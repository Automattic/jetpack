/**
 * WordPress dependencies
 */
import { useLinkProps } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { TOP_TAB_PATHS, type TopTab } from '../../top-tabs.ts';

/**
 * Preloads the top tab that isn't showing, so switching to it doesn't wait on its code and data.
 *
 * The tabs are buttons, so they never get the router's hover preload that a link would.
 *
 * @param activeTab - The tab on screen.
 * @param disabled  - Skip the preload, for screens that don't render the top tabs.
 */
export default function usePreloadTopTab( activeTab: TopTab, disabled: boolean ): void {
	useLinkProps( {
		to: TOP_TAB_PATHS[ activeTab === 'forms' ? 'responses' : 'forms' ],
		preload: 'render',
		disabled,
	} );
}
