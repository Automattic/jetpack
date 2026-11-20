import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Stack } from '@wordpress/ui';
import { useMembershipsProducts } from '../data/use-memberships-products';
import { useSendBounceConfirmationMutation } from '../data/use-send-bounce-confirmation-mutation';
import { useSubscriberRemoveMutation } from '../data/use-subscriber-remove-mutation';
import { useSubscribers } from '../data/use-subscribers';
import { isNarrowed, isPageSelected } from '../lib/bulk-remove-scope';
import { canCompSubscriber } from '../lib/comp-eligibility';
import { getSubscribedAt, getSubscriberLabel, getSubscriberRowId } from '../lib/subscriber-helpers';
import { getSubscriptionType } from '../lib/subscription-plans';
import { getSubscriptionStatusLabel } from '../lib/subscription-status';
import { recordTracksEvent } from '../lib/tracks';
import { useViewState } from '../lib/use-view-state';
import SubscriberIdentity from './cells/subscriber-identity';
import SubscriptionStatusCell from './cells/subscription-status-cell';
import SubscriptionTypeCell from './cells/subscription-type-cell';
import EmptyState from './empty-state';
import CompModal from './modals/comp-modal';
import RemoveCompModal from './modals/remove-comp-modal';
import UnsubscribeModal from './modals/unsubscribe-modal';
import SelectionBanner from './selection-banner';
import type {
	Subscriber,
	SubscribersExportQuery,
	SubscribersFilter,
	SubscribersSortField,
} from '../data/types';
import type { BulkRemoveScope } from '../data/use-bulk-remove';
import type { Action, Field, View } from '@wordpress/dataviews';
import type { JSX } from 'react';

const DEFAULT_PER_PAGE = 20;

const defaultView: View = {
	type: 'table',
	page: 1,
	perPage: DEFAULT_PER_PAGE,
	search: '',
	filters: [],
	sort: { field: 'date_subscribed', direction: 'desc' },
	titleField: 'name',
	fields: [ 'plan', 'subscription_status', 'date_subscribed' ],
};

const defaultLayouts = {
	table: {},
};

type Props = {
	onAddSubscribers: () => void;
	onViewSubscriber: ( subscriber: Subscriber ) => void;
	onSubscribersRemoved: ( removed: Subscriber[] ) => void;
	onSelfOnlyChange: ( isSelfOnly: boolean ) => void;
	onQueryChange: ( query: SubscribersExportQuery ) => void;
	onListChange: ( list: { total: number; examples: string[] } ) => void;
	onRequestBulkRemove: ( scope: BulkRemoveScope ) => void;
	isBulkRemoveRunning: boolean;
	isBulkRemoveEnabled?: boolean;
};

/**
 * Subscribers DataViews table — server-driven pagination, sort, search, filters with URL
 * persistence, and per-row + bulk subscriber removal.
 *
 * @param props                      - Component props.
 * @param props.onAddSubscribers     - Open the Add Subscribers modal (used by the empty-state CTA).
 * @param props.onViewSubscriber     - Callback fired when the View row action is invoked.
 * @param props.onSubscribersRemoved - Callback fired with the rows that were actually removed.
 * @param props.onSelfOnlyChange     - Reports whether the viewer is the only subscriber, for the header's nudge.
 * @param props.onQueryChange        - Reports the active filters, search and sort, for the header's CSV download.
 * @param props.onListChange         - Reports the matching total and the first emails on the page, for the bulk remove menu item and dialog.
 * @param props.onRequestBulkRemove  - Open the bulk remove dialog, once every matching subscriber is selected.
 * @param props.isBulkRemoveRunning  - True while a bulk removal runs; removal actions are disabled.
 * @param props.isBulkRemoveEnabled  - Whether WP.com has removal turned on for the site. Until it
 *                                   does, the banner offers no "Select all N" and removal stays per page.
 * @return The DataViews component bound to the subscribers query.
 */
export default function SubscribersDataViews( {
	onAddSubscribers,
	onViewSubscriber,
	onSubscribersRemoved,
	onSelfOnlyChange,
	onQueryChange,
	onListChange,
	onRequestBulkRemove,
	isBulkRemoveRunning,
	isBulkRemoveEnabled = false,
}: Props ): JSX.Element {
	const [ view, setView ] = useViewState( defaultView );
	const [ selection, setSelection ] = useState< string[] >( [] );
	// "Select all N matching subscribers": the selection then means every match, not only this page.
	const [ isAllSelected, setAllSelected ] = useState( false );
	const [ pendingRemoval, setPendingRemoval ] = useState< Subscriber[] >( [] );
	const [ compTarget, setCompTarget ] = useState< Subscriber | null >( null );
	const [ removeCompTarget, setRemoveCompTarget ] = useState< {
		subscriber: Subscriber;
		compId: number;
		planTitle?: string;
	} | null >( null );

	const apiFilters = useMemo< SubscribersFilter[] >( () => {
		const values = ( view.filters ?? [] )
			.map( filter => filter.value as SubscribersFilter )
			.filter( Boolean );
		return values.length ? values : [ 'all' ];
	}, [ view.filters ] );

	useEffect( () => {
		onQueryChange( {
			filters: apiFilters.filter( filter => filter !== 'all' ),
			search: view.search ?? '',
			sort: ( view.sort?.field as SubscribersSortField ) ?? 'date_subscribed',
			sortOrder: ( view.sort?.direction ?? 'desc' ) as 'asc' | 'desc',
		} );
	}, [ apiFilters, view.search, view.sort?.field, view.sort?.direction, onQueryChange ] );

	const queryParams = useMemo(
		() => ( {
			page: view.page ?? 1,
			perPage: view.perPage ?? DEFAULT_PER_PAGE,
			sort: ( view.sort?.field as SubscribersSortField ) ?? 'date_subscribed',
			sortOrder: ( view.sort?.direction ?? 'desc' ) as 'asc' | 'desc',
			search: view.search ?? '',
			filters: apiFilters,
		} ),
		[ view.page, view.perPage, view.sort?.field, view.sort?.direction, view.search, apiFilters ]
	);

	const narrowed = isNarrowed( apiFilters, queryParams.search );

	const { data, isLoading, isPlaceholderData, error } = useSubscribers( queryParams );
	const subscribers = useMemo( () => data?.subscribers ?? [], [ data?.subscribers ] );
	const pageIds = useMemo( () => subscribers.map( getSubscriberRowId ), [ subscribers ] );
	const removeMutation = useSubscriberRemoveMutation();
	const { mutate: sendBounceConfirmation } = useSendBounceConfirmationMutation();

	// Fetch the site's paid products once for the whole table (not per row) so the "Comp a
	// subscription" action can be hidden when there's nothing to comp onto — otherwise it opens a
	// dead-end modal that only reports "no paid plans". The Subscribers tab is already gated behind
	// a WordPress.com connection, so the proxied request is safe to fire eagerly.
	const { data: membershipsProducts, isError: membershipsProductsError } =
		useMembershipsProducts( true );
	const hasPaidProducts = ( membershipsProducts?.length ?? 0 ) > 0;
	// Offer the action when we know there's a paid product to comp onto, OR when we couldn't
	// determine it because the products request errored. Failing open on error preserves the
	// capability and lets the modal surface the fetch error, rather than silently removing the
	// action on a transient failure. It stays hidden only while the request is still loading and
	// when the site genuinely has zero paid products (the dead-end case this fix targets).
	const canShowCompAction = hasPaidProducts || membershipsProductsError;

	// Fired off `onChangeView` rather than per-control handlers because DataViews owns
	// the controls — we diff the previous view against the next to mirror Calypso's
	// per-interaction Tracks events.
	const handleChangeView = useCallback(
		( nextView: View ) => {
			if ( ( nextView.search ?? '' ) !== ( view.search ?? '' ) ) {
				recordTracksEvent( 'jetpack_subscribers_search_performed', {
					query: nextView.search ?? '',
				} );
			}

			const previousFilterValues = new Set(
				( view.filters ?? [] ).map( filter => `${ filter.field }:${ String( filter.value ) }` )
			);
			( nextView.filters ?? [] ).forEach( filter => {
				const key = `${ filter.field }:${ String( filter.value ) }`;
				if ( ! previousFilterValues.has( key ) ) {
					recordTracksEvent( 'jetpack_subscribers_filter_applied', {
						filter_field: filter.field,
						filter_value: String( filter.value ),
					} );
				}
			} );

			if (
				nextView.sort?.field !== view.sort?.field ||
				nextView.sort?.direction !== view.sort?.direction
			) {
				if ( nextView.sort?.field ) {
					recordTracksEvent( 'jetpack_subscribers_sort_changed', {
						sort_field: nextView.sort.field,
						sort_direction: nextView.sort.direction ?? 'desc',
					} );
				}
			}

			setView( nextView );
		},
		[ setView, view.filters, view.search, view.sort?.direction, view.sort?.field ]
	);

	const fields = useMemo< Field< Subscriber >[] >(
		() => [
			{
				id: 'name',
				label: __( 'Name', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: Subscriber } ) => getSubscriberLabel( item ),
				render: ( { item }: { item: Subscriber } ) => <SubscriberIdentity subscriber={ item } />,
				enableSorting: true,
				enableHiding: false,
			},
			{
				id: 'plan',
				label: __( 'Subscription type', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: Subscriber } ) => getSubscriptionType( item ),
				render: ( { item }: { item: Subscriber } ) => <SubscriptionTypeCell subscriber={ item } />,
				elements: [
					{ label: __( 'Paid', 'jetpack-newsletter' ), value: 'paid' },
					{ label: __( 'Comp', 'jetpack-newsletter' ), value: 'comp' },
					{ label: __( 'Free', 'jetpack-newsletter' ), value: 'free' },
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: true,
				enableHiding: false,
			},
			{
				id: 'subscription_status',
				label: __( 'Email subscription', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: Subscriber } ) =>
					getSubscriptionStatusLabel( item.subscription_status ),
				render: ( { item }: { item: Subscriber } ) => (
					<SubscriptionStatusCell
						status={ item.subscription_status }
						reason={ item.subscription_status_reason }
					/>
				),
				elements: [
					{
						label: __( 'Subscribed', 'jetpack-newsletter' ),
						value: 'email_subscriber',
					},
					{
						label: __( 'Not subscribed', 'jetpack-newsletter' ),
						value: 'reader_subscriber',
					},
					{
						label: __( 'Not confirmed', 'jetpack-newsletter' ),
						value: 'unconfirmed_subscriber',
					},
					{
						label: __( 'Not sending (any reason)', 'jetpack-newsletter' ),
						value: 'blocked_subscriber',
					},
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: true,
				enableHiding: false,
			},
			{
				id: 'date_subscribed',
				type: 'date',
				label: __( 'Date subscribed', 'jetpack-newsletter' ),
				getValue: ( { item }: { item: Subscriber } ) => getSubscribedAt( item ) ?? '',
				filterBy: false,
				enableSorting: true,
				enableHiding: false,
			},
		],
		[]
	);

	const actions = useMemo< Action< Subscriber >[] >(
		() => [
			{
				id: 'view',
				label: __( 'View', 'jetpack-newsletter' ),
				isPrimary: true,
				callback: ( items: Subscriber[] ) => {
					const target = items[ 0 ];
					if ( ! target ) {
						return;
					}
					onViewSubscriber( target );
				},
			},
			{
				id: 'comp',
				label: __( 'Comp a subscription', 'jetpack-newsletter' ),
				// Needs a paid product to comp onto, otherwise the modal is a dead-end that only
				// reports "no paid plans". `canShowCompAction` comes from a single table-level fetch
				// (see above: true when products exist or the fetch errored, false while loading or
				// on a genuinely empty site), so this stays cheap per row. The modal still handles
				// the per-subscriber "already comped on every plan" edge case.
				isEligible: ( subscriber: Subscriber ) =>
					canCompSubscriber( subscriber ) && canShowCompAction,
				callback: ( items: Subscriber[] ) => {
					const target = items[ 0 ];
					if ( ! target ) {
						return;
					}
					setCompTarget( target );
				},
			},
			{
				id: 'remove-comp',
				label: __( 'Remove comp', 'jetpack-newsletter' ),
				// Calypso's `findRemovableComp`: surface only when at least one plan on the row
				// is a comp with a `comp_id` we can revoke.
				isEligible: ( subscriber: Subscriber ) =>
					( subscriber.plans ?? [] ).some( plan => plan.is_comp && !! plan.comp_id ),
				callback: ( items: Subscriber[] ) => {
					const target = items[ 0 ];
					if ( ! target ) {
						return;
					}
					const compPlan = ( target.plans ?? [] ).find( plan => plan.is_comp && !! plan.comp_id );
					if ( ! compPlan?.comp_id ) {
						return;
					}
					setRemoveCompTarget( {
						subscriber: target,
						compId: compPlan.comp_id,
						planTitle: compPlan.title,
					} );
				},
			},
			{
				id: 'send-bounce-confirmation',
				label: __( 'Send confirmation email', 'jetpack-newsletter' ),
				isEligible: ( subscriber: Subscriber ) =>
					subscriber.subscription_status_reason === 'bounced' &&
					!! subscriber.bounce_retry?.can_retry &&
					!! subscriber.email_address,
				callback: ( items: Subscriber[] ) => {
					const target = items[ 0 ];
					if ( ! target?.email_address ) {
						return;
					}
					sendBounceConfirmation( target.email_address );
				},
			},
			{
				id: 'remove',
				label: __( 'Remove subscriber', 'jetpack-newsletter' ),
				// A one-item toolbar action is indistinguishable from a row action; the banner
				// provides the explicit whole-list action on a one-row final page.
				supportsBulk: ! ( isAllSelected && pageIds.length === 1 ),
				disabled: isBulkRemoveRunning,
				callback: ( items: Subscriber[] ) => {
					if ( isBulkRemoveRunning ) {
						return;
					}
					if (
						isBulkRemoveEnabled &&
						isAllSelected &&
						items.length > 1 &&
						items.length === pageIds.length
					) {
						onRequestBulkRemove( narrowed ? 'matching' : 'all' );
						return;
					}
					setPendingRemoval( items );
				},
			},
		],
		[
			onViewSubscriber,
			canShowCompAction,
			sendBounceConfirmation,
			isBulkRemoveEnabled,
			isBulkRemoveRunning,
			isAllSelected,
			pageIds,
			narrowed,
			onRequestBulkRemove,
		]
	);

	const handleConfirmRemoval = useCallback( async () => {
		const targets = pendingRemoval;
		if ( isBulkRemoveRunning || targets.length === 0 ) {
			return;
		}
		try {
			const result = await removeMutation.mutateAsync( targets );
			if ( result.removed.length > 0 ) {
				onSubscribersRemoved( result.removed );
			}
		} finally {
			setPendingRemoval( [] );
		}
	}, [ isBulkRemoveRunning, pendingRemoval, removeMutation, onSubscribersRemoved ] );

	const handleCancelRemoval = useCallback( () => {
		setPendingRemoval( [] );
	}, [] );

	const handleClickItem = useCallback(
		( item: Subscriber ) => {
			recordTracksEvent( 'jetpack_subscribers_subscriber_row_clicked', {
				subscription_id: item.email_subscription_id ?? item.wpcom_subscription_id ?? 0,
				user_id: item.user_id ?? 0,
			} );
			onViewSubscriber( item );
		},
		[ onViewSubscriber ]
	);

	const handleCloseComp = useCallback( () => setCompTarget( null ), [] );
	const handleCloseRemoveComp = useCallback( () => setRemoveCompTarget( null ), [] );

	const totalItems = data?.total ?? 0;
	const totalPages = data?.pages ?? 0;

	const hasActiveFiltersOrSearch = Boolean(
		( view.filters && view.filters.length > 0 ) || ( view.search && view.search.length > 0 )
	);

	const filterKey = `${ queryParams.search }|${ [ ...apiFilters ].sort().join( ',' ) }`;
	const settledFilterKey = useRef( filterKey );
	if ( ! isPlaceholderData ) {
		settledFilterKey.current = filterKey;
	}

	const isSelfOnly =
		settledFilterKey.current === filterKey &&
		! hasActiveFiltersOrSearch &&
		totalItems === 1 &&
		!! data?.is_owner_subscribed;

	useEffect( () => {
		onSelfOnlyChange( isSelfOnly );
	}, [ isSelfOnly, onSelfOnlyChange ] );

	// A new search or filter changes what "all" means, so start the selection over.
	useEffect( () => {
		setSelection( [] );
		setAllSelected( false );
	}, [ filterKey ] );

	// "All N selected" only holds while this page stays on screen.
	useEffect( () => {
		setAllSelected( false );
	}, [ view.page, view.perPage, view.sort?.field, view.sort?.direction ] );

	// Once a bulk removal starts, the rows it covers are on their way out.
	useEffect( () => {
		if ( isBulkRemoveRunning ) {
			setSelection( [] );
			setAllSelected( false );
			setPendingRemoval( [] );
		}
	}, [ isBulkRemoveRunning ] );

	const selectedOnPage = useMemo(
		() => subscribers.filter( item => selection.includes( getSubscriberRowId( item ) ) ),
		[ subscribers, selection ]
	);

	// Rows can change under the selection (a refetch, a single removal), so drop "everyone" as soon
	// as the page is no longer fully selected.
	useEffect( () => {
		if ( ! isPageSelected( pageIds, selection ) ) {
			setAllSelected( false );
		}
	}, [ pageIds, selection ] );

	const clearSelection = useCallback( () => {
		setSelection( [] );
		setAllSelected( false );
	}, [] );

	// Selecting across pages leads to the background job, so it needs removal turned on for the site.
	const selectAll = useCallback( () => {
		if ( isBulkRemoveEnabled && ! isBulkRemoveRunning ) {
			setAllSelected( true );
		}
	}, [ isBulkRemoveEnabled, isBulkRemoveRunning ] );
	const removeSelectedOnPage = useCallback( () => {
		if ( ! isBulkRemoveRunning ) {
			setPendingRemoval( selectedOnPage );
		}
	}, [ isBulkRemoveRunning, selectedOnPage ] );
	const requestBulkRemoveOfSelection = useCallback( () => {
		if ( ! isBulkRemoveRunning ) {
			onRequestBulkRemove( narrowed ? 'matching' : 'all' );
		}
	}, [ isBulkRemoveRunning, onRequestBulkRemove, narrowed ] );

	const settledTotal = settledFilterKey.current === filterKey ? totalItems : null;
	const examplesKey = subscribers
		.slice( 0, 3 )
		.map( item => item.email_address )
		.join( ',' );
	useEffect( () => {
		if ( settledTotal === null ) {
			onListChange( { total: 0, examples: [] } );
			return;
		}
		onListChange( {
			total: settledTotal,
			examples: examplesKey ? examplesKey.split( ',' ) : [],
		} );
	}, [ settledTotal, examplesKey, onListChange ] );

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	if ( error ) {
		return (
			<Notice.Root intent="error">
				<Notice.Title>{ __( 'Could not load subscribers.', 'jetpack-newsletter' ) }</Notice.Title>
				<Notice.Description>{ error }</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<>
			<DataViews< Subscriber >
				data={ subscribers }
				fields={ fields }
				view={ view }
				onChangeView={ handleChangeView }
				defaultLayouts={ defaultLayouts }
				paginationInfo={ paginationInfo }
				getItemId={ getSubscriberRowId }
				isLoading={ isLoading }
				search
				searchLabel={ __( 'Search subscribers…', 'jetpack-newsletter' ) }
				actions={ actions }
				selection={ selection }
				onChangeSelection={ setSelection }
				onClickItem={ handleClickItem }
				empty={
					<EmptyState
						hasFiltersOrSearch={ hasActiveFiltersOrSearch }
						onAddSubscribers={ onAddSubscribers }
					/>
				}
			>
				{ /* The default DataViews layout, with the selection banner between the filters and the table. */ }
				<Stack
					direction="row"
					align="top"
					justify="space-between"
					gap="xs"
					className="dataviews__view-actions"
				>
					<Stack direction="row" justify="start" gap="sm" className="dataviews__search">
						<DataViews.Search label={ __( 'Search subscribers…', 'jetpack-newsletter' ) } />
						<DataViews.FiltersToggle />
					</Stack>
					<Stack direction="row" gap="xs" style={ { flexShrink: 0 } }>
						<DataViews.LayoutSwitcher />
						<DataViews.ViewConfig />
					</Stack>
				</Stack>
				<DataViews.FiltersToggled className="dataviews-filters__container" />
				{ /* The list stays mounted, so screen readers hear the banner appear and change. */ }
				<Notice.List>
					<SelectionBanner
						pageCount={ subscribers.length }
						selectedCount={ selectedOnPage.length }
						matchingCount={ totalItems }
						totalPages={ totalPages }
						narrowed={ narrowed }
						isAllSelected={ isAllSelected }
						disabled={ isBulkRemoveRunning }
						canSelectAll={ isBulkRemoveEnabled }
						onSelectAll={ selectAll }
						onRemovePage={ removeSelectedOnPage }
						onRemoveAll={ requestBulkRemoveOfSelection }
						onClear={ clearSelection }
					/>
				</Notice.List>
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
			<UnsubscribeModal
				subscribers={ isBulkRemoveRunning ? [] : pendingRemoval }
				onConfirm={ handleConfirmRemoval }
				onCancel={ handleCancelRemoval }
			/>
			<CompModal subscriber={ compTarget } onClose={ handleCloseComp } />
			<RemoveCompModal pending={ removeCompTarget } onClose={ handleCloseRemoveComp } />
		</>
	);
}
