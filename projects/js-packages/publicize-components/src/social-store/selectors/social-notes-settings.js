const socialNotesSettingsSelectors = {
	isSocialNotesEnabled: state => state.socialNotesSettings.enabled,
	isSocialNotesSettingsUpdating: state => state.socialNotesSettings.isUpdating,
};

export default socialNotesSettingsSelectors;
