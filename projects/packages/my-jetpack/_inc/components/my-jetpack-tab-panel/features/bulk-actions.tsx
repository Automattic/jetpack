import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import useActivatePlugins from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useAnalytics from '../../../hooks/use-analytics';
import { partitionSelection } from './partition-selection';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type BulkActionsProps = {
	states: FeatureState[];
	selected: string[];
	onClear: () => void;
};

/**
 * The bar above the list.
 *
 * Always rendered, with its buttons disabled until something is selected: swapping it
 * in and out changed the header's height and pushed the list down on the first tick.
 *
 * @param {BulkActionsProps} props          - The component props.
 * @param {FeatureState[]}   props.states   - Live state for every feature.
 * @param {string[]}         props.selected - Slugs of the selected features.
 * @param {Function}         props.onClear  - Clears the selection.
 * @return The rendered component.
 */
export function BulkActions( { states, selected, onClear }: BulkActionsProps ) {
	const { recordEvent } = useAnalytics();
	const [ isRunning, setIsRunning ] = useState( false );
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );

	const { toInstall, toActivate, toDeactivate, modulesOn, modulesOff } = useMemo(
		() => partitionSelection( states, selected ),
		[ states, selected ]
	);

	const { install } = useInstallPlugins( toInstall );
	const { activate } = useActivatePlugins( toActivate );
	const { deactivate } = useDeactivatePlugins( toDeactivate );

	const canActivate = toInstall.length + toActivate.length + modulesOn.length > 0;
	const canDeactivate = toDeactivate.length + modulesOff.length > 0;

	const runModules = useCallback(
		async ( names: string[], active: boolean ) => {
			// The modules store takes one module at a time, so these go in sequence.
			for ( const name of names ) {
				await updateJetpackModuleStatus( { name, active } );
			}
		},
		[ updateJetpackModuleStatus ]
	);

	const onActivate = useCallback( async () => {
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
		onClear();
	}, [
		activate,
		install,
		modulesOn,
		onClear,
		recordEvent,
		runModules,
		selected.length,
		toActivate.length,
		toInstall.length,
	] );

	const onDeactivate = useCallback( async () => {
		recordEvent( 'jetpack_myjetpack_features_bulk_deactivate', { count: selected.length } );
		setIsRunning( true );

		if ( toDeactivate.length ) {
			deactivate();
		}

		await runModules( modulesOff, false );
		setIsRunning( false );
		onClear();
	}, [
		deactivate,
		modulesOff,
		onClear,
		recordEvent,
		runModules,
		selected.length,
		toDeactivate.length,
	] );

	return (
		<Stack
			direction="row"
			align="center"
			gap="md"
			wrap="wrap"
			className={ styles[ 'bulk-actions' ] }
		>
			<Text variant="body-sm">
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

			<Stack direction="row" align="center" gap="sm">
				<Button
					variant="solid"
					size="compact"
					disabled={ ! canActivate || isRunning }
					loading={ isRunning }
					onClick={ onActivate }
				>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
				<Button
					variant="outline"
					tone="neutral"
					size="compact"
					disabled={ ! canDeactivate || isRunning }
					onClick={ onDeactivate }
				>
					{ __( 'Deactivate', 'jetpack-my-jetpack' ) }
				</Button>
				<Button
					variant="minimal"
					tone="neutral"
					size="compact"
					onClick={ onClear }
					disabled={ selected.length === 0 }
				>
					{ __( 'Clear', 'jetpack-my-jetpack' ) }
				</Button>
			</Stack>
		</Stack>
	);
}
