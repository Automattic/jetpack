export type PrePublishConfirmation = 'show' | 'hide';

export interface UserJetpackSocialSettings {
	pre_publish_confirmation: PrePublishConfirmation;
}

export interface UserJetpackSocialSettingsHook {
	settings: UserJetpackSocialSettings;
	updateSettings: ( newSettings: Partial< UserJetpackSocialSettings > ) => Promise< void >;
	isLoading: boolean;
	isSaving: boolean;
}
