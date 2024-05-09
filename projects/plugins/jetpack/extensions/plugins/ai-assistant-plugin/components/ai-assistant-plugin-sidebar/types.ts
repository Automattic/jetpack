export const PLACEMENT_JETPACK_SIDEBAR = 'jetpack-sidebar' as const;
export const PLACEMENT_DOCUMENT_SETTINGS = 'document-settings' as const;
export const PLACEMENT_PRE_PUBLISH = 'pre-publish' as const;

export type JetpackSettingsContentProps = {
	placement: typeof PLACEMENT_JETPACK_SIDEBAR | typeof PLACEMENT_DOCUMENT_SETTINGS;
	requireUpgrade: boolean;
	upgradeType: string;
};
