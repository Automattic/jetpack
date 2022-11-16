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
	jetpack_videopress?: {
		title: string;
		description: string;
	};
};
