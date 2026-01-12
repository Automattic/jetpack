import { __ } from '@wordpress/i18n';
import { useState, useMemo, useCallback } from 'react';
import { getNavigationScreen, getParentScreenId } from './navigation-config';
import SidebarNavigationItem from './navigation-item';
import SidebarNavigationScreen from './navigation-screen';
import './style.scss';

/**
 * SidebarNavigation component - modern app-like navigation for Jetpack.
 *
 * This component implements the navigation pattern proposed in the P2 post
 * "Reimagining Jetpack Navigation", adopting patterns from modern WordPress
 * admin experiences like the Site Editor.
 *
 * @param {object} props              - Component props.
 * @param {string} props.currentRoute - The current hash route (e.g., '/dashboard').
 * @return {Element|null} The sidebar navigation component.
 */
export default function SidebarNavigation( { currentRoute } ) {
	const [ currentScreenId, setCurrentScreenId ] = useState( 'root' );

	const currentScreen = useMemo(
		() => getNavigationScreen( currentScreenId ),
		[ currentScreenId ]
	);

	const handleDrilldown = useCallback( screenId => {
		setCurrentScreenId( screenId );
	}, [] );

	const handleBack = useCallback( () => {
		const parentId = getParentScreenId( currentScreenId );
		if ( parentId ) {
			setCurrentScreenId( parentId );
		}
	}, [ currentScreenId ] );

	const isItemActive = useCallback(
		item => {
			if ( ! item.to ) {
				return false;
			}
			return currentRoute === item.to || currentRoute.startsWith( item.to + '/' );
		},
		[ currentRoute ]
	);

	if ( ! currentScreen ) {
		return null;
	}

	const isRoot = currentScreenId === 'root';

	return (
		<nav className="jp-sidebar-navigation" aria-label={ __( 'Jetpack Navigation', 'jetpack' ) }>
			<div className="jp-sidebar-navigation__header">
				<div className="jp-sidebar-navigation__logo">
					<svg
						width="32"
						height="32"
						viewBox="0 0 32 32"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 2.133c7.659 0 13.867 6.208 13.867 13.867S23.659 29.867 16 29.867 2.133 23.659 2.133 16 8.341 2.133 16 2.133z"
							fill="#069e08"
						/>
						<path d="M15.5 17.5v8.5l-8-12h8v-9l8 12.5h-8z" fill="#069e08" />
					</svg>
					<span className="jp-sidebar-navigation__title">{ __( 'Jetpack', 'jetpack' ) }</span>
				</div>
			</div>

			<SidebarNavigationScreen
				isRoot={ isRoot }
				title={ currentScreen.title }
				onBack={ handleBack }
			>
				{ currentScreen.items.map( item => (
					<SidebarNavigationItem
						key={ item.id }
						id={ item.id }
						icon={ item.icon }
						label={ item.label }
						to={ item.to }
						isDrilldown={ item.isDrilldown }
						onClick={ item.isDrilldown ? handleDrilldown : undefined }
						isActive={ isItemActive( item ) }
					/>
				) ) }
			</SidebarNavigationScreen>
		</nav>
	);
}
