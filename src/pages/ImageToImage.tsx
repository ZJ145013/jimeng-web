import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import { Loader2, Send, Plus, Trash2, Image as ImageIcon, Upload, Link } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import CurlPreview from '../components/common/CurlPreview';
import JsonViewer from '../components/common/JsonViewer';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { saveHistory } from '../utils/history';
import { toast } from 'sonner';

interface ImageToImageForm {
    model: string;
    prompt: string;
    negative_prompt: string;
    images: { type: 'url' | 'file'; url: string; file?: File | null }[];
    ratio: string;
    resolution: string;
    sampleStrength: number;
    intelligentRatio: boolean;
}

const ImageToImage = () => {
    const { baseUrl, token, region } = useSettings();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ImageToImageForm>({
        defaultValues: {
            model: 'jimeng-4.0',
            prompt: '',
            negative_prompt: '',
            images: [{ type: 'url', url: '', file: null }],
            ratio: '1:1',
            resolution: '1k',
            sampleStrength: 0.5,
            intelligentRatio: false,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "images"
    });

    const formValues = watch();

    const MODELS = [
        { value: 'jimeng-4.0', label: 'Jimeng 4.0' },
        { value: 'jimeng-4.1', label: 'Jimeng 4.1', disabledIn: ['International'] },
        { value: 'nanobanana', label: 'Nanobanana', disabledIn: ['CN'] },
        { value: 'nanobananapro', label: 'Nanobanana Pro', disabledIn: ['CN'] },
    ];

    const availableModels = MODELS.filter(m => !m.disabledIn?.includes(region));

    useEffect(() => {
        const isAvailable = availableModels.some(m => m.value === formValues.model);
        if (!isAvailable && availableModels.length > 0) {
            setValue('model', availableModels[0].value);
        }
    }, [region, availableModels, formValues.model, setValue]);

    const getCurlData = () => {
        const hasFile = formValues.images.some(img => img.type === 'file' && img.file);

        if (hasFile) {
            const formData = new FormData();
            formData.append('model', formValues.model);
            formData.append('prompt', formValues.prompt);
            formData.append('negative_prompt', formValues.negative_prompt);
            formData.append('ratio', formValues.ratio);
            formData.append('resolution', formValues.resolution);
            formData.append('sampleStrength', formValues.sampleStrength.toString());
            formData.append('intelligentRatio', formValues.intelligentRatio.toString());

            formValues.images.forEach((img) => {
                if (img.type === 'file' && img.file) {
                    formData.append('images', img.file);
                } else if (img.type === 'url' && img.url) {
                    formData.append('images', img.url);
                }
            });

            return {
                method: 'POST',
                url: `${baseUrl.replace(/\/$/, '')}/v1/images/compositions?model=${formValues.model}`,
                headers: {
                    'Authorization': `Bearer ${token}`
                } as Record<string, string>,
                body: formData
            };
        }

        const body = {
            ...formValues,
            images: formValues.images.map(img => img.url).filter(url => url)
        };
        return {
            method: 'POST',
            url: `${baseUrl.replace(/\/$/, '')}/v1/images/compositions`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body
        };
    };

    const onSubmit = async (data: ImageToImageForm) => {
        if (!token) {
            toast.error('请在顶部设置 Session ID / Token');
            return;
        }

        const validImages = data.images.filter(img => (img.type === 'url' && img.url) || (img.type === 'file' && img.file));
        if (validImages.length === 0) {
            toast.error('请至少提供一张图片');
            return;
        }

        setLoading(true);
        setResponse(null);

        let payload: any;
        let headers: any = { 'Authorization': `Bearer ${token}` };

        const hasFile = data.images.some(img => img.type === 'file' && img.file);

        if (hasFile) {
            const formData = new FormData();
            formData.append('model', data.model);
            formData.append('prompt', data.prompt);
            formData.append('negative_prompt', data.negative_prompt);
            formData.append('ratio', data.ratio);
            formData.append('resolution', data.resolution);
            formData.append('sampleStrength', data.sampleStrength.toString());
            formData.append('intelligentRatio', data.intelligentRatio.toString());

            data.images.forEach((img) => {
                if (img.type === 'file' && img.file) {
                    formData.append('images', img.file);
                } else if (img.type === 'url' && img.url) {
                    formData.append('images', img.url);
                }
            });
            payload = formData;
        } else {
            payload = {
                ...data,
                images: data.images.map(img => img.url).filter(url => url)
            };
        }

        try {
            const url = hasFile
                ? `${baseUrl.replace(/\/$/, '')}/v1/images/compositions?model=${data.model}`
                : `${baseUrl.replace(/\/$/, '')}/v1/images/compositions`;

            const res = await axios.post(url, payload, {
                headers
            });
            setResponse(res.data);

            // Save to history
            if (res.data && res.data.data && Array.isArray(res.data.data)) {
                const resultUrls = res.data.data.map((item: any) => typeof item === 'string' ? item : item?.url).filter(Boolean);
                if (resultUrls.length > 0) {
                    // Remove file objects before saving to localStorage
                    const historyParams = { ...data };
                    historyParams.images = data.images.map(img => ({
                        type: img.type,
                        url: img.url,
                        file: null // Don't save File object
                    }));

                    saveHistory({
                        type: 'image-to-image',
                        prompt: data.prompt,
                        params: historyParams,
                        resultUrls: resultUrls,
                        thumbnailUrl: resultUrls[0]
                    });
                }
            }

            toast.success('图片生成成功');
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
                <h2 className="text-2xl font-bold mb-6 text-gray-800">图生图</h2>

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

                    {/* Images Input */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">参考图片</label>
                        {fields.map((field, index) => {
                            const imageType = formValues.images[index]?.type || 'url';
                            return (
                                <div key={field.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <button
                                            type="button"
                                            onClick={() => setValue(`images.${index}.type`, 'url')}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${imageType === 'url' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            <Link className="w-3 h-3" /> URL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setValue(`images.${index}.type`, 'file')}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${imageType === 'file' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            <Upload className="w-3 h-3" /> 文件
                                        </button>
                                        <div className="flex-1" />
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {imageType === 'url' ? (
                                        <Controller
                                            name={`images.${index}.url`}
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
                                            name={`images.${index}.file`}
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
                        <button
                            type="button"
                            onClick={() => append({ type: 'url', url: '', file: null })}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            添加参考图片
                        </button>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">提示词</label>
                        <Controller
                            name="prompt"
                            control={control}
                            rules={{ required: '请输入提示词' }}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    placeholder="描述你想要生成的画面..."
                                />
                            )}
                        />
                        {errors.prompt && <p className="text-red-500 text-xs">{errors.prompt.message}</p>}
                    </div>

                    {/* Ratio & Resolution */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">图片比例</label>
                            <Controller
                                name="ratio"
                                control={control}
                                render={({ field }) => (
                                    <select {...field} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                                        <option value="1:1">1:1 (方形)</option>
                                        <option value="16:9">16:9 (横屏)</option>
                                        <option value="9:16">9:16 (竖屏)</option>
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
                                        <option value="1k">标准 (1k)</option>
                                        <option value="2k">高清 (2k)</option>
                                        <option value="4k">超清 (4k)</option>
                                    </select>
                                )}
                            />
                        </div>
                    </div>

                    {/* Sample Strength & Intelligent Ratio */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-medium text-gray-700">采样强度</label>
                                <span className="text-sm text-indigo-600 font-medium">{formValues.sampleStrength}</span>
                            </div>
                            <Controller
                                name="sampleStrength"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Controller
                                name="intelligentRatio"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        id="intelligentRatio"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                )}
                            />
                            <label htmlFor="intelligentRatio" className="text-sm text-gray-700">智能比例</label>
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
                                    生成图片
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
                {response && response.data && Array.isArray(response.data) && (
                    <div className="flex-none">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">生成结果</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {response.data.map((item: any, index: number) => {
                                const url = typeof item === 'string' ? item : item?.url;
                                if (!url) return null;
                                return (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm aspect-square">
                                        <ImageWithFallback src={url} alt={`Generated ${index + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </a>
                                );
                            })}
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

export default ImageToImage;