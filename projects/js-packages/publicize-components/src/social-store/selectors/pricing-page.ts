import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { SHOW_PRICING_PAGE_KEY } from '../constants';

/**
 * Returns the UTM state.
 */
export const getShouldShowPricingPage = createRegistrySelector( select => () => {
	// @ts-expect-error TS2339 - https://github.com/WordPress/gutenberg/issues/67847
	const { getSite } = select( coreStore );

	const settings = getSite( undefined, { _fields: SHOW_PRICING_PAGE_KEY } ) as boolean;

	// If the settings are not available in the store yet, use the default settings.
	return (
		settings?.[ SHOW_PRICING_PAGE_KEY ] ??
		getSocialScriptData().settings?.socialPlugin?.show_pricing_page
	);
} );
