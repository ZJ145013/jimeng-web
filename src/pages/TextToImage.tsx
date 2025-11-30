import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { Loader2, Send } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import CurlPreview from '../components/common/CurlPreview';
import JsonViewer from '../components/common/JsonViewer';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { saveHistory } from '../utils/history';
import { toast } from 'sonner';

interface TextToImageForm {
    model: string;
    prompt: string;
    negative_prompt: string;
    ratio: string;
    resolution: string;
    sampleStrength: number;
}

const TextToImage = () => {
    const { baseUrl, token, region } = useSettings();
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TextToImageForm>({
        defaultValues: {
            model: 'jimeng-4.0',
            prompt: '',
            negative_prompt: '',
            ratio: '1:1',
            resolution: '1k',
            sampleStrength: 0.5,
        }
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
        return {
            method: 'POST',
            url: `${baseUrl.replace(/\/$/, '')}/v1/images/generations`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: formValues
        };
    };

    const onSubmit = async (data: TextToImageForm) => {
        if (!token) {
            toast.error('请在顶部设置 Session ID / Token');
            return;
        }

        setLoading(true);
        setResponse(null);

        try {
            const res = await axios.post(`${baseUrl.replace(/\/$/, '')}/v1/images/generations`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setResponse(res.data);

            // Save to history
            if (res.data && res.data.data && Array.isArray(res.data.data)) {
                const resultUrls = res.data.data.map((item: any) => typeof item === 'string' ? item : item?.url).filter(Boolean);
                if (resultUrls.length > 0) {
                    saveHistory({
                        type: 'text-to-image',
                        prompt: data.prompt,
                        params: data,
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
                <h2 className="text-2xl font-bold mb-6 text-gray-800">文生图</h2>

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
                            rules={{ required: '请输入提示词' }}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    placeholder="描述你想要生成的画面..."
                                />
                            )}
                        />
                        {errors.prompt && <p className="text-red-500 text-xs">{errors.prompt.message}</p>}
                    </div>

                    {/* Negative Prompt */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">反向提示词</label>
                        <Controller
                            name="negative_prompt"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                                    placeholder="描述你不希望出现在画面中的内容..."
                                />
                            )}
                        />
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

                    {/* Sample Strength */}
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

export default TextToImage;