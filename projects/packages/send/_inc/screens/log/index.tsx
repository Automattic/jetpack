import { speak } from '@wordpress/a11y';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { envelope, funnel, search as searchIcon, trash } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { AlertDialog, Button, EmptyState, Notice, Stack, Text } from '@wordpress/ui';
import Avatar from '../../components/avatar';
import DateRangeControl from '../../components/date-range-control';
import { EmailTime } from '../../components/email-time';
import ErrorNotice from '../../components/error-notice';
import { ResentBadge } from '../../components/resent-badge';
import RouteLink from '../../components/route-link';
import {
	deleteLogEntries,
	errorMessage,
	fetchLog,
	fetchLogEntry,
	getOriginOptions,
} from '../../data/api';
import { addDays, dayLabel, siteToday } from '../../data/dates';
import { failureSummary } from '../../data/failure-reasons';
import { EMAIL_LOG_SETTINGS_HREF, LOG_ENTRY_PARAM, entryId } from '../../data/log-link';
import { cleanSearch, logQueryArgs, viewToQuery } from '../../data/log-query';
import {
	coversFromDay,
	parsePeriod,
	periodPhrase,
	presetsWithin,
	retentionLabel,
	retentionSentence,
} from '../../data/period';
import { sendStore, useLogVersion, useSendStatus } from '../../data/store';
import { OriginIcon } from '../overview/dashboard/list-icons';
import { PANEL_TITLE_ID } from './email-preview';
import { LANDING_PARAMS, searchFromView, urlKey, viewFromSearch } from './log-url';
import StatusBadge, { statusLabels } from './status-badge';
import TestBadge from './test-badge';
import type { LogPage, LogRow, LogSource, Period } from '../../data/types';
import type { Action, Field, Operator, View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import './style.scss';

const NO_EMAILS: LogPage = { items: [], total: 0 };

/**
 * What the Log says when its list fails to load.
 *
 * @return The title.
 */
const loadFailedTitle = () => __( 'The log didn’t load', 'jetpack-send-pkg' );

const sourceLabels = (): Record< LogSource, string > => ( {
	wp_mail: __( 'Site emails', 'jetpack-send-pkg' ),
	test: __( 'Tests', 'jetpack-send-pkg' ),
	resend: __( 'Resends', 'jetpack-send-pkg' ),
} );

type Navigate = ReturnType< typeof useNavigate >;

/**
 * Tidy the address after landing: drop the landing params, top-level (email links) and inside the
 * `p` route, turn an older `days` into the period it means, and move an email link's top-level
 * `entry` into the route, where the panel reads it. The route changes through the router without a
 * view transition: a raw replaceState would start a second transition mid-navigation and the first
 * would fail with an uncaught error.
 *
 * @param navigate - The router's navigate.
 * @param search   - The route's search params.
 */
function tidyLandingParams( navigate: Navigate, search: Record< string, unknown > | undefined ) {
	const url = new URL( window.location.href );
	const coldEntry = entryId( url.searchParams.get( LOG_ENTRY_PARAM ) );
	const topLevel = [ LOG_ENTRY_PARAM, ...LANDING_PARAMS ];
	// Email links open the page cold, with no transition running, so the address can change directly.
	if ( topLevel.some( param => url.searchParams.has( param ) ) ) {
		topLevel.forEach( param => url.searchParams.delete( param ) );
		window.history.replaceState( window.history.state, '', url.href );
	}
	const routeEntry = entryId( search?.[ LOG_ENTRY_PARAM ] );
	const moveEntry = !! coldEntry && ! routeEntry;
	if ( ! moveEntry && ! LANDING_PARAMS.some( param => search?.[ param ] !== undefined ) ) {
		return;
	}
	navigate( {
		search: ( prev: Record< string, unknown > ) => ( {
			...prev,
			...searchFromView(
				viewFromSearch( search ),
				parsePeriod( search, null ),
				routeEntry || coldEntry
			),
		} ),
		replace: true,
		viewTransition: false,
	} as Parameters< Navigate >[ 0 ] );
}

type SubjectProps = { item: LogRow; open: boolean };

const Subject = ( { item, open }: SubjectProps ) => (
	<span
		className="jetpack-send-log__subject"
		data-log-id={ item.id }
		data-open={ open ? 'true' : undefined }
	>
		<span className="jetpack-send-log__subject-text">
			{ item.subject || __( '(No subject)', 'jetpack-send-pkg' ) }
		</span>
		{ item.source === 'test' && <TestBadge className="jetpack-send-log__badge" /> }
		{ item.source === 'resend' && <ResentBadge className="jetpack-send-log__badge" /> }
	</span>
);

/**
 * The first recipient's avatar beside who the email went to, as in Recent emails.
 *
 * @param props      - Component props.
 * @param props.item - The row.
 * @return The cell.
 */
const Recipients = ( { item }: { item: LogRow } ) => (
	<span className="jetpack-send-log__recipients">
		<Avatar name={ item.recipients } url={ item.avatar_url } />
		<span className="jetpack-send-log__recipients-text" title={ item.recipients }>
			{ item.recipients }
		</span>
	</span>
);

/**
 * The plugin, theme or kind of WordPress email that sent it, with its icon, as What sends the most.
 *
 * @param props      - Component props.
 * @param props.item - The row.
 * @return The cell, or nothing for tests and older rows.
 */
const Origin = ( { item }: { item: LogRow } ) =>
	item.origin && item.origin_label ? (
		<span className="jetpack-send-log__origin">
			<OriginIcon
				originKey={ item.origin }
				label={ item.origin_label }
				url={ item.origin_icon_url }
			/>
			<span className="jetpack-send-log__origin-text" title={ item.origin_label }>
				{ item.origin_label }
			</span>
		</span>
	) : null;

/** Column sizes that hold whatever the filters show, in characters so they follow the text size. */
const TABLE_LAYOUT = {
	styles: {
		recipients: { width: '32%', minWidth: '18ch' },
		origin: { width: '22ch' },
		status: { width: '18ch' },
		created_at: { width: '16ch' },
	},
};

/**
 * The table beside the side panel: who it went to moves under the subject, and below 1280 only the
 * subject is left, as on Newsletter › Subscribers.
 *
 * @param view - The view the person chose.
 * @param wide - The window is at least 1280 wide.
 * @return The view to show.
 */
function besidePanel( view: View, wide: boolean ): View {
	return view.type === 'table'
		? {
				...view,
				descriptionField: 'recipients',
				fields: wide ? [ 'status', 'created_at' ] : [],
			}
		: view;
}

/**
 * The view for a layout: a table, or a list at phone width so the status and date stay on screen.
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
				titleField: 'subject',
				descriptionField: 'recipients',
				fields: [ 'status', 'created_at' ],
			}
		: {
				type: 'table',
				page,
				perPage,
				search,
				filters,
				titleField: 'subject',
				fields: [ 'recipients', 'status', 'created_at' ],
				layout: TABLE_LAYOUT,
			};
}

/**
 * What the delete confirmation says, for one email or several.
 *
 * @param count - Emails to delete.
 * @return Title, description and the confirm button's text.
 */
export function deleteCopy( count: number ) {
	if ( count === 1 ) {
		return {
			title: __( 'Delete this email from the log?', 'jetpack-send-pkg' ),
			description: __(
				'This can’t be undone, and it doesn’t unsend the email. Your dashboard numbers stay.',
				'jetpack-send-pkg'
			),
			confirm: __( 'Delete', 'jetpack-send-pkg' ),
		};
	}
	return {
		title: sprintf(
			/* translators: %d: number of emails. */
			_n(
				'Delete %d email from the log?',
				'Delete %d emails from the log?',
				count,
				'jetpack-send-pkg'
			),
			count
		),
		description: __(
			'This can’t be undone, and it doesn’t unsend them. Your dashboard numbers stay.',
			'jetpack-send-pkg'
		),
		confirm: sprintf(
			/* translators: %d: number of emails. */
			_n( 'Delete %d email', 'Delete %d emails', count, 'jetpack-send-pkg' ),
			count
		),
	};
}

/**
 * The first site-local day a period covers; the last 24 hours reach into yesterday.
 *
 * @param period - The period.
 * @param today  - Site-local today.
 * @return `Y-m-d`.
 */
function periodStartDay( period: Period, today: string ): string {
	if ( ! ( 'range' in period ) ) {
		return period.start;
	}
	return addDays( today, period.range === 1 ? -1 : 1 - period.range );
}

const LogScreen = () => {
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	const navigate = useNavigate();
	// The email open in the side panel.
	const openId = entryId( search?.[ LOG_ENTRY_PARAM ] );
	const openIdRef = useRef( openId );
	openIdRef.current = openId;

	// The address holds the search, filters and period; the Log follows it whenever it changes.
	const fromAddress = useMemo(
		() => ( { ...viewFromSearch( search ), period: parsePeriod( search, null ) } ),
		[ search ]
	);
	const addressKey = urlKey( fromAddress, fromAddress.period );

	const narrow = useViewportMatch( 'medium', '<' );
	const wide = useViewportMatch( 'wide' );
	const [ view, setView ] = useState< View >( () =>
		inLayout(
			{
				type: 'table',
				page: 1,
				perPage: 20,
				search: fromAddress.search,
				filters: fromAddress.filters,
			},
			narrow
		)
	);
	const [ period, setPeriod ] = useState< Period | null >( fromAddress.period );
	const viewRef = useRef( view );
	viewRef.current = view;
	const periodRef = useRef( period );
	periodRef.current = period;
	// The last address the Log wrote or read, so its own writes aren't read back as changes.
	const writtenKey = useRef( addressKey );
	useEffect( () => {
		if ( addressKey === writtenKey.current ) {
			return;
		}
		writtenKey.current = addressKey;
		setView( current => ( {
			...current,
			page: 1,
			search: fromAddress.search,
			filters: fromAddress.filters,
		} ) );
		setPeriod( fromAddress.period );
	}, [ addressKey, fromAddress ] );
	useEffect( () => {
		setView( current =>
			( current.type === 'list' ) === narrow ? current : inLayout( current, narrow )
		);
	}, [ narrow ] );

	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ pendingDelete, setPendingDelete ] = useState< LogRow[] >( [] );
	const [ deletedNotice, setDeletedNotice ] = useState< string | null >( null );
	const [ landingGone, setLandingGone ] = useState( false );
	const [ trimmedDismissed, setTrimmedDismissed ] = useState( false );
	const [ searchNoticeDismissedFor, setSearchNoticeDismissedFor ] = useState< string | null >(
		null
	);
	const { logChanged, receiveLogRows, requestLogDelete } = useDispatch( sendStore );
	const logVersion = useLogVersion();
	const [ data, setData ] = useState< LogPage >( NO_EMAILS );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	// Try again loads the same query again; `retried` counts the times that worked.
	const [ attempt, setAttempt ] = useState( 0 );
	const [ retried, setRetried ] = useState( 0 );
	const retryRef = useRef( false );
	// The open email when it isn't on this page, shown above the table.
	const [ pinned, setPinned ] = useState< LogRow | null >( null );
	const pinTriedRef = useRef< string | null >( null );
	const mountedRef = useRef( true );
	useEffect( () => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, [] );
	const containerRef = useRef< HTMLDivElement >( null );
	// After a delete, focus goes to the row that took the first deleted row's place once the page reloads.
	const focusAfterDelete = useRef< number | null >( null );
	const deletedNoticeRef = useRef< HTMLDivElement >( null );

	const { status } = useSendStatus();
	const domain = status?.account?.domain ?? '';
	const devMode = status?.provisioner === 'local';
	const retentionDays = status?.log_retention_days ?? 30;
	const retentionLocked = !! status?.log_retention_locked;

	const query = viewToQuery( view, period );
	const queryKey = JSON.stringify( logQueryArgs( query ) );
	const queryRef = useRef( query );
	queryRef.current = query;
	const searchText = cleanSearch( view.search );
	const isFiltered = !! (
		searchText ||
		period ||
		query.status?.length ||
		query.origin?.length ||
		query.source?.length
	);

	useEffect( () => {
		tidyLandingParams( navigate, search );
	}, [ navigate, search ] );

	/**
	 * Put the list's search, filters and period in the address, replacing the current entry, so
	 * reload and a copied link keep them; an open panel stays open.
	 */
	const writeAddress = useCallback(
		( nextView: View, nextPeriod: Period | null ) => {
			const key = urlKey( nextView, nextPeriod );
			if ( key === writtenKey.current ) {
				return;
			}
			writtenKey.current = key;
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					...searchFromView( nextView, nextPeriod, openIdRef.current ),
				} ),
				replace: true,
				viewTransition: false,
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	const closePanel = useCallback(
		( replace = false ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ LOG_ENTRY_PARAM ]: undefined,
				} ),
				replace,
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);

	// Each change of query cancels the last request, so a stale search never lands; an abort isn't an error.
	// A failed load shows no rows, so nothing on screen claims what the log holds.
	useEffect( () => {
		const controller = new AbortController();
		const isRetry = retryRef.current;
		retryRef.current = false;
		setIsLoading( true );
		fetchLog( queryRef.current, { signal: controller.signal } )
			.then( result => {
				if ( ! controller.signal.aborted ) {
					setData( result );
					setError( null );
					if ( isRetry ) {
						setRetried( count => count + 1 );
					}
				}
			} )
			.catch( e => {
				if ( controller.signal.aborted ) {
					return;
				}
				const message = errorMessage( e );
				setData( NO_EMAILS );
				setError( message );
				// The notice doesn't announce itself.
				speak(
					/* translators: 1: what didn't load, e.g. "The log didn’t load", 2: why. */
					sprintf( __( '%1$s. %2$s', 'jetpack-send-pkg' ), loadFailedTitle(), message ),
					'assertive'
				);
			} )
			.finally( () => ! controller.signal.aborted && setIsLoading( false ) );
		return () => controller.abort();
	}, [ queryKey, logVersion, attempt ] );
	const retryLoad = useCallback( () => {
		retryRef.current = true;
		setAttempt( count => count + 1 );
	}, [] );

	// The side panel shows a listed row at once, before its full entry loads.
	const listedRef = useRef( new Set< string >() );
	useEffect( () => {
		data.items.forEach( item => listedRef.current.add( item.id ) );
		if ( data.items.length ) {
			receiveLogRows( data.items );
		}
	}, [ data.items, receiveLogRows ] );

	// A link to an email the list hasn't shown (not on this page) fetches it and pins it above the table.
	useEffect( () => {
		if (
			! openId ||
			isLoading ||
			error ||
			pinned?.id === openId ||
			pinTriedRef.current === openId ||
			listedRef.current.has( openId )
		) {
			return;
		}
		pinTriedRef.current = openId;
		fetchLogEntry( openId )
			.then( entry => {
				if ( mountedRef.current && openIdRef.current === entry.id ) {
					setPinned( entry );
				}
			} )
			.catch( () => {
				if ( mountedRef.current && openIdRef.current === openId ) {
					setLandingGone( true );
					closePanel( true );
				}
			} );
	}, [ openId, isLoading, error, data, pinned, closePanel ] );

	// Closing the panel returns focus to its row, unless focus has already moved somewhere else.
	const lastOpenRef = useRef( openId );
	useEffect( () => {
		const closed = lastOpenRef.current;
		lastOpenRef.current = openId;
		if ( ! closed || openId || focusAfterDelete.current !== null ) {
			return;
		}
		const frame = window.requestAnimationFrame( () => {
			const doc = containerRef.current?.ownerDocument;
			const active = doc?.activeElement;
			if ( ! doc || ( active && active !== doc.body && doc.contains( active ) ) ) {
				return;
			}
			const marker = Array.from(
				containerRef.current?.querySelectorAll< HTMLElement >( '[data-log-id]' ) ?? []
			).find( element => element.dataset.logId === closed );
			// The table's title is the button; in the list layout the row's button sits beside it.
			const target =
				marker?.closest< HTMLElement >( '[role="button"], button' ) ??
				marker
					?.closest< HTMLElement >( '[role="row"]' )
					?.querySelector< HTMLElement >( '.dataviews-view-list__item' );
			target?.focus();
		} );
		return () => window.cancelAnimationFrame( frame );
	}, [ openId ] );

	const fields = useMemo< Field< LogRow >[] >(
		() => [
			{
				id: 'subject',
				label: __( 'Subject', 'jetpack-send-pkg' ),
				enableSorting: false,
				enableHiding: false,
				getValue: ( { item } ) => item.subject || __( '(No subject)', 'jetpack-send-pkg' ),
				render: ( { item } ) => <Subject item={ item } open={ item.id === openId } />,
			},
			{
				id: 'recipients',
				label: __( 'Recipients', 'jetpack-send-pkg' ),
				enableSorting: false,
				render: ( { item } ) => <Recipients item={ item } />,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-send-pkg' ),
				enableSorting: false,
				elements: Object.entries( statusLabels() ).map( ( [ value, label ] ) => ( {
					value,
					label,
				} ) ),
				filterBy: { operators: [ 'isAny' ] as Operator[], isPrimary: true },
				// Plain words in the tooltip; the service's own text stays in the panel's technical details.
				render: ( { item } ) => (
					<StatusBadge
						status={ item.status }
						error={
							item.status !== 'sent' && ( item.error || item.reason )
								? failureSummary( item, domain, {
										devMode,
										plugin: item.origin_label || undefined,
									} )
								: ''
						}
					/>
				),
			},
			{
				id: 'origin',
				label: __( 'Source', 'jetpack-send-pkg' ),
				enableSorting: false,
				// One function for the page, so DataViews loads the options once.
				getElements: getOriginOptions,
				filterBy: { operators: [ 'isAny' ] as Operator[], isPrimary: true },
				render: ( { item } ) => <Origin item={ item } />,
			},
			{
				id: 'source',
				label: __( 'Type', 'jetpack-send-pkg' ),
				enableSorting: false,
				// A filter only: its labels are plural, so it never becomes a column.
				enableHiding: false,
				elements: Object.entries( sourceLabels() ).map( ( [ value, label ] ) => ( {
					value,
					label,
				} ) ),
				filterBy: { operators: [ 'isAny' ] as Operator[] },
				render: ( { item } ) => sourceLabels()[ item.source ] ?? '',
			},
			{
				id: 'created_at',
				label: __( 'Date', 'jetpack-send-pkg' ),
				type: 'datetime',
				enableSorting: false,
				// The date control beside the search filters by date, so DataViews' own is off.
				filterBy: false,
				render: ( { item } ) => <EmailTime createdAt={ item.created_at } />,
			},
		],
		[ openId, domain, devMode ]
	);

	const openEntry = useCallback(
		( item: LogRow ) => {
			if ( item.id === openIdRef.current ) {
				document.getElementById( PANEL_TITLE_ID )?.focus();
				return;
			}
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					// A number, as `/log?entry=12` parses, so the address doesn't quote it.
					[ LOG_ENTRY_PARAM ]: /^\d+$/.test( item.id ) ? Number( item.id ) : item.id,
				} ),
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	const actions = useMemo< Action< LogRow >[] >(
		() => [
			{
				id: 'view',
				label: __( 'View', 'jetpack-send-pkg' ),
				isPrimary: true,
				callback: ( [ item ]: LogRow[] ) => openEntry( item ),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'jetpack-send-pkg' ),
				icon: trash,
				supportsBulk: true,
				callback: ( items: LogRow[] ) => setPendingDelete( items ),
			},
		],
		[ openEntry ]
	);

	const getItemId = useCallback( ( item: LogRow ) => item.id, [] );
	const isItemClickable = useCallback( () => true, [] );
	const openPinned = useCallback( () => pinned && openEntry( pinned ), [ pinned, openEntry ] );
	// The list layout has no row click of its own: a tap selects the row, so open it instead.
	const onChangeSelection = useCallback(
		( ids: string[] ) => {
			const item =
				view.type === 'list' && ids.length === 1 && data.items.find( row => row.id === ids[ 0 ] );
			if ( item ) {
				openEntry( item );
				setSelection( [] );
				return;
			}
			setSelection( ids );
		},
		[ view.type, data.items, openEntry ]
	);
	const dismissDeleted = useCallback( () => setDeletedNotice( null ), [] );
	const dismissGone = useCallback( () => setLandingGone( false ), [] );
	const dismissTrimmed = useCallback( () => setTrimmedDismissed( true ), [] );

	/**
	 * Change the list and its address together.
	 *
	 * @param nextView   - The new view.
	 * @param nextPeriod - The new period.
	 */
	const applyChange = useCallback(
		( nextView: View, nextPeriod: Period | null ) => {
			setView( nextView );
			setPeriod( nextPeriod );
			writeAddress( nextView, nextPeriod );
		},
		[ writeAddress ]
	);
	// The empty state's buttons leave with it once the rows come back, so focus goes to the search
	// box, which stays, rather than falling to the page.
	const findRef = useRef< HTMLDivElement >( null );
	const focusSearch = useCallback( () => {
		window.requestAnimationFrame( () =>
			findRef.current?.querySelector< HTMLInputElement >( '.dataviews-search input' )?.focus()
		);
	}, [] );
	const resetFilters = useCallback( () => {
		applyChange( { ...viewRef.current, page: 1, search: '', filters: [] }, null );
		focusSearch();
	}, [ applyChange, focusSearch ] );
	const clearSearch = useCallback( () => {
		applyChange( { ...viewRef.current, page: 1, search: '' }, periodRef.current );
		focusSearch();
	}, [ applyChange, focusSearch ] );
	const searchAllDates = useCallback( () => {
		applyChange( { ...viewRef.current, page: 1 }, null );
		focusSearch();
	}, [ applyChange, focusSearch ] );
	// Try again leaves with the error notice once the list loads, so focus goes to the search box too.
	useEffect( () => {
		if ( retried ) {
			focusSearch();
		}
	}, [ retried, focusSearch ] );
	const onPeriodChange = useCallback(
		( next: Period | null ) => applyChange( { ...viewRef.current, page: 1 }, next ),
		[ applyChange ]
	);

	// DataViews' Reset clears search and filters, giving the same view as removing the last chip;
	// a click noted on its way down tells them apart, so a real Reset clears the date too.
	const resetAllRef = useRef( false );
	useEffect( () => {
		const find = findRef.current;
		if ( ! find ) {
			return;
		}
		const noteResetClick = ( event: Event ) => {
			const reset = ( event.target as Element | null )?.closest?.< HTMLButtonElement >(
				'.dataviews-filters__reset-button'
			);
			if ( reset && ! reset.disabled && reset.getAttribute( 'aria-disabled' ) !== 'true' ) {
				resetAllRef.current = true;
				setTimeout( () => {
					resetAllRef.current = false;
				} );
			}
		};
		find.addEventListener( 'click', noteResetClick, true );
		return () => find.removeEventListener( 'click', noteResetClick, true );
	}, [] );

	// Beside the panel the table drops columns, so changes made there keep the person's own columns.
	const shownView = useMemo(
		() => ( openId && ! narrow ? besidePanel( view, wide ) : view ),
		[ openId, narrow, view, wide ]
	);
	const besideTable = shownView !== view;
	const onChangeView = useCallback(
		( next: View ) => {
			const current = viewRef.current;
			const resetAll = resetAllRef.current;
			resetAllRef.current = false;
			applyChange(
				besideTable && next.type === current.type
					? { ...next, fields: current.fields, descriptionField: current.descriptionField }
					: next,
				resetAll ? null : periodRef.current
			);
		},
		[ besideTable, applyChange ]
	);

	// The panel's Delete asks here, so it gets the same warning, notice and focus as a row's.
	const deleteRequest = useSelect( select => select( sendStore ).getLogDeleteRequest(), [] );
	useEffect( () => {
		if ( deleteRequest ) {
			setPendingDelete( [ deleteRequest ] );
			requestLogDelete( null );
		}
	}, [ deleteRequest, requestLogDelete ] );
	const onDeleteOpenChange = useCallback(
		( isOpen: boolean ) => ! isOpen && setPendingDelete( [] ),
		[]
	);
	const confirmDelete = useCallback( async () => {
		let deleted: string[];
		try {
			( { deleted } = await deleteLogEntries( pendingDelete.map( item => item.id ) ) );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
		const gone = new Set( [ ...deleted, ...pendingDelete.map( item => item.id ) ] );
		focusAfterDelete.current = Math.max(
			0,
			data.items.findIndex( item => gone.has( item.id ) )
		);
		setSelection( current => current.filter( id => ! gone.has( id ) ) );
		if ( openIdRef.current && gone.has( openIdRef.current ) ) {
			closePanel( true );
		}
		if ( pinned && gone.has( pinned.id ) ) {
			setPinned( null );
		}
		const message = sprintf(
			/* translators: %d: number of emails deleted. */
			_n( '%d email deleted.', '%d emails deleted.', deleted.length, 'jetpack-send-pkg' ),
			deleted.length
		);
		setDeletedNotice( message );
		speak( message );
		// Reloads this list, the Overview's lists and the Source filter's options.
		logChanged();
	}, [ pendingDelete, pinned, logChanged, data.items, closePanel ] );
	// A cancelled delete returns focus to where it was; a confirmed one is handled below.
	const deleteFinalFocus = useCallback( () => focusAfterDelete.current === null, [] );

	useEffect( () => {
		if ( isLoading || focusAfterDelete.current === null ) {
			return;
		}
		const index = focusAfterDelete.current;
		let tries = 0;
		let timer: ReturnType< typeof setTimeout >;
		const place = () => {
			// Wait for the confirmation to finish closing, or it takes focus back.
			if ( document.querySelector( '[role="alertdialog"]' ) && tries++ < 10 ) {
				timer = setTimeout( place, 100 );
				return;
			}
			focusAfterDelete.current = null;
			const rows = Array.from(
				containerRef.current?.querySelectorAll< HTMLElement >(
					'tbody .dataviews-view-table__row, .dataviews-view-list [role="row"]'
				) ?? []
			);
			const row = rows[ Math.min( index, rows.length - 1 ) ];
			const target =
				row?.querySelector< HTMLElement >(
					'.dataviews-title-field--clickable, .dataviews-view-list__item'
				) ?? deletedNoticeRef.current;
			target?.focus();
		};
		place();
		return () => clearTimeout( timer );
	}, [ isLoading, data ] );

	const showPinned = !! pinned && ! data.items.some( item => item.id === pinned.id );
	// The dialog keeps its words while it closes.
	const deleteCount = useRef( 1 );
	if ( pendingDelete.length ) {
		deleteCount.current = pendingDelete.length;
	}
	const confirmCopy = deleteCopy( deleteCount.current );

	const changeLink = retentionLocked ? null : (
		<RouteLink href={ EMAIL_LOG_SETTINGS_HREF }>{ __( 'Change', 'jetpack-send-pkg' ) }</RouteLink>
	);
	const keptNote = (
		<>
			{ retentionSentence( retentionDays ) } { changeLink }
		</>
	);
	const goToRetention = useCallback(
		() => navigate( { href: EMAIL_LOG_SETTINGS_HREF } ),
		[ navigate ]
	);
	const changeHowLong = __( 'Change how long', 'jetpack-send-pkg' );

	// Older emails were really deleted, and the period reaches back past what's left.
	const today = siteToday();
	const trimmedDay = status?.log_trimmed_before
		? coversFromDay( { log_covers_from: status.log_trimmed_before }, today )
		: '';
	const showTrimmed =
		! error &&
		! trimmedDismissed &&
		!! trimmedDay &&
		!! period &&
		periodStartDay( period, today ) < trimmedDay;
	// Retention explains where the log starts only when it starts about one period back; a shorter
	// period kept earlier, or deletes by hand, leave it starting later.
	const retentionExplains =
		retentionDays > 0 && !! trimmedDay && trimmedDay <= addDays( today, 1 - retentionDays );
	const emptyWithHistory =
		! isLoading && ! error && ! isFiltered && ! data.items.length && !! status?.has_history;

	// Searching addresses and subjects only, or more matches than the total counts: said once, above the rows.
	const searchKey = JSON.stringify( logQueryArgs( { ...query, page: 1 } ) );
	const searchNotes = [
		data.searched_text === false &&
			__(
				'Searching addresses and subjects only. Pick a shorter date range to search inside emails too.',
				'jetpack-send-pkg'
			),
		data.total_capped &&
			__(
				'More than 1,000 emails match. Add words or pick dates to narrow it down.',
				'jetpack-send-pkg'
			),
	].filter( Boolean );
	const dismissSearchNotice = useCallback(
		() => setSearchNoticeDismissedFor( searchKey ),
		[ searchKey ]
	);
	const showSearchNotice =
		!! searchText &&
		data.items.length > 0 &&
		searchNotes.length > 0 &&
		searchNoticeDismissedFor !== searchKey;

	// While the list hasn't loaded, the error notice says so and no empty state guesses why.
	let empty: ReactNode;
	if ( error ) {
		empty = null;
	} else if ( searchText ) {
		let description: string;
		if ( data.searched_text === false ) {
			description = __(
				'Search looked at addresses and subjects only. There are too many emails to search inside them, so pick a shorter date range.',
				'jetpack-send-pkg'
			);
		} else if ( period ) {
			description = sprintf(
				/* translators: %s: the dates searched, e.g. "in the last 7 days" or "between Sep 1 and Oct 19". */
				__( 'Search looked at addresses, subjects and email text %s.', 'jetpack-send-pkg' ),
				periodPhrase( period )
			);
		} else {
			description = __(
				'Search looked at the addresses, subjects and text of every email in your log.',
				'jetpack-send-pkg'
			);
		}
		empty = (
			<EmptyState.Root className="jetpack-send-log__empty">
				<EmptyState.Icon icon={ searchIcon } />
				<EmptyState.Title>
					{ sprintf(
						/* translators: %s: the search text. */
						__( 'No emails match “%s”', 'jetpack-send-pkg' ),
						searchText
					) }
				</EmptyState.Title>
				<EmptyState.Description>{ description }</EmptyState.Description>
				<EmptyState.Actions>
					<Button variant="outline" tone="neutral" onClick={ clearSearch }>
						{ __( 'Clear search', 'jetpack-send-pkg' ) }
					</Button>
					{ period && data.searched_text !== false && (
						<Button variant="outline" tone="neutral" onClick={ searchAllDates }>
							{ __( 'Search all dates', 'jetpack-send-pkg' ) }
						</Button>
					) }
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	} else if ( isFiltered ) {
		empty = (
			<EmptyState.Root className="jetpack-send-log__empty">
				<EmptyState.Icon icon={ funnel } />
				<EmptyState.Title>
					{ __( 'No emails match these filters', 'jetpack-send-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Actions>
					<Button variant="outline" tone="neutral" onClick={ resetFilters }>
						{ __( 'Reset filters', 'jetpack-send-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		);
	} else if ( status?.has_history ) {
		empty = (
			<EmptyState.Root className="jetpack-send-log__empty">
				<EmptyState.Icon icon={ envelope } />
				<EmptyState.Title>
					{ __( 'No emails in the log right now', 'jetpack-send-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ retentionDays > 0
						? sprintf(
								/* translators: %s: how long the log keeps emails, e.g. "1 week". */
								__(
									'The log keeps emails for %s. Older ones were deleted, but your dashboard still counts them.',
									'jetpack-send-pkg'
								),
								retentionLabel( retentionDays )
							)
						: __(
								'Older emails were deleted, but your dashboard still counts them.',
								'jetpack-send-pkg'
							) }
				</EmptyState.Description>
				{ ! retentionLocked && (
					<EmptyState.Actions>
						<Button variant="outline" tone="neutral" onClick={ goToRetention }>
							{ changeHowLong }
						</Button>
					</EmptyState.Actions>
				) }
			</EmptyState.Root>
		);
	} else {
		empty = (
			<EmptyState.Root className="jetpack-send-log__empty">
				<EmptyState.Icon icon={ envelope } />
				<EmptyState.Title>{ __( 'No emails yet', 'jetpack-send-pkg' ) }</EmptyState.Title>
				{ /* How long emails are kept is already said once, in the toolbar above. */ }
				<EmptyState.Description>
					{ __( 'Emails your site sends show up here.', 'jetpack-send-pkg' ) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	return (
		<div
			className={ `jetpack-send-log${
				openId ? ' jetpack-send-log--panel-open jetpack-send-has-panel' : ''
			}` }
			ref={ containerRef }
		>
			{ error && (
				<div className="jetpack-send-log__notice">
					<ErrorNotice
						title={ loadFailedTitle() }
						message={ error }
						onRetry={ retryLoad }
						retrying={ isLoading }
					/>
				</div>
			) }
			{ landingGone && (
				<div className="jetpack-send-log__notice">
					<Notice.Root>
						<Notice.Description>
							{ __( 'That email is no longer in the log.', 'jetpack-send-pkg' ) }
						</Notice.Description>
						<Notice.CloseIconButton
							label={ __( 'Dismiss', 'jetpack-send-pkg' ) }
							onClick={ dismissGone }
						/>
					</Notice.Root>
				</div>
			) }
			{ showTrimmed && (
				<div className="jetpack-send-log__notice">
					<Notice.Root intent="info">
						<Notice.Description>
							{ retentionExplains
								? sprintf(
										/* translators: 1: how long the log keeps emails, e.g. "1 week", 2: a day, e.g. "Oct 12". */
										__(
											'The log keeps emails for %1$s, so it starts on %2$s. Your dashboard still counts older ones.',
											'jetpack-send-pkg'
										),
										retentionLabel( retentionDays ),
										dayLabel( trimmedDay )
									)
								: sprintf(
										/* translators: %s: a day, e.g. "Oct 12". */
										__(
											'Older emails were deleted from the log, so it starts on %s. Your dashboard still counts them.',
											'jetpack-send-pkg'
										),
										dayLabel( trimmedDay )
									) }
						</Notice.Description>
						{ retentionExplains && ! retentionLocked && (
							<Notice.Actions>
								<Notice.ActionButton variant="outline" onClick={ goToRetention }>
									{ changeHowLong }
								</Notice.ActionButton>
							</Notice.Actions>
						) }
						<Notice.CloseIconButton
							label={ __( 'Dismiss', 'jetpack-send-pkg' ) }
							onClick={ dismissTrimmed }
						/>
					</Notice.Root>
				</div>
			) }
			{ deletedNotice && (
				<div className="jetpack-send-log__notice" ref={ deletedNoticeRef } tabIndex={ -1 }>
					<Notice.Root intent="success">
						<Notice.Description>{ deletedNotice }</Notice.Description>
						<Notice.CloseIconButton
							label={ __( 'Dismiss', 'jetpack-send-pkg' ) }
							onClick={ dismissDeleted }
						/>
					</Notice.Root>
				</div>
			) }
			{ showSearchNotice && (
				<div className="jetpack-send-log__notice">
					<Notice.Root intent="info">
						<Notice.Description>{ searchNotes.join( ' ' ) }</Notice.Description>
						{ data.searched_text === false && (
							<Notice.CloseIconButton
								label={ __( 'Dismiss', 'jetpack-send-pkg' ) }
								onClick={ dismissSearchNotice }
							/>
						) }
					</Notice.Root>
				</div>
			) }
			{ showPinned && pinned && (
				<div className="jetpack-send-log__pinned">
					<Button
						variant="unstyled"
						className="jetpack-send-log__pinned-row"
						onClick={ openPinned }
					>
						<Subject item={ pinned } open={ pinned.id === openId } />
						<Recipients item={ pinned } />
						<StatusBadge
							status={ pinned.status }
							error={
								pinned.status !== 'sent' && ( pinned.error || pinned.reason )
									? failureSummary( pinned, domain, { devMode } )
									: ''
							}
						/>
						<EmailTime createdAt={ pinned.created_at } />
					</Button>
				</div>
			) }
			<DataViews
				data={ data.items }
				fields={ fields }
				view={ shownView }
				onChangeView={ onChangeView }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				paginationInfo={ {
					totalItems: data.total,
					totalPages: Math.max( 1, Math.ceil( data.total / ( view.perPage ?? 20 ) ) ),
				} }
				isLoading={ isLoading }
				getItemId={ getItemId }
				isItemClickable={ isItemClickable }
				onClickItem={ openEntry }
				defaultLayouts={ { table: {}, list: {} } }
				empty={ empty }
			>
				{ /* Search, the date and the always-on chips start the row; the view options end it,
				   beside the chips' last line (the search's, with the panel open), never on a row alone. */ }
				<Stack
					direction="row"
					justify="space-between"
					align="flex-end"
					gap="md"
					className="dataviews__view-actions jetpack-send-log__toolbar"
				>
					<div className="jetpack-send-log__find" ref={ findRef }>
						<Stack direction="row" align="center" gap="sm" wrap="wrap">
							<DataViews.Search label={ __( 'Search emails', 'jetpack-send-pkg' ) } />
							<DateRangeControl
								value={ period }
								onChange={ onPeriodChange }
								allowAny
								align="start"
								presets={ presetsWithin( retentionDays ) }
								earliest={ coversFromDay(
									{ log_covers_from: status?.log_covers_from ?? null },
									today
								) }
								note={ keptNote }
							/>
							<DataViews.Filters />
						</Stack>
					</div>
					<Stack direction="row" align="center" gap="xs" className="jetpack-send-log__tools">
						{ ! emptyWithHistory && (
							<Text variant="body-sm" className="jetpack-send-muted jetpack-send-log__kept">
								{ keptNote }
							</Text>
						) }
						<DataViews.ViewConfig />
					</Stack>
				</Stack>
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
			<AlertDialog.Root
				open={ pendingDelete.length > 0 }
				onOpenChange={ onDeleteOpenChange }
				onConfirm={ confirmDelete }
			>
				<AlertDialog.Popup
					finalFocus={ deleteFinalFocus }
					intent="irreversible"
					title={ confirmCopy.title }
					description={ confirmCopy.description }
					confirmButtonText={ confirmCopy.confirm }
				/>
			</AlertDialog.Root>
		</div>
	);
};

export default LogScreen;
