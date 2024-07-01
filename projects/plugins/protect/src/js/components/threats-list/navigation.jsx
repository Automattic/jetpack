import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import {
	wordpress as coreIcon,
	plugins as pluginsIcon,
	warning as warningIcon,
	color as themesIcon,
	code as filesIcon,
	grid as databaseIcon,
	Icon,
	check,
	info,
} from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import Navigation, { NavigationItem, NavigationGroup } from '../navigation';
import styles from './styles.module.scss';

const CheckedBadge = () => {
	return <Icon icon={ check } size={ 28 } className={ styles[ 'navigation-item-check-badge' ] } />;
};

const NotCheckedBadge = () => {
	return <Icon icon={ info } size={ 28 } className={ styles[ 'navigation-item-info-badge' ] } />;
};

export const ThreatsCountBadge = ( { count, selected } ) => {
	return (
		<Text
			variant="body-extra-small"
			className={ clsx(
				styles[ 'navigation-item-badge' ],
				selected && styles[ 'navigation-item-badge--selected' ]
			) }
			component="div"
		>
			{ count }
		</Text>
	);
};

const getExtensionBadgeElement = ( threats, checked, selected ) => {
	if ( threats?.length ) {
		return <ThreatsCountBadge count={ threats.length } selected={ selected } />;
	}
	if ( checked ) {
		return <CheckedBadge />;
	}
	return <NotCheckedBadge />;
};

const newExtensionPopoverText = __(
	'This item was added to your site after the most recent scan. We will check for threats during the next scheduled one.',
	'jetpack-protect'
);

const checkedExtensionPopoverText = __(
	'No known threats found to affect this version',
	'jetpack-protect'
);

const ThreatsNavigation = ( { selected, onSelect } ) => {
	const {
		plugins,
		themes,
		numThreats,
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
				disabled={ numThreats === 0 }
				onClick={ trackNavigationClickAll }
				badgeElement={
					numThreats ? (
						<ThreatsCountBadge count={ numThreats } selected={ selected === 'all' } />
					) : (
						<CheckedBadge />
					)
				}
				badgePopoverText={
					numThreats === 0
						? __( 'No threats were found in the lastest scan.', 'jetpack-protect' )
						: undefined
				}
			/>
			<NavigationItem
				id="wordpress"
				label={ __( 'WordPress', 'jetpack-protect' ) }
				icon={ coreIcon }
				iconCount={ numCoreThreats }
				disabled={ numCoreThreats <= 0 }
				onClick={ trackNavigationClickCore }
				checked={ true }
				badgeElement={
					numCoreThreats ? (
						<ThreatsCountBadge count={ numCoreThreats } selected={ selected === 'wordpress' } />
					) : (
						<CheckedBadge />
					)
				}
				badgePopoverText={ numCoreThreats === 0 ? checkedExtensionPopoverText : undefined }
			/>
			<NavigationGroup label={ __( 'Plugins', 'jetpack-protect' ) } icon={ pluginsIcon }>
				{ plugins.map( ( { name, threats, checked } ) => {
					let badgePopoverText;
					if ( checked && threats.length === 0 ) {
						badgePopoverText = checkedExtensionPopoverText;
					} else if ( ! checked ) {
						badgePopoverText = newExtensionPopoverText;
					}
					return (
						<NavigationItem
							key={ name }
							id={ name }
							label={ name }
							checked={ checked }
							iconCount={ threats?.length }
							disabled={ threats?.length <= 0 }
							onClick={ trackNavigationClickPlugin }
							badgeElement={ getExtensionBadgeElement( threats, checked, selected === name ) }
							badgePopoverText={ badgePopoverText }
						/>
					);
				} ) }
			</NavigationGroup>
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ themesIcon }>
				{ themes.map( ( { name, threats, checked } ) => {
					let badgePopoverText;
					if ( checked && threats.length === 0 ) {
						badgePopoverText = checkedExtensionPopoverText;
					} else if ( ! checked ) {
						badgePopoverText = newExtensionPopoverText;
					}
					return (
						<NavigationItem
							key={ name }
							id={ name }
							label={ name }
							checked={ checked }
							iconCount={ threats?.length }
							disabled={ threats?.length <= 0 }
							onClick={ trackNavigationClickTheme }
							badgeElement={ getExtensionBadgeElement( threats, checked, selected === name ) }
							badgePopoverText={ badgePopoverText }
						/>
					);
				} ) }
			</NavigationGroup>
			{ hasRequiredPlan && (
				<>
					<NavigationItem
						id="files"
						label={ __( 'Files', 'jetpack-protect' ) }
						icon={ filesIcon }
						iconCount={ numFilesThreats }
						disabled={ numFilesThreats <= 0 }
						onClick={ trackNavigationClickFiles }
						checked={ true }
						badgeElement={
							numFilesThreats ? (
								<ThreatsCountBadge count={ numFilesThreats } selected={ selected === 'files' } />
							) : (
								<CheckedBadge />
							)
						}
						badgePopoverText={
							! numFilesThreats
								? __( 'No known file threats were found in the latest scan.', 'jetpack-protect' )
								: undefined
						}
					/>
					<NavigationItem
						id="database"
						label={ __( 'Database', 'jetpack-protect' ) }
						icon={ databaseIcon }
						iconCount={ numDatabaseThreats }
						disabled={ numDatabaseThreats <= 0 }
						onClick={ trackNavigationClickDatabase }
						checked={ true }
						badgeElement={
							numDatabaseThreats ? (
								<ThreatsCountBadge
									count={ numDatabaseThreats }
									selected={ selected === 'database' }
								/>
							) : (
								<CheckedBadge />
							)
						}
						badgePopoverText={
							! numDatabaseThreats
								? __(
										'No known database threats were found in the lastest scan.',
										'jetpack-protect'
								  )
								: undefined
						}
					/>
				</>
			) }
		</Navigation>
	);
};

export default ThreatsNavigation;
