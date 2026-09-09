import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import styles from './styles.module.scss';
import type { MyJetpackModule } from '../../../types';

type ModuleBulkActionsProps = {
	modules: MyJetpackModule[];
	selected: string[];
	onClear: () => void;
};

/**
 * The bar above the module list.
 *
 * Always rendered, with its buttons disabled until something is selected: swapping it
 * in and out would change the header's height and push the list down on the first tick.
 *
 * @param {ModuleBulkActionsProps} props          - The component props.
 * @param {MyJetpackModule[]}      props.modules  - Every module in the list.
 * @param {string[]}               props.selected - Slugs of the selected modules.
 * @param {Function}               props.onClear  - Clears the selection.
 * @return The rendered component.
 */
export function ModuleBulkActions( { modules, selected, onClear }: ModuleBulkActionsProps ) {
	const { recordEvent } = useAnalytics();
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );
	const { createErrorNotice } = useGlobalNotices();
	const [ isRunning, setIsRunning ] = useState( false );

	const { toActivate, toDeactivate } = useMemo( () => {
		const chosen = modules.filter( item => selected.includes( item.module ) );

		return {
			toActivate: chosen.filter( item => ! item.activated ).map( item => item.module ),
			toDeactivate: chosen.filter( item => item.activated ).map( item => item.module ),
		};
	}, [ modules, selected ] );

	const run = useCallback(
		async ( names: string[], active: boolean ) => {
			setIsRunning( true );

			// The modules store takes one module at a time, so these go in sequence.
			const failed: string[] = [];

			for ( const name of names ) {
				const success = await updateJetpackModuleStatus( { name, active } );

				if ( ! success ) {
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

			setIsRunning( false );
			onClear();
		},
		[ createErrorNotice, onClear, updateJetpackModuleStatus ]
	);

	const onActivate = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_modules_bulk_activate', { count: toActivate.length } );
		run( toActivate, true );
	}, [ recordEvent, run, toActivate ] );

	const onDeactivate = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_modules_bulk_deactivate', { count: toDeactivate.length } );
		run( toDeactivate, false );
	}, [ recordEvent, run, toDeactivate ] );

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
					disabled={ ! toActivate.length || isRunning }
					loading={ isRunning }
					onClick={ onActivate }
				>
					{ __( 'Activate', 'jetpack-my-jetpack' ) }
				</Button>
				<Button
					variant="outline"
					tone="neutral"
					size="compact"
					disabled={ ! toDeactivate.length || isRunning }
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
