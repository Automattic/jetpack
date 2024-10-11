import { Text, ThreatSeverityBadge } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/components';
import {
	Action,
	DataViews,
	Field,
	Filter,
	filterSortAndPaginate,
	SupportedLayouts,
	type View,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
import { THREAT_STATUSES, THREAT_TYPES } from './constants';
import FixerStatus from './fixer-status';
import styles from './styles.module.scss';
import { DataViewThreat, ThreatsDataViewActionCallback } from './types';
import { getThreatIcon, getThreatSubtitle } from './utils';

/**
 * DataView component for displaying security threats.
 *
 * @param {object}   props                             - Component props.
 * @param {Array}    props.data                        - Threats data.
 * @param {Array}    props.filters                     - Initial DataView filters.
 * @param {Function} props.onFixThreat                 - Threat fix action callback.
 * @param {Function} props.onIgnoreThreat              - Threat ignore action callback.
 * @param {Function} props.onUnignoreThreat            - Threat unignore action callback.
 * @param {Function} props.isThreatEligibleForFix      - Function to determine if a threat is eligible for fixing.
 * @param {Function} props.isThreatEligibleForIgnore   - Function to determine if a threat is eligible for ignoring.
 * @param {Function} props.isThreatEligibleForUnignore - Function to determine if a threat is eligible for unignoring.
 *
 * @return {JSX.Element} The component.
 */
export default function ThreatsDataView( {
	data,
	filters,
	isThreatEligibleForFix,
	isThreatEligibleForIgnore,
	isThreatEligibleForUnignore,
	onFixThreat,
	onIgnoreThreat,
	onUnignoreThreat,
}: {
	data: DataViewThreat[];
	filters?: Filter[];
	isThreatEligibleForFix?: ( threat: DataViewThreat ) => boolean;
	isThreatEligibleForIgnore?: ( threat: DataViewThreat ) => boolean;
	isThreatEligibleForUnignore?: ( threat: DataViewThreat ) => boolean;
	onFixThreat?: ThreatsDataViewActionCallback;
	onIgnoreThreat?: ThreatsDataViewActionCallback;
	onUnignoreThreat?: ThreatsDataViewActionCallback;
} ): JSX.Element {
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
	 * Compute values based on the threats data.
	 *
	 * @member {object} extensions - List of unique threat extensions.
	 * @member {object} signatures - List of unique threat signatures.
	 * @member {Array}  dataFields - List of unique threat data fields.
	 */
	const { extensions, signatures, dataFields } = useMemo( () => {
		return data.reduce(
			( acc, threat ) => {
				// Extensions
				if ( threat?.extension ) {
					if ( ! acc.extensions.find( ( { value } ) => value === threat.extension.slug ) ) {
						acc.extensions.push( { value: threat.extension.slug, label: threat.extension.name } );
					}
				}

				// Signatures
				if ( threat?.signature ) {
					if ( ! acc.extensions.find( ( { value } ) => value === threat.signature ) ) {
						acc.extensions.push( { value: threat.signature, label: threat.signature } );
					}
				}

				// Fields
				const fields = Object.keys( threat );
				fields.forEach( field => {
					if (
						! acc.dataFields.includes( field ) &&
						threat[ field ] !== null &&
						threat[ field ] !== undefined
					) {
						acc.dataFields.push( field );
					}
				} );

				return acc;
			},
			{
				extensions: [] as { value: string; label: string }[],
				signatures: [] as { value: string; label: string }[],
				dataFields: [] as string[],
			}
		);
	}, [ data ] );

	/**
	 * DataView fields - describes the visible items for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-object
	 */
	const fields = useMemo( () => {
		const result: Field< DataViewThreat >[] = [
			{
				id: 'threat',
				label: __( 'Threat', 'jetpack' ),
				enableHiding: false,
				enableGlobalSearch: true,
				getValue( { item }: { item: DataViewThreat } ) {
					return `${ item.title } ${ item.description }`;
				},
				render( { item }: { item: DataViewThreat } ) {
					return (
						<div>
							<Text mb={ 1 } className={ styles.threat__subtitle }>
								<Icon icon={ getThreatIcon( item ) } size={ 20 } />
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
				id: 'status',
				label: __( 'Status', 'jetpack' ),
				elements: THREAT_STATUSES,
				getValue( { item }: { item: DataViewThreat } ) {
					return (
						THREAT_STATUSES.find( ( { value } ) => value === item.status )?.value ?? item.status
					);
				},
			},
			{
				id: 'extension',
				label: __( 'Extension', 'jetpack' ),
				enableGlobalSearch: true,
				elements: extensions,
				getValue( { item }: { item: DataViewThreat } ) {
					return item.extension ? item.extension.slug : '';
				},
			},
			{
				id: 'type',
				label: __( 'Category', 'jetpack' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: DataViewThreat } ) {
					if ( 'signature' in item && item.signature === 'Vulnerable.WP.Core' ) {
						return 'core';
					}
					if ( 'extension' in item && item.extension ) {
						return item.extension.type;
					}
					if ( 'filename' in item && item.filename ) {
						return 'file';
					}
					if ( 'table' in item && item.table ) {
						return 'database';
					}

					return 'uncategorized';
				},
			},
		];

		if ( dataFields.includes( 'fixable' ) ) {
			result.push( {
				id: 'auto-fix',
				label: __( 'Auto-fix', 'jetpack' ),
				getValue( { item }: { item: DataViewThreat } ) {
					return item.fixable ? 'Yes' : '';
				},
				render( { item }: { item: DataViewThreat } ) {
					return item.fixable ? <FixerStatus fixer={ item.fixer } /> : null;
				},
			} );
		}

		if ( dataFields.includes( 'severity' ) ) {
			result.push( {
				id: 'severity',
				label: __( 'Severity', 'jetpack' ),
				getValue( { item }: { item: DataViewThreat } ) {
					return item.severity ?? 0;
				},
				render( { item }: { item: DataViewThreat } ) {
					return <ThreatSeverityBadge severity={ item.severity } />;
				},
			} );
		}

		if ( dataFields.includes( 'signature' ) ) {
			result.push( {
				id: 'signature',
				label: __( 'Signature', 'jetpack' ),
				elements: signatures,
				enableGlobalSearch: true,
			} );
		}

		return result;
	}, [ extensions, signatures, dataFields ] );

	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions = useMemo( () => {
		const result: Action< DataViewThreat >[] = [];

		if ( dataFields.includes( 'fixable' ) ) {
			result.push( {
				id: 'fix',
				label: __( 'Auto-Fix', 'jetpack' ),
				isPrimary: true,
				callback: onFixThreat,
				isEligible( item ) {
					if ( ! onFixThreat ) {
						return false;
					}
					if ( isThreatEligibleForFix ) {
						return isThreatEligibleForFix( item );
					}
					return !! item.fixable;
				},
				icon: 'check',
			} );
		}

		if ( dataFields.includes( 'status' ) ) {
			result.push( {
				id: 'ignore',
				label: __( 'Ignore', 'jetpack' ),
				isPrimary: true,
				isDestructive: true,
				callback: onIgnoreThreat,
				isEligible( item ) {
					if ( ! onIgnoreThreat ) {
						return false;
					}
					if ( isThreatEligibleForIgnore ) {
						return isThreatEligibleForIgnore( item );
					}
					return item.status === 'current';
				},
				icon: 'unseen',
			} );
		}

		if ( dataFields.includes( 'status' ) ) {
			result.push( {
				id: 'un-ignore',
				label: __( 'Unignore', 'jetpack' ),
				isPrimary: true,
				isDestructive: true,
				callback: onUnignoreThreat,
				isEligible( item ) {
					if ( ! onUnignoreThreat ) {
						return false;
					}
					if ( isThreatEligibleForUnignore ) {
						return isThreatEligibleForUnignore( item );
					}
					return item.status === 'ignored';
				},
				icon: 'seen',
			} );
		}

		return result;
	}, [
		dataFields,
		onFixThreat,
		onIgnoreThreat,
		onUnignoreThreat,
		isThreatEligibleForFix,
		isThreatEligibleForIgnore,
		isThreatEligibleForUnignore,
	] );

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
	 *
	 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dataviews/src/filter-and-sort-data-view.ts
	 */
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ data, view, fields ] );

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

	return (
		<DataViews
			actions={ actions }
			data={ processedData }
			defaultLayouts={ defaultLayouts }
			fields={ fields }
			getItemId={ getItemId }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			view={ view }
		/>
	);
}
