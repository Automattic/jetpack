/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { Link } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { TOP_TAB_HREFS, TOP_TABS } from '../../../constants.ts';
import { saveLastTab } from '../../../last-tab-cookie.ts';
import type { Page } from '@wordpress/admin-ui';
import type { ComponentProps } from 'react';

type PageComponents = NonNullable< ComponentProps< typeof Page >[ 'components' ] >;
type NavigationLinkProps = ComponentProps< NonNullable< PageComponents[ 'link' ] > >;

const TAB_BY_HREF = Object.fromEntries( TOP_TABS.map( tab => [ TOP_TAB_HREFS[ tab ], tab ] ) );

const ACTIVE_OPTIONS = { exact: true };

/**
 * Router link behind the page header's section navigation.
 *
 * `activeOptions.exact` is load-bearing: TanStack appends its own
 * `aria-current="page"` after the one admin-ui derives from `currentHref`, and
 * its default prefix matching would mark more than one item as current.
 *
 * @param props      - Anchor props from admin-ui's Navigation.
 * @param props.href - The section's route path.
 * @return The link element.
 */
export default function RouteLink( { href, ...props }: NavigationLinkProps ) {
	// Only a deliberate click is remembered, so arriving on a response through an
	// email link cannot quietly change which tab the dashboard reopens on.
	const rememberSection = useCallback( () => {
		const tab = TAB_BY_HREF[ href ];
		if ( tab ) {
			saveLastTab( tab );
		}
	}, [ href ] );

	return (
		<Link to={ href } activeOptions={ ACTIVE_OPTIONS } onClick={ rememberSection } { ...props } />
	);
}

/**
 * `Page`'s `components` override, hoisted so a screen passes the same object on
 * every render.
 */
export const PAGE_COMPONENTS: PageComponents = { link: RouteLink };
