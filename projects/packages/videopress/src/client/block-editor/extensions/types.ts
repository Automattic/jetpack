export type VideoPressExtensionProps = {
	name: string;
	isEnabled: boolean;
	isBeta: boolean;
	adminUrl: string;
};

export type VideoPressExtensionsProps = Array< VideoPressExtensionProps >;
