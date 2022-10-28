export type VideoPressExtensionProp = {
	name: string;
	isEnabled: boolean;
	isBeta: boolean;
};

export type VideoPressExtensionsProp = Array< VideoPressExtensionProp >;

export declare global {
	interface Window {
		videoPressExtensions: VideoPressExtensionsProps;
	}
}
