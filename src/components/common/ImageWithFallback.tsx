import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallbackSrc?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, fallbackSrc, alt, className, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const [isTotallyBroken, setIsTotallyBroken] = useState(false);

    useEffect(() => {
        setImgSrc(src);
        setHasError(false);
        setIsTotallyBroken(false);
    }, [src]);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            // Try weserv.nl proxy as fallback
            // Remove protocol from url for weserv
            const cleanUrl = src.replace(/^https?:\/\//, '');
            const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
            setImgSrc(proxyUrl);
        } else {
            // If proxy also fails
            if (fallbackSrc) {
                setImgSrc(fallbackSrc);
            } else {
                setIsTotallyBroken(true);
            }
        }
    };

    if (isTotallyBroken) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
                <ImageOff className="w-8 h-8" />
            </div>
        );
    }

    return (
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            className={className}
            onError={handleError}
            referrerPolicy="no-referrer"
        />
    );
};

export default ImageWithFallback;