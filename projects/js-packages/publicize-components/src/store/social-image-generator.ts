import { createWpDataSync } from '@automattic/wp-data-sync';
import { SocialImageGeneratorConfig, SocialStoreState } from './types';

const key = 'jetpack_social_image_generator_settings';

export default createWpDataSync< SocialImageGeneratorConfig, 'socialImageGeneratorConfig' >(
	'socialImageGeneratorConfig',
	{
		endpoint: `/wp/v2/settings?_fields=${ key }`,
		getSliceFromState: ( { settings }: SocialStoreState ) => settings.socialImageGenerator,
		extractFetchResponse: response => response[ key ],
		prepareUpdateRequest: data => ( { [ key ]: data } ),
	}
);
