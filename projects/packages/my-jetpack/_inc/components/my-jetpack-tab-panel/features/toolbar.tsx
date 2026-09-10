import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { SearchControl, SelectControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button, Checkbox, Icon, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useAnalytics from '../../../hooks/use-analytics';
import { partitionSelection } from './partition-selection';
import styles from './styles.module.scss';
import type { BulkTarget } from './partition-selection';
import type { FeatureFilter } from './use-feature-filter';

type ToolbarProps = {
	targets: BulkTarget[];
	selectableSlugs: string[];
	selected: string[];
	onSelectedChange: ( slugs: string[] ) => void;
	filter: FeatureFilter;
	onFilterChange: ( filter: FeatureFilter ) => void;
	search: string;
	onSearchChange: ( search: string ) => void;
};

/**
 * The one control bar for every feature and module on the page.
 *
 * Sticky, so a selection made near the bottom of a long list can still be acted on
 * without scrolling back up.
 *
 * @param {ToolbarProps} props - The component props.
 * @return The rendered component.
 */
export function Toolbar( {
	targets,
	selectableSlugs,
	selected,
	onSelectedChange,
	filter,
	onFilterChange,
	search,
	onSearchChange,
}: ToolbarProps ) {
	const { recordEvent } = useAnalytics();
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );
	const { createErrorNotice } = useGlobalNotices();
	const [ isRunning, setIsRunning ] = useState( false );

	const { toInstall, toActivate, toDeactivate, modulesOn, modulesOff } = useMemo(
		() => partitionSelection( targets, selected ),
		[ targets, selected ]
	);

	const { install } = useInstallPlugins( toInstall );
	const { activate } = useActivatePlugins( toActivate );
	const { deactivate } = useDeactivatePlugins( toDeactivate );

	const canActivate = toInstall.length + toActivate.length + modulesOn.length > 0;
	const canDeactivate = toDeactivate.length + modulesOff.length > 0;
	const allSelected = selectableSlugs.length > 0 && selected.length === selectableSlugs.length;

	const runModules = useCallback(
		async ( names: string[], active: boolean ) => {
			// The modules store takes one module at a time, so these go in sequence.
			const failed: string[] = [];

			for ( const name of names ) {
				if ( ! ( await updateJetpackModuleStatus( { name, active } ) ) ) {
					failed.push( name );
				}
			}

			if ( failed.length ) {
				createErrorNotice(
					sprintf(
						/* translators: %s is a comma-separated list of module slugs. */
						__( 'Could not update: %s.', 'jetpack-my-jetpack' ),
						failed.join( ', ' )
					)
				);
			}
		},
		[ createErrorNotice, updateJetpackModuleStatus ]
	);

	const onActivateAll = useCallback( async () => {
		recordEvent( 'jetpack_myjetpack_features_bulk_activate', { count: selected.length } );
		setIsRunning( true );

		if ( toInstall.length ) {
			install();
		}

		if ( toActivate.length ) {
			activate();
		}

		await runModules( modulesOn, true );
		setIsRunning( false );
		onSelectedChange( [] );
	}, [
		activate,
		install,
		modulesOn,
		onSelectedChange,
		recordEvent,
		runModules,
		selected.length,
		toActivate.length,
		toInstall.length,
	] );

	const onDeactivateAll = useCallback( async () => {
		recordEvent( 'jetpack_myjetpack_features_bulk_deactivate', { count: selected.length } );
		setIsRunning( true );

		if ( toDeactivate.length ) {
			deactivate();
		}

		await runModules( modulesOff, false );
		setIsRunning( false );
		onSelectedChange( [] );
	}, [
		deactivate,
		modulesOff,
		onSelectedChange,
		recordEvent,
		runModules,
		selected.length,
		toDeactivate.length,
	] );

	const onToggleAll = useCallback(
		( checked: boolean ) => onSelectedChange( checked ? selectableSlugs : [] ),
		[ onSelectedChange, selectableSlugs ]
	);

	const onClear = useCallback( () => onSelectedChange( [] ), [ onSelectedChange ] );

	const onSelectFilter = useCallback(
		( next: string ) => onFilterChange( next as FeatureFilter ),
		[ onFilterChange ]
	);

	return (
		<div className={ styles.toolbar }>
			<Stack direction="row" align="center" gap="md" wrap="wrap">
				<Checkbox
					checked={ allSelected }
					indeterminate={ selected.length > 0 && ! allSelected }
					onCheckedChange={ onToggleAll }
					aria-label={ __( 'Select all features', 'jetpack-my-jetpack' ) }
				/>

				<Text variant="body-sm" className={ styles.toolbar__status }>
					{ selected.length === 0
						? __( 'Select features to turn several on or off at once.', 'jetpack-my-jetpack' )
						: sprintf(
								/* translators: %d is the number of selected features. */
								_n(
									'%d feature selected',
									'%d features selected',
									selected.length,
									'jetpack-my-jetpack'
								),
								selected.length
						  ) }
				</Text>

				{ selected.length > 0 && (
					<Stack direction="row" align="center" gap="sm">
						<Button
							variant="solid"
							size="compact"
							disabled={ ! canActivate || isRunning }
							loading={ isRunning }
							onClick={ onActivateAll }
						>
							{ __( 'Activate', 'jetpack-my-jetpack' ) }
						</Button>
						<Button
							variant="outline"
							tone="neutral"
							size="compact"
							disabled={ ! canDeactivate || isRunning }
							onClick={ onDeactivateAll }
						>
							{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
						</Button>
						<Button
							variant="minimal"
							tone="neutral"
							size="compact"
							onClick={ onClear }
							aria-label={ __( 'Clear selection', 'jetpack-my-jetpack' ) }
						>
							<Icon icon={ closeSmall } size={ 20 } />
						</Button>
					</Stack>
				) }

				<Stack direction="row" align="center" gap="sm" className={ styles.toolbar__end }>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ filter }
						onChange={ onSelectFilter }
						aria-label={ __( 'Filter features', 'jetpack-my-jetpack' ) }
						options={ [
							{ label: __( 'All', 'jetpack-my-jetpack' ), value: 'all' },
							{ label: __( 'Active', 'jetpack-my-jetpack' ), value: 'active' },
							{ label: __( 'Inactive', 'jetpack-my-jetpack' ), value: 'inactive' },
							{ label: __( 'Recommended', 'jetpack-my-jetpack' ), value: 'recommended' },
							{ label: __( 'Essential', 'jetpack-my-jetpack' ), value: 'essential' },
						] }
					/>
					<SearchControl
						__nextHasNoMarginBottom
						value={ search }
						onChange={ onSearchChange }
						aria-label={ __( 'Search features', 'jetpack-my-jetpack' ) }
						placeholder={ __( 'Search features', 'jetpack-my-jetpack' ) }
						className={ styles.search }
					/>
				</Stack>
			</Stack>
		</div>
	);
}
