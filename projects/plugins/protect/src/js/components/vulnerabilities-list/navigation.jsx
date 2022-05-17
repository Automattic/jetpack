/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { wordpress, plugins as pluginsIcon, warning, color } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Navigation, { NavigationItem, NavigationGroup } from '../navigation';
import useProtectData from '../../hooks/use-protect-data';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { useCallback } from 'react';

const VulnerabilitiesNavigation = ( { selected, onSelect } ) => {
	const { plugins, themes, numVulnerabilities, numCoreVulnerabilities } = useProtectData();

	const { recordEventHandler } = useAnalyticsTracks();

	const trackNavigationClickAll = useCallback( () => {
		recordEventHandler( 'jetpack_protect_navigation_all_click' );
	}, [ recordEventHandler ] );

	const trackNavigationClickCore = useCallback( () => {
		recordEventHandler( 'jetpack_protect_navigation_core_click' );
	}, [ recordEventHandler ] );

	const trackNavigationClickPlugin = useCallback( () => {
		recordEventHandler( 'jetpack_protect_navigation_plugin_click' );
	}, [ recordEventHandler ] );

	const trackNavigationClickTheme = useCallback( () => {
		recordEventHandler( 'jetpack_protect_navigation_theme_click' );
	}, [ recordEventHandler ] );

	return (
		<Navigation selected={ selected } onSelect={ onSelect }>
			<NavigationItem
				initial
				id="all"
				label={ __( 'All vulnerabilities', 'jetpack-protect' ) }
				icon={ warning }
				badge={ numVulnerabilities }
				disabled={ numVulnerabilities <= 0 }
				onClick={ trackNavigationClickAll }
			/>
			<NavigationItem
				id="wordpress"
				label={ __( 'WordPress', 'jetpack-protect' ) }
				icon={ wordpress }
				badge={ numCoreVulnerabilities }
				disabled={ numCoreVulnerabilities <= 0 }
				onClick={ trackNavigationClickCore }
			/>
			<NavigationGroup label={ __( 'Plugins', 'jetpack-protect' ) } icon={ pluginsIcon }>
				{ plugins.map( ( { name, vulnerabilities, notChecked } ) => (
					<NavigationItem
						key={ name }
						id={ name }
						label={ name }
						notChecked={ notChecked }
						badge={ vulnerabilities?.length }
						disabled={ vulnerabilities?.length <= 0 }
						onClick={ trackNavigationClickPlugin }
					/>
				) ) }
			</NavigationGroup>
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ color }>
				{ themes.map( ( { name, vulnerabilities, notChecked } ) => (
					<NavigationItem
						key={ name }
						id={ name }
						label={ name }
						notChecked={ notChecked }
						badge={ vulnerabilities?.length }
						disabled={ vulnerabilities?.length <= 0 }
						onClick={ trackNavigationClickTheme }
					/>
				) ) }
			</NavigationGroup>
		</Navigation>
	);
};

export default VulnerabilitiesNavigation;
