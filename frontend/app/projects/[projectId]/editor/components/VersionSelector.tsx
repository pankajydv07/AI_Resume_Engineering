'use client';

/**
 * PHASE 3: Version Selector Component
 * 
 * Per requirements:
 * - Switching versions resets editor state
 * - Loads new version via loadVersion()
 * - Clears isDirty flag
 * 
 * NOTE: Version listing not in apis.md, so using placeholder
 * TODO: Add version listing API when defined in apis.md
 */

interface Version {
  versionId: string;
  type: 'BASE' | 'MANUAL' | 'AI_GENERATED';
  createdAt: string;
}

interface VersionSelectorProps {
  currentVersionId: string | null;
  projectId: string;
  onVersionSwitch: (versionId: string) => Promise<void>;
  isDirty: boolean;
}

export function VersionSelector({
  currentVersionId,
  projectId,
  onVersionSwitch,
  isDirty,
}: VersionSelectorProps) {
  // TODO: Fetch versions from API when listing endpoint is added to apis.md
  // For now: Placeholder UI only
  
  const handleSwitch = async (versionId: string) => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Switching versions will discard them. Continue?'
      );
      if (!confirmed) return;
    }

    await onVersionSwitch(versionId);
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Current Version
      </label>
      
      {currentVersionId ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded">
            <span className="font-mono text-xs text-gray-600">
              {currentVersionId.substring(0, 8)}...
            </span>
          </div>
          
          {/* TODO: Add dropdown when version listing API is available */}
          <button
            type="button"
            disabled
            className="px-3 py-2 text-xs font-medium text-gray-400 bg-gray-100 rounded cursor-not-allowed"
            title="Version switching UI pending version list API"
          >
            Switch
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          No version loaded
        </div>
      )}
    </div>
  );
}
