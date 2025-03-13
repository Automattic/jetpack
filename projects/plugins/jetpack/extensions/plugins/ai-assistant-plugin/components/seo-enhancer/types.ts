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
};

export type SeoEnhancerAction = {
	type: 'SET_BUSY' | 'SET_IS_TOGGLING_AUTO_ENHANCE' | 'SET_IS_AUTO_ENHANCE_ENABLED';
	isBusy?: boolean;
	isToggling?: boolean;
	isEnabled?: boolean;
};
