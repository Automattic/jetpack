import {
	getThreatType,
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
	THREAT_ACTION_UNIGNORE,
	THREAT_ACTIONS,
	ThreatAction,
	ThreatsContext,
	type Threat,
} from '@automattic/jetpack-scan';
import {
	type Field,
	type FieldType,
	type Filter,
	type SortDirection,
	type SupportedLayouts,
	type View,
	Action,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { useCallback, useContext, useImperativeHandle, useMemo, useState } from 'react';
import Badge from '../badge';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import ThreatFixerButton from '../threat-fixer-button';
import ThreatDetailsModal from '../threat-modals/details-modal';
import ThreatFixerModal from '../threat-modals/fixer-modal';
import ThreatIgnoreModal from '../threat-modals/ignore-modal';
import ThreatSeverityBadge from '../threat-severity-badge';
import {
	CURRENT_TABLE_FIELDS,
	LIST_FIELDS,
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
import styles from './styles.module.scss';

export { HISTORIC_TABLE_FIELDS, THREAT_FIELD_AUTO_FIX } from './constants';

type ThreatsDataViewsProps = {
	data: Threat[];
	header?: JSX.Element;
	initialFields?: string[];
	initialFilters?: Filter[];
	disableFields?: string[];
};

/**
 * DataViews component for displaying threats data.
 *
 * @param {object} props                - Component props.
 * @param {Array}  props.data           - DataViews data.
 * @param {Array}  props.header         - DataViews header.
 * @param {Array}  props.initialFields  - Initial DataViews fields.
 * @param {Array}  props.initialFilters - Initial DataViews filters.
 * @param {Array}  props.disableFields  - Fields to hide from the DataView.
 *
 * @return {JSX.Element} The threats data views component.
 */
const ThreatsDataViews = ( {
	data,
	header,
	initialFields,
	initialFilters,
	disableFields,
}: ThreatsDataViewsProps ): JSX.Element => {
	const context = useContext( ThreatsContext );
	const {
		actionCallbacks,
		selectedThreat,
		setSelectedThreat,
		actionToConfirm,
		setActionToConfirm,
	} = context;

	const [ isSm ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const baseView = {
		sort: {
			field: 'severity',
			direction: 'desc' as SortDirection,
		},
		search: '',
		filters: initialFilters || [],
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
			fields: initialFields || CURRENT_TABLE_FIELDS,
			titleField: THREAT_FIELD_TITLE,
			descriptionField: THREAT_FIELD_DESCRIPTION,
			showMedia: false,
		},
		list: {
			...baseView,
			fields: initialFields || LIST_FIELDS,
			titleField: THREAT_FIELD_TITLE,
			mediaField: THREAT_FIELD_ICON,
			showMedia: true,
		},
	};

	/**
	 * Default View Type.
	 *
	 * Set the default view type (list or table) based on the initial screen size.
	 */
	const defaultViewType: 'list' | 'table' = isSm ? 'list' : 'table';

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( {
		type: defaultViewType,
		...defaultLayouts[ defaultViewType ],
	} );

	const onClickFix = useCallback(
		( threat: Threat ) => () => {
			setActionToConfirm( { id: 'fix', items: [ threat ] } );
		},
		[ setActionToConfirm ]
	);

	const onRequestClose = useCallback( () => {
		setSelectedThreat( null );
		setActionToConfirm( undefined );
	}, [ setSelectedThreat, setActionToConfirm ] );

	/**
	 * Compute values from the provided threats data.
	 *
	 * @member {object[]} themes    - List of unique themes included in the threats data.
	 * @member {object[]} plugins   - plugins included in the threats data.
	 * @member {object[]} signatures - List of unique threat signatures.
	 * @member {string[]}    dataFields - List of unique fields.
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
								acc.plugins.push( {
									value: threat.extension.slug,
									label: threat.extension.name,
								} );
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
			...( dataFields.includes( 'status' )
				? [
						{
							id: THREAT_FIELD_STATUS,
							label: __( 'Status', 'jetpack-components' ),
							elements: THREAT_STATUSES,
							getValue( { item }: { item: Threat } ) {
								if ( ! item.status ) {
									return 'current';
								}
								return (
									THREAT_STATUSES.find( ( { value } ) => value === item.status )?.value ??
									item.status
								);
							},
							render( { item }: { item: Threat } ) {
								if ( item.status ) {
									const threatStatus = THREAT_STATUSES.find(
										( { value } ) => value === item.status
									);
									if ( threatStatus ) {
										return <Badge variant={ threatStatus?.variant }>{ threatStatus.label }</Badge>;
									}
								}
								return <Badge variant="warning">{ __( 'Current', 'jetpack-components' ) }</Badge>;
							},
						},
				  ]
				: [] ),
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

								return <ThreatFixerButton threat={ item } onClick={ onClickFix( item ) } />;
							},
						},
				  ]
				: [] ),
		];

		return result.filter( field => ! disableFields?.includes( field.id ) );
	}, [ plugins, themes, dataFields, signatures, onClickFix, disableFields ] );

	/**
	 * DataView actions - collection of operations that can be performed upon each record.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#actions-object
	 */
	const actions: Action< Threat >[] = useMemo( () => {
		const callbacks = {
			[ THREAT_ACTION_FIX ]: {
				id: THREAT_ACTION_FIX,
				callback: ( items: Threat[], { onActionPerformed } ) => {
					setActionToConfirm( { id: THREAT_ACTION_FIX, items } );
					onActionPerformed?.( items );
				},
			},
			[ THREAT_ACTION_IGNORE ]: {
				id: THREAT_ACTION_IGNORE,
				callback: ( items: Threat[], { onActionPerformed } ) => {
					setActionToConfirm( { id: THREAT_ACTION_IGNORE, items } );
					onActionPerformed?.( items );
				},
			},
			[ THREAT_ACTION_UNIGNORE ]: {
				id: THREAT_ACTION_UNIGNORE,
				callback: async ( items: Threat[], { onActionPerformed } ) => {
					actionCallbacks[ THREAT_ACTION_UNIGNORE ]( items, { onActionPerformed } );
				},
			},
		};

		const axns = Object.values( THREAT_ACTIONS ).map( ( threatAction: ThreatAction ) => {
			const action: Action< Threat > = {
				id: threatAction.id,
				label: ( items: Threat[] ) => {
					if ( typeof threatAction.label === 'function' ) {
						return items[ 0 ] ? threatAction.label( items[ 0 ] ) : '';
					}

					return threatAction.label || '';
				},
				callback: callbacks[ threatAction.id ],
				isEligible: ( item: Threat ) => {
					return threatAction.isEligible( item, context );
				},
			};

			return action;
		} );

		return [
			{
				id: 'view',
				label: __( 'View Details', 'jetpack-components' ),
				callback: ( items: Threat[] ) => {
					setSelectedThreat( items[ 0 ] );
				},
			},
			...axns,
		];
	}, [ actionCallbacks, context, setActionToConfirm, setSelectedThreat ] );

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
	 * DataViews getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	/**
	 * DataViews onClickItem function - render the threat modal on media or primary field click.
	 */
	const onClickItem = useCallback(
		( item: Threat ) => {
			setSelectedThreat( item );
		},
		[ setSelectedThreat ]
	);

	const ModalComponent = useMemo( () => {
		if ( actionToConfirm ) {
			switch ( actionToConfirm.id ) {
				case THREAT_ACTION_FIX:
					return ThreatFixerModal;
				case THREAT_ACTION_IGNORE:
					return ThreatIgnoreModal;
				default:
					break;
			}
		}

		if ( selectedThreat ) {
			return ThreatDetailsModal;
		}

		return null;
	}, [ actionToConfirm, selectedThreat ] );

	useImperativeHandle( ref, () => ( {
		getSelectedRows: () => null,
	} ) );

	return (
		<>
			<DataViews
				actions={ actions }
				data={ processedData }
				defaultLayouts={ defaultLayouts }
				fields={ fields }
				getItemId={ getItemId }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				onClickItem={ onClickItem }
				view={ view }
				header={ header }
			/>
			{ ModalComponent && <ModalComponent onRequestClose={ onRequestClose } /> }
		</>
	);
};

export default ThreatsDataViews;
