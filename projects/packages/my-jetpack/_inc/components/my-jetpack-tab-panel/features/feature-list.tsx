import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FeatureIcon } from './feature-icon';
import { featureStatusLabel } from './feature-status-label';
import { FeatureToggle } from './feature-toggle';
import styles from './styles.module.scss';
import { useBulkSwitch } from './use-bulk-switch';
import type { FeatureState } from './feature-state';
import type { Action, Field, View } from '@wordpress/dataviews';

type FeatureListProps = {
	states: FeatureState[];
	onOpen: ( slug: string ) => void;
};

const getItemId = ( state: FeatureState ) => state.feature.slug;

/**
 * The features as a table, with a checkbox on every row.
 *
 * DataViews carries the table: selection, select-all, and the keyboard and screen
 * reader semantics that go with them, the same component the Products tab and the
 * modules list already use. The filtering above it stays ours, so both views are
 * driven by one toolbar — DataViews renders only its layout here, not its own
 * search, filters or pagination.
 *
 * @param {FeatureListProps} props        - The component props.
 * @param {FeatureState[]}   props.states - The features to list, already filtered.
 * @param {Function}         props.onOpen - Opens a feature's details.
 * @return The rendered component.
 */
export function FeatureList( { states, onOpen }: FeatureListProps ) {
	const [ selected, setSelected ] = useState< string[] >( [] );
	const { activateAll, deactivateAll } = useBulkSwitch( states );
	// A bulk call takes a while and the toolbar's buttons stay live throughout, so a
	// second click would fire the same call again over the same rows.
	const isRunning = useRef( false );

	const run = useCallback( async ( work: () => Promise< void > ) => {
		if ( isRunning.current ) {
			return;
		}

		isRunning.current = true;

		try {
			await work();
			setSelected( [] );
		} finally {
			isRunning.current = false;
		}
	}, [] );

	// Everything the toolbar filtered to, on one page: the list is short, and a second
	// pager under our own filters would be two ways to narrow the same set.
	const [ view, setView ] = useState< View >( {
		type: 'table',
		page: 1,
		perPage: 100,
		search: '',
		filters: [],
		fields: [ 'status', 'switch' ],
		titleField: 'name',
		descriptionField: 'description',
		mediaField: 'icon',
		showMedia: true,
		layout: {},
	} );

	const fields = useMemo< Field< FeatureState >[] >(
		() => [
			{
				id: 'icon',
				label: __( 'Icon', 'jetpack-my-jetpack' ),
				enableSorting: false,
				render: ( { item }: { item: FeatureState } ) => (
					<span className={ styles[ 'list-icon' ] }>
						<FeatureIcon feature={ item.feature } />
					</span>
				),
			},
			{
				id: 'name',
				label: __( 'Feature', 'jetpack-my-jetpack' ),
				enableGlobalSearch: false,
				getValue: ( { item }: { item: FeatureState } ) => item.feature.name,
				render: ( { item }: { item: FeatureState } ) => (
					<Stack direction="row" align="center" gap="sm" wrap="wrap">
						{ /* heading-md, not heading-sm: the small heading variant is the uppercase
						     label used for section overlines, which a row title is not. */ }
						<Text variant="heading-md">{ item.feature.name }</Text>
						{ item.feature.essential ? (
							<Badge intent="informational">{ __( 'Essential', 'jetpack-my-jetpack' ) }</Badge>
						) : null }
					</Stack>
				),
			},
			{
				id: 'description',
				label: __( 'Description', 'jetpack-my-jetpack' ),
				enableSorting: false,
				getValue: ( { item }: { item: FeatureState } ) => item.feature.description,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-my-jetpack' ),
				enableSorting: false,
				getValue: ( { item }: { item: FeatureState } ) =>
					featureStatusLabel( item.status === 'active' ),
				render: ( { item }: { item: FeatureState } ) => {
					const isActive = item.status === 'active';

					return (
						<Badge intent={ isActive ? 'stable' : 'none' }>
							{ featureStatusLabel( isActive ) }
						</Badge>
					);
				},
			},
			{
				// Labelled for the pair of columns it starts: the switch sits beside the
				// row's own menu, and DataViews' heading for that one is hidden.
				id: 'switch',
				label: __( 'Actions', 'jetpack-my-jetpack' ),
				enableSorting: false,
				render: ( { item }: { item: FeatureState } ) => (
					<Stack direction="row" align="center" justify="end" className={ styles[ 'list-switch' ] }>
						<FeatureToggle state={ item } />
					</Stack>
				),
			},
		],
		[]
	);

	// Both actions take the rows they are given, so the row menu acts on that row and
	// the bulk bar on the selection, from the same pair.
	const actions = useMemo< Action< FeatureState >[] >(
		() => [
			{
				id: 'activate',
				label: __( 'Activate', 'jetpack-my-jetpack' ),
				supportsBulk: true,
				isEligible: ( item: FeatureState ) => item.switchable && item.status !== 'active',
				callback: ( items: FeatureState[] ) =>
					run( () => activateAll( items.map( item => item.feature.slug ) ) ),
			},
			{
				id: 'deactivate',
				label: __( 'Deactivate', 'jetpack-my-jetpack' ),
				supportsBulk: true,
				isEligible: ( item: FeatureState ) => item.switchable && item.status === 'active',
				callback: ( items: FeatureState[] ) =>
					run( () => deactivateAll( items.map( item => item.feature.slug ) ) ),
			},
		],
		[ activateAll, deactivateAll, run ]
	);

	const paginationInfo = useMemo(
		() => ( { totalItems: states.length, totalPages: 1 } ),
		[ states.length ]
	);

	const onClickItem = useCallback(
		( item: FeatureState ) => onOpen( item.feature.slug ),
		[ onOpen ]
	);

	return (
		<div className={ styles[ 'feature-list' ] }>
			<DataViews< FeatureState >
				data={ states }
				fields={ fields }
				actions={ actions }
				view={ view }
				onChangeView={ setView }
				getItemId={ getItemId }
				paginationInfo={ paginationInfo }
				selection={ selected }
				onChangeSelection={ setSelected }
				onClickItem={ onClickItem }
				defaultLayouts={ { table: {} } }
				search={ false }
			>
				<DataViews.Layout />
				<DataViews.BulkActionToolbar />
			</DataViews>
		</div>
	);
}
