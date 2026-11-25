import { speak } from '@wordpress/a11y';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { bug, funnel } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { AlertDialog, Button, EmptyState, Notice, Stack } from '@wordpress/ui';
import { CopyValueButton } from '../../components/copy-button';
import EmailTime from '../../components/email-time';
import ErrorNotice from '../../components/error-notice';
import RouteLink from '../../components/route-link';
import {
	clearDebugLog,
	errorMessage,
	fetchDebugLog,
	fetchDebugText,
	fetchStatus,
} from '../../data/api';
import { formatCount } from '../../data/dates';
import {
	DEBUG_EMAIL_PARAM,
	DEBUG_EVENT_PARAM,
	DEBUG_SETTINGS_HREF,
	entryId,
	logEntryHref,
} from '../../data/log-link';
import { cleanSearch } from '../../data/log-query';
import { retentionLabel } from '../../data/period';
import { sendStore } from '../../data/store';
import { DEBUG_PANEL_TITLE_ID, LevelBadge, areaLabels, levelLabels } from './entry-panel';
import type {
	DebugArea,
	DebugEntry,
	DebugLevel,
	DebugLogState,
	DebugPage,
	DebugQuery,
	SendStatus,
} from '../../data/types';
import type { Action, Field, Filter, Operator, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import './style.scss';

const LEVELS: DebugLevel[] = [ 'error', 'warning', 'info', 'debug' ];
const DEBUG_OFF: DebugLogState = { enabled: false, days: 7, until: null, entries: 0 };
const AREAS: DebugArea[] = [ 'sending', 'domain', 'account', 'settings', 'cleanup' ];

/** How long to wait after the filters change before fetching the text to copy, in ms. */
const TEXT_DELAY_MS = 250;

const NO_ENTRIES: DebugPage = { items: [], total: 0 };

/**
 * What the debug log says when its list fails to load.
 *
 * @return The title.
 */
const loadFailedTitle = () => __( 'The debug log didn’t load', 'jetpack-send-pkg' );

/** Column sizes, in characters so they follow the text size. */
const TABLE_LAYOUT = {
	styles: {
		level: { width: '12ch' },
		area: { width: '16ch' },
		log_id: { width: '14ch' },
		created_at: { width: '16ch' },
	},
};

/**
 * The locked filter that shows one email's entries, for links from its Technical details.
 *
 * @param email - The email's log id, or ''.
 * @return The filters.
 */
const emailFilters = ( email: string ): Filter[] =>
	email ? [ { field: 'log_id', operator: 'is', value: email, isLocked: true } ] : [];

/**
 * The view for a layout: a table, or a list at phone width so the level and time stay on screen.
 *
 * @param view - The current view.
 * @param list - Use the list layout.
 * @return The view in that layout.
 */
function inLayout( view: View, list: boolean ): View {
	const { filters, page, perPage, search } = view;
	return list
		? {
				type: 'list',
				page,
				perPage,
				search,
				filters,
				titleField: 'message',
				fields: [ 'level', 'created_at' ],
			}
		: {
				type: 'table',
				page,
				perPage,
				search,
				filters,
				titleField: 'message',
				fields: [ 'level', 'area', 'log_id', 'created_at' ],
				layout: TABLE_LAYOUT,
			};
}

/**
 * The values picked in one of the view's filters, keeping only allowed ones.
 *
 * @param view    - The view.
 * @param field   - The field.
 * @param allowed - The values allowed.
 * @return The values.
 */
function picked< T extends string >( view: View, field: string, allowed: T[] ): T[] {
	const value = view.filters?.find( filter => filter.field === field )?.value;
	return ( Array.isArray( value ) ? value : [] ).filter( ( item: unknown ): item is T =>
		allowed.includes( item as T )
	);
}

/**
 * What the screen asks the server for.
 *
 * @param view  - The view.
 * @param email - One email's log id, or ''.
 * @return The query.
 */
export function debugQuery( view: View, email: string ): DebugQuery {
	const query: DebugQuery = {
		page: view.page ?? 1,
		per_page: view.perPage ?? 50,
		search: cleanSearch( view.search ),
		level: picked( view, 'level', LEVELS ),
		area: picked( view, 'area', AREAS ),
	};
	if ( email ) {
		query.email = email;
	}
	return query;
}

/**
 * The debug log: what Jetpack Send did, step by step, while the debug log recorded. Built like the
 * Log, with "Copy for support" ready before it's clicked, since some browsers only let a page copy
 * inside the click itself.
 *
 * @param props        - Component props.
 * @param props.status - Send status.
 * @return The screen.
 */
const DebugLogScreen = ( { status }: { status: SendStatus } ) => {
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	const navigate = useNavigate();
	const { receiveStatus } = useDispatch( sendStore );
	const openId = entryId( search?.[ DEBUG_EVENT_PARAM ] );
	const openIdRef = useRef( openId );
	openIdRef.current = openId;
	const email = entryId( search?.[ DEBUG_EMAIL_PARAM ] );
	const debug = status.debug_log ?? DEBUG_OFF;

	const narrow = useViewportMatch( 'medium', '<' );
	const wide = useViewportMatch( 'wide' );
	const [ view, setView ] = useState< View >( () =>
		inLayout(
			{ type: 'table', page: 1, perPage: 50, search: '', filters: emailFilters( email ) },
			narrow
		)
	);
	useEffect( () => {
		setView( current =>
			( current.type === 'list' ) === narrow ? current : inLayout( current, narrow )
		);
	}, [ narrow ] );
	// A link to another email's entries swaps the locked filter; the tab drops it.
	useEffect( () => {
		setView( current => ( {
			...current,
			page: 1,
			filters: [
				...( current.filters ?? [] ).filter( filter => filter.field !== 'log_id' ),
				...emailFilters( email ),
			],
		} ) );
	}, [ email ] );

	const [ data, setData ] = useState< DebugPage >( NO_ENTRIES );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ reloadKey, setReloadKey ] = useState( 0 );
	// Try again reloads; `retried` counts the times that worked.
	const [ retried, setRetried ] = useState( 0 );
	const retryRef = useRef( false );
	const query = useMemo( () => debugQuery( view, email ), [ view, email ] );
	const queryKey = JSON.stringify( query );
	// A failed load shows no entries, so nothing on screen claims what the debug log holds.
	useEffect( () => {
		let cancelled = false;
		const isRetry = retryRef.current;
		retryRef.current = false;
		setIsLoading( true );
		fetchDebugLog( query )
			.then( result => {
				if ( ! cancelled ) {
					setData( result );
					setError( null );
					if ( isRetry ) {
						setRetried( count => count + 1 );
					}
				}
			} )
			.catch( e => {
				if ( cancelled ) {
					return;
				}
				const message = errorMessage( e );
				setData( NO_ENTRIES );
				setError( message );
				// The notice doesn't announce itself.
				speak(
					/* translators: 1: what didn't load, e.g. "The debug log didn’t load", 2: why. */
					sprintf( __( '%1$s. %2$s', 'jetpack-send-pkg' ), loadFailedTitle(), message ),
					'assertive'
				);
			} )
			.finally( () => ! cancelled && setIsLoading( false ) );
		return () => {
			cancelled = true;
		};
		// The key stands for the query, which is a new object each render.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ queryKey, reloadKey ] );
	const retryLoad = useCallback( () => {
		retryRef.current = true;
		setReloadKey( key => key + 1 );
	}, [] );

	// The text to copy, fetched ahead and again whenever the filters change.
	const textKey = JSON.stringify( {
		search: query.search,
		level: query.level,
		area: query.area,
		email: query.email,
	} );
	const [ copy, setCopy ] = useState< { key: string; text: string; count: number } | null >( null );
	// The text that failed to load. The button stays usable then and fetches again when clicked.
	const [ copyFailedKey, setCopyFailedKey ] = useState< string | null >( null );
	const [ textAttempt, setTextAttempt ] = useState( 0 );
	useEffect( () => {
		const controller = new AbortController();
		const timer = setTimeout( () => {
			fetchDebugText( JSON.parse( textKey ), { signal: controller.signal } )
				.then( result => setCopy( { key: textKey, ...result } ) )
				.catch( () => ! controller.signal.aborted && setCopyFailedKey( textKey ) );
		}, TEXT_DELAY_MS );
		return () => {
			clearTimeout( timer );
			controller.abort();
		};
	}, [ textKey, reloadKey, textAttempt ] );
	const copyReady = copy?.key === textKey;
	const copyFailed = ! copyReady && copyFailedKey === textKey;
	const retryText = useCallback( () => setTextAttempt( count => count + 1 ), [] );

	const closePanel = useCallback(
		( replace = false ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ DEBUG_EVENT_PARAM ]: undefined,
				} ),
				replace,
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);
	const openEntry = useCallback(
		( item: DebugEntry ) => {
			if ( item.id === openIdRef.current ) {
				document.getElementById( DEBUG_PANEL_TITLE_ID )?.focus();
				return;
			}
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					// A number, as the router parses `event=12`, so the address doesn't quote it.
					[ DEBUG_EVENT_PARAM ]: /^\d+$/.test( item.id ) ? Number( item.id ) : item.id,
				} ),
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	// Closing the panel returns focus to its row, unless focus has already moved somewhere else.
	const containerRef = useRef< HTMLDivElement >( null );
	const lastOpenRef = useRef( openId );
	useEffect( () => {
		const closed = lastOpenRef.current;
		lastOpenRef.current = openId;
		if ( ! closed || openId ) {
			return;
		}
		const frame = window.requestAnimationFrame( () => {
			const doc = containerRef.current?.ownerDocument;
			const active = doc?.activeElement;
			if ( ! doc || ( active && active !== doc.body && doc.contains( active ) ) ) {
				return;
			}
			const marker = Array.from(
				containerRef.current?.querySelectorAll< HTMLElement >( '[data-debug-id]' ) ?? []
			).find( element => element.dataset.debugId === closed );
			const target =
				marker?.closest< HTMLElement >( '[role="button"], button' ) ??
				marker
					?.closest< HTMLElement >( '[role="row"]' )
					?.querySelector< HTMLElement >( '.dataviews-view-list__item' );
			target?.focus();
		} );
		return () => window.cancelAnimationFrame( frame );
	}, [ openId ] );

	const fields = useMemo< Field< DebugEntry >[] >(
		() => [
			{
				id: 'message',
				label: __( 'Event', 'jetpack-send-pkg' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) => item.message,
				render: ( { item } ) => (
					<span
						className="jetpack-send-debug__message"
						data-debug-id={ item.id }
						data-open={ item.id === openId ? 'true' : undefined }
					>
						{ item.message }
					</span>
				),
			},
			{
				id: 'level',
				label: __( 'Level', 'jetpack-send-pkg' ),
				enableSorting: false,
				elements: LEVELS.map( value => ( { value, label: levelLabels()[ value ] } ) ),
				// Always-on chips, as the Log's Status and Source.
				filterBy: { operators: [ 'isAny' ] as Operator[], isPrimary: true },
				render: ( { item } ) => <LevelBadge level={ item.level } />,
			},
			{
				id: 'area',
				label: __( 'Area', 'jetpack-send-pkg' ),
				enableSorting: false,
				elements: AREAS.map( value => ( { value, label: areaLabels()[ value ] } ) ),
				filterBy: { operators: [ 'isAny' ] as Operator[], isPrimary: true },
				render: ( { item } ) => areaLabels()[ item.area ] ?? item.area,
			},
			{
				id: 'log_id',
				label: __( 'Email', 'jetpack-send-pkg' ),
				enableSorting: false,
				// Only a link's own email, locked: there's never a box to type an id into.
				...( email
					? {
							elements: [ { value: email, label: __( 'This email', 'jetpack-send-pkg' ) } ],
							filterBy: { operators: [ 'is' ] as Operator[] },
						}
					: { filterBy: false as const } ),
				render: ( { item } ) =>
					item.log_id ? (
						<RouteLink href={ logEntryHref( item.log_id ) }>
							{ __( 'Open email', 'jetpack-send-pkg' ) }
						</RouteLink>
					) : null,
			},
			{
				id: 'created_at',
				label: __( 'Time', 'jetpack-send-pkg' ),
				enableSorting: false,
				filterBy: false,
				render: ( { item } ) => <EmailTime createdAt={ item.created_at } />,
			},
		],
		[ openId, email ]
	);
	const actions = useMemo< Action< DebugEntry >[] >(
		() => [
			{
				id: 'view',
				label: __( 'View', 'jetpack-send-pkg' ),
				isPrimary: true,
				callback: ( [ item ]: DebugEntry[] ) => openEntry( item ),
			},
		],
		[ openEntry ]
	);
	const getItemId = useCallback( ( item: DebugEntry ) => item.id, [] );
	const isItemClickable = useCallback( () => true, [] );
	// The list layout has no row click of its own: a tap selects the row, so open it instead.
	const onChangeSelection = useCallback(
		( ids: string[] ) => {
			const item = ids.length === 1 && data.items.find( row => row.id === ids[ 0 ] );
			if ( item ) {
				openEntry( item );
			}
		},
		[ data.items, openEntry ]
	);
	// Beside the panel the table keeps the level and time from 1280 up; below that, as on the Log,
	// only the event fits, and the panel shows the rest.
	const shownView = useMemo(
		() =>
			openId && ! narrow && view.type === 'table'
				? { ...view, fields: wide ? [ 'level', 'created_at' ] : [] }
				: view,
		[ openId, narrow, wide, view ]
	);
	const onChangeView = useCallback(
		( next: View ) =>
			setView( current =>
				shownView !== current && next.type === current.type
					? { ...next, fields: current.fields }
					: next
			),
		[ shownView ]
	);
	// As on the Log: the button leaves with the empty state, so focus waits in the search box.
	const findRef = useRef< HTMLDivElement >( null );
	const resetFilters = useCallback( () => {
		setView( current => ( {
			...current,
			page: 1,
			search: '',
			filters: current.filters?.filter( filter => filter.isLocked ) ?? [],
		} ) );
		window.requestAnimationFrame( () =>
			findRef.current?.querySelector< HTMLInputElement >( '.dataviews-search input' )?.focus()
		);
	}, [] );
	// Try again leaves with the error notice once the entries load, so focus goes to the search box too.
	useEffect( () => {
		if ( ! retried ) {
			return;
		}
		const frame = window.requestAnimationFrame( () =>
			findRef.current?.querySelector< HTMLInputElement >( '.dataviews-search input' )?.focus()
		);
		return () => window.cancelAnimationFrame( frame );
	}, [ retried ] );
	const toSettings = useCallback( () => navigate( { href: DEBUG_SETTINGS_HREF } ), [ navigate ] );

	const [ confirmClear, setConfirmClear ] = useState( false );
	const openClear = useCallback( () => setConfirmClear( true ), [] );
	const onClear = useCallback( async () => {
		let deleted: number;
		try {
			( { deleted } = await clearDebugLog() );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
		if ( openIdRef.current ) {
			closePanel( true );
		}
		speak(
			sprintf(
				/* translators: %s: number of entries. */
				_n( 'Cleared %s entry.', 'Cleared %s entries.', deleted, 'jetpack-send-pkg' ),
				formatCount( deleted )
			)
		);
		setReloadKey( key => key + 1 );
		// Settings shows the count, so the store's status reads it again.
		fetchStatus()
			.then( receiveStatus )
			.catch( () => undefined );
	}, [ closePanel, receiveStatus ] );

	const filtered = !! ( query.search || query.level?.length || query.area?.length );
	// Unfiltered, the page's total is the freshest count; filtered, the status has the whole log's.
	const entries = filtered || email ? Math.max( debug.entries, data.total ) : data.total;
	const hasEntries = data.total > 0 || debug.entries > 0;
	// The dialog keeps its words while it closes.
	const clearCount = useRef( 0 );
	if ( confirmClear ) {
		clearCount.current = entries;
	}

	let empty: ReactNode = (
		<EmptyState.Root className="jetpack-send-debug__empty">
			<EmptyState.Icon icon={ bug } />
			<EmptyState.Title>{ __( 'The debug log is off', 'jetpack-send-pkg' ) }</EmptyState.Title>
			<EmptyState.Description>
				{ __(
					'Turn it on in Settings when you need to find a problem. It turns itself off after the time you pick.',
					'jetpack-send-pkg'
				) }
			</EmptyState.Description>
			<EmptyState.Actions>
				<Button variant="outline" tone="neutral" onClick={ toSettings }>
					{ __( 'Open Settings', 'jetpack-send-pkg' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
	if ( error ) {
		// While the entries haven't loaded, the error notice says so and no empty state guesses why.
		empty = null;
	} else if ( filtered || email ) {
		empty = (
			<EmptyState.Root className="jetpack-send-debug__empty">
				<EmptyState.Icon icon={ funnel } />
				<EmptyState.Title>{ __( 'No entries match', 'jetpack-send-pkg' ) }</EmptyState.Title>
				{ filtered && (
					<EmptyState.Actions>
						<Button variant="outline" tone="neutral" onClick={ resetFilters }>
							{ __( 'Reset filters', 'jetpack-send-pkg' ) }
						</Button>
					</EmptyState.Actions>
				) }
			</EmptyState.Root>
		);
	} else if ( debug.enabled ) {
		empty = (
			<EmptyState.Root className="jetpack-send-debug__empty">
				<EmptyState.Icon icon={ bug } />
				<EmptyState.Title>{ __( 'Nothing recorded yet', 'jetpack-send-pkg' ) }</EmptyState.Title>
				<EmptyState.Description>
					{ __( 'Entries show up as your site sends email.', 'jetpack-send-pkg' ) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	return (
		<div
			className={ `jetpack-send-debug${ openId ? ' jetpack-send-has-panel' : '' }` }
			ref={ containerRef }
		>
			{ error && (
				<div className="jetpack-send-debug__notice">
					<ErrorNotice
						title={ loadFailedTitle() }
						message={ error }
						onRetry={ retryLoad }
						retrying={ isLoading }
					/>
				</div>
			) }
			{ ! error && ! debug.enabled && hasEntries && (
				<div className="jetpack-send-debug__notice">
					<Notice.Root intent="info">
						<Notice.Description>
							{ sprintf(
								/* translators: %s: how long entries are kept, e.g. "1 week". */
								__(
									'The debug log is off, so nothing new is recorded. These entries are deleted %s after they were recorded.',
									'jetpack-send-pkg'
								),
								retentionLabel( debug.days )
							) }
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionButton variant="outline" onClick={ toSettings }>
								{ __( 'Turn it on', 'jetpack-send-pkg' ) }
							</Notice.ActionButton>
						</Notice.Actions>
					</Notice.Root>
				</div>
			) }
			<DataViews
				data={ data.items }
				fields={ fields }
				view={ shownView }
				onChangeView={ onChangeView }
				actions={ actions }
				onChangeSelection={ onChangeSelection }
				paginationInfo={ {
					totalItems: data.total,
					totalPages: Math.max( 1, Math.ceil( data.total / ( view.perPage ?? 50 ) ) ),
				} }
				isLoading={ isLoading }
				getItemId={ getItemId }
				isItemClickable={ isItemClickable }
				onClickItem={ openEntry }
				defaultLayouts={ { table: {}, list: {} } }
				empty={ empty }
			>
				{ /* As the Log: search and the always-on chips start the row; the tools end it. */ }
				<Stack
					direction="row"
					justify="space-between"
					align="flex-end"
					gap="md"
					className="dataviews__view-actions jetpack-send-debug__toolbar"
				>
					<div className="jetpack-send-debug__find" ref={ findRef }>
						<Stack direction="row" align="center" gap="sm" wrap="wrap">
							<DataViews.Search label={ __( 'Search entries', 'jetpack-send-pkg' ) } />
							<DataViews.Filters />
						</Stack>
					</div>
					<Stack direction="row" align="center" gap="xs" className="jetpack-send-debug__tools">
						{ /* Nothing to copy or clear yet, or while the entries didn't load. */ }
						{ hasEntries && ! error && (
							<CopyValueButton
								text={ copyReady ? copy.text : '' }
								label={ __( 'Copy for support', 'jetpack-send-pkg' ) }
								announcement={ sprintf(
									/* translators: %s: number of entries. */
									_n(
										'Copied %s entry.',
										'Copied %s entries.',
										copy?.count ?? 0,
										'jetpack-send-pkg'
									),
									formatCount( copy?.count ?? 0 )
								) }
								loading={ ! copyReady && ! copyFailed }
								unavailable={
									copyFailed
										? __(
												'Couldn’t get the entries to copy, so nothing was copied. Try again in a moment.',
												'jetpack-send-pkg'
											)
										: undefined
								}
								onUnavailable={ retryText }
							>
								{ __( 'Copy for support', 'jetpack-send-pkg' ) }
							</CopyValueButton>
						) }
						{ hasEntries && ! error && (
							<Button variant="minimal" tone="neutral" size="compact" onClick={ openClear }>
								{ __( 'Clear…', 'jetpack-send-pkg' ) }
							</Button>
						) }
						<DataViews.ViewConfig />
					</Stack>
				</Stack>
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
			<AlertDialog.Root
				open={ confirmClear }
				onOpenChange={ setConfirmClear }
				onConfirm={ onClear }
			>
				<AlertDialog.Popup
					intent="irreversible"
					title={ sprintf(
						/* translators: %s: number of entries. */
						_n(
							'Clear all %s entry?',
							'Clear all %s entries?',
							clearCount.current,
							'jetpack-send-pkg'
						),
						formatCount( clearCount.current )
					) }
					description={ __( 'This can’t be undone.', 'jetpack-send-pkg' ) }
					confirmButtonText={ __( 'Clear', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</div>
	);
};

export default DebugLogScreen;
