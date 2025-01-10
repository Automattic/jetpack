import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import * as connectionDataSelectors from './connection-data';
import * as shareStatusSelectors from './share-status';
import * as sigSelectors from './social-image-generator';
import * as socialPluginSelectors from './social-plugin-settings';
import * as utmSelectors from './utm-settings';

/**
 * Returns whether the site settings are being saved.
 */
export const isSavingSiteSettings = createRegistrySelector( select => () => {
	return select( coreStore ).isSavingEntityRecord( 'root', 'site', undefined );
} );

const selectors = {
	...connectionDataSelectors,
	...shareStatusSelectors,
	isSavingSiteSettings,
	...sigSelectors,
	...utmSelectors,
	...socialPluginSelectors,
};

export default selectors;
