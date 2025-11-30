import { useState } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, Coins, Database } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import JsonViewer from '../components/common/JsonViewer';
import { toast } from 'sonner';

const Tools = () => {
    const { baseUrl, token } = useSettings();
    const [loading, setLoading] = useState<string | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'check' | 'points' | 'models'>('check');

    const handleRequest = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
        if (!token && endpoint !== '/v1/models') {
            toast.error('请在顶部设置 Session ID / Token');
            return;
        }

        setLoading(endpoint);
        setResponse(null);

        try {
            const config = {
                method,
                url: `${baseUrl.replace(/\/$/, '')}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                data: body
            };

            const res = await axios(config);
            setResponse(res.data);
            toast.success('请求成功');
        } catch (error: any) {
            console.error('API Error:', error);
            setResponse(error.response?.data || { error: error.message });
            toast.error(error.response?.data?.detail || '请求失败');
        } finally {
            setLoading(null);
        }
    };

    const tools = [
        {
            id: 'check',
            name: 'Token 验证',
            icon: CheckCircle,
            description: '验证你的 Token 是否有效',
            action: () => handleRequest('/token/check', 'POST', { token })
        },
        {
            id: 'points',
            name: '积分查询',
            icon: Coins,
            description: '查询账户剩余积分/点数',
            action: () => handleRequest('/token/points', 'POST', { token })
        },
        {
            id: 'models',
            name: '模型列表',
            icon: Database,
            description: '获取可用模型列表',
            action: () => handleRequest('/v1/models', 'GET')
        }
    ];

    return (
        <div className="flex h-full">
            {/* Left: Tools List */}
            <div className="w-1/2 p-6 overflow-auto border-r border-gray-200 custom-scrollbar">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">工具箱</h2>

                <div className="grid gap-4">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                setActiveTab(tool.id as any);
                                tool.action();
                            }}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left hover:shadow-md ${activeTab === tool.id
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                : 'border-gray-200 bg-white hover:border-indigo-300'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${activeTab === tool.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-medium ${activeTab === tool.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    {tool.name}
                                </h3>
                                <p className={`text-sm mt-1 ${activeTab === tool.id ? 'text-indigo-700' : 'text-gray-500'}`}>
                                    {tool.description}
                                </p>
                            </div>
                            {loading === (tool.id === 'models' ? '/v1/models' : tool.id === 'check' ? '/token/check' : '/token/points') && (
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Response */}
            <div className="w-1/2 p-6 bg-gray-50 flex flex-col gap-6 overflow-hidden">
                <div className="flex-1 min-h-0">
                    <JsonViewer
                        data={response || { message: '请选择左侧工具进行操作' }}
                        title={tools.find(t => t.id === activeTab)?.name || '响应结果'}
                    />
                </div>
            </div>
        </div>
    );
};

export default Tools;