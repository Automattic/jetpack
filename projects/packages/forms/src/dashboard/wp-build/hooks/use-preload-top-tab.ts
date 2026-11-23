/**
 * WordPress dependencies
 */
import { useLinkProps } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { TOP_TAB_PATHS, type TopTab } from '../../top-tabs.ts';
import type { HTMLAttributes } from 'react';

export type PreloadTopTabProps = Pick<
	HTMLAttributes< HTMLElement >,
	'onFocus' | 'onMouseEnter' | 'onMouseLeave' | 'onTouchStart'
>;

/**
 * Preloads the top tab that isn't showing once the user hovers, focuses or touches it.
 *
 * The tabs are buttons, so they don't get the router's link preload unless these handlers are spread on them.
 *
 * @param activeTab - The tab on screen.
 * @param disabled  - Skip the preload, for screens that don't render the top tabs.
 * @return Handlers to spread on the tab that isn't showing.
 */
export default function usePreloadTopTab(
	activeTab: TopTab,
	disabled: boolean
): PreloadTopTabProps {
	const { onFocus, onMouseEnter, onMouseLeave, onTouchStart } = useLinkProps( {
		to: TOP_TAB_PATHS[ activeTab === 'forms' ? 'responses' : 'forms' ],
		preload: 'intent',
		disabled,
	} );

	return { onFocus, onMouseEnter, onMouseLeave, onTouchStart };
}
