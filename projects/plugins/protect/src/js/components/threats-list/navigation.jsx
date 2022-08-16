import { useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { wordpress, plugins as pluginsIcon, warning, color } from '@wordpress/icons';
import { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import Navigation, { NavigationItem, NavigationGroup } from '../navigation';

const ThreatsNavigation = ( { selected, onSelect } ) => {
	const { plugins, themes, numThreats, numCoreThreats } = useProtectData();
	const { recordEvent } = useAnalyticsTracks();
	const [ isSmallOrLarge ] = useBreakpointMatch( 'lg', '<' );

	const trackNavigationClickAll = useCallback( () => {
		recordEvent( 'jetpack_protect_navigation_all_click' );
	}, [ recordEvent ] );

	const trackNavigationClickCore = useCallback( () => {
		recordEvent( 'jetpack_protect_navigation_core_click' );
	}, [ recordEvent ] );

	const trackNavigationClickPlugin = useCallback( () => {
		recordEvent( 'jetpack_protect_navigation_plugin_click' );
	}, [ recordEvent ] );

	const trackNavigationClickTheme = useCallback( () => {
		recordEvent( 'jetpack_protect_navigation_theme_click' );
	}, [ recordEvent ] );

	return (
		<Navigation
			selected={ selected }
			onSelect={ onSelect }
			mode={ isSmallOrLarge ? 'dropdown' : 'list' }
		>
			<NavigationItem
				initial
				id="all"
				label={ __( 'All threats', 'jetpack-protect' ) }
				icon={ warning }
				badge={ numThreats }
				disabled={ numThreats <= 0 }
				onClick={ trackNavigationClickAll }
				checked={ true }
			/>
			<NavigationItem
				id="wordpress"
				label={ __( 'WordPress', 'jetpack-protect' ) }
				icon={ wordpress }
				badge={ numCoreThreats }
				disabled={ numCoreThreats <= 0 }
				onClick={ trackNavigationClickCore }
				checked={ true }
			/>
			<NavigationGroup label={ __( 'Plugins', 'jetpack-protect' ) } icon={ pluginsIcon }>
				{ plugins.map( ( { name, threats, checked } ) => (
					<NavigationItem
						key={ name }
						id={ name }
						label={ name }
						checked={ checked }
						badge={ threats?.length }
						disabled={ threats?.length <= 0 }
						onClick={ trackNavigationClickPlugin }
					/>
				) ) }
			</NavigationGroup>
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ color }>
				{ themes.map( ( { name, threats, checked } ) => (
					<NavigationItem
						key={ name }
						id={ name }
						label={ name }
						checked={ checked }
						badge={ threats?.length }
						disabled={ threats?.length <= 0 }
						onClick={ trackNavigationClickTheme }
					/>
				) ) }
			</NavigationGroup>
		</Navigation>
	);
};

export default ThreatsNavigation;
