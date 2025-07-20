"use client";

import { useState, useEffect, useRef } from 'react';
import { Profile } from './Profile';
import Image from 'next/image';
import { IUser } from '@/types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: IUser; // Optional userId to load a specific user's profile
}

export const ProfileModal = ({ isOpen, onClose, user }: ProfileModalProps) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const modalContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 300); 
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;


    const handleOuterClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Check if the clicked target is the outermost div
        if (e.target === e.currentTarget) {
            onClose();
        }
    };


    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={handleOuterClick}
        >
                
                <div className="h-full w-[40vw] relative overflow-auto">
                    <Profile user={user} />
            </div>
        </div>
    );
}; 