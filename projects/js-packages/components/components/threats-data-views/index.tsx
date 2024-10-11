import { type Threat } from '@automattic/jetpack-scan';
import {
	Action,
	DataViews,
	Field,
	FieldType,
	Filter,
	filterSortAndPaginate,
	SortDirection,
	SupportedLayouts,
	type View,
} from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import Badge from '../badge';
import ThreatSeverityBadge from '../threat-severity-badge';
import { THREAT_STATUSES, THREAT_TYPES } from './constants';
import FixerStatusIcon, { FixerStatusBadge } from './fixer-status';
import styles from './styles.module.scss';
import { ThreatsDataViewActionCallback } from './types';
import { getThreatIcon, getThreatSubtitle, getThreatType } from './utils';

/**
 * DataViews component for displaying security threats.
 *
 * @param {object}   props                             - Component props.
 * @param {Array}    props.data                        - Threats data.
 * @param {Array}    props.filters                     - Initial DataView filters.
 * @param {Function} props.onChangeSelection           - Callback function run when an item is selected.
 * @param {Function} props.onFixThreats                - Threat fix action callback.
 * @param {Function} props.onIgnoreThreats             - Threat ignore action callback.
 * @param {Function} props.onUnignoreThreats           - Threat unignore action callback.
 * @param {Function} props.isThreatEligibleForFix      - Function to determine if a threat is eligible for fixing.
 * @param {Function} props.isThreatEligibleForIgnore   - Function to determine if a threat is eligible for ignoring.
 * @param {Function} props.isThreatEligibleForUnignore - Function to determine if a threat is eligible for unignoring.
 * @return {JSX.Element} The component.
 */
export default function ThreatsDataViews( {
	data,
	filters,
	onChangeSelection,
	isThreatEligibleForFix,
	isThreatEligibleForIgnore,
	isThreatEligibleForUnignore,
	onFixThreats,
	onIgnoreThreats,
	onUnignoreThreats,
}: {
	data: Threat[];
	filters?: Filter[];
	onChangeSelection?: ( selectedItemIds: string[] ) => void;
	isThreatEligibleForFix?: ( threat: Threat ) => boolean;
	isThreatEligibleForIgnore?: ( threat: Threat ) => boolean;
	isThreatEligibleForUnignore?: ( threat: Threat ) => boolean;
	onFixThreats?: ThreatsDataViewActionCallback;
	onIgnoreThreats?: ThreatsDataViewActionCallback;
	onUnignoreThreats?: ThreatsDataViewActionCallback;
} ): JSX.Element {
	const baseView = {
		sort: {
			field: 'severity',
			direction: 'desc' as SortDirection,
		},
		search: '',
		filters: filters || [],
		page: 1,
		perPage: 20,
	};

	/**
	 * DataView default layouts.
	 *
	 * This property provides layout information about the view types that are active. If empty, enables all layout types (see “Layout Types”) with empty layout data.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#defaultlayouts-record-string-view
	 */
	const defaultLayouts: SupportedLayouts = {
		table: {
			...baseView,
			fields: [ 'severity', 'threat', 'auto-fix' ],
			layout: {
				primaryField: 'severity',
			},
		},
		list: {
			...baseView,
			fields: [ 'severity', 'subtitle', 'signature', 'auto-fix' ],
			layout: {
				primaryField: 'title',
				mediaField: 'icon',
			},
		},
	};

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		type: 'table',
		...defaultLayouts.table,
	} );

	/**
	 * Compute values from the provided threats data.
	 *
	 * @member {object} extensions - List of unique threat extensions.
	 * @member {object} signatures - List of unique threat signatures.
	 * @member {Array}  dataFields - List of unique fields.
	 */
	const {
		extensions,
		signatures,
		dataFields,
	}: {
		extensions: { value: string; label: string }[];
		signatures: { value: string; label: string }[];
		dataFields: string[];
	} = useMemo( () => {
		return data.reduce(
			( acc, threat ) => {
				// Extensions
				if ( threat.extension ) {
					if ( ! acc.extensions.find( ( { value } ) => value === threat.extension.slug ) ) {
						acc.extensions.push( { value: threat.extension.slug, label: threat.extension.name } );
					}
				}

				// Signatures
				if ( threat.signature ) {
					if ( ! acc.signatures.find( ( { value } ) => value === threat.signature ) ) {
						acc.signatures.push( { value: threat.signature, label: threat.signature } );
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
				extensions: [],
				signatures: [],
				dataFields: [],
			}
		);
	}, [ data ] );

	/**
	 * DataView fields - describes the visible items for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#fields-object
	 */
	const fields = useMemo( () => {
		const result: Field< Threat >[] = [
			{
				id: 'threat',
				label: __( 'Threat', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				getValue( { item }: { item: Threat } ) {
					return item.title + item.description;
				},
				render( { item }: { item: Threat } ) {
					return (
						<div className={ styles.threat__primary }>
							<div className={ styles.threat__subtitle }>
								<Icon icon={ getThreatIcon( item ) } size={ 20 } />
								{ getThreatSubtitle( item ) }
							</div>
							<div className={ styles.threat__title }>{ item.title }</div>
							<div className={ styles.threat__description }>{ item.description }</div>
						</div>
					);
				},
			},
			{
				id: 'title',
				label: __( 'Title', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
			},
			{
				id: 'icon',
				label: __( 'Icon', 'jetpack' ),
				enableHiding: false,
				getValue( { item }: { item: Threat } ) {
					return getThreatType( item );
				},
				render( { item }: { item: Threat } ) {
					return (
						<div className={ styles.threat__media }>
							<Icon icon={ getThreatIcon( item ) } size={ 20 } />
						</div>
					);
				},
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack' ),
				elements: THREAT_STATUSES,
				getValue( { item }: { item: Threat } ) {
					if ( ! item.status ) {
						return 'current';
					}
					return (
						THREAT_STATUSES.find( ( { value } ) => value === item.status )?.value ?? item.status
					);
				},
				render( { item }: { item: Threat } ) {
					if ( item.status ) {
						const status = THREAT_STATUSES.find( ( { value } ) => value === item.status );
						if ( status ) {
							return <Badge variant={ status?.variant }>{ status.label }</Badge>;
						}
					}
					return <Badge variant="warning">{ __( 'Active', 'jetpack' ) }</Badge>;
				},
			},
			{
				id: 'extension',
				label: __( 'Extension', 'jetpack' ),
				enableGlobalSearch: true,
				elements: extensions,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
			},
			{
				id: 'type',
				label: __( 'Category', 'jetpack' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: Threat } ) {
					if ( item.signature === 'Vulnerable.WP.Core' ) {
						return 'core';
					}
					if ( item.extension ) {
						return item.extension.type;
					}
					if ( item.filename ) {
						return 'file';
					}
					if ( item.table ) {
						return 'database';
					}

					return 'uncategorized';
				},
			},
			{
				id: 'subtitle',
				label: __( 'Affected Item', 'jetpack' ),
				enableHiding: false,
				getValue( { item }: { item: Threat } ) {
					return getThreatSubtitle( item );
				},
			},
			...( dataFields.includes( 'signature' )
				? [
						{
							id: 'signature',
							label: __( 'Signature', 'jetpack' ),
							elements: signatures,
							enableGlobalSearch: true,
							getValue( { item }: { item: Threat } ) {
								return item.signature || '';
							},
						},
				  ]
				: [] ),
			...( dataFields.includes( 'severity' )
				? [
						{
							id: 'severity',
							label: __( 'Severity', 'jetpack' ),
							type: 'integer' as FieldType,
							getValue( { item }: { item: Threat } ) {
								return item.severity ?? 0;
							},
							render( { item }: { item: Threat } ) {
								return <ThreatSeverityBadge severity={ item.severity } />;
							},
						},
				  ]
				: [] ),
			...( dataFields.includes( 'fixable' )
				? [
						{
							id: 'auto-fix',
							label: __( 'Auto-fix', 'jetpack' ),
							enableHiding: false,
							type: 'integer' as FieldType,
							getValue( { item }: { item: Threat } ) {
								return item.fixable ? 1 : 0;
							},
							render( { item }: { item: Threat } ) {
								if ( ! item.fixable ) {
									return null;
								}

								if ( view.type === 'table' ) {
									return (
										<div className={ styles.threat__fixer }>
											<FixerStatusIcon fixer={ item.fixer } />
										</div>
									);
								}

								return <FixerStatusBadge fixer={ item.fixer } />;
							},
						},
				  ]
				: [] ),
			...( dataFields.includes( 'firstDetected' )
				? [
						{
							id: 'first-detected',
							label: __( 'First Detected', 'jetpack' ),
							type: 'datetime' as FieldType,
							getValue( { item }: { item: Threat } ) {
								return item.firstDetected ? new Date( item.firstDetected ) : null;
							},
							render( { item }: { item: Threat } ) {
								return item.firstDetected ? (
									<span className={ styles.threat__firstDetected }>
										{ dateI18n( 'F j Y', item.firstDetected, false ) }
									</span>
								) : null;
							},
						},
				  ]
				: [] ),
			...( dataFields.includes( 'fixedOn' )
				? [
						{
							id: 'fixed-on',
							label: __( 'Fixed On', 'jetpack' ),
							type: 'datetime' as FieldType,
							getValue( { item }: { item: Threat } ) {
								return item.fixedOn ? new Date( item.fixedOn ) : null;
							},
							render( { item }: { item: Threat } ) {
								return item.fixedOn ? (
									<span className={ styles.threat__fixedOn }>
										{ dateI18n( 'F j Y', item.fixedOn, false ) }
									</span>
								) : null;
							},
						},
				  ]
				: [] ),
		];

		return result;
	}, [ extensions, signatures, dataFields, view ] );

	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions = useMemo( () => {
		const result: Action< Threat >[] = [];

		if ( dataFields.includes( 'fixable' ) ) {
			result.push( {
				id: 'fix',
				label: __( 'Auto-Fix', 'jetpack' ),
				isPrimary: true,
				supportsBulk: true,
				callback: onFixThreats,
				isEligible( item ) {
					if ( ! onFixThreats ) {
						return false;
					}
					if ( isThreatEligibleForFix ) {
						return isThreatEligibleForFix( item );
					}
					return !! item.fixable;
				},
			} );
		}

		if ( dataFields.includes( 'status' ) ) {
			result.push( {
				id: 'ignore',
				label: __( 'Ignore', 'jetpack' ),
				isPrimary: true,
				isDestructive: true,
				callback: onIgnoreThreats,
				isEligible( item ) {
					if ( ! onIgnoreThreats ) {
						return false;
					}
					if ( isThreatEligibleForIgnore ) {
						return isThreatEligibleForIgnore( item );
					}
					return item.status === 'current';
				},
			} );
		}

		if ( dataFields.includes( 'status' ) ) {
			result.push( {
				id: 'un-ignore',
				label: __( 'Unignore', 'jetpack' ),
				isPrimary: true,
				isDestructive: true,
				callback: onUnignoreThreats,
				isEligible( item ) {
					if ( ! onUnignoreThreats ) {
						return false;
					}
					if ( isThreatEligibleForUnignore ) {
						return isThreatEligibleForUnignore( item );
					}
					return item.status === 'ignored';
				},
			} );
		}

		return result;
	}, [
		dataFields,
		onFixThreats,
		onIgnoreThreats,
		onUnignoreThreats,
		isThreatEligibleForFix,
		isThreatEligibleForIgnore,
		isThreatEligibleForUnignore,
	] );

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
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	return (
		<DataViews
			actions={ actions }
			data={ processedData }
			defaultLayouts={ defaultLayouts }
			fields={ fields }
			getItemId={ getItemId }
			onChangeSelection={ onChangeSelection }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			view={ view }
		/>
	);
}
