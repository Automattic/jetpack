import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSubscriberRemoveMutation } from '../data/use-subscriber-remove-mutation';
import { useSubscribers } from '../data/use-subscribers';
import { getSubscribedAt, getSubscriberRowId } from '../lib/subscriber-helpers';
import { getSubscriptionStatusLabel } from '../lib/subscription-status';
import { useViewState } from '../lib/use-view-state';
import SubscriberIdentity from './cells/subscriber-identity';
import SubscriptionTypeCell from './cells/subscription-type-cell';
import EmptyState from './empty-state';
import UnsubscribeModal from './modals/unsubscribe-modal';
import type { Subscriber, SubscribersFilter, SubscribersSortField } from '../data/types';
import type { Action, Field, View } from '@wordpress/dataviews/wp';

const DEFAULT_PER_PAGE = 10;

const defaultView: View = {
	type: 'table',
	page: 1,
	perPage: DEFAULT_PER_PAGE,
	search: '',
	filters: [],
	sort: { field: 'date_subscribed', direction: 'desc' },
	titleField: 'name',
	mediaField: 'media',
	fields: [ 'plan', 'subscription_status', 'date_subscribed' ],
};

const defaultLayouts = {
	table: {},
};

type Props = {
	onAddSubscribers: () => void;
};

/**
 * Subscribers DataViews table — server-driven pagination, sort, search, filters with URL
 * persistence, and per-row + bulk subscriber removal.
 *
 * @param props                  - Component props.
 * @param props.onAddSubscribers - Open the Add Subscribers modal (used by the empty-state CTA).
 * @return The DataViews component bound to the subscribers query.
 */
export default function SubscribersDataViews( { onAddSubscribers }: Props ): JSX.Element {
	const [ view, setView ] = useViewState( defaultView );
	const [ pendingRemoval, setPendingRemoval ] = useState< Subscriber[] >( [] );

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

	const dateSettings = getDateSettings();

	const fields = useMemo< Field< Subscriber >[] >(
		() => [
			{
				id: 'media',
				label: __( 'Media', 'jetpack-subscribers-dashboard' ),
				getValue: ( { item }: { item: Subscriber } ) => item.avatar ?? '',
				render: ( { item }: { item: Subscriber } ) =>
					item.avatar ? (
						<img
							src={ item.avatar }
							alt=""
							width={ 40 }
							height={ 40 }
							className="jetpack-subscribers-dashboard__identity-avatar"
						/>
					) : null,
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'name',
				label: __( 'Name', 'jetpack-subscribers-dashboard' ),
				getValue: ( { item }: { item: Subscriber } ) => item.display_name || item.email_address,
				render: ( { item }: { item: Subscriber } ) => <SubscriberIdentity subscriber={ item } />,
				enableSorting: true,
				enableHiding: false,
			},
			{
				id: 'plan',
				label: __( 'Subscription type', 'jetpack-subscribers-dashboard' ),
				getValue: ( { item }: { item: Subscriber } ) => {
					const plans = item.plans ?? [];
					const hasNonCompPlan = plans.some( plan => ! plan.is_comp );
					if ( hasNonCompPlan ) {
						return 'paid';
					}
					if ( plans.length ) {
						return 'comp';
					}
					return 'free';
				},
				render: ( { item }: { item: Subscriber } ) => <SubscriptionTypeCell subscriber={ item } />,
				elements: [
					{ label: __( 'Paid', 'jetpack-subscribers-dashboard' ), value: 'paid' },
					{ label: __( 'Comp', 'jetpack-subscribers-dashboard' ), value: 'comp' },
					{ label: __( 'Free', 'jetpack-subscribers-dashboard' ), value: 'free' },
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: true,
				enableHiding: false,
			},
			{
				id: 'subscription_status',
				label: __( 'Email subscription', 'jetpack-subscribers-dashboard' ),
				getValue: ( { item }: { item: Subscriber } ) => item.subscription_status,
				render: ( { item }: { item: Subscriber } ) => (
					<div>{ getSubscriptionStatusLabel( item.subscription_status ) }</div>
				),
				elements: [
					{
						label: __( 'Subscribed', 'jetpack-subscribers-dashboard' ),
						value: 'email_subscriber',
					},
					{
						label: __( 'Not subscribed', 'jetpack-subscribers-dashboard' ),
						value: 'reader_subscriber',
					},
					{
						label: __( 'Not confirmed', 'jetpack-subscribers-dashboard' ),
						value: 'unconfirmed_subscriber',
					},
					{
						label: __( 'Not sending', 'jetpack-subscribers-dashboard' ),
						value: 'blocked_subscriber',
					},
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: true,
				enableHiding: false,
			},
			{
				id: 'date_subscribed',
				label: __( 'Date subscribed', 'jetpack-subscribers-dashboard' ),
				getValue: ( { item }: { item: Subscriber } ) => getSubscribedAt( item ),
				render: ( { item }: { item: Subscriber } ) => {
					const value = getSubscribedAt( item );
					if ( ! value ) {
						return null;
					}
					return <span>{ dateI18n( dateSettings.formats.date, value, undefined ) }</span>;
				},
				enableSorting: true,
				enableHiding: false,
			},
		],
		[ dateSettings.formats.date ]
	);

	const actions = useMemo< Action< Subscriber >[] >(
		() => [
			{
				id: 'remove',
				label: __( 'Remove subscriber', 'jetpack-subscribers-dashboard' ),
				supportsBulk: true,
				isDestructive: true,
				callback: ( items: Subscriber[] ) => {
					setPendingRemoval( items );
				},
			},
		],
		[]
	);

	const handleConfirmRemoval = useCallback( () => {
		const targets = pendingRemoval;
		if ( targets.length === 0 ) {
			return;
		}
		removeMutation.mutate( targets, {
			onSettled: () => {
				setPendingRemoval( [] );
			},
		} );
	}, [ pendingRemoval, removeMutation ] );

	const handleCancelRemoval = useCallback( () => {
		setPendingRemoval( [] );
	}, [] );

	const subscribers = data?.subscribers ?? [];
	const totalItems = data?.total ?? 0;
	const totalPages = data?.pages ?? 0;

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const hasActiveFiltersOrSearch =
		( view.filters && view.filters.length > 0 ) || ( view.search && view.search.length > 0 );

	if ( error ) {
		return (
			<div className="jetpack-subscribers-dashboard__error">
				<p>{ __( 'Could not load subscribers.', 'jetpack-subscribers-dashboard' ) }</p>
				<p className="jetpack-subscribers-dashboard__error-detail">{ error }</p>
			</div>
		);
	}

	if ( ! isLoading && ! hasActiveFiltersOrSearch && totalItems === 0 ) {
		return <EmptyState onAddSubscribers={ onAddSubscribers } />;
	}

	return (
		<>
			<DataViews< Subscriber >
				data={ subscribers }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				defaultLayouts={ defaultLayouts }
				paginationInfo={ paginationInfo }
				getItemId={ getSubscriberRowId }
				isLoading={ isLoading }
				search
				searchLabel={ __( 'Search subscribers…', 'jetpack-subscribers-dashboard' ) }
				actions={ actions }
			/>
			<UnsubscribeModal
				subscribers={ pendingRemoval }
				isBusy={ removeMutation.isPending }
				onConfirm={ handleConfirmRemoval }
				onCancel={ handleCancelRemoval }
			/>
		</>
	);
}
