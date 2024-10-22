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
import { __, _x } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import Badge from '../badge';
import { THREAT_STATUSES, THREAT_TYPES } from './constants';
import { DataViewFixerStatus } from './fixer-status';
import styles from './styles.module.scss';
import { DataViewThreat, ThreatsDataViewActionCallback } from './types';
import { getThreatIcon, getThreatSubtitle, getThreatType } from './utils';

/**
 * DataView component for displaying security threats.
 *
 * @param {object}   props                             - Component props.
 * @param {Array}    props.data                        - Threats data.
 * @param {Array}    props.filters                     - Initial DataView filters.
 * @param {Function} props.onChangeSelection           - Callback function run when an item is selected.
 * @param {Function} props.onFixThreat                 - Threat fix action callback.
 * @param {Function} props.onIgnoreThreat              - Threat ignore action callback.
 * @param {Function} props.onUnignoreThreat            - Threat unignore action callback.
 * @param {Function} props.isThreatEligibleForFix      - Function to determine if a threat is eligible for fixing.
 * @param {Function} props.isThreatEligibleForIgnore   - Function to determine if a threat is eligible for ignoring.
 * @param {Function} props.isThreatEligibleForUnignore - Function to determine if a threat is eligible for unignoring.
 * @return {JSX.Element} The component.
 */
export default function ThreatsDataView( {
	data,
	filters,
	onChangeSelection,
	isThreatEligibleForFix,
	isThreatEligibleForIgnore,
	isThreatEligibleForUnignore,
	onFixThreat,
	onIgnoreThreat,
	onUnignoreThreat,
}: {
	data: DataViewThreat[];
	filters?: Filter[];
	onChangeSelection?: ( selectedItemIds: string[] ) => void;
	isThreatEligibleForFix?: ( threat: DataViewThreat ) => boolean;
	isThreatEligibleForIgnore?: ( threat: DataViewThreat ) => boolean;
	isThreatEligibleForUnignore?: ( threat: DataViewThreat ) => boolean;
	onFixThreat?: ThreatsDataViewActionCallback;
	onIgnoreThreat?: ThreatsDataViewActionCallback;
	onUnignoreThreat?: ThreatsDataViewActionCallback;
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
				combinedFields: [
					{
						id: 'threat',
						label: __( 'Threat', 'jetpack' ),
						children: [ 'subtitle', 'title', 'description' ],
						direction: 'vertical',
					},
				],
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
	 * Compute values based on the threats data.
	 *
	 * @member {object} extensions - List of unique threat extensions.
	 * @member {object} signatures - List of unique threat signatures.
	 * @member {Array}  dataFields - List of unique fields.
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
				id: 'title',
				label: __( 'Title', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render( { item }: { item: DataViewThreat } ) {
					if ( view.type === 'list' ) {
						return item.title;
					}
					return <span className={ styles.threat__title }>{ item.title }</span>;
				},
			},
			{
				id: 'description',
				label: __( 'Description', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render( { item }: { item: DataViewThreat } ) {
					return <span className={ styles.threat__description }>{ item.description }</span>;
				},
			},
			{
				id: 'icon',
				label: __( 'Icon', 'jetpack' ),
				getValue( { item }: { item: DataViewThreat } ) {
					return getThreatType( item );
				},
				render( { item }: { item: DataViewThreat } ) {
					return (
						<div className={ styles.media }>
							<Icon icon={ getThreatIcon( item ) } size={ 20 } />
						</div>
					);
				},
				enableHiding: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack' ),
				elements: THREAT_STATUSES,
				getValue( { item }: { item: DataViewThreat } ) {
					if ( ! item.status ) {
						return 'current';
					}
					return (
						THREAT_STATUSES.find( ( { value } ) => value === item.status )?.value ?? item.status
					);
				},
				render( { item }: { item: DataViewThreat } ) {
					if ( item.status ) {
						const status = THREAT_STATUSES.find( ( { value } ) => value === item.status );
						if ( status ) {
							return <Badge variant={ status?.variant }>{ status?.label }</Badge>;
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
			{
				id: 'subtitle',
				label: __( 'Affected Item', 'jetpack' ),
				getValue( { item }: { item: DataViewThreat } ) {
					return getThreatSubtitle( item );
				},
				render( { item }: { item: DataViewThreat } ) {
					if ( view.type === 'table' ) {
						return (
							<div className={ styles.threat__subtitle }>
								<Icon icon={ getThreatIcon( item ) } size={ 20 } />
								{ getThreatSubtitle( item ) }
							</div>
						);
					}

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
							getValue( { item }: { item: DataViewThreat } ) {
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
							getValue( { item }: { item: DataViewThreat } ) {
								return item.severity ?? 0;
							},
							render( { item }: { item: DataViewThreat } ) {
								let text = _x( 'Low', 'Severity label for issues rated below 3.', 'jetpack' );
								let variant: 'danger' | 'warning' | undefined;

								if ( item.severity >= 5 ) {
									text = _x(
										'Critical',
										'Severity label for issues rated 5 or higher.',
										'jetpack'
									);
									variant = 'danger';
								} else if ( item.severity >= 3 && item.severity < 5 ) {
									text = _x(
										'High',
										'Severity label for issues rated between 3 and 5.',
										'jetpack'
									);
									variant = 'warning';
								}

								return <Badge variant={ variant }>{ text }</Badge>;
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
							getValue( { item }: { item: DataViewThreat } ) {
								return item.fixable ? 'Yes' : '';
							},
							render( { item }: { item: DataViewThreat } ) {
								return item.fixable ? (
									<DataViewFixerStatus fixer={ item.fixer } view={ view } />
								) : null;
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
							getValue( { item }: { item: DataViewThreat } ) {
								return new Date( item.firstDetected );
							},
							render( { item }: { item: DataViewThreat } ) {
								return (
									<span className={ styles.threat__firstDetected }>
										{ dateI18n( 'F j Y', item.firstDetected, false ) }
									</span>
								);
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
							getValue( { item }: { item: DataViewThreat } ) {
								return new Date( item.firstDetected );
							},
							render( { item }: { item: DataViewThreat } ) {
								return (
									<span className={ styles.threat__fixedOn }>
										{ dateI18n( 'F j Y', item.firstDetected, false ) }
									</span>
								);
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
	 * Apply the view settings (i.e. filters, sorting, pagination) to the dataset.
	 *
	 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/dataviews/src/filter-and-sort-data-view.ts
	 */
	const { data: processedData, paginationInfo } = useMemo( () => {
		// to do: secondary sort for status, detected on, etc.
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
			onChangeSelection={ onChangeSelection }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			view={ view }
		/>
	);
}
