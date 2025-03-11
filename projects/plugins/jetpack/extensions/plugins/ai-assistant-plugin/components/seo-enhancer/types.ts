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
