import { useState, useEffect } from 'react';
import { Trash2, X, Eye, Calendar, FileType, CheckSquare, Square, Trash } from 'lucide-react';
import { getHistory, deleteHistory, clearHistory, type HistoryItem } from '../utils/history';
import ImageWithFallback from '../components/common/ImageWithFallback';
import JsonViewer from '../components/common/JsonViewer';
import { toast } from 'sonner';

const History = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = () => {
        setHistory(getHistory());
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (confirm(`确定要删除选中的 ${selectedIds.size} 条记录吗？`)) {
            const newHistory = deleteHistory(Array.from(selectedIds));
            setHistory(newHistory);
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            toast.success('删除成功');
        }
    };

    const handleClearAll = () => {
        if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            clearHistory();
            setHistory([]);
            toast.success('已清空所有记录');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'text-to-image': return '文生图';
            case 'image-to-image': return '图生图';
            case 'video-generation': return '视频生成';
            default: return type;
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="flex h-full flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 flex-none">
                <h2 className="text-2xl font-bold text-gray-800">历史记录</h2>
                <div className="flex gap-2">
                    {isSelectionMode ? (
                        <>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0}
                                className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                删除选中 ({selectedIds.size})
                            </button>
                            <button
                                onClick={toggleSelectionMode}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                                取消
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleSelectionMode}
                                disabled={history.length === 0}
                                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <CheckSquare className="w-4 h-4" />
                                批量管理
                            </button>
                            <button
                                onClick={handleClearAll}
                                disabled={history.length === 0}
                                className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                                <Trash className="w-4 h-4" />
                                清空
                            </button>
                        </>
                    )}
                </div>
            </div>

            {history.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <Calendar className="w-16 h-16 mb-4 opacity-20" />
                    <p>暂无历史记录</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-6">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className={`group relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md ${selectedIds.has(item.id) ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200'
                                    }`}
                                onClick={() => {
                                    if (isSelectionMode) {
                                        toggleSelect(item.id);
                                    } else {
                                        setSelectedItem(item);
                                        setCurrentImageIndex(0);
                                    }
                                }}
                            >
                                {item.thumbnailUrl ? (
                                    <ImageWithFallback
                                        src={item.thumbnailUrl}
                                        alt={item.prompt}
                                        className="w-full h-full object-cover"
                                    />
                                ) : item.type === 'video-generation' && item.resultUrls?.[0] ? (
                                    <video
                                        src={item.resultUrls[0]}
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                        {...({ referrerPolicy: "no-referrer" } as any)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <FileType className="w-8 h-8" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-white text-xs font-medium truncate">{getTypeLabel(item.type)}</p>
                                    <p className="text-white/80 text-[10px] truncate">{formatTime(item.timestamp)}</p>
                                </div>

                                {isSelectionMode && (
                                    <div className="absolute top-2 right-2">
                                        {selectedIds.has(item.id) ? (
                                            <CheckSquare className="w-5 h-5 text-indigo-600 bg-white rounded-sm" />
                                        ) : (
                                            <Square className="w-5 h-5 text-white drop-shadow-md" />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Media Preview */}
                        <div className="w-1/2 bg-black flex flex-col items-center justify-center relative p-4 gap-4">
                            <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                                {selectedItem.type === 'video-generation' && selectedItem.resultUrls[currentImageIndex] ? (
                                    <video
                                        src={selectedItem.resultUrls[currentImageIndex]}
                                        controls
                                        className="max-w-full max-h-full object-contain"
                                        {...({ referrerPolicy: "no-referrer" } as any)}
                                    />
                                ) : (
                                    <ImageWithFallback
                                        src={selectedItem.resultUrls[currentImageIndex] || selectedItem.thumbnailUrl || ''}
                                        alt={`Preview ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                )}
                            </div>

                            {selectedItem.resultUrls && selectedItem.resultUrls.length > 1 && (
                                <div className="w-full flex justify-center gap-2 overflow-x-auto py-2 px-4 bg-black/50 rounded-lg backdrop-blur-sm">
                                    {selectedItem.resultUrls.map((url, idx) => (
                                        <button
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex(idx);
                                            }}
                                            className={`w-16 h-16 border-2 rounded-md overflow-hidden flex-none transition-all ${currentImageIndex === idx
                                                ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105'
                                                : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            {selectedItem.type === 'video-generation' ? (
                                                <video
                                                    src={url}
                                                    className="w-full h-full object-cover"
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <ImageWithFallback
                                                    src={url}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="w-1/2 flex flex-col h-full bg-gray-50">
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
                                <div>
                                    <h3 className="font-bold text-gray-800">{getTypeLabel(selectedItem.type)}</h3>
                                    <p className="text-xs text-gray-500">{formatTime(selectedItem.timestamp)}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt</h4>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-600 leading-relaxed">
                                        {selectedItem.prompt || '无提示词'}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">参数详情</h4>
                                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                        <JsonViewer data={selectedItem.params} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-2">
                                <a
                                    href={selectedItem.resultUrls[currentImageIndex]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    {selectedItem.type === 'video-generation' ? '查看原视频' : '查看原图'}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;