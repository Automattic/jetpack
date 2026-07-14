/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { isPostDetailTabLayouts } from '../config';
import { POST_DETAIL_PREFERENCES_SCOPE, POST_DETAIL_TAB_LAYOUTS_KEY } from './constants';
import type { PostDetailTabId, PostDetailTabLayouts } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const EMPTY_LAYOUT: DashboardWidget[] = [];
const EMPTY_TAB_LAYOUTS: PostDetailTabLayouts = {};

type PreferencesActions = {
	set: ( scope: string, key: string, value: PostDetailTabLayouts ) => Promise< void > | void;
};

/**
 * Manage the customizable widget layout for the currently active post-detail tab.
 *
 * Each tab customizes an independent widget grid, persisted under a single tab
 * layout map in the post-detail preferences scope. The page ships no default
 * widgets yet (the post-scoped widgets are ported separately), so a tab with no
 * stored layout starts empty and reset clears it back to empty.
 *
 * @param activeTabId - Currently active tab ID.
 * @return Active tab layout, setter, and reset action.
 */
export function usePostDetailTabLayout(
	activeTabId: PostDetailTabId
): [ DashboardWidget[], ( layout: DashboardWidget[] ) => void, () => void ] {
	const tabLayouts = useSelect( select => {
		const value = (
			select( preferencesStore ) as unknown as {
				get: ( scope: string, key: string ) => unknown;
			}
		 ).get( POST_DETAIL_PREFERENCES_SCOPE, POST_DETAIL_TAB_LAYOUTS_KEY );

		return isPostDetailTabLayouts( value ) ? value : EMPTY_TAB_LAYOUTS;
	}, [] );

	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	const layout = useMemo(
		() => tabLayouts[ activeTabId ] ?? EMPTY_LAYOUT,
		[ activeTabId, tabLayouts ]
	);

	const setLayout = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			void set( POST_DETAIL_PREFERENCES_SCOPE, POST_DETAIL_TAB_LAYOUTS_KEY, {
				...tabLayouts,
				[ activeTabId ]: nextLayout,
			} );
		},
		[ activeTabId, tabLayouts, set ]
	);

	const resetLayout = useCallback( () => {
		void set( POST_DETAIL_PREFERENCES_SCOPE, POST_DETAIL_TAB_LAYOUTS_KEY, {
			...tabLayouts,
			[ activeTabId ]: EMPTY_LAYOUT,
		} );
	}, [ activeTabId, tabLayouts, set ] );

	return [ layout, setLayout, resetLayout ];
}
