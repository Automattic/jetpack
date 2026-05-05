// NOTE: `'embedded'` is intentionally not derivable from booleans — the legacy
// REST schema only exposes `module_active` / `instant_search_enabled`, which
// can't distinguish Embedded from Theme search. Embedded can only enter the
// store via `setLastSavedExperience()` within a session, or — once RSM-2291
// lands — be seeded from the back end's persisted `experience` field.
const deriveExperienceFromBooleans = state => {
	if ( ! state.jetpackSettings.module_active ) {
		return 'off';
	}
	if ( state.jetpackSettings.instant_search_enabled ) {
		return 'overlay';
	}
	return 'classic';
};

const jetpackSettingSelectors = {
	getSearchModuleStatus: state => state.jetpackSettings,
	isModuleEnabled: state => state.jetpackSettings.module_active,
	isInstantSearchEnabled: state => state.jetpackSettings.instant_search_enabled,
	isUpdatingJetpackSettings: state => state.jetpackSettings.is_updating,
	isTogglingModule: state => state.jetpackSettings.is_toggling_module,
	isTogglingInstantSearch: state => state.jetpackSettings.is_toggling_instant_search,

	getPendingExperience: state => state.jetpackSettings.pending_experience ?? null,
	getLastSavedExperience: state => state.jetpackSettings.last_saved_experience ?? null,

	// `last_saved_experience` is set on a successful save (this session) and,
	// once the back end persists the field, will be seeded from initial state
	// at boot. Until then, fall back to deriving from the existing booleans.
	getActiveExperience: state =>
		state.jetpackSettings.last_saved_experience ?? deriveExperienceFromBooleans( state ),

	getSelectedExperience: state => {
		const pending = state.jetpackSettings.pending_experience;
		if ( pending !== null && pending !== undefined ) {
			return pending;
		}
		return jetpackSettingSelectors.getActiveExperience( state );
	},

	isDirty: state => {
		const pending = state.jetpackSettings.pending_experience;
		if ( pending === null || pending === undefined ) {
			return false;
		}
		return pending !== jetpackSettingSelectors.getActiveExperience( state );
	},
};

export default jetpackSettingSelectors;
