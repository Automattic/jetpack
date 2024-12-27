import { getThreatType, type Threat } from '@automattic/jetpack-scan';
import {
	type Action,
	type ActionButton,
	type Field,
	type FieldType,
	DataViews,
	Filter,
	filterSortAndPaginate,
	View,
} from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
import Badge from '../badge';
import ThreatFixerButton from '../threat-fixer-button';
import ThreatModal from '../threat-modal';
import ThreatSeverityBadge from '../threat-severity-badge';
import {
	DEFAULT_LAYOUTS,
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
	THREAT_FIELD_TITLE,
	THREAT_FIELD_TYPE,
	THREAT_ICONS,
	THREAT_STATUSES,
	THREAT_TYPES,
} from './constants';
import ThreatsDataViewsContext from './context';
import styles from './styles.module.scss';
import ThreatsStatusToggleGroupControl from './threats-status-toggle-group-control';

/**
 * DataViews component for displaying security threats.
 *
 * @param {object}   props                             - Component props.
 * @param {Array}    props.data                        - Threats data.
 * @param {Array}    props.filters                     - Default filters to apply.
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
	isThreatEligibleForFix,
	isThreatEligibleForIgnore,
	isThreatEligibleForUnignore,
	onFixThreats,
	onIgnoreThreats,
	onUnignoreThreats,
}: {
	data: Threat[];
	filters?: Filter[];
	isThreatEligibleForFix?: ( threat: Threat ) => boolean;
	isThreatEligibleForIgnore?: ( threat: Threat ) => boolean;
	isThreatEligibleForUnignore?: ( threat: Threat ) => boolean;
	onFixThreats?: ( fixThreats: Threat[] ) => void;
	onIgnoreThreats?: ActionButton< Threat >[ 'callback' ];
	onUnignoreThreats?: ActionButton< Threat >[ 'callback' ];
} ): JSX.Element {
	const [ selectedThreat, setSelectedThreat ] = useState< Threat | null >( null );

	/**
	 * View Object.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		...DEFAULT_LAYOUTS.table,
		type: 'table',
		filters: filters ?? DEFAULT_LAYOUTS.table.filters,
	} );

	/**
	 * Compute values from the provided threats data.
	 *
	 * @member {object[]} themes    - List of unique themes included in the threats data.
	 * @member {object[]} plugins   - plugins included in the threats data.
	 * @member {object[]} signatures - List of unique threat signatures.
	 * @member {string[]} dataFields - List of unique fields.
	 */
	const {
		themes,
		plugins,
		signatures,
		dataFields,
	}: {
		themes: { value: string; label: string }[];
		plugins: { value: string; label: string }[];
		signatures: { value: string; label: string }[];
		dataFields: string[];
	} = useMemo( () => {
		return data.reduce(
			( acc, threat ) => {
				// Extensions (Themes and Plugins)
				if ( threat.extension ) {
					switch ( threat.extension.type ) {
						case 'themes':
							if ( ! acc.themes.find( ( { value } ) => value === threat.extension.slug ) ) {
								acc.themes.push( { value: threat.extension.slug, label: threat.extension.name } );
							}
							break;
						case 'plugins':
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
				label: __( 'Threat', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__title }>{ item.title }</div>
				),
			},
			{
				id: THREAT_FIELD_DESCRIPTION,
				label: __( 'Description', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__description }>{ item.description }</div>
				),
			},
			{
				id: THREAT_FIELD_ICON,
				label: __( 'Icon', 'jetpack-components' ),
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
				label: __( 'Status', 'jetpack-components' ),
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
					return <Badge variant="warning">{ __( 'Active', 'jetpack-components' ) }</Badge>;
				},
			},
			{
				id: THREAT_FIELD_TYPE,
				label: __( 'Type', 'jetpack-components' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: Threat } ) {
					return getThreatType( item ) ?? '';
				},
			},
			{
				id: THREAT_FIELD_EXTENSION,
				label: __( 'Extension', 'jetpack-components' ),
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
				label: __( 'Plugin', 'jetpack-components' ),
				enableGlobalSearch: true,
				enableHiding: false,
				elements: plugins,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
			},
			{
				id: THREAT_FIELD_THEME,
				label: __( 'Theme', 'jetpack-components' ),
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
							label: __( 'Severity', 'jetpack-components' ),
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
							label: __( 'Signature', 'jetpack-components' ),
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
							label: __( 'First Detected', 'jetpack-components' ),
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
							label: __( 'Fixed On', 'jetpack-components' ),
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
							label: __( 'Auto-fix', 'jetpack-components' ),
							enableHiding: false,
							elements: [
								{
									value: 'yes',
									label: __( 'Yes', 'jetpack-components' ),
								},
								{
									value: 'no',
									label: __( 'No', 'jetpack-components' ),
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
				label: __( 'Auto-fix', 'jetpack-components' ),
				isPrimary: true,
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
				label: __( 'Ignore', 'jetpack-components' ),
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
				label: __( 'Unignore', 'jetpack-components' ),
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
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	const onChangeSelection = useCallback(
		( selectedItemIds: string[] ) => {
			const threat = data.find( item => getItemId( item ) === selectedItemIds[ 0 ] );
			if ( threat ) {
				setSelectedThreat( threat );
			}
		},
		[ data, getItemId ]
	);

	return (
		<ThreatsDataViewsContext.Provider value={ { view, setView, data } }>
			<DataViews
				actions={ actions }
				data={ processedData }
				defaultLayouts={ DEFAULT_LAYOUTS }
				fields={ fields }
				getItemId={ getItemId }
				header={ <ThreatsStatusToggleGroupControl /> }
				onChangeView={ setView }
				onChangeSelection={ onChangeSelection }
				onClickItem={ setSelectedThreat }
				paginationInfo={ paginationInfo }
				view={ view }
			/>
			{ selectedThreat && <ThreatModal threat={ selectedThreat } /> }
		</ThreatsDataViewsContext.Provider>
	);
}
