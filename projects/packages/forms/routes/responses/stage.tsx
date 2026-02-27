/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import {
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	ExternalLink,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import { Badge, Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../src/blocks/contact-form/components/jetpack-integrations-modal';
import EmptyResponses from '../../src/dashboard/components/empty-responses';
import Gravatar from '../../src/dashboard/components/gravatar';
import TextWithFlag from '../../src/dashboard/components/text-with-flag/index.tsx';
import useInboxData from '../../src/dashboard/hooks/use-inbox-data.ts';
import WpRouteDashboardSearchParamsProvider from '../../src/dashboard/router/wp-route-dashboard-search-params-provider.tsx';
import DataViewsHeaderRow from '../../src/dashboard/wp-build/components/dataviews-header-row';
import usePageHeaderDetails from '../../src/dashboard/wp-build/hooks/use-page-header-details';
import useConfigValue from '../../src/hooks/use-config-value';
import { INTEGRATIONS_STORE, IntegrationsSelectors } from '../../src/store/integrations';
import { getRowActions } from './actions';
import '../../src/dashboard/wp-build/style.scss';
import './style.scss';
/**
 * Types
 */
import type { FormResponse } from '../../src/types/index.ts';
import type { View, Field, Action, Operator } from '@wordpress/dataviews';

type FeedbackFilterDate = {
	month: number;
	year: number;
};

type FeedbackFilterSource = {
	id: number;
	title: string;
	url: string;
};

type FeedbackFilters = {
	date: FeedbackFilterDate[];
	source: FeedbackFilterSource[];
};

const EMPTY_ARRAY = [];

const defaultLayouts = {
	table: {},
	list: {},
};

type QueryParams = {
	status: string;
	per_page?: number;
	page?: number;
	orderby?: string;
	order?: string;
	is_unread?: boolean;
	parent?: string;
	before?: string;
	after?: string;
	search?: string;
};

const DEFAULT_VIEW: View = {
	type: 'table',
	filters: [],
	perPage: 20,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	titleField: 'from',
	fields: [ 'date', 'source', 'ip' ],
};

/**
 * Get item ID as string.
 *
 * @param {object} item - The item object.
 * @return {string} The item ID as a string.
 */
function getItemId( item: unknown ): string {
	return ( item as { id: number | string } )?.id?.toString() ?? '';
}

/**
 * Styles an element with bold font weight when it represents an unread item.
 * If the element is a string, it will be wrapped in a span tag with the appropriate styling.
 *
 * @param {React.ReactNode} element  - The element to style. Can be a string, React element, or other React node.
 * @param {boolean}         isUnread - Whether the item is unread. If true, applies fontWeight: 600 styling.
 * @return {React.ReactNode} The styled element. Returns the element as-is if not unread, or wraps/clones it with fontWeight: 600 if unread.
 */
function styleUnreadValue( element: React.ReactNode, isUnread: boolean ): React.ReactNode {
	if ( ! isUnread ) {
		return element;
	}

	// If element is a string, wrap it in a span tag with fontWeight style
	if ( typeof element === 'string' ) {
		return <span style={ { fontWeight: 600 } }>{ element }</span>;
	}

	// If element is already a React element, clone it and add the fontWeight style
	if ( React.isValidElement( element ) ) {
		return React.cloneElement( element, {
			style: { ...( element.props.style || {} ), fontWeight: 600 },
		} as React.HTMLAttributes< HTMLElement > );
	}

	// Fallback: wrap in span for other types
	return <span style={ { fontWeight: 600 } }>{ element }</span>;
}

/**
 * Get the path from a URL string.
 *
 * @param url - The URL string.
 * @return The pathname from the URL, or null if the URL is invalid.
 */
function getUrlPath( url: string ): string | null {
	try {
		const parsedUrl = new URL( url );
		return parsedUrl.pathname;
	} catch {
		return null;
	}
}

/**
 * Stage component for the form responses DataViews.
 *
 * @return The stage component.
 */
function StageInner() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const statusView = params.view === 'spam' || params.view === 'trash' ? params.view : 'inbox';
	const statusFilter = statusView === 'inbox' ? 'draft,publish' : statusView;

	const sourceIdValue = ( searchParams as { sourceId?: string | number } )?.sourceId;
	const sourceIdNumber =
		typeof sourceIdValue === 'number' ? sourceIdValue : Number( sourceIdValue );
	const isSingleFormView = Number.isFinite( sourceIdNumber ) && sourceIdNumber > 0;

	const [ isIntegrationsModalOpen, setIsIntegrationsModalOpen ] = useState( false );
	const integrations = useSelect(
		select => ( select( INTEGRATIONS_STORE ) as IntegrationsSelectors ).getIntegrations?.() ?? [],
		[]
	);
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const showDashboardIntegrations = useConfigValue( 'showDashboardIntegrations' );

	const [ view, setView ] = useState< View >( () => ( {
		...DEFAULT_VIEW,
		search: searchParams?.search || '',
	} ) );

	const selection = useMemo( () => searchParams?.responseIds ?? [], [ searchParams?.responseIds ] );

	const {
		setCurrentQuery,
		setSelectedResponses,
		filterOptions,
		records,
		isLoadingData,
		totalItems,
		totalPages,
		totalItemsInbox,
		totalItemsSpam,
		totalItemsTrash,
	} = useInboxData( { status: statusView } );

	useEffect( () => {
		const urlSearch = searchParams?.search || '';
		if ( urlSearch !== view.search ) {
			setView( prev => ( { ...prev, search: urlSearch } ) );
		}
	}, [ searchParams?.search ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const onChangeView = useCallback(
		( newView: View ) => {
			if ( ! isSingleFormView ) {
				// If the Folder filter changes (CFM-on behavior), treat it as a route param change.
				const folderValue =
					newView.filters?.find( filter => filter.field === 'folder' )?.value || 'inbox';

				if ( folderValue !== statusView ) {
					// Clear selection when changing folder to avoid mismatched inspector state.
					navigate( {
						to: '/responses/$view',
						params: { view: folderValue },
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );
					setView( { ...newView, page: 1 } );
					return;
				}
			}

			setView( newView );

			if ( newView.search !== view.search ) {
				navigate( {
					search: {
						...searchParams,
						search: newView.search || undefined,
					},
				} );
			}
		},
		[ isSingleFormView, navigate, searchParams, statusView, view.search ]
	);

	const onChangeSelection = useCallback(
		items => {
			navigate( {
				search: {
					...searchParams,
					responseIds: items.length > 0 ? items : undefined,
				},
			} );
		},
		[ searchParams, navigate ]
	);

	const onStatusChange = useCallback(
		( nextStatus: 'inbox' | 'spam' | 'trash' ) => {
			navigate( {
				to: '/responses/$view',
				params: { view: nextStatus },
				search: {
					...searchParams,
					responseIds: undefined,
					sourceId: isSingleFormView ? String( sourceIdNumber ) : undefined,
				},
			} );
		},
		[ isSingleFormView, navigate, searchParams, sourceIdNumber ]
	);

	// Keep the Folder filter in sync with the route param (CFM-on behavior).
	useEffect( () => {
		if ( isSingleFormView ) {
			return;
		}
		setView( previousView => {
			const previousFilters = previousView.filters || [];
			const existing = previousFilters.find( filter => filter.field === 'folder' );
			if ( existing?.value === statusView ) {
				return previousView;
			}
			return {
				...previousView,
				filters: [
					{ field: 'folder', operator: 'is', value: statusView },
					...previousFilters.filter( filter => filter.field !== 'folder' ),
				],
			};
		} );
	}, [ isSingleFormView, setView, statusView ] );

	const queryParams = useMemo( () => {
		const queryArgs: QueryParams = {
			status: statusFilter,
			per_page: view.perPage,
			page: view.page || 1,
			orderby: view.sort?.field || 'date',
			order: view.sort?.direction || 'desc',
		};

		if ( view.search ) {
			queryArgs.search = view.search;
		}

		if ( isSingleFormView ) {
			queryArgs.parent = String( sourceIdNumber );
		}

		view.filters?.forEach( filter => {
			if ( ! filter.value ) {
				return;
			}
			if ( filter.field === 'read_status' ) {
				queryArgs.is_unread = filter.value === 'unread';
			}
			if ( ! isSingleFormView && filter.field === 'source' ) {
				queryArgs.parent = filter.value;
			}
			if ( filter.field === 'date' ) {
				const [ year, month ] = filter.value.split( '/' ).map( Number );
				queryArgs.after = new Date( Date.UTC( year, month - 1, 1 ) ).toISOString();
				queryArgs.before = new Date( Date.UTC( year, month, 0, 23, 59, 59 ) ).toISOString();
			}
		} );

		return queryArgs;
	}, [ isSingleFormView, sourceIdNumber, statusFilter, view ] );

	// Keep dashboard store query in sync so core-data fetches include fields_format=collection.
	useEffect( () => {
		setCurrentQuery( queryParams );
	}, [ queryParams, setCurrentQuery ] );

	// Keep selected responses in store for shared dashboard behavior (e.g., export).
	useEffect( () => {
		const validSelectedIds = ( selection || [] ).filter( id => {
			return records?.some( record => getItemId( record ) === id );
		} );

		setSelectedResponses( validSelectedIds );
	}, [ records, selection, setSelectedResponses ] );

	const fields: Field< FormResponse >[] = useMemo(
		() => [
			...( isSingleFormView
				? []
				: [
						{
							id: 'folder',
							label: __( 'Folder', 'jetpack-forms' ),
							elements: [
								{
									label: sprintf(
										/* translators: %s is the number of inbox responses. */
										__( 'Inbox (%s)', 'jetpack-forms' ),
										formatNumber( totalItemsInbox ?? 0 )
									),
									value: 'inbox',
								},
								{
									label: sprintf(
										/* translators: %s is the number of spam responses. */
										__( 'Spam (%s)', 'jetpack-forms' ),
										formatNumber( totalItemsSpam ?? 0 )
									),
									value: 'spam',
								},
								{
									label: sprintf(
										/* translators: %s is the number of trash responses. */
										__( 'Trash (%s)', 'jetpack-forms' ),
										formatNumber( totalItemsTrash ?? 0 )
									),
									value: 'trash',
								},
							],
							// Primary so the filter UI (and its pill) is visible by default.
							filterBy: { operators: [ 'is' ] as Operator[], isPrimary: true },
							enableSorting: false,
							enableHiding: false,
							// Filter-only field; not shown as a column.
							render: () => null,
							getValue: () => null,
						},
				  ] ),
			{
				id: 'from',
				label: __( 'From', 'jetpack-forms' ),
				render: ( { item } ) => {
					const displayName = decodeEntities(
						item.author_name || item.author_email || item.author_url || item.ip || 'Anonymous'
					);
					const showEmail =
						item.author_email && displayName !== decodeEntities( item.author_email );
					const defaultImage = item.author_name || item.author_email ? 'initials' : 'mp';

					return (
						<Stack align="center" gap="sm">
							{ item.is_unread && (
								<span
									style={ {
										color: '#d63638',
										fontSize: '8px',
										position: 'absolute',
										marginLeft: '-12px',
									} }
									aria-label={ __( '(Unread form response)', 'jetpack-forms' ) }
								>
									●
								</span>
							) }
							<Gravatar
								email={ item.author_email || item.ip } // With IP we still return placeholder image
								defaultImage={ defaultImage }
								displayName={ displayName }
								size={ 32 }
								useHovercard={ false }
							/>
							{ styleUnreadValue(
								<Stack direction="column" gap="2xs">
									<Text ellipsizeMode="tail" limit={ 50 } truncate>
										{ displayName }
									</Text>
									{ showEmail && (
										<Text variant="muted" size={ 12 } ellipsizeMode="tail" limit={ 50 } truncate>
											{ item.author_email }
										</Text>
									) }
								</Stack>,
								item.is_unread
							) }
						</Stack>
					);
				},
				getValue: ( { item } ) =>
					item.author_name || item.author_email || item.author_url || item.ip || 'Anonymous',
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				render: ( { item } ) => {
					const dateStr = new Date( item.date ).toLocaleDateString( undefined, {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
					} );
					return styleUnreadValue( dateStr, item.is_unread );
				},
				elements: ( ( filterOptions as unknown as FeedbackFilters )?.date || [] ).map( filter => {
					const date = new Date();
					date.setDate( 1 );
					date.setMonth( filter.month - 1 );
					date.setFullYear( filter.year );
					return {
						label: dateI18n( __( 'F Y', 'jetpack-forms' ), date ),
						value: `${ filter.year }/${ filter.month }`,
					};
				} ),
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
			},
			{
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => {
					const source =
						item.entry_title ||
						getUrlPath( item.entry_permalink ) ||
						__( '(no title)', 'jetpack-forms' );
					if ( item.entry_permalink ) {
						return styleUnreadValue(
							<ExternalLink href={ item.entry_permalink }>{ source }</ExternalLink>,
							item.is_unread
						);
					}
					return styleUnreadValue( source, item.is_unread );
				},
				elements: ( ( filterOptions as unknown as FeedbackFilters )?.source || [] ).map(
					source => ( {
						value: source.id.toString(),
						label:
							decodeEntities( source.title ) ||
							getUrlPath( source.url ) ||
							__( '(no title)', 'jetpack-forms' ),
					} )
				),
				...( isSingleFormView ? {} : { filterBy: { operators: [ 'is' ] as Operator[] } } ),
				enableSorting: false,
			},
			{
				id: 'read_status',
				label: __( 'Status', 'jetpack-forms' ),
				elements: [
					{ label: __( 'Unread', 'jetpack-forms' ), value: 'unread' },
					{ label: __( 'Read', 'jetpack-forms' ), value: 'read' },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
				render: ( { item } ) => {
					return (
						<Badge intent="draft">
							{ item.is_unread ? __( 'Unread', 'jetpack-forms' ) : __( 'Read', 'jetpack-forms' ) }
						</Badge>
					);
				},
			},
			{
				id: 'ip',
				label: __( 'IP Address', 'jetpack-forms' ),
				render: ( { item } ) => {
					if ( ! item.ip ) {
						return styleUnreadValue( '-', item.is_unread );
					}
					return (
						<TextWithFlag countryCode={ item.country_code } fallbackIcon>
							{ styleUnreadValue( item.ip, item.is_unread ) }
						</TextWithFlag>
					);
				},
				enableSorting: false,
			},
		],
		[ filterOptions, isSingleFormView, totalItemsInbox, totalItemsSpam, totalItemsTrash ]
	);

	const actions = useMemo(
		() =>
			getRowActions( {
				navigate,
				searchParams,
				view: statusView,
			} ),
		[ navigate, searchParams, statusView ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems || 0,
			totalPages: totalPages || 1,
		} ),
		[ totalItems, totalPages ]
	);

	const handleIntegrations = useCallback( () => {
		setIsIntegrationsModalOpen( true );
	}, [] );

	const closeIntegrationsModal = useCallback( () => {
		setIsIntegrationsModalOpen( false );
	}, [] );

	const {
		breadcrumbs,
		badges,
		subtitle,
		actions: headerActions,
	} = usePageHeaderDetails( {
		screen: 'responses',
		statusView,
		sourceId: sourceIdValue,
		isIntegrationsEnabled: !! isIntegrationsEnabled,
		showDashboardIntegrations: !! showDashboardIntegrations,
		onOpenIntegrations: handleIntegrations,
	} );

	// Check if read_status filter is applied
	const readStatusFilter = view.filters?.find( filter => filter.field === 'read_status' )?.value;

	const onClickItem = useCallback(
		( item: unknown ) => {
			onChangeSelection( [ String( ( item as { id: number | string } ).id ) ] );
		},
		[ onChangeSelection ]
	);

	return (
		<Page
			showSidebarToggle={ false }
			breadcrumbs={ breadcrumbs }
			badges={ badges }
			subTitle={ subtitle }
			actions={ headerActions }
			hasPadding={ false }
		>
			<DataViews
				empty={
					<EmptyResponses
						isSearch={ !! view.search }
						isSingleFormView={ isSingleFormView }
						readStatusFilter={ readStatusFilter }
						status={ statusView }
					/>
				}
				data={ records || EMPTY_ARRAY }
				fields={ fields as Field< unknown >[] }
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				isLoading={ isLoadingData }
				getItemId={ getItemId }
				defaultLayouts={ defaultLayouts }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				onClickItem={ onClickItem }
				actions={ actions as Action< unknown >[] }
			>
				<DataViewsHeaderRow
					activeTab="responses"
					isSingleFormView={ isSingleFormView }
					activeStatus={ statusView }
					statusCounts={ {
						inbox: totalItemsInbox ?? 0,
						spam: totalItemsSpam ?? 0,
						trash: totalItemsTrash ?? 0,
					} }
					onStatusChange={ onStatusChange }
				/>
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ closeIntegrationsModal }
				attributes={ undefined }
				setAttributes={ undefined }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
				context="dashboard"
			/>
		</Page>
	);
}

const Stage = () => {
	return (
		<WpRouteDashboardSearchParamsProvider from="/responses/$view">
			<StageInner />
		</WpRouteDashboardSearchParamsProvider>
	);
};

export { Stage as stage };
