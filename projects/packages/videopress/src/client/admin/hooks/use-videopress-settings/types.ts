export type useVideoPressSettingsProps = {
	settings: {
		videoPressVideosPrivateForSite: boolean;
	};
	onUpdate: ( settings: { videoPressVideosPrivateForSite: boolean } ) => void;
};
