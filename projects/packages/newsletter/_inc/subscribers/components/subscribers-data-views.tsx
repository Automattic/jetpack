import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useMembershipsProducts } from '../data/use-memberships-products';
import { useSubscriberRemoveMutation } from '../data/use-subscriber-remove-mutation';
import { useSubscribers } from '../data/use-subscribers';
import {
	getSubscribedAt,
	getSubscriberRowId,
	hasNoSubscribersOtherThanOwner,
} from '../lib/subscriber-helpers';
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
import type { Subscriber, SubscribersFilter, SubscribersSortField } from '../data/types';
import type { Action, Field, View } from '@wordpress/dataviews';

const DEFAULT_PER_PAGE = 20;

// Stable reference so passing "no rows" to DataViews doesn't churn on every render.
const NO_SUBSCRIBERS: Subscriber[] = [];

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
};

/**
 * Subscribers DataViews table — server-driven pagination, sort, search, filters with URL
 * persistence, and per-row + bulk subscriber removal.
 *
 * @param props                      - Component props.
 * @param props.onAddSubscribers     - Open the Add Subscribers modal (used by the empty-state CTA).
 * @param props.onViewSubscriber     - Callback fired when the View row action is invoked.
 * @param props.onSubscribersRemoved - Callback fired with the rows that were actually removed.
 * @return The DataViews component bound to the subscribers query.
 */
export default function SubscribersDataViews( {
	onAddSubscribers,
	onViewSubscriber,
	onSubscribersRemoved,
}: Props ): JSX.Element {
	const [ view, setView ] = useViewState( defaultView );
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

	const { data, isLoading, error } = useSubscribers( queryParams );
	const removeMutation = useSubscriberRemoveMutation();

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
				getValue: ( { item }: { item: Subscriber } ) => item.display_name || item.email_address,
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
					<SubscriptionStatusCell status={ item.subscription_status } />
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
						label: __( 'Not sending', 'jetpack-newsletter' ),
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
				// Needs a wpcom user id to attach the comp to, plus a paid product to comp onto —
				// otherwise the modal is a dead-end that only reports "no paid plans".
				// `canShowCompAction` comes from a single table-level fetch (see above: true when
				// products exist or the fetch errored, false while loading or on a genuinely empty
				// site), so this stays cheap per row. The modal still handles the per-subscriber
				// "already comped on every plan" edge case.
				isEligible: ( subscriber: Subscriber ) => !! subscriber.user_id && canShowCompAction,
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
				id: 'remove',
				label: __( 'Remove subscriber', 'jetpack-newsletter' ),
				supportsBulk: true,
				callback: ( items: Subscriber[] ) => {
					setPendingRemoval( items );
				},
			},
		],
		[ onViewSubscriber, canShowCompAction ]
	);

	const handleConfirmRemoval = useCallback( async () => {
		const targets = pendingRemoval;
		if ( targets.length === 0 ) {
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
	}, [ pendingRemoval, removeMutation, onSubscribersRemoved ] );

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

	const subscribers = data?.subscribers ?? [];
	const totalItems = data?.total ?? 0;
	const totalPages = data?.pages ?? 0;
	const isOwnerSubscribed = data?.is_owner_subscribed ?? false;

	const hasActiveFiltersOrSearch = Boolean(
		( view.filters && view.filters.length > 0 ) || ( view.search && view.search.length > 0 )
	);

	// The owner is always returned in the list, so when they're the only subscriber the table
	// would render a single row and DataViews' `empty` slot would never fire. Mirror Calypso's
	// launchpad condition and present the cold-start empty state ourselves. Gated on no active
	// filter/search so a filtered-to-nothing result still shows the "no matching subscribers"
	// message instead.
	const showColdStartEmpty =
		! hasActiveFiltersOrSearch && hasNoSubscribersOtherThanOwner( totalItems, isOwnerSubscribed );

	const displayedSubscribers = showColdStartEmpty ? NO_SUBSCRIBERS : subscribers;

	const paginationInfo = useMemo(
		() => ( {
			totalItems: showColdStartEmpty ? 0 : totalItems,
			totalPages: showColdStartEmpty ? 0 : totalPages,
		} ),
		[ showColdStartEmpty, totalItems, totalPages ]
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
				data={ displayedSubscribers }
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
				onClickItem={ handleClickItem }
				empty={
					<EmptyState
						hasFiltersOrSearch={ hasActiveFiltersOrSearch }
						onAddSubscribers={ onAddSubscribers }
					/>
				}
			/>
			<UnsubscribeModal
				subscribers={ pendingRemoval }
				onConfirm={ handleConfirmRemoval }
				onCancel={ handleCancelRemoval }
			/>
			<CompModal subscriber={ compTarget } onClose={ handleCloseComp } />
			<RemoveCompModal pending={ removeCompTarget } onClose={ handleCloseRemoveComp } />
		</>
	);
}
