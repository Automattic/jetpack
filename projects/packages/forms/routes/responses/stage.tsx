/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Badge } from '@automattic/ui';
import '@automattic/ui/style.css';
/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import apiFetch from '@wordpress/api-fetch';
import {
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	Button,
	ExternalLink,
} from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n } from '@wordpress/i18n';
import { download, plus } from '@wordpress/icons';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import { Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../src/blocks/contact-form/components/jetpack-integrations-modal';
import EmptyResponses from '../../src/dashboard/components/empty-responses';
import EmptySpamButton from '../../src/dashboard/components/empty-spam-button';
import EmptyTrashButton from '../../src/dashboard/components/empty-trash-button';
import Gravatar from '../../src/dashboard/components/gravatar';
import * as Tabs from '../../src/dashboard/components/tabs';
import TextWithFlag from '../../src/dashboard/components/text-with-flag/index.tsx';
import useCreateForm from '../../src/dashboard/hooks/use-create-form';
import { getPath } from '../../src/dashboard/inbox/utils';
import WpRouteDashboardSearchParamsProvider from '../../src/dashboard/router/wp-route-dashboard-search-params-provider.tsx';
import { store as dashboardStore } from '../../src/dashboard/store';
import useConfigValue from '../../src/hooks/use-config-value';
import { INTEGRATIONS_STORE, IntegrationsSelectors } from '../../src/store/integrations';
import { getActions } from './actions';
import './style.scss';
/**
 * Types
 */
import type { SelectActions } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';
import type { StoreDescriptor } from '@wordpress/data';
import type { View, Field, Action } from '@wordpress/dataviews';

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

/**
 * Hook to fetch filter options for date and source fields.
 *
 * @return Object containing date and source filter options.
 */
function useFilterOptions() {
	const [ filterOptions, setFilterOptions ] = useState< FeedbackFilters >( {
		date: [],
		source: [],
	} );

	useEffect( () => {
		apiFetch< FeedbackFilters >( { path: '/wp/v2/feedback/filters' } ).then( response => {
			setFilterOptions( {
				date: response.date || [],
				source: response.source || [],
			} );
		} );
	}, [] );

	return filterOptions;
}

/**
 * Returns a formatted tab label with count badge.
 *
 * @param label - The label for the tab.
 * @param count - The count to display.
 * @return The formatted label with count badge.
 */
function getTabLabel( label: string, count: number ): JSX.Element {
	return (
		<Stack align="center" gap="2xs">
			{ label }
			<Badge intent="default" style={ { backgroundColor: '#f0f0f0' } }>
				{ count.toString() }
			</Badge>
		</Stack>
	);
}

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
 * Stage component for the form responses DataViews.
 *
 * @return The stage component.
 */
function Stage() {
	const params = useParams( { from: '/responses/$view' } );
	const searchParams = useSearch( { from: '/responses/$view' } );
	const navigate = useNavigate();
	const counts = useSelect(
		select => ( select( dashboardStore ) as unknown as SelectActions ).getCounts(),
		[]
	);

	const dashboardStoreDescriptor = dashboardStore as StoreDescriptor;
	const { updateCountsOptimistically, invalidateCounts } = useDispatch(
		dashboardStoreDescriptor
	) as unknown as DispatchActions;
	const filterOptions = useFilterOptions();
	let status = 'publish';
	if ( params.view === 'spam' ) {
		status = 'spam';
	} else if ( params.view === 'trash' ) {
		status = 'trash';
	}

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

	const selection = searchParams?.responseIds ?? [];

	useEffect( () => {
		const urlSearch = searchParams?.search || '';
		if ( urlSearch !== view.search ) {
			setView( prev => ( { ...prev, search: urlSearch } ) );
		}
	}, [ searchParams?.search ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const onChangeView = useCallback(
		( newView: View ) => {
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
		[ navigate, searchParams, view.search ]
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

	const queryParams = useMemo( () => {
		const queryArgs: QueryParams = {
			status,
			per_page: view.perPage,
			page: view.page || 1,
			orderby: view.sort?.field || 'date',
			order: view.sort?.direction || 'desc',
		};

		if ( view.search ) {
			queryArgs.search = view.search;
		}

		view.filters?.forEach( filter => {
			if ( ! filter.value ) {
				return;
			}
			if ( filter.field === 'read_status' ) {
				queryArgs.is_unread = filter.value === 'unread';
			}
			if ( filter.field === 'source' ) {
				queryArgs.parent = filter.value;
			}
			if ( filter.field === 'date' ) {
				const [ year, month ] = filter.value.split( '/' ).map( Number );
				queryArgs.after = new Date( Date.UTC( year, month - 1, 1 ) ).toISOString();
				queryArgs.before = new Date( Date.UTC( year, month, 0, 23, 59, 59 ) ).toISOString();
			}
		} );

		return queryArgs;
	}, [ status, view ] );

	const { records, isResolving, totalItems, totalPages } = useEntityRecords(
		'postType',
		'feedback',
		queryParams
	);

	const fields: Field< FormResponse >[] = useMemo(
		() => [
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
				elements: ( filterOptions?.date || [] ).map( filter => {
					const date = new Date();
					date.setDate( 1 );
					date.setMonth( filter.month - 1 );
					date.setFullYear( filter.year );
					return {
						label: dateI18n( __( 'F Y', 'jetpack-forms' ), date ),
						value: `${ filter.year }/${ filter.month }`,
					};
				} ),
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
			},
			{
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => {
					const source = item.entry_title || getPath( item ) || __( '(no title)', 'jetpack-forms' );
					if ( item.entry_permalink ) {
						return styleUnreadValue(
							<ExternalLink href={ item.entry_permalink }>{ source }</ExternalLink>,
							item.is_unread
						);
					}
					return styleUnreadValue( source, item.is_unread );
				},
				elements: ( filterOptions?.source || [] ).map( source => ( {
					value: source.id.toString(),
					label: decodeEntities( source.title ) || source.url,
				} ) ),
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
			},
			{
				id: 'read_status',
				label: __( 'Status', 'jetpack-forms' ),
				elements: [
					{ label: __( 'Unread', 'jetpack-forms' ), value: 'unread' },
					{ label: __( 'Read', 'jetpack-forms' ), value: 'read' },
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
				render: ( { item } ) => {
					return (
						<Badge intent="default">
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
		[ filterOptions ]
	);

	const actions = useMemo(
		() =>
			getActions( {
				navigate,
				searchParams,
				view: params.view,
				getItemId,
				queryParams,
			} ),
		[ navigate, searchParams, params.view, queryParams ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: totalItems || 0,
			totalPages: totalPages || 1,
		} ),
		[ totalItems, totalPages ]
	);

	const statusTabs = [
		{ slug: 'inbox', label: getTabLabel( __( 'Inbox', 'jetpack-forms' ), counts.inbox ) },
		{ slug: 'spam', label: getTabLabel( __( 'Spam', 'jetpack-forms' ), counts.spam ) },
		{ slug: 'trash', label: getTabLabel( __( 'Trash', 'jetpack-forms' ), counts.trash ) },
	];

	const handleTabChange = useCallback(
		newView => {
			navigate( {
				to: '/responses/$view',
				params: { view: newView },
			} );
		},
		[ navigate ]
	);

	const { openNewForm } = useCreateForm();

	const handleCreateForm = useCallback( () => {
		openNewForm( { showPatterns: false } );
	}, [ openNewForm ] );

	const handleIntegrations = useCallback( () => {
		setIsIntegrationsModalOpen( true );
	}, [] );

	const closeIntegrationsModal = useCallback( () => {
		setIsIntegrationsModalOpen( false );
	}, [] );

	const headerActions = useMemo( () => {
		const actionsArray: React.ReactNode[] = [];

		// Show integrations button on inbox when feature flags are enabled
		if (
			( params.view === 'inbox' || ! params.view ) &&
			isIntegrationsEnabled &&
			showDashboardIntegrations
		) {
			actionsArray.push(
				<Button
					key="integrations"
					variant="secondary"
					size="compact"
					onClick={ handleIntegrations }
				>
					{ __( 'Manage integrations', 'jetpack-forms' ) }
				</Button>
			);
		}

		if ( params.view === 'inbox' || ! params.view ) {
			actionsArray.push(
				<Button
					key="create"
					variant="secondary"
					size="compact"
					icon={ plus }
					onClick={ handleCreateForm }
				>
					{ __( 'Create a form', 'jetpack-forms' ) }
				</Button>
			);
		}

		actionsArray.push(
			<Button
				key="export"
				variant={ params.view === 'inbox' ? 'primary' : 'secondary' }
				size="compact"
				icon={ download }
			>
				{ __( 'Export', 'jetpack-forms' ) }
			</Button>
		);

		if ( params.view === 'trash' ) {
			actionsArray.push( <EmptyTrashButton key="empty-trash" /> );
		}

		if ( params.view === 'spam' ) {
			actionsArray.push( <EmptySpamButton key="empty-spam" /> );
		}

		return actionsArray;
	}, [
		params.view,
		handleIntegrations,
		handleCreateForm,
		isIntegrationsEnabled,
		showDashboardIntegrations,
	] );

	// Check if read_status filter is applied
	const readStatusFilter = view.filters?.find( filter => filter.field === 'read_status' )?.value;

	const onClickItem = useCallback(
		( item: unknown ) => {
			onChangeSelection( [ String( ( item as { id: number | string } ).id ) ] );
		},
		[ onChangeSelection ]
	);

	return (
		<WpRouteDashboardSearchParamsProvider from="/responses/$view">
			<Page
				showSidebarToggle={ false }
				title={
					<Stack align="center" gap="xs">
						<JetpackLogo showText={ false } width={ 20 } />
						{ __( 'Forms', 'jetpack-forms' ) }
					</Stack>
				}
				subTitle={ __(
					'View and manage all your form submissions in one place.',
					'jetpack-forms'
				) }
				actions={ headerActions }
				hasPadding={ false }
			>
				<DataViews
					empty={
						<EmptyResponses
							status={ params.view }
							isSearch={ !! view.search }
							readStatusFilter={ readStatusFilter }
						/>
					}
					data={ records || EMPTY_ARRAY }
					fields={ fields as Field< unknown >[] }
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
					isLoading={ isResolving }
					getItemId={ getItemId }
					defaultLayouts={ defaultLayouts }
					selection={ selection }
					onChangeSelection={ onChangeSelection }
					onClickItem={ onClickItem }
					actions={ actions as Action< FormResponse >[] }
				>
					<Stack
						align="center"
						className="jp-forms-dataviews__view-actions"
						gap="sm"
						justify="space-between"
					>
						<Stack align="center" gap="sm">
							<Tabs.Root value={ params.view || 'inbox' } onValueChange={ handleTabChange }>
								<Tabs.List density="compact">
									{ statusTabs.map( tab => (
										<Tabs.Tab value={ tab.slug } key={ tab.slug }>
											{ tab.label }
										</Tabs.Tab>
									) ) }
								</Tabs.List>
							</Tabs.Root>
						</Stack>
						<Stack align="center" gap="sm">
							<DataViews.Search />
							<DataViews.FiltersToggle />
							<DataViews.ViewConfig />
						</Stack>
					</Stack>
					<DataViews.Filters className="dataviews-filters__container" />
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
		</WpRouteDashboardSearchParamsProvider>
	);
}

export { Stage as stage };
