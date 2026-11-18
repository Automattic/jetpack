import { useBackToSettings } from '$lib/navigation/use-back-to-settings';
import type { AdminPage } from '@automattic/jetpack-components';
import type { AnchorHTMLAttributes, ComponentProps, MouseEvent } from 'react';

type AdminPageProps = ComponentProps< typeof AdminPage >;

/**
 * The "Boost" crumb's link: returns to Settings without a reload and records the click.
 *
 * @param props          - Anchor props from admin-ui's `Page`.
 * @param props.href     - Settings URL.
 * @param props.children - Link text.
 * @param props.onClick  - Click handler from `Page`, if any.
 * @return The link.
 */
function BackToSettingsLink( {
	href,
	children,
	onClick,
	...props
}: AnchorHTMLAttributes< HTMLAnchorElement > ) {
	const { onClick: backToSettings } = useBackToSettings( 'breadcrumb' );
	const handleClick = ( event: MouseEvent< HTMLAnchorElement > ) => {
		onClick?.( event );
		backToSettings( event );
	};

	return (
		<a { ...props } href={ href } onClick={ handleClick }>
			{ children }
		</a>
	);
}

const COMPONENTS: AdminPageProps[ 'components' ] = { link: BackToSettingsLink };

/**
 * "Boost / <page>" breadcrumbs, with "Boost" returning to Settings; spread onto `BoostAdminPage`.
 *
 * @param title - The page's title, the trailing crumb.
 * @return The `breadcrumbs` and `components` props.
 */
export function useSubpageBreadcrumbs(
	title: string
): Pick< AdminPageProps, 'breadcrumbs' | 'components' > {
	const { href } = useBackToSettings( 'breadcrumb' );

	return {
		// "Boost" is a product name, do not translate.
		breadcrumbs: [ { label: 'Boost', href }, { label: title } ],
		components: COMPONENTS,
	};
}
