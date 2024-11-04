import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import * as connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import * as shareStatusSelectors from './share-status';
import siteDataSelectors from './site-data';
import * as sigSelectors from './social-image-generator';
import * as socialPluginSelectors from './social-plugin-settings';

/**
 * Returns whether the site settings are being saved.
 *
 * @type {() => boolean} Whether the site settings are being saved.
 */
export const isSavingSiteSettings = createRegistrySelector( select => () => {
	return select( coreStore ).isSavingEntityRecord( 'root', 'site', undefined );
} );

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...shareStatusSelectors,
	isSavingSiteSettings,
	...sigSelectors,
	...socialPluginSelectors,
};

export default selectors;
