import React from 'react';
import { NavLink } from 'react-router-dom';
import { Image, Video, Wrench, Sparkles, ImagePlus, History } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { path: '/images/generations', icon: Sparkles, label: '文生图' },
    { path: '/images/compositions', icon: ImagePlus, label: '图生图' },
    { path: '/videos/generations', icon: Video, label: '视频生成' },
    { path: '/tools', icon: Wrench, label: '工具箱' },
    { path: '/history', icon: History, label: '历史记录' },
];

const Sidebar: React.FC = () => {
    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-600">
                    <Image className="w-6 h-6" />
                    Jimeng API
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    © 2024 Jimeng API Panel
                </p>
            </div>
        </div>
    );
};

export default Sidebar;