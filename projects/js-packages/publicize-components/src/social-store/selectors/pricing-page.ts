import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { SHOW_PRICING_PAGE_KEY } from '../constants';

/**
 * Returns the Show Pricing Page enabled status for the current site.
 */
export const shouldShowPricingPage = createRegistrySelector( select => () => {
	const { getSite } = select( coreStore );

	const settings = getSite( undefined, { _fields: SHOW_PRICING_PAGE_KEY } );

	// If the settings are not available in the store yet, use the default settings.
	return (
		settings?.[ SHOW_PRICING_PAGE_KEY ] ??
		getSocialScriptData().settings?.socialPlugin?.show_pricing_page
	);
} );
