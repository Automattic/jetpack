// Defence-in-depth fallback for the case where the back end hasn't been
// updated to send `experience` yet (or a unit test stubs only the legacy
// fields). `'embedded'` isn't derivable from booleans alone — the legacy
// schema can't distinguish Embedded from Theme search — so derived inline
// is the right default in that case; once the back end ships, the seeded
// `experience` value takes precedence.
const deriveExperienceFromBooleans = state => {
	if ( ! state.jetpackSettings.module_active ) {
		return 'off';
	}
	if ( state.jetpackSettings.instant_search_enabled ) {
		return 'overlay';
	}
	return 'inline';
};

const jetpackSettingSelectors = {
	getSearchModuleStatus: state => state.jetpackSettings,
	isModuleEnabled: state => state.jetpackSettings.module_active,
	isInstantSearchEnabled: state => state.jetpackSettings.instant_search_enabled,
	isReaderChatAvailable: state =>
		Object.prototype.hasOwnProperty.call( state.jetpackSettings, 'reader_chat' ),
	isReaderChatEnabled: state => state.jetpackSettings.reader_chat,
	isAiAnswersEnabled: state => !! state.jetpackSettings.ai_answers_enabled,
	isSearchSuggestionsEnabled: state => !! state.jetpackSettings.search_suggestions_enabled,
	isWooCommerceSearchTemplateOverrideEnabled: state =>
		!! state.jetpackSettings.override_woocommerce_search_template,
	isUpdatingJetpackSettings: state => state.jetpackSettings.is_updating,
	isTogglingModule: state => state.jetpackSettings.is_toggling_module,
	isTogglingInstantSearch: state => state.jetpackSettings.is_toggling_instant_search,

	getPendingExperience: state => state.jetpackSettings.pending_experience ?? null,

	getActiveExperience: state =>
		state.jetpackSettings.experience ?? deriveExperienceFromBooleans( state ),

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
