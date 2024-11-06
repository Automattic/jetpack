import { getThreatType, type Threat, type ThreatStatus } from '@automattic/jetpack-scan';
import {
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import {
	Action,
	ActionButton,
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
import { __, sprintf } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import Badge from '../badge';
import ThreatFixerButton from '../threat-fixer-button';
import ThreatSeverityBadge from '../threat-severity-badge';
import {
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
	THREAT_ACTION_UNIGNORE,
	THREAT_FIELD_AUTO_FIX,
	THREAT_FIELD_DESCRIPTION,
	THREAT_FIELD_EXTENSION,
	THREAT_FIELD_FIRST_DETECTED,
	THREAT_FIELD_FIXED_ON,
	THREAT_FIELD_ICON,
	THREAT_FIELD_PLUGIN,
	THREAT_FIELD_SEVERITY,
	THREAT_FIELD_SIGNATURE,
	THREAT_FIELD_STATUS,
	THREAT_FIELD_THEME,
	THREAT_FIELD_THREAT,
	THREAT_FIELD_TITLE,
	THREAT_FIELD_TYPE,
	THREAT_ICONS,
	THREAT_STATUSES,
	THREAT_TYPES,
} from './constants';
import styles from './styles.module.scss';

/**
 * ToggleGroupControl component for filtering threats by status.
 * @param {object}   props                          - Component props.
 * @param {number}   props.activeCount              - Number of active threats.
 * @param {number}   props.historicCount            - Number of historic threats.
 * @param {boolean}  props.isViewingActiveThreats   - Whether the active status is selected.
 * @param {boolean}  props.isViewingHistoricThreats - Whether the historic status is selected.
 * @param {Function} props.onStatusFilterChange     - Callback function to handle the status filter change.
 * @return {JSX.Element|null} The component or null.
 */
export function ThreatsStatusToggleGroupControl( {
	activeCount,
	historicCount,
	isViewingActiveThreats,
	isViewingHistoricThreats,
	onStatusFilterChange,
}: {
	activeCount: number;
	historicCount: number;
	isViewingActiveThreats: boolean;
	isViewingHistoricThreats: boolean;
	onStatusFilterChange: ( newValue: string ) => void;
} ): JSX.Element {
	if ( ! ( activeCount + historicCount ) ) {
		return null;
	}

	let selectedValue = '';
	if ( isViewingActiveThreats ) {
		selectedValue = 'active';
	} else if ( isViewingHistoricThreats ) {
		selectedValue = 'historic';
	}

	return (
		<ToggleGroupControl
			className={ styles[ 'toggle-group-control' ] }
			value={ selectedValue }
			onChange={ onStatusFilterChange }
		>
			<ToggleGroupControlOption
				value="active"
				label={
					<span className={ styles[ 'toggle-group-control__option' ] }>
						{ sprintf(
							/* translators: %d: number of active threats */ __(
								'Active threats (%d)',
								'jetpack'
							),
							activeCount
						) }
					</span>
				}
			/>
			<ToggleGroupControlOption
				value="historic"
				label={
					<span className={ styles[ 'toggle-group-control__option' ] }>
						{ sprintf(
							/* translators: %d: number of historic threats */
							__( 'History (%d)', 'jetpack' ),
							historicCount
						) }
					</span>
				}
			/>
		</ToggleGroupControl>
	);
}

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
 *
 * @return {JSX.Element} The ThreatsDataViews component.
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
	onFixThreats?: ( threats: Threat[] ) => void;
	onIgnoreThreats?: ActionButton< Threat >[ 'callback' ];
	onUnignoreThreats?: ActionButton< Threat >[ 'callback' ];
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
			fields: [
				THREAT_FIELD_SEVERITY,
				THREAT_FIELD_THREAT,
				THREAT_FIELD_TYPE,
				THREAT_FIELD_AUTO_FIX,
			],
			layout: {
				primaryField: THREAT_FIELD_SEVERITY,
				combinedFields: [
					{
						id: THREAT_FIELD_THREAT,
						label: __( 'Threat', 'jetpack' ),
						children: [ THREAT_FIELD_TITLE, THREAT_FIELD_DESCRIPTION ],
						direction: 'vertical',
					},
				],
			},
		},
		list: {
			...baseView,
			fields: [
				THREAT_FIELD_SEVERITY,
				THREAT_FIELD_TYPE,
				THREAT_FIELD_EXTENSION,
				THREAT_FIELD_SIGNATURE,
			],
			layout: {
				primaryField: THREAT_FIELD_TITLE,
				mediaField: THREAT_FIELD_ICON,
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
	 * Memoized function to determine if a status filter is selected.
	 *
	 * @param {Array} threatStatuses - List of threat statuses.
	 */
	const isStatusFilterSelected = useMemo(
		() => ( threatStatuses: ThreatStatus[] ) =>
			view.filters.some(
				filter =>
					filter.field === 'status' &&
					Array.isArray( filter.value ) &&
					filter.value.length === threatStatuses.length &&
					threatStatuses.every( threatStatus => filter.value.includes( threatStatus ) )
			),
		[ view.filters ]
	);

	/**
	 * Compute values from the provided threats data.
	 *
	 * @member {number}   activeThreatsCount - Count of active threats.
	 * @member {number}   historicThreatsCount - Count of historic threats.
	 * @member {object[]} themes - List of unique threat themes.
	 * @member {object[]} plugins - List of unique threat plugins.
	 * @member {object[]} signatures - List of unique threat signatures.
	 * @member {Array}    dataFields - List of unique fields.
	 */
	const {
		activeThreatsCount,
		historicThreatsCount,
		themes,
		plugins,
		signatures,
		dataFields,
	}: {
		activeThreatsCount: number;
		historicThreatsCount: number;
		themes: { value: string; label: string }[];
		plugins: { value: string; label: string }[];
		signatures: { value: string; label: string }[];
		dataFields: string[];
	} = useMemo( () => {
		return data.reduce(
			( acc, threat ) => {
				// Active/Historic Threats
				if ( threat.status ) {
					if ( threat.status === 'current' ) {
						acc.activeThreatsCount++;
					} else {
						acc.historicThreatsCount++;
					}
				}

				// Extensions (Themes and Plugins)
				if ( threat.extension ) {
					switch ( threat.extension.type ) {
						case 'theme':
							if ( ! acc.themes.find( ( { value } ) => value === threat.extension.slug ) ) {
								acc.themes.push( { value: threat.extension.slug, label: threat.extension.name } );
							}
							break;
						case 'plugin':
							if ( ! acc.plugins.find( ( { value } ) => value === threat.extension.slug ) ) {
								acc.plugins.push( { value: threat.extension.slug, label: threat.extension.name } );
							}
							break;
						default:
							break;
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
				activeThreatsCount: 0,
				historicThreatsCount: 0,
				themes: [],
				plugins: [],
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
				id: THREAT_FIELD_TITLE,
				label: __( 'Title', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__title }>{ item.title }</div>
				),
			},
			{
				id: THREAT_FIELD_DESCRIPTION,
				label: __( 'Description', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__description }>{ item.description }</div>
				),
			},
			{
				id: THREAT_FIELD_ICON,
				label: __( 'Icon', 'jetpack' ),
				enableHiding: false,
				getValue( { item }: { item: Threat } ) {
					return getThreatType( item );
				},
				render( { item }: { item: Threat } ) {
					return (
						<div className={ styles.threat__media }>
							<Icon icon={ THREAT_ICONS[ getThreatType( item ) ] } size={ 20 } />
						</div>
					);
				},
			},
			{
				id: THREAT_FIELD_STATUS,
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
				id: THREAT_FIELD_TYPE,
				label: __( 'Type', 'jetpack' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: Threat } ) {
					return getThreatType( item ) ?? '';
				},
			},
			{
				id: THREAT_FIELD_EXTENSION,
				label: __( 'Extension', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: true,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
				render( { item }: { item: Threat } ) {
					return item.extension ? item.extension.name : '';
				},
			},
			{
				id: THREAT_FIELD_PLUGIN,
				label: __( 'Plugin', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				elements: plugins,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
			},
			{
				id: THREAT_FIELD_THEME,
				label: __( 'Theme', 'jetpack' ),
				enableGlobalSearch: true,
				enableHiding: false,
				elements: themes,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
			},
			...( dataFields.includes( 'severity' )
				? [
						{
							id: THREAT_FIELD_SEVERITY,
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
			...( dataFields.includes( 'signature' )
				? [
						{
							id: THREAT_FIELD_SIGNATURE,
							label: __( 'Signature', 'jetpack' ),
							elements: signatures,
							enableGlobalSearch: true,
							getValue( { item }: { item: Threat } ) {
								return item.signature || '';
							},
						},
				  ]
				: [] ),
			...( dataFields.includes( 'firstDetected' )
				? [
						{
							id: THREAT_FIELD_FIRST_DETECTED,
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
							id: THREAT_FIELD_FIXED_ON,
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
			...( dataFields.includes( 'fixable' )
				? [
						{
							id: THREAT_FIELD_AUTO_FIX,
							label: __( 'Auto-Fix', 'jetpack' ),
							enableHiding: false,
							elements: [
								{
									value: 'yes',
									label: __( 'Yes', 'jetpack' ),
								},
								{
									value: 'no',
									label: __( 'No', 'jetpack' ),
								},
							],
							getValue( { item }: { item: Threat } ) {
								return item.fixable ? 'yes' : 'no';
							},
							render( { item }: { item: Threat } ) {
								if ( ! item.fixable ) {
									return null;
								}

								return <ThreatFixerButton threat={ item } onClick={ onFixThreats } />;
							},
						},
				  ]
				: [] ),
		];

		return result;
	}, [ dataFields, plugins, themes, signatures, onFixThreats ] );

	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions = useMemo( () => {
		const result: Action< Threat >[] = [];

		if ( dataFields.includes( 'fixable' ) ) {
			result.push( {
				id: THREAT_ACTION_FIX,
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
				id: THREAT_ACTION_IGNORE,
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
				id: THREAT_ACTION_UNIGNORE,
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

	/**
	 * Callback function to handle the status change filter.
	 *
	 * @param {string} newStatus - The new status filter value.
	 */
	const onStatusFilterChange = useCallback(
		( newStatus: string ) => {
			const updatedFilters = view.filters.filter( filter => filter.field !== 'status' );

			if ( newStatus === 'active' ) {
				updatedFilters.push( {
					field: 'status',
					operator: 'isAny',
					value: [ 'current' ],
				} );
			} else if ( newStatus === 'historic' ) {
				updatedFilters.push( {
					field: 'status',
					operator: 'isAny',
					value: [ 'fixed', 'ignored' ],
				} );
			}

			setView( {
				...view,
				filters: updatedFilters,
			} );
		},
		[ view ]
	);

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
			header={
				<ThreatsStatusToggleGroupControl
					activeCount={ activeThreatsCount }
					historicCount={ historicThreatsCount }
					isViewingActiveThreats={ isStatusFilterSelected( [ 'current' ] ) }
					isViewingHistoricThreats={ isStatusFilterSelected( [ 'fixed', 'ignored' ] ) }
					onStatusFilterChange={ onStatusFilterChange }
				/>
			}
		/>
	);
}
