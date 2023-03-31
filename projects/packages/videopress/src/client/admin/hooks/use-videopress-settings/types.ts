import { SiteType } from '../../types';

export type useVideoPressSettingsProps = {
	settings: {
		videoPressVideosPrivateForSite: boolean;
		siteIsPrivate: boolean;
		siteType: SiteType;
	};
	onUpdate: ( settings: { videoPressVideosPrivateForSite: boolean } ) => void;
};
