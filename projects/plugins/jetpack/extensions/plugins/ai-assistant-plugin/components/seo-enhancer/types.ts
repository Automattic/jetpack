export type PromptType = 'seo-title' | 'seo-meta-description' | 'images-alt-text';

export type JetpackModuleSettings = {
	[ module: string ]: {
		options: {
			[ option: string ]: {
				current_value: boolean;
			};
		};
	};
};

export type JetpackModuleSelector = {
	getJetpackModules: () => JetpackModuleSettings;
};

export type SeoEnhancerState = {
	isBusy?: boolean;
	isTogglingAutoEnhance?: boolean;
	isAutoEnhanceEnabled?: boolean;
	busyImages?: Record< string, boolean >;
	failedImages?: Record< string, boolean >;
	features?: Record< PromptType, boolean >;
};

export type SeoEnhancerAction = {
	type:
		| 'SET_BUSY'
		| 'SET_IS_TOGGLING_AUTO_ENHANCE'
		| 'SET_IS_AUTO_ENHANCE_ENABLED'
		| 'SET_IMAGE_BUSY'
		| 'SET_IMAGE_FAILED'
		| 'SET_FEATURE_ENABLED';
	isBusy?: boolean;
	isToggling?: boolean;
	isEnabled?: boolean;
	clientId?: string;
	failed?: boolean;
	feature?: PromptType;
	enabled?: boolean;
};
