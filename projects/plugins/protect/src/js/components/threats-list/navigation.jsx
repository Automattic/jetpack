import { useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import {
	wordpress as coreIcon,
	plugins as pluginsIcon,
	warning as warningIcon,
	color as themesIcon,
	code as filesIcon,
	grid as databaseIcon,
} from '@wordpress/icons';
import { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import Navigation, { NavigationItem, NavigationGroup } from '../navigation';

const ThreatsNavigation = ( { selected, onSelect } ) => {
	const {
		plugins,
		themes,
		numThreats,
		numCoreThreats,
		numFilesThreats,
		numDatabaseThreats,
		securityBundle,
	} = useProtectData();
	const { hasRequiredPlan } = securityBundle;
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

	const trackNavigationClickFiles = useCallback( () => {
		recordEvent( 'jetpack_protect_navigation_file_click' );
	}, [ recordEvent ] );

	const trackNavigationClickDatabase = useCallback( () => {
		recordEvent( 'jetpack_protect_navigation_database_click' );
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
				icon={ warningIcon }
				badge={ numThreats }
				disabled={ numThreats <= 0 }
				onClick={ trackNavigationClickAll }
				checked={ true }
			/>
			<NavigationItem
				id="wordpress"
				label={ __( 'WordPress', 'jetpack-protect' ) }
				icon={ coreIcon }
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
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ themesIcon }>
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
			{ hasRequiredPlan && (
				<>
					<NavigationItem
						id="files"
						label={ __( 'Files', 'jetpack-protect' ) }
						icon={ filesIcon }
						badge={ numFilesThreats }
						disabled={ numFilesThreats <= 0 }
						onClick={ trackNavigationClickFiles }
						checked={ true }
					/>
					<NavigationItem
						id="database"
						label={ __( 'Database', 'jetpack-protect' ) }
						icon={ databaseIcon }
						badge={ numDatabaseThreats }
						disabled={ numDatabaseThreats <= 0 }
						onClick={ trackNavigationClickDatabase }
						checked={ true }
					/>
				</>
			) }
		</Navigation>
	);
};

export default ThreatsNavigation;
