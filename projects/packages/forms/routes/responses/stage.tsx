/**
 * External dependencies
 */
import Gravatar from '@automattic/jetpack-components/gravatar';
import { formatNumber } from '@automattic/number-formatters';
/**
 * WordPress dependencies
 */
import { __experimentalText as Text } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useEvent, useViewportMatch } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { caution } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { useParams, useSearch, useNavigate } from '@wordpress/route';
import { Badge, Link, Notice, Stack } from '@wordpress/ui';
import { useView } from '@wordpress/views';
import * as React from 'react';
/**
 * Internal dependencies
 */
import IntegrationsModal from '../../src/blocks/contact-form/components/jetpack-integrations-modal';
import EmptyResponses from '../../src/dashboard/components/empty-responses';
import TextWithFlag from '../../src/dashboard/components/text-with-flag/index.tsx';
import { RESPONSES_PER_PAGE, getResponseStatusFilter } from '../../src/dashboard/constants.ts';
import useInboxData from '../../src/dashboard/hooks/use-inbox-data.ts';
import useResponseFieldColumns from '../../src/dashboard/hooks/use-response-field-columns.ts';
import { ensurePreferencesPersistence } from '../../src/dashboard/preferences-persistence.ts';
import { writeKnownAnswerIds } from '../../src/dashboard/response-column-preferences.ts';
import {
	buildResponseFieldColumns,
	getFrozenColumnsClassName,
	getResponseTableView,
	isSameColumnChoice,
	keepColumnChoice,
} from '../../src/dashboard/response-field-columns.tsx';
import WpRouteDashboardSearchParamsProvider from '../../src/dashboard/router/wp-route-dashboard-search-params-provider.tsx';
import { getFormEditUrl } from '../../src/dashboard/utils.ts';
import DataViewsHeaderRow from '../../src/dashboard/wp-build/components/dataviews-header-row';
import FormsPage from '../../src/dashboard/wp-build/components/page';
import usePageHeaderDetails from '../../src/dashboard/wp-build/hooks/use-page-header-details';
import useConfigValue from '../../src/hooks/use-config-value';
import { INTEGRATIONS_STORE, IntegrationsSelectors } from '../../src/store/integrations';
import { getRowActions } from './actions';
import '../../src/dashboard/wp-build/style.scss';
import './style.scss';
/**
 * Types
 */
import type { QueryParams } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';
import type { View, Field, Action, Operator } from '@wordpress/dataviews';

type FeedbackFilterSource = {
	id: number;
	title: string;
	url: string;
};

type FeedbackFilters = {
	source: FeedbackFilterSource[];
};

const EMPTY_ARRAY = [];

// Sentinel value used in the Source filter to represent form-preview (test) responses.
// Source IDs are numeric post IDs, so this non-numeric value is safe from collision.
const FORM_PREVIEW_SOURCE_VALUE = 'form_preview';

const defaultLayouts = {
	table: {},
	list: {},
};

const DEFAULT_VIEW: View = {
	type: 'table',
	filters: [],
	perPage: RESPONSES_PER_PAGE,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	titleField: 'from',
	// From is the title column and renders ahead of these; answer columns are slotted
	// in directly after Date. The order is therefore From, Date, the form's own
	// fields, Source, IP Address — and Status after those, for anyone who turns it
	// on, since it is off by default.
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
	const statusFilter = getResponseStatusFilter( statusView );
	const dateSettings = getDateSettings();
	// Matches the width at which boot flips the inspector from a side panel to a
	// full-screen overlay. Also the width below which the responses table drops every
	// column but the response and its actions, since it cannot usefully scroll sideways.
	const isMobileViewport = useViewportMatch( 'medium', '<' );

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
	const adminUrl = ( useConfigValue( 'adminUrl' ) as string ) || '';

	// `useView` keeps the view in the preferences store, which only holds it in memory
	// until something gives it somewhere to write to. A wp-build dashboard is not booted
	// by Core, so nothing else will.
	const { setPersistenceLayer } = useDispatch( preferencesStore );
	ensurePreferencesPersistence( setPersistenceLayer );

	// The Folder filter is the route, not a preference: it comes from the URL and must
	// never be persisted, or reloading /responses/inbox could resolve a stored `spam`.
	// `isLocked` is how `useView` is told to apply a filter but keep it out of what it
	// saves. A single form's responses have no Folder filter at all.
	const activeViewOverrides = useMemo(
		() =>
			isSingleFormView
				? undefined
				: {
						filters: [
							{ field: 'folder', operator: 'is' as const, value: statusView, isLocked: true },
						],
				  },
		[ isSingleFormView, statusView ]
	);

	// `page` is deliberately not in the URL — it never has been here — so it lives
	// alongside the search term that is, and both reach the view as query params.
	const [ page, setPage ] = useState( 1 );

	const onChangeQueryParams = useCallback(
		( next: { page: number; search: string } ) => {
			setPage( next.page );

			if ( next.search !== ( searchParams?.search || '' ) ) {
				navigate( {
					search: {
						...searchParams,
						search: next.search || undefined,
					},
				} );
			}
		},
		[ navigate, searchParams ]
	);

	const { view, updateView } = useView( {
		kind: 'postType',
		name: 'feedback',
		// One remembered view per form, plus one for the view spanning every form. A
		// form's answer columns name its own fields, so sharing a view across forms
		// would strand one form's columns on another.
		slug: isSingleFormView ? `form-${ sourceIdNumber }` : 'all',
		defaultView: DEFAULT_VIEW,
		activeViewOverrides,
		queryParams: { page, search: searchParams?.search || '' },
		onChangeQueryParams,
	} );

	// `useView` takes a whole view, while the columns hook and the effects below think in
	// updates to the previous one. The ref is what makes a second update in the same tick
	// build on the first instead of clobbering it — the columns effect does exactly that
	// when it drops the outgoing form's columns and adds the incoming form's.
	const pendingViewRef = useRef< View >( view );
	pendingViewRef.current = view;

	const setView = useCallback(
		( updater: ( previousView: View ) => View ) => {
			const next = updater( pendingViewRef.current );
			pendingViewRef.current = next;
			updateView( next );
		},
		[ updateView ]
	);

	// The form whose column choice is being read and written, or null on the view
	// spanning every form.
	const columnPreferenceFormId = isSingleFormView ? sourceIdNumber : null;
	// Every answer column currently on offer, kept in a ref because the choice is saved
	// from `onChangeView`, which is declared before the columns hook runs.
	const knownAnswerIdsRef = useRef< string[] >( [] );
	// Every column DataViews has a field for, for the same reason.
	const knownFieldIdsRef = useRef< Set< string > >( new Set() );

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
		currentQuery,
	} = useInboxData( { status: statusView } );

	const onChangeView = useCallback(
		( incomingView: View ) => {
			const newView = keepColumnChoice(
				incomingView,
				view,
				isMobileViewport,
				knownFieldIdsRef.current
			);

			// DataViews reports a column being shown, hidden or moved through here and
			// keeps nothing itself, so this is the only moment the choice can be saved.
			// Only when the columns actually changed, though: this same callback carries
			// every sort, search and page change, and saving on those would both write
			// constantly and, while a form's responses are still loading, record an empty
			// set of known answer columns over a choice that names several.
			if ( ! isSameColumnChoice( newView.fields, view.fields ) ) {
				writeKnownAnswerIds( columnPreferenceFormId, knownAnswerIdsRef.current );
			}

			if ( ! isSingleFormView ) {
				// If the Folder filter changes (CFM-on behavior), treat it as a route param change.
				const folderValue =
					newView.filters?.find( filter => filter.field === 'folder' )?.value || 'inbox';

				if ( folderValue !== statusView ) {
					// Clear selection when changing folder to avoid mismatched inspector state.
					navigate( {
						to: `/responses/${ folderValue }`,
						search: {
							...searchParams,
							responseIds: undefined,
						},
					} );
					updateView( { ...newView, page: 1 } );
					return;
				}
			}

			// The search term reaches the URL through `onChangeQueryParams`, which
			// `updateView` calls whenever it changes.
			updateView( newView );
		},
		[
			columnPreferenceFormId,
			isMobileViewport,
			isSingleFormView,
			navigate,
			searchParams,
			statusView,
			updateView,
			view,
		]
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

	// Selecting a single response is what both clicking a row and (on small
	// screens) the View action do. `useEvent` keeps the reference stable so the
	// memoized row actions don't rebuild every time `searchParams` changes.
	const selectResponse = useEvent( ( id: string ) => onChangeSelection( [ id ] ) );

	const onStatusChange = useCallback(
		( nextStatus: 'inbox' | 'spam' | 'trash' ) => {
			navigate( {
				to: `/responses/${ nextStatus }`,
				search: {
					...searchParams,
					responseIds: undefined,
					sourceId: isSingleFormView ? String( sourceIdNumber ) : undefined,
				},
			} );
		},
		[ isSingleFormView, navigate, searchParams, sourceIdNumber ]
	);

	// A form's own fields become columns, so a single form's responses can be read
	// across at a glance. The "All responses" view spans every form and has no
	// shared field set, so it keeps the built-in columns only.
	const responseFieldColumns = useResponseFieldColumns( {
		formId: columnPreferenceFormId,
		records,
		setView,
	} );

	useEffect( () => {
		knownAnswerIdsRef.current = responseFieldColumns.map( column => column.id );
	}, [ responseFieldColumns ] );

	const queryParams = useMemo( () => {
		const queryArgs: QueryParams = {
			status: statusFilter,
			per_page: view.perPage,
			page: view.page || 1,
			orderby: view.sort?.field || 'date',
			order: view.sort?.direction || 'desc',
			fields_format: 'collection',
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
				if ( filter.value === FORM_PREVIEW_SOURCE_VALUE ) {
					queryArgs.is_test = true;
				} else {
					queryArgs.source = filter.value;
				}
			}
			if ( filter.field === 'date' ) {
				const filterValue: unknown = filter.value;
				const operator = filter.operator ?? 'is';

				if ( filterValue ) {
					let startDate: Date;
					let endDate: Date;

					if ( Array.isArray( filterValue ) ) {
						const firstValue: unknown = filterValue[ 0 ];
						const secondValue: unknown = filterValue[ 1 ];
						startDate = new Date(
							typeof firstValue === 'string' ||
							typeof firstValue === 'number' ||
							firstValue instanceof Date
								? firstValue
								: ''
						);
						endDate = new Date(
							typeof secondValue === 'string' ||
							typeof secondValue === 'number' ||
							secondValue instanceof Date
								? secondValue
								: ''
						);
					} else {
						const dateValue =
							typeof filterValue === 'string' ||
							typeof filterValue === 'number' ||
							filterValue instanceof Date
								? filterValue
								: '';
						startDate = new Date( dateValue );
						endDate = new Date( dateValue );
					}

					// Validate dates before processing
					if ( ! isNaN( startDate.getTime() ) && ! isNaN( endDate.getTime() ) ) {
						startDate.setUTCHours( 0, 0, 0, 0 );
						endDate.setUTCHours( 23, 59, 59, 999 );

						const startOfDayISO = startDate.toISOString();
						const endOfDayISO = endDate.toISOString();

						// Convert operator to REST API operator. Note, before and after are treated as inclusive.
						switch ( operator ) {
							case 'on':
								queryArgs.after = startOfDayISO;
								queryArgs.before = endOfDayISO;
								break;
							case 'before':
								queryArgs.before = endOfDayISO;
								break;
							case 'after':
								queryArgs.after = startOfDayISO;
								break;
							case 'between':
								queryArgs.after = startOfDayISO;
								queryArgs.before = endOfDayISO;
								break;
						}
					}
				}
			}
		} );

		return queryArgs;
	}, [ isSingleFormView, sourceIdNumber, statusFilter, view ] );

	// Keep dashboard store query in sync so core-data fetches include fields_format=collection.
	useEffect( () => {
		setCurrentQuery( queryParams );
	}, [ queryParams, setCurrentQuery ] );

	// Detect when the store's query hasn't caught up to the locally computed queryParams.
	// setCurrentQuery runs in a useEffect (after paint), so for one render cycle the store
	// still holds the previous query and useEntityRecords returns stale cached data.
	// Force a loading state during that gap to avoid flashing old results.
	const isQueryStale = useMemo( () => {
		if ( ! currentQuery ) {
			return true;
		}

		const allKeys = new Set( [ ...Object.keys( currentQuery ), ...Object.keys( queryParams ) ] );

		return Array.from( allKeys ).some(
			key => currentQuery[ key ] !== queryParams[ key as keyof QueryParams ]
		);
	}, [ currentQuery, queryParams ] );

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
					const gravatarName = item.author_name
						? decodeEntities( item.author_name )
						: item.author_email?.split( '@' )[ 0 ];
					const defaultImage = gravatarName ? 'initials' : 'mp';

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
								displayName={ gravatarName }
								size={ 32 }
								useHovercard={ false }
							/>
							{ styleUnreadValue(
								<Stack direction="column" gap="xs">
									<Stack direction="row" align="center" gap="xs">
										<Text ellipsizeMode="tail" limit={ 50 } truncate>
											{ displayName }
										</Text>
										{ item.is_test && (
											<Badge intent="none" aria-label={ __( 'Test response', 'jetpack-forms' ) }>
												{ __( 'Test', 'jetpack-forms' ) }
											</Badge>
										) }
									</Stack>
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
			...buildResponseFieldColumns( responseFieldColumns ),
			{
				id: 'date',
				type: 'date',
				label: __( 'Date', 'jetpack-forms' ),
				filterBy: {
					operators: [ 'on', 'between', 'before', 'after' ] as Operator[],
				},
				render: ( { item } ) => {
					const datetime = dateI18n( dateSettings.formats.datetime, item.date );
					return styleUnreadValue( datetime, item.is_unread );
				},
				getValue: ( { item } ) => {
					if ( typeof item.date !== 'string' ) {
						return '';
					}
					return item.date;
				},
			},
			{
				id: 'source',
				label: __( 'Source', 'jetpack-forms' ),
				render: ( { item } ) => {
					// Test responses point at the regenerated preview URL instead of
					// the hosting page, and always surface as "Form preview".
					if ( item.is_test ) {
						const previewLabel = __( 'Form preview', 'jetpack-forms' );
						if ( item.preview_url ) {
							return styleUnreadValue(
								<Link openInNewTab href={ item.preview_url }>
									{ previewLabel }
								</Link>,
								item.is_unread
							);
						}
						return styleUnreadValue( previewLabel, item.is_unread );
					}
					const source =
						item.entry_title ||
						getUrlPath( item.entry_permalink ) ||
						__( '(no title)', 'jetpack-forms' );
					if ( item.entry_permalink ) {
						return styleUnreadValue(
							<Link openInNewTab href={ item.entry_permalink }>
								{ source }
							</Link>,
							item.is_unread
						);
					}
					return styleUnreadValue( source, item.is_unread );
				},
				elements: [
					{
						value: FORM_PREVIEW_SOURCE_VALUE,
						label: __( 'Form preview', 'jetpack-forms' ),
					},
					...( ( filterOptions as unknown as FeedbackFilters )?.source || [] ).map( source => ( {
						value: source.id.toString(),
						label:
							decodeEntities( source.title ) ||
							getUrlPath( source.url ) ||
							__( '(no title)', 'jetpack-forms' ),
					} ) ),
				],
				filterBy: isSingleFormView ? false : { operators: [ 'is' ] as Operator[] },
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
		[
			dateSettings.formats.datetime,
			filterOptions,
			isSingleFormView,
			responseFieldColumns,
			totalItemsInbox,
			totalItemsSpam,
			totalItemsTrash,
		]
	);

	const answerColumnsClassName = getFrozenColumnsClassName(
		responseFieldColumns,
		view,
		isMobileViewport
	);

	const knownFieldIds = useMemo( () => new Set( fields.map( field => field.id ) ), [ fields ] );

	useEffect( () => {
		knownFieldIdsRef.current = knownFieldIds;
	}, [ knownFieldIds ] );

	const viewForDataViews = useMemo(
		() => getResponseTableView( view, isMobileViewport, knownFieldIds ),
		[ isMobileViewport, knownFieldIds, view ]
	);

	const actions = useMemo(
		() =>
			getRowActions( {
				navigate,
				view: statusView,
				onSelectResponse: isMobileViewport ? selectResponse : undefined,
				// Pin this list onto links to the standalone response page, so its
				// prev/next walks the sequence the user is looking at right now —
				// filters, search and ordering included.
				pinnedView: queryParams,
			} ),
		[ navigate, statusView, isMobileViewport, selectResponse, queryParams ]
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
		ariaLabel,
		breadcrumbs,
		badges,
		subtitle,
		title,
		visual,
		actions: headerActions,
	} = usePageHeaderDetails( {
		screen: 'responses',
		statusView,
		sourceId: sourceIdValue,
		isIntegrationsEnabled: !! isIntegrationsEnabled,
		showDashboardIntegrations: !! showDashboardIntegrations,
		onOpenIntegrations: handleIntegrations,
	} );

	// On a single-form view, surface a persistent warning when the form isn't
	// collecting its responses anywhere (email + saving off, no integration).
	const isFormNotCollecting = useSelect(
		select => {
			if ( ! isSingleFormView ) {
				return false;
			}
			const form = select( coreStore ).getEntityRecord(
				'postType',
				'jetpack_form',
				sourceIdNumber,
				{ context: 'edit' }
			) as { is_collecting_responses?: boolean } | undefined;
			return form ? form.is_collecting_responses === false : false;
		},
		[ isSingleFormView, sourceIdNumber ]
	);

	// Link to the form editor, where the author can set up a response destination.
	const formEditUrl = useMemo(
		() => getFormEditUrl( sourceIdNumber, adminUrl ),
		[ adminUrl, sourceIdNumber ]
	);

	// Whether the form has any stored responses — summed across inbox, spam and
	// trash, not just the current view, so a form with responses only in spam or
	// trash still keeps the table (and its status tabs) and gets a banner above it.
	// These counts carry the active search / read-status filters, so they're only
	// a reliable "has anything at all" signal when no search or filter is applied —
	// otherwise a search that matches nothing would read as an empty form.
	const totalResponseCount =
		( totalItemsInbox ?? 0 ) + ( totalItemsSpam ?? 0 ) + ( totalItemsTrash ?? 0 );
	const hasActiveSearchOrFilter = !! view.search || ( view.filters?.length ?? 0 ) > 0;
	const countsReady = ! isLoadingData && ! isQueryStale;
	const hasAnyResponses = countsReady && totalResponseCount > 0;
	// Replace the table with the front-and-center warning only when the form truly
	// has no responses anywhere — never while a search/filter is narrowing the list,
	// so real data is never hidden behind the callout.
	const showNotCollectingCallout =
		isFormNotCollecting &&
		isSingleFormView &&
		countsReady &&
		! hasActiveSearchOrFilter &&
		totalResponseCount === 0;

	// Check if read_status filter is applied
	const readStatusFilter = view.filters?.find( filter => filter.field === 'read_status' )?.value;

	const onClickItem = useCallback(
		( item: unknown ) => {
			selectResponse( String( ( item as { id: number | string } ).id ) );
		},
		[ selectResponse ]
	);

	return (
		<FormsPage
			visual={ visual }
			breadcrumbs={ breadcrumbs }
			badges={ badges }
			title={ title }
			ariaLabel={ ariaLabel }
			subTitle={ subtitle }
			actions={ headerActions }
			hasPadding={ false }
			showFooter={ false }
		>
			{ isFormNotCollecting && hasAnyResponses && (
				<Notice.Root
					intent="error"
					icon={ caution }
					className="jetpack-forms__not-collecting-banner"
				>
					<Notice.Title>
						{ __( 'This form isn’t collecting responses', 'jetpack-forms' ) }
					</Notice.Title>
					<Notice.Description>
						{ __(
							'New submissions are being dropped because this form has nowhere to send them.',
							'jetpack-forms'
						) }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink href={ formEditUrl }>
							{ __( 'Choose where responses go', 'jetpack-forms' ) }
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			) }
			{ showNotCollectingCallout ? (
				<Stack className="jetpack-forms__not-collecting-callout" align="center" justify="center">
					<EmptyResponses
						isSearch={ false }
						isSingleFormView={ isSingleFormView }
						status={ statusView }
						isNotCollecting
						notCollectingEditUrl={ formEditUrl }
					/>
				</Stack>
			) : (
				<DataViews
					empty={
						<EmptyResponses
							isSearch={ !! view.search }
							isSingleFormView={ isSingleFormView }
							readStatusFilter={ readStatusFilter }
							status={ statusView }
							isNotCollecting={ isFormNotCollecting }
							notCollectingEditUrl={ formEditUrl }
						/>
					}
					data={ isQueryStale ? EMPTY_ARRAY : records || EMPTY_ARRAY }
					fields={ fields as Field< unknown >[] }
					view={ viewForDataViews }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
					isLoading={ isLoadingData || isQueryStale }
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
					<DataViews.Layout className={ answerColumnsClassName } />
					<DataViews.Footer />
				</DataViews>
			) }
			<IntegrationsModal
				isOpen={ isIntegrationsModalOpen }
				onClose={ closeIntegrationsModal }
				attributes={ undefined }
				setAttributes={ undefined }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
				context="dashboard"
			/>
		</FormsPage>
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
