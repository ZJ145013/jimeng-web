import React from 'react';
import { Settings, Key, Globe, Info } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Header: React.FC = () => {
    const { baseUrl, setBaseUrl, token, setToken, region, setRegion } = useSettings();

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2 text-gray-500 relative">
                <Settings className="w-5 h-5" />
                <span className="font-medium text-sm">全局配置</span>

                <div className="relative group ml-1">
                    <Info className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    <div className="absolute top-full left-0 mt-2 w-80 p-3 bg-gray-800 text-white text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
                        <p className="font-medium mb-1">后端服务地址配置</p>
                        <p className="text-gray-300 leading-relaxed">
                            默认为 <span className="text-indigo-300">http://localhost:5100</span>。<br />
                            如果是远程服务器部署，请输入服务器的 IP 和端口。<br />
                            例如: <span className="text-indigo-300">http://192.168.1.100:5100</span>
                        </p>
                        {/* Arrow */}
                        <div className="absolute -top-1 left-1.5 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value as any)}
                        className="bg-transparent border-none outline-none text-sm text-gray-700 font-medium cursor-pointer focus:ring-0"
                    >
                        <option value="CN">🇨🇳 国内站</option>
                        <option value="International">🌏 国际站</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="服务地址 (如 http://192.168.1.x:5100)"
                        className="bg-transparent border-none outline-none text-sm w-72 text-gray-700 placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                    <Key className="w-4 h-4 text-gray-400" />
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder={region === 'International' ? "Session ID (通常以 us- 开头)" : "请输入 Session ID / Token"}
                        className="bg-transparent border-none outline-none text-sm w-64 text-gray-700 placeholder-gray-400"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;