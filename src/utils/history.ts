export type GenerationType = 'text-to-image' | 'image-to-image' | 'video-generation';

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export interface HistoryItem {
    id: string;
    timestamp: number;
    type: GenerationType;
    prompt: string;
    params: any;
    resultUrls: string[];
    thumbnailUrl?: string;
}

const HISTORY_KEY = 'jimeng_generation_history';

export const getHistory = (): HistoryItem[] => {
    try {
        const history = localStorage.getItem(HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Failed to load history:', error);
        return [];
    }
};

export const saveHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    try {
        const history = getHistory();
        const newItem: HistoryItem = {
            ...item,
            id: generateId(),
            timestamp: Date.now(),
        };
        const newHistory = [newItem, ...history];
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newItem;
    } catch (error) {
        console.error('Failed to save history:', error);
    }
};

export const deleteHistory = (ids: string[]) => {
    try {
        const history = getHistory();
        const newHistory = history.filter(item => !ids.includes(item.id));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
    } catch (error) {
        console.error('Failed to delete history:', error);
        return [];
    }
};

export const clearHistory = () => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear history:', error);
    }
};