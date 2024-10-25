export type SocialImageGeneratorConfig = {
	enabled: boolean;
	template?: string;
};

export type SocialStoreState = {
	settings: {
		socialImageGenerator: { data: SocialImageGeneratorConfig };
	};
};
