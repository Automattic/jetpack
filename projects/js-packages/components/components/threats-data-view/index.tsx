import { Text, ThreatSeverityBadge } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/components';
import {
	Action,
	DataViews,
	Field,
	Filter,
	SupportedLayouts,
	type View,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import { THREAT_STATUSES, THREAT_TYPES } from './constants';
import FixerStatus from './fixer-status';
import styles from './styles.module.scss';
import { DataViewThreat, ThreatsDataViewActionCallback } from './types';
import { filterThreatByView, getThreatIcon, getThreatSubtitle, sortThreatsByView } from './utils';

/**
 * DataView component for displaying security threats.
 *
 * @param {object}   props                  - Component props.
 * @param {Array}    props.data             - Threats data.
 * @param {Array}    props.filters          - Initial DataView filters.
 * @param {Function} props.onFixThreat      - Threat fix action callback.
 * @param {Function} props.onIgnoreThreat   - Threat ignore action callback.
 * @param {Function} props.onUnignoreThreat - Threat unignore action callback.
 * @return {JSX.Element} The component.
 */
export default function ThreatsDataView( {
	data,
	filters,
	onFixThreat,
	onIgnoreThreat,
	onUnignoreThreat,
}: {
	data: DataViewThreat[];
	filters?: Filter[];
	onFixThreat?: ThreatsDataViewActionCallback;
	onIgnoreThreat?: ThreatsDataViewActionCallback;
	onUnignoreThreat?: ThreatsDataViewActionCallback;
} ): JSX.Element {
	/**
	 * List of unique extensions extracted from the threats data.
	 */
	const extensions = useMemo( () => {
		return data.reduce( ( acc, threat ) => {
			if ( ! threat?.extension ) {
				return acc;
			}
			if ( ! acc.find( ( { value } ) => value === threat.extension.slug ) ) {
				acc.push( { value: threat.extension.slug, label: threat.extension.name } );
			}
			return acc;
		}, [] );
	}, [ data ] );

	/**
	 * DataView fields - describes the visible items for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-object
	 */
	const fields: Field< DataViewThreat >[] = useMemo(
		() => [
			{
				id: 'threat',
				label: __( 'Threat', 'jetpack' ),
				enableHiding: false,
				getValue( { item }: { item: DataViewThreat } ) {
					return item.title;
				},
				render( { item }: { item: DataViewThreat } ) {
					return (
						<div>
							<Text mb={ 1 } className={ styles.threat__subtitle }>
								<Icon icon={ getThreatIcon( item ) } size={ 18 } />
								{ getThreatSubtitle( item ) }
							</Text>
							<Text variant="body" className={ styles.threat__title }>
								{ item.title }
							</Text>
							<Text variant="body-extra-small">{ item.description }</Text>
						</div>
					);
				},
			},
			{
				id: 'severity',
				label: __( 'Severity', 'jetpack' ),
				getValue( { item }: { item: DataViewThreat } ) {
					return <ThreatSeverityBadge severity={ item.severity } />;
				},
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack' ),
				elements: THREAT_STATUSES,
				getValue( { item }: { item: DataViewThreat } ) {
					return (
						THREAT_STATUSES.find( ( { value } ) => value === item.status )?.label ?? item.status
					);
				},
			},
			{
				id: 'auto-fix',
				label: __( 'Auto-fix', 'jetpack' ),
				getValue( { item }: { item: DataViewThreat } ) {
					return !! item.fixable;
				},
				render( { item }: { item: DataViewThreat } ) {
					return item.fixable ? (
						<FixerStatus isActiveFixInProgress={ false } isStaleFixInProgress={ false } />
					) : null;
				},
			},
			{
				id: 'signature',
				label: __( 'Signature', 'jetpack' ),
				elements: data.reduce( ( acc, threat ) => {
					if ( ! acc.find( ( { value } ) => value === threat.signature ) ) {
						acc.push( { value: threat.signature, label: threat.signature } );
					}
					return acc;
				}, [] ),
			},
			{
				id: 'extension',
				label: __( 'Extension', 'jetpack' ),
				elements: extensions,
				getValue( { item }: { item: DataViewThreat } ) {
					return extensions.find( ( { slug } ) => slug === item.extension.slug )?.label ?? null;
				},
			},
			{
				id: 'type',
				label: __( 'Type', 'jetpack' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: DataViewThreat } ) {
					if ( 'signature' in item && item.signature === 'Vulnerable.WP.Core' ) {
						return 'core';
					}
					if ( 'extension' in item ) {
						return item.extension.type;
					}
					if ( 'filename' in item && item.filename ) {
						return 'file';
					}
					if ( 'table' in item && item.table ) {
						return 'database';
					}

					return null;
				},
			},
		],
		[ data, extensions ]
	);

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		filters: filters || [],
		page: 1,
		perPage: 25,
		sort: {
			field: 'severity',
			direction: 'desc',
		},
		fields: [ 'severity', 'threat', 'auto-fix' ],
		layout: {},
	} );

	/**
	 * Callback function to update the view state.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#onchangeview-function
	 */
	const onChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	/**
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: DataViewThreat ) => item.id.toString(), [] );

	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions: Action< DataViewThreat >[] = [
		{
			id: 'fix',
			label: __( 'Auto-Fix', 'jetpack' ),
			isPrimary: true,
			callback: onFixThreat,
			isEligible( item ) {
				return !! item.fixable;
			},
			icon: 'check',
		},
		{
			id: 'ignore',
			label: __( 'Ignore', 'jetpack' ),
			isPrimary: false,
			isDestructive: true,
			callback: onIgnoreThreat,
			isEligible( item ) {
				// to do: isActiveFixInProgress || isStaleFixInProgress
				return item.status === 'current';
			},
			icon: 'unseen',
		},
		{
			id: 'un-ignore',
			label: __( 'Unignore', 'jetpack' ),
			isPrimary: false,
			isDestructive: true,
			callback: onUnignoreThreat,
			isEligible( item ) {
				return item.status === 'ignored';
			},
			icon: 'seen',
		},
	];

	/**
	 * DataView pagination info object.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#paginationinfo-object
	 */
	const paginationInfo = useMemo( () => {
		return {
			totalItems: data.length,
			totalPages: Math.ceil( data.length / view.perPage ),
		};
	}, [ data.length, view.perPage ] );

	/**
	 * DataView default layouts.
	 *
	 * This property provides layout information about the view types that are active. If empty, enables all layout types (see “Layout Types”) with empty layout data.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#defaultlayouts-record-string-view
	 */
	const defaultLayouts: SupportedLayouts = {};

	/**
	 * Apply the view settings (i.e. filters, sorting, pagination) to the dataset.
	 */
	const filteredData = useMemo( () => {
		return data
			.filter( threat => filterThreatByView( threat, view ) )
			.sort( ( a, b ) => sortThreatsByView( a, b, view ) )
			.slice( ( view.page - 1 ) * view.perPage, view.page * view.perPage );
	}, [ data, view ] );

	return (
		<DataViews
			actions={ actions }
			data={ filteredData }
			defaultLayouts={ defaultLayouts }
			fields={ fields }
			getItemId={ getItemId }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			view={ view }
		/>
	);
}
