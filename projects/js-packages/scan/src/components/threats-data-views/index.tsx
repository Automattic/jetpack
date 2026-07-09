import {
	type Action,
	type ActionButton,
	type Field,
	type FieldTypeName,
	type Filter,
	type RenderModalProps,
	type SortDirection,
	type View,
	DataViews,
	filterSortAndPaginate,
} from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { Badge } from '@wordpress/ui';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from 'react';
import { ThreatSeverityBadge, getThreatType, type Threat } from '@automattic/jetpack-scan';
import ThreatFixerButton from '../threat-fixer-button/index.tsx';
import {
	THREAT_ACTION_FIX,
	THREAT_ACTION_IGNORE,
	THREAT_ACTION_UNIGNORE,
	THREAT_ACTION_VIEW,
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
} from './constants.ts';
import styles from './styles.module.scss';
import ThreatsStatusToggleGroupControl from './threats-status-toggle-group-control.tsx';

/**
 * DataViews component for displaying security threats.
 *
 * Each row action (Auto-fix / Ignore / Unignore) supports two wiring shapes:
 * pass a callback (`onFixThreats` etc.) for the existing fire-and-forget
 * behaviour, or pass a React component via the matching `Render*Modal` prop
 * to open a confirmation modal — DataViews renders it inline when the
 * action is invoked, and consumers receive `{ items, closeModal }` from
 * `RenderModalProps< Threat >`. Render-modal props take precedence when
 * both are supplied for the same action.
 *
 * @param {object}    props                             - Component props.
 * @param {Array}     props.data                        - Threats data.
 * @param {Array}     props.filters                     - Initial DataView filters.
 * @param {Function}  props.onChangeSelection           - Callback function run when an item is selected.
 * @param {Function}  props.onFixThreats                - Threat fix action callback (used when no `RenderFixModal`).
 * @param {Function}  props.onIgnoreThreats             - Threat ignore action callback (used when no `RenderIgnoreModal`).
 * @param {Function}  props.onUnignoreThreats           - Threat unignore action callback (used when no `RenderUnignoreModal`).
 * @param {Function}  props.RenderFixModal              - Optional component rendered as the fix-action modal.
 * @param {Function}  props.RenderIgnoreModal           - Optional component rendered as the ignore-action modal.
 * @param {Function}  props.RenderUnignoreModal         - Optional component rendered as the unignore-action modal.
 * @param {Function}  props.RenderViewModal             - Optional component rendered as the view-details modal. Unlike the fix / ignore / unignore actions, this one is always eligible for any row.
 * @param {Function}  props.isThreatEligibleForFix      - Function to determine if a threat is eligible for fixing.
 * @param {Function}  props.isThreatEligibleForIgnore   - Function to determine if a threat is eligible for ignoring.
 * @param {Function}  props.isThreatEligibleForUnignore - Function to determine if a threat is eligible for unignoring.
 * @param {ReactNode} [props.empty]                     - Empty-state node forwarded to DataViews when `data` is empty. Defaults to DataViews' built-in "no items" body.
 * @param {boolean}   [props.showStatusFilter]          - Whether to render the active/historic status toggle above the table. Defaults to `true`. Set to `false` when the consumer already filters the dataset by status outside the component (e.g. page-level tabs).
 * @param {Function}  [props.onTrackEvent]              - Optional callback that receives DataViews-canonical event names (`view_change`, `filter_change`, `search`, `page_change`, `layout_changed`) on the matching view transitions. Consumers prefix and forward to their own analytics client.
 * @param {string}    [props.persistKey]                - Optional `localStorage` key. When set, the component hydrates its initial view state from `localStorage[persistKey]` and writes back on every change. Use stable, namespaced keys (e.g. `jetpack-scan:active-threats:view`) so consumer panels don't collide. Quietly no-ops when `localStorage` is unavailable.
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
	RenderFixModal,
	RenderIgnoreModal,
	RenderUnignoreModal,
	RenderViewModal,
	empty,
	showStatusFilter = true,
	onTrackEvent,
	persistKey,
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
	RenderFixModal?: ( props: RenderModalProps< Threat > ) => ReactElement;
	RenderIgnoreModal?: ( props: RenderModalProps< Threat > ) => ReactElement;
	RenderUnignoreModal?: ( props: RenderModalProps< Threat > ) => ReactElement;
	RenderViewModal?: ( props: RenderModalProps< Threat > ) => ReactElement;
	empty?: ReactNode;
	showStatusFilter?: boolean;
	onTrackEvent?: ( event: string, properties?: Record< string, unknown > ) => void;
	persistKey?: string;
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
	const defaultLayouts = {
		table: {
			...baseView,
			fields: [ THREAT_FIELD_SEVERITY, THREAT_FIELD_TYPE, THREAT_FIELD_AUTO_FIX ],
			titleField: THREAT_FIELD_TITLE,
			descriptionField: THREAT_FIELD_DESCRIPTION,
			showMedia: false,
		},
		list: {
			...baseView,
			fields: [
				THREAT_FIELD_SEVERITY,
				THREAT_FIELD_TYPE,
				THREAT_FIELD_EXTENSION,
				THREAT_FIELD_SIGNATURE,
			],
			titleField: THREAT_FIELD_TITLE,
			mediaField: THREAT_FIELD_ICON,
			showMedia: true,
		},
	};

	/**
	 * DataView view object - configures how the dataset is visible to the user.
	 *
	 * When `persistKey` is supplied, the initial view hydrates from
	 * `localStorage[persistKey]` so reloads, tab changes, and drill-ins
	 * preserve the user's filters / sort / pagination / layout. Falls
	 * back to the default table view on parse failure or first load.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#view-object
	 */
	const [ view, setView ] = useState< View >( () => {
		const fallback: View = { type: 'table', ...defaultLayouts.table };
		if ( ! persistKey || typeof window === 'undefined' ) {
			return fallback;
		}
		try {
			const stored = window.localStorage.getItem( persistKey );
			if ( stored ) {
				return JSON.parse( stored ) as View;
			}
		} catch {
			// localStorage may be disabled (privacy mode, full disk) — no-op.
		}
		return fallback;
	} );

	useEffect( () => {
		if ( ! persistKey || typeof window === 'undefined' ) {
			return;
		}
		try {
			window.localStorage.setItem( persistKey, JSON.stringify( view ) );
		} catch {
			// localStorage may be disabled (privacy mode, full disk) — no-op.
		}
	}, [ persistKey, view ] );

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
				label: __( 'Threat', 'jetpack-scan' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__title }>{ item.title }</div>
				),
			},
			{
				id: THREAT_FIELD_DESCRIPTION,
				label: __( 'Description', 'jetpack-scan' ),
				enableGlobalSearch: true,
				enableHiding: false,
				render: ( { item }: { item: Threat } ) => (
					<div className={ styles.threat__description }>{ item.description }</div>
				),
			},
			{
				id: THREAT_FIELD_ICON,
				label: __( 'Icon', 'jetpack-scan' ),
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
				label: __( 'Status', 'jetpack-scan' ),
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
							return <Badge intent={ status.intent }>{ status.label }</Badge>;
						}
					}
					return <Badge intent="medium">{ __( 'Active', 'jetpack-scan' ) }</Badge>;
				},
			},
			{
				id: THREAT_FIELD_TYPE,
				label: __( 'Type', 'jetpack-scan' ),
				elements: THREAT_TYPES,
				getValue( { item }: { item: Threat } ) {
					switch ( getThreatType( item ) ) {
						case 'core':
							return __( 'WordPress', 'jetpack-scan' );
						case 'plugins':
							return __( 'Plugin', 'jetpack-scan' );
						case 'themes':
							return __( 'Theme', 'jetpack-scan' );
						case 'file':
							return __( 'File', 'jetpack-scan' );
						default:
							return __( 'Unknown', 'jetpack-scan' );
					}
				},
			},
			{
				id: THREAT_FIELD_EXTENSION,
				label: __( 'Extension', 'jetpack-scan' ),
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
				label: __( 'Plugin', 'jetpack-scan' ),
				enableGlobalSearch: true,
				enableHiding: false,
				elements: plugins,
				getValue( { item }: { item: Threat } ) {
					return item.extension ? item.extension.slug : '';
				},
			},
			{
				id: THREAT_FIELD_THEME,
				label: __( 'Theme', 'jetpack-scan' ),
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
							label: __( 'Severity', 'jetpack-scan' ),
							type: 'integer' as FieldTypeName,
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
							label: __( 'Signature', 'jetpack-scan' ),
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
							label: __( 'First Detected', 'jetpack-scan' ),
							type: 'datetime' as FieldTypeName,
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
							label: __( 'Fixed On', 'jetpack-scan' ),
							type: 'datetime' as FieldTypeName,
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
							label: __( 'Auto-fix', 'jetpack-scan' ),
							enableHiding: false,
							elements: [
								{
									value: 'yes',
									label: __( 'Yes', 'jetpack-scan' ),
								},
								{
									value: 'no',
									label: __( 'No', 'jetpack-scan' ),
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
			const isEligible = ( item: Threat ) => {
				if ( ! RenderFixModal && ! onFixThreats ) {
					return false;
				}
				if ( isThreatEligibleForFix ) {
					return isThreatEligibleForFix( item );
				}
				return !! item.fixable;
			};
			if ( RenderFixModal ) {
				result.push( {
					id: THREAT_ACTION_FIX,
					label: __( 'Auto-fix', 'jetpack-scan' ),
					isPrimary: true,
					modalHeader: __( 'Fix threat', 'jetpack-scan' ),
					RenderModal: RenderFixModal,
					isEligible,
				} );
			} else {
				result.push( {
					id: THREAT_ACTION_FIX,
					label: __( 'Auto-fix', 'jetpack-scan' ),
					isPrimary: true,
					callback: onFixThreats,
					isEligible,
				} );
			}
		}

		if ( dataFields.includes( 'status' ) ) {
			const isEligible = ( item: Threat ) => {
				if ( ! RenderIgnoreModal && ! onIgnoreThreats ) {
					return false;
				}
				if ( isThreatEligibleForIgnore ) {
					return isThreatEligibleForIgnore( item );
				}
				return item.status === 'current';
			};
			if ( RenderIgnoreModal ) {
				result.push( {
					id: THREAT_ACTION_IGNORE,
					label: __( 'Ignore', 'jetpack-scan' ),
					isPrimary: true,
					modalHeader: __( 'Ignore threat', 'jetpack-scan' ),
					RenderModal: RenderIgnoreModal,
					isEligible,
				} );
			} else {
				result.push( {
					id: THREAT_ACTION_IGNORE,
					label: __( 'Ignore', 'jetpack-scan' ),
					isPrimary: true,
					callback: onIgnoreThreats,
					isEligible,
				} );
			}
		}

		if ( dataFields.includes( 'status' ) ) {
			const isEligible = ( item: Threat ) => {
				if ( ! RenderUnignoreModal && ! onUnignoreThreats ) {
					return false;
				}
				if ( isThreatEligibleForUnignore ) {
					return isThreatEligibleForUnignore( item );
				}
				return item.status === 'ignored';
			};
			if ( RenderUnignoreModal ) {
				result.push( {
					id: THREAT_ACTION_UNIGNORE,
					label: __( 'Unignore', 'jetpack-scan' ),
					isPrimary: true,
					modalHeader: __( 'Unignore threat', 'jetpack-scan' ),
					RenderModal: RenderUnignoreModal,
					isEligible,
				} );
			} else {
				result.push( {
					id: THREAT_ACTION_UNIGNORE,
					label: __( 'Unignore', 'jetpack-scan' ),
					isPrimary: true,
					callback: onUnignoreThreats,
					isEligible,
				} );
			}
		}

		// View details — always-eligible row action that opens the
		// supplied `RenderViewModal`. Unlike fix / ignore / unignore, it
		// is NOT gated by threat status or capability, so the user can
		// always drill in for the full file context, fix description,
		// and metadata.
		if ( RenderViewModal ) {
			result.push( {
				id: THREAT_ACTION_VIEW,
				label: __( 'View details', 'jetpack-scan' ),
				isPrimary: false,
				modalHeader: __( 'Threat details', 'jetpack-scan' ),
				modalSize: 'large',
				RenderModal: RenderViewModal,
				isEligible: () => true,
			} );
		}

		return result;
	}, [
		dataFields,
		onFixThreats,
		onIgnoreThreats,
		onUnignoreThreats,
		RenderFixModal,
		RenderIgnoreModal,
		RenderUnignoreModal,
		RenderViewModal,
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
	 * Callback function to update the view state. When `onTrackEvent` is
	 * supplied, diff the previous view against the new one and fire the
	 * matching DataViews-canonical event names so consumer analytics can
	 * track which dimension actually changed (search vs filter vs page
	 * vs layout). The generic `view_change` event always fires last so
	 * consumers can choose between the granular events and an "anything
	 * changed" hook.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#onchangeview-function
	 */
	const previousViewRef = useRef< View >( view );
	const onChangeView = useCallback(
		( newView: View ) => {
			if ( onTrackEvent ) {
				const previous = previousViewRef.current;
				if ( previous.search !== newView.search ) {
					onTrackEvent( 'search', { has_query: !! newView.search } );
				}
				if ( previous.type !== newView.type ) {
					onTrackEvent( 'layout_changed', { layout: newView.type } );
				}
				if ( previous.page !== newView.page ) {
					onTrackEvent( 'page_change', { page: newView.page } );
				}
				if (
					JSON.stringify( previous.filters ?? [] ) !== JSON.stringify( newView.filters ?? [] )
				) {
					onTrackEvent( 'filter_change' );
				}
				onTrackEvent( 'view_change' );
			}
			previousViewRef.current = newView;
			setView( newView );
		},
		[ onTrackEvent ]
	);

	/**
	 * DataView getItemId function - returns the unique ID for each record in the dataset.
	 *
	 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/#getitemid-function
	 */
	const getItemId = useCallback( ( item: Threat ) => item.id.toString(), [] );

	return (
		<div className={ styles[ 'threats-data-views' ] }>
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
				empty={ empty }
				header={
					showStatusFilter ? (
						<ThreatsStatusToggleGroupControl
							data={ data }
							view={ view }
							onChangeView={ onChangeView }
						/>
					) : undefined
				}
			/>
		</div>
	);
}
