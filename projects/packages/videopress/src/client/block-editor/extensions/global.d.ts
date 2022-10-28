export type VideoPressExtensionProp = {
	name: string;
	isEnabled: boolean;
	isBeta: boolean;
};

export type VideoPressExtensionsProp = Array< VideoPressExtensionProp >;

export declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		videoPressExtensions: VideoPressExtensions;
	}
}
