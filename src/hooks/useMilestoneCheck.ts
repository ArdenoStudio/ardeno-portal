// ─── useMilestoneCheck ────────────────────────────────
// Compares the current project stage with the last-seen
// stage stored in localStorage. If they differ, returns
// the new stage so MilestoneMoment can fire once.

import { useState, useEffect, useCallback } from 'react';
import type { ProjectStage } from '@/types';

const STORAGE_PREFIX = 'ardeno:milestone:';

interface MilestoneState {
    /** True when a stage change is detected and the interstitial should show */
    shouldShow: boolean;
    /** The new stage the project has moved to */
    newStage: ProjectStage | null;
    /** Dismiss the interstitial and persist the new stage */
    dismiss: () => void;
}

export function useMilestoneCheck(
    projectId: string | undefined,
    currentStage: ProjectStage | undefined
): MilestoneState {
    const [shouldShow, setShouldShow] = useState(false);
    const [newStage, setNewStage] = useState<ProjectStage | null>(null);

    useEffect(() => {
        if (!projectId || !currentStage) return;

        const key = `${STORAGE_PREFIX}${projectId}`;
        const lastSeen = localStorage.getItem(key);

        if (lastSeen === null) {
            // First visit — store stage silently, no interstitial
            localStorage.setItem(key, currentStage);
            return;
        }

        if (lastSeen !== currentStage) {
            setNewStage(currentStage);
            setShouldShow(true);
        }
    }, [projectId, currentStage]);

    const dismiss = useCallback(() => {
        if (!projectId || !currentStage) return;
        const key = `${STORAGE_PREFIX}${projectId}`;
        localStorage.setItem(key, currentStage);
        setShouldShow(false);
    }, [projectId, currentStage]);

    return { shouldShow, newStage, dismiss };
}
