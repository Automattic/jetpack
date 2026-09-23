import { Popover } from '@wordpress/components';
import { useMediaQuery } from '@wordpress/compose';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { menuLinkOf } from '../../../utils/admin-menu-sync';
import styles from './styles.module.scss';
import type { MenuPointerTarget } from './use-sidebar-sync';

const DISMISS_AFTER = 6000;

type MenuPointerProps = {
	target: MenuPointerTarget;
	onDismiss: () => void;
};

/**
 * Mark new menu items in the wp-admin sidebar: a pulsing dot on each, and one tooltip.
 *
 * Desktop only: below core's 783px breakpoint the sidebar is hidden behind the menu toggle.
 *
 * @param props           - Component props.
 * @param props.target    - The new menu items and what the tooltip says.
 * @param props.onDismiss - Called when the pointer should go away.
 * @return The rendered pointer, or nothing on small screens.
 */
export function MenuPointer( { target, onDismiss }: MenuPointerProps ) {
	// Not useViewportMatch: its "medium" is 782px, where core's sidebar is still hidden.
	const isDesktop = useMediaQuery( '(min-width: 783px)' );

	// A folded sidebar shows only top-level icons, so items inside one share its dot.
	const links = useMemo( () => {
		const found = target.elements.map( element => {
			const item = element.getClientRects().length
				? element
				: ( element.closest< HTMLElement >( 'li.menu-top' ) ?? element );

			return menuLinkOf( item ) ?? item;
		} );

		return [ ...new Set( found ) ];
	}, [ target ] );

	useEffect( () => {
		const timer = setTimeout( onDismiss, isDesktop ? DISMISS_AFTER : 0 );

		return () => clearTimeout( timer );
	}, [ isDesktop, onDismiss ] );

	if ( ! isDesktop ) {
		return null;
	}

	return (
		<>
			{ links.map( ( link, index ) =>
				createPortal(
					<span className={ styles[ 'menu-pointer__dot' ] } aria-hidden />,
					link,
					String( index )
				)
			) }
			<Popover
				anchor={ links[ 0 ] }
				placement="right"
				offset={ 8 }
				focusOnMount={ false }
				className={ styles[ 'menu-pointer' ] }
			>
				{ target.label }
			</Popover>
		</>
	);
}
