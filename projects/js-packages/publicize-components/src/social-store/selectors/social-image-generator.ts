import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { EMPTY_ARRAY } from '../constants';
import { SocialImageFontOption } from '../types';

/**
 * Get the list of font options for the Social Image Generator.
 *
 * @param state - State object.
 *
 * @return The list of font options.
 */
export const getSocialImageFontOptions = createRegistrySelector( select => {
	return (): Array< SocialImageFontOption > => {
		const data = select( coreStore ).getEntityRecords< SocialImageFontOption >(
			'wpcom/v2',
			'publicize/social-image-generator/font-options'
		);

		return data ?? EMPTY_ARRAY;
	};
} );

/**
 * Returns whether the font options for the Social Image Generator are being fetched.
 */
export const isFetchingSocialImageFontOptions = createRegistrySelector( select => {
	return (): boolean => {
		const { isResolving } = select( coreStore );

		return isResolving( 'getEntityRecords', [
			'wpcom/v2',
			'publicize/social-image-generator/font-options',
		] );
	};
} );
