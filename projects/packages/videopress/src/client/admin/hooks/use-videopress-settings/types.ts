export type useVideoPressSettingsProps = {
	settings: {
		videoPressVideosPrivateForSite: boolean;
		siteIsPrivate: boolean;
		siteType: 'atomic' | 'jetpack' | 'simple';
	};
	onUpdate: ( settings: { videoPressVideosPrivateForSite: boolean } ) => void;
};
