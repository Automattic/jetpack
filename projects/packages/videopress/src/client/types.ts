/*
 * Video Privacy:
 * '0': public
 * '1': private
 * '2': site default
 */
type PrivacySettingProp = '0' | '1' | '2';

export type WPComV2VideopressGetMetaEndpointResponseProps = {
	code: string;
	data: 200 | number; // <- check other data variants
	message: string;
};

export type WPComV2VideopressPostMetaEndpointBodyProps = {
	title?: string;
	description?: string;
	privacy_setting?: PrivacySettingProp;
};

/*
 * 'wp/v2/media/${ id }'
 */
export type WPV2mediaGetEndpointResponseProps = {
	source_url: string;
	jetpack_videopress?: {
		guid: string;
		title: string;
		description: string;
		caption: string;
		allow_download: 0 | 1;
		needs_playback_token: boolean;
		privacy_setting: PrivacySettingProp;
		rating: string;
	};
	media_details: {
		videopress?: {
			is_private: boolean;
		};
	};
};
