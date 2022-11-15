/*
 * Video Privacy:
 * '0': public
 * '1': private
 * '2': site default
 */
type privacySettingProp = '0' | '1' | '2';

export type wpcomV2VideopressGetMetaEndpointResponseProps = {
	code: string;
	data: 200 | number; // <- check other data variants
	message: string;
};

export type wpcomV2VideopressPostMetaEndpointBodyProps = {
	title?: string;
	description?: string;
	privacy_setting?: privacySettingProp;
};

/*
 * 'wp/v2/media/${ id }'
 */
export type wpV2mediaGetEndpointResponseProps = {
	jetpack_videopress?: {
		title: string;
		description: string;
	};
};
