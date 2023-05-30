import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
import styles from './styles.module.scss';

const ThreatsNavigation = ( { selected, onSelect } ) => {
	const {
		plugins,
		themes,
		numThreats,
		numPluginsThreats,
		numThemesThreats,
		numCoreThreats,
		numFilesThreats,
		numDatabaseThreats,
		hasRequiredPlan,
	} = useProtectData();
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
			<NavigationGroup
				id="plugins"
				label={ createInterpolateElement(
					sprintf(
						// translators: %s is the number of plugins installed on the site.
						__( 'Plugins <small>(%s)</small>', 'jetpack-protect' ),
						plugins.length
					),
					{
						small: (
							<Text
								variant="body-extra-small"
								component="span"
								className={ styles[ 'navigation-group-count' ] }
							/>
						),
					}
				) }
				icon={ pluginsIcon }
				badge={ numPluginsThreats }
				checked={ plugins.filter( plugin => plugin.checked ).length === plugins.length }
				items={ plugins.map( plugin => ( { ...plugin, onClick: trackNavigationClickPlugin } ) ) }
				onClick={ trackNavigationClickPlugin }
			/>
			<NavigationGroup
				id="themes"
				label={ createInterpolateElement(
					sprintf(
						// translators: %s is the number of themes installed on the site.
						__( 'Themes <small>(%s)</small>', 'jetpack-protect' ),
						themes.length
					),
					{
						small: (
							<Text
								variant="body-extra-small"
								component="span"
								className={ styles[ 'navigation-group-count' ] }
							/>
						),
					}
				) }
				icon={ themesIcon }
				badge={ numThemesThreats }
				checked={ themes.filter( theme => theme.checked ).length === themes.length }
				items={ themes.map( theme => ( { ...theme, onClick: trackNavigationClickTheme } ) ) }
				onClick={ trackNavigationClickTheme }
			/>
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
