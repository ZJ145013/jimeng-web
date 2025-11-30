import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import { Loader2, Send, Plus, Trash2, Image as ImageIcon, Upload, Link } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import CurlPreview from '../components/common/CurlPreview';
import JsonViewer from '../components/common/JsonViewer';
import { saveHistory } from '../utils/history';
import { toast } from 'sonner';

interface VideoGenerationForm {
    model: string;
    prompt: string;
    ratio: string;
    resolution: string;
    duration: number;
    filePaths: { type: 'url' | 'file'; url: string; file?: File | null }[];
}

const VideoGeneration = () => {
    const { baseUrl, token, region } = useSettings();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<VideoGenerationForm>({
        defaultValues: {
            model: 'jimeng-video-3.0',
            prompt: '',
            ratio: '16:9',
            resolution: '720p',
            duration: 5,
            filePaths: [],
        }
    });

    const MODELS = [
        { value: 'jimeng-video-3.0', label: 'Jimeng Video 3.0' },
        { value: 'jimeng-video-3.0-pro', label: 'Jimeng Video 3.0 Pro' },
        { value: 'jimeng-video-3.0-fast', label: 'Jimeng Video 3.0 Fast', disabledIn: ['International'] },
    ];

    const availableModels = MODELS.filter(m => !m.disabledIn?.includes(region));
    const formValues = watch();

    useEffect(() => {
        const isAvailable = availableModels.some(m => m.value === formValues.model);
        if (!isAvailable && availableModels.length > 0) {
            setValue('model', availableModels[0].value);
        }
    }, [region, availableModels, formValues.model, setValue]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "filePaths"
    });

    const videoUrl = (() => {
        if (!response) return null;
        if (typeof response === 'string' && response.startsWith('http')) return response;
        if (response.url && typeof response.url === 'string') return response.url;
        if (response.data) {
            if (typeof response.data === 'string' && response.data.startsWith('http')) return response.data;
            if (Array.isArray(response.data) && response.data.length > 0) {
                const item = response.data[0];
                if (typeof item === 'string') return item;
                if (item?.url) return item.url;
            }
            if (response.data.url) return response.data.url;
        }
        return null;
    })();

    const getCurlData = () => {
        const hasFile = formValues.filePaths.some(img => img.type === 'file' && img.file);

        if (hasFile) {
            const formData = new FormData();
            formData.append('model', formValues.model);
            formData.append('prompt', formValues.prompt);
            formData.append('ratio', formValues.ratio);
            formData.append('resolution', formValues.resolution);
            formData.append('duration', formValues.duration.toString());

            formValues.filePaths.forEach((img, index) => {
                if (img.type === 'file' && img.file) {
                    formData.append(`image_file_${index + 1}`, img.file);
                } else if (img.type === 'url' && img.url) {
                    formData.append('filePaths', img.url);
                }
            });

            return {
                method: 'POST',
                url: `${baseUrl.replace(/\/$/, '')}/v1/videos/generations?model=${formValues.model}`,
                headers: {
                    'Authorization': `Bearer ${token}`
                } as Record<string, string>,
                body: formData
            };
        }

        const body = {
            ...formValues,
            filePaths: formValues.filePaths.map(img => img.url).filter(url => url)
        };
        return {
            method: 'POST',
            url: `${baseUrl.replace(/\/$/, '')}/v1/videos/generations`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body
        };
    };

    const onSubmit = async (data: VideoGenerationForm) => {
        if (!token) {
            toast.error('请在顶部设置 Session ID / Token');
            return;
        }

        setLoading(true);
        setResponse(null);

        let payload: any;
        let headers: any = { 'Authorization': `Bearer ${token}` };

        const hasFile = data.filePaths.some(img => img.type === 'file' && img.file);

        if (hasFile) {
            const formData = new FormData();
            formData.append('model', data.model);
            formData.append('prompt', data.prompt);
            formData.append('ratio', data.ratio);
            formData.append('resolution', data.resolution);
            formData.append('duration', data.duration.toString());

            data.filePaths.forEach((img, index) => {
                if (img.type === 'file' && img.file) {
                    formData.append(`image_file_${index + 1}`, img.file);
                } else if (img.type === 'url' && img.url) {
                    formData.append('filePaths', img.url);
                }
            });
            payload = formData;
            // No need to set Content-Type manually, axios does it for FormData
        } else {
            payload = {
                ...data,
                filePaths: data.filePaths.map(img => img.url).filter(url => url)
            };
        }

        try {
            const url = hasFile
                ? `${baseUrl.replace(/\/$/, '')}/v1/videos/generations?model=${data.model}`
                : `${baseUrl.replace(/\/$/, '')}/v1/videos/generations`;

            const res = await axios.post(url, payload, {
                headers
            });
            setResponse(res.data);

            // Save to history
            let resultUrl = '';
            if (typeof res.data === 'string' && res.data.startsWith('http')) resultUrl = res.data;
            else if (res.data.url && typeof res.data.url === 'string') resultUrl = res.data.url;
            else if (res.data.data) {
                if (typeof res.data.data === 'string' && res.data.data.startsWith('http')) resultUrl = res.data.data;
                else if (Array.isArray(res.data.data) && res.data.data.length > 0) {
                    const item = res.data.data[0];
                    if (typeof item === 'string') resultUrl = item;
                    else if (item?.url) resultUrl = item.url;
                }
                else if (res.data.data.url) resultUrl = res.data.data.url;
            }

            if (resultUrl) {
                // Remove file objects before saving to localStorage
                const historyParams = { ...data };
                historyParams.filePaths = data.filePaths.map(img => ({
                    type: img.type,
                    url: img.url,
                    file: null // Don't save File object
                }));

                saveHistory({
                    type: 'video-generation',
                    prompt: data.prompt,
                    params: historyParams,
                    resultUrls: [resultUrl],
                    thumbnailUrl: resultUrl // Video URL can be used as thumbnail in some cases or we might need a placeholder
                });
            }

            toast.success('视频生成成功');
        } catch (error: any) {
            console.error('API Error:', error);
            setResponse(error.response?.data || { error: error.message });
            toast.error(error.response?.data?.detail || '生成失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Left: Form */}
            <div className="w-1/2 p-6 overflow-auto border-r border-gray-200 custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">视频生成</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">模型选择</label>
                        <Controller
                            name="model"
                            control={control}
                            render={({ field }) => (
                                <select {...field} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                                    {availableModels.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            )}
                        />
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">提示词</label>
                        <Controller
                            name="prompt"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    placeholder="描述你想要生成的视频画面 (可选)..."
                                />
                            )}
                        />
                        {errors.prompt && <p className="text-red-500 text-xs">{errors.prompt.message}</p>}
                    </div>

                    {/* Images Input (Optional) */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">参考图片 (可选)</label>
                        <p className="text-xs text-gray-500">第一张图片为起始帧，第二张图片为结束帧。</p>
                        {fields.map((field, index) => {
                            const imageType = formValues.filePaths[index]?.type || 'url';
                            return (
                                <div key={field.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <button
                                            type="button"
                                            onClick={() => setValue(`filePaths.${index}.type`, 'url')}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${imageType === 'url' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            <Link className="w-3 h-3" /> URL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue(`filePaths.${index}.type`, 'file')}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${imageType === 'file' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            <Upload className="w-3 h-3" /> 文件
                                        </button>
                                        <div className="flex-1" />
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {imageType === 'url' ? (
                                        <Controller
                                            name={`filePaths.${index}.url`}
                                            control={control}
                                            render={({ field }) => (
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <ImageIcon className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                    <input
                                                        {...field}
                                                        type="url"
                                                        className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                        placeholder="https://example.com/image.jpg"
                                                    />
                                                </div>
                                            )}
                                        />
                                    ) : (
                                        <Controller
                                            name={`filePaths.${index}.file`}
                                            control={control}
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <div className="relative">
                                                    <input
                                                        {...field}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            onChange(file);
                                                        }}
                                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                                                    />
                                                </div>
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {fields.length < 2 && (
                            <button
                                type="button"
                                onClick={() => append({ type: 'url', url: '', file: null })}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                添加图片帧
                            </button>
                        )}
                    </div>

                    {/* Ratio, Resolution & Duration */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">视频比例</label>
                            <Controller
                                name="ratio"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                                        <option value="16:9">16:9 (横屏)</option>
                                        <option value="9:16">9:16 (竖屏)</option>
                                        <option value="1:1">1:1 (方形)</option>
                                        <option value="4:3">4:3</option>
                                        <option value="3:4">3:4</option>
                                    </select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">分辨率</label>
                            <Controller
                                name="resolution"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                                        <option value="720p">720p</option>
                                        <option value="1080p">1080p</option>
                                    </select>
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">时长</label>
                            <Controller
                                name="duration"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    >
                                        <option value={5}>5 秒</option>
                                        <option value={10}>10 秒</option>
                                    </select>
                                )}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    生成中...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    生成视频
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">请求预览</h3>
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                        <CurlPreview {...getCurlData()} />
                    </div>
                </div>
            </div>

            {/* Right: Response & Preview */}
            <div className="w-1/2 p-6 bg-gray-50 flex flex-col gap-6 overflow-hidden">
                {videoUrl && (
                    <div className="flex-none">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">生成视频</h3>
                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black shadow-sm aspect-video">
                            <video controls src={videoUrl} className="w-full h-full" {...({ referrerPolicy: "no-referrer" } as any)} />
                        </div>
                    </div>
                )}

                <div className="flex-1 min-h-0">
                    <JsonViewer data={loading ? { status: '正在生成中，请稍候...' } : (response || { message: 'No response yet' })} />
                </div>
            </div>
        </div>
    );
};

export default VideoGeneration;