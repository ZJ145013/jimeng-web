import React, { createContext, useContext, useState, useEffect } from 'react';

export type Region = 'CN' | 'International';

interface SettingsContextType {
    baseUrl: string;
    setBaseUrl: (url: string) => void;
    token: string;
    setToken: (token: string) => void;
    region: Region;
    setRegion: (region: Region) => void;
}

interface EnvConfig {
    baseUrl: string;
    token: string;
}

type ConfigMap = {
    [key in Region]: EnvConfig;
};

const DEFAULT_CONFIG: ConfigMap = {
    CN: {
        baseUrl: 'http://localhost:5100',
        token: '',
    },
    International: {
        baseUrl: 'http://localhost:5100',
        token: '',
    },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [region, setRegion] = useState<Region>(() => (localStorage.getItem('jimeng_region') as Region) || 'CN');

    const [config, setConfig] = useState<ConfigMap>(() => {
        const savedConfig = localStorage.getItem('jimeng_config');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                return { ...DEFAULT_CONFIG, ...parsed };
            } catch (e) {
                console.error('Failed to parse config from local storage', e);
            }
        }

        // Migration logic: check for old keys
        const oldBaseUrl = localStorage.getItem('jimeng_base_url');
        const oldToken = localStorage.getItem('jimeng_token');

        // Use the region we just initialized
        const currentRegion = (localStorage.getItem('jimeng_region') as Region) || 'CN';

        if (oldBaseUrl || oldToken) {
            const newConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            newConfig[currentRegion] = {
                baseUrl: oldBaseUrl || DEFAULT_CONFIG[currentRegion].baseUrl,
                token: oldToken || DEFAULT_CONFIG[currentRegion].token
            };
            return newConfig;
        }

        return DEFAULT_CONFIG;
    });

    const baseUrl = config[region].baseUrl;
    const token = config[region].token;

    const setBaseUrl = (url: string) => {
        setConfig((prev) => {
            const newConfig = {
                ...prev,
                [region]: {
                    ...prev[region],
                    baseUrl: url,
                },
            };
            localStorage.setItem('jimeng_config', JSON.stringify(newConfig));
            return newConfig;
        });
    };

    const setToken = (token: string) => {
        setConfig((prev) => {
            const newConfig = {
                ...prev,
                [region]: {
                    ...prev[region],
                    token: token,
                },
            };
            localStorage.setItem('jimeng_config', JSON.stringify(newConfig));
            return newConfig;
        });
    };

    useEffect(() => {
        localStorage.setItem('jimeng_region', region);
    }, [region]);

    return (
        <SettingsContext.Provider value={{ baseUrl, setBaseUrl, token, setToken, region, setRegion }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};