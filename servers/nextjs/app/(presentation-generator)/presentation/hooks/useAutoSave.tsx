'use client'
import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { PresentationGenerationApi } from '../../services/api/presentation-generation';
import { addToHistory } from '@/store/slices/undoRedoSlice';

interface UseAutoSaveOptions {
    debounceMs?: number;
    enabled?: boolean;
}

export const useAutoSave = ({
    debounceMs = 1000,
    enabled = true,
}: UseAutoSaveOptions = {}) => {
   
    const dispatch = useDispatch();
    const { presentationData, isStreaming, isLoading, isLayoutLoading } = useSelector(
        (state: RootState) => state.presentationGeneration
    );

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedDataRef = useRef<any>(null);
    const isSavingRef = useRef(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
 

    // Debounced save function
    const debouncedSave = useCallback(async (data: any) => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        const saveWhenIdle = async () => {
            if (!data) return;
            if (isSavingRef.current) {
                saveTimeoutRef.current = setTimeout(saveWhenIdle, debounceMs);
                return;
            }

            // Skip if data hasn't changed since last save
            if (data === lastSavedDataRef.current) {
                return;
            }

            try {
                isSavingRef.current = true;
                setIsSaving(true);
                dispatch(addToHistory({
                    slides: data.slides,
                    actionType: "AUTO_SAVE"
                }));
                console.log('🔄 Auto-saving presentation data...');

                // Call the API to update presentation content
                await PresentationGenerationApi.updatePresentationContent(data);

                // Update last saved data reference
                lastSavedDataRef.current = data;

                console.log('✅ Auto-save successful');

            } catch (error) {
                console.error('❌ Auto-save failed:', error);

            } finally {
                isSavingRef.current = false;
                setIsSaving(false);
            }
        };
        saveTimeoutRef.current = setTimeout(saveWhenIdle, debounceMs);
    }, [debounceMs, dispatch]);

    // Effect to trigger auto-save when presentation data changes
    useEffect(() => {
        if (!enabled || !presentationData || isStreaming || isLoading || isLayoutLoading ) return;
        
        // Trigger debounced save
        debouncedSave(presentationData);
       
        // Cleanup timeout on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [presentationData, enabled, debouncedSave,isLoading, isStreaming, isLayoutLoading]);
    
    return {
        isSaving,
    };
};
