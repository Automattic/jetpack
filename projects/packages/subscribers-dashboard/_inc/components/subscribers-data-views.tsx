import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSubscribers } from '../data/use-subscribers';
import { getSubscribedAt, getSubscriberRowId } from '../lib/subscriber-helpers';
import { getSubscriptionStatusLabel } from '../lib/subscription-status';
import SubscriberIdentity from './cells/subscriber-identity';
import SubscriptionTypeCell from './cells/subscription-type-cell';
import type { Subscriber, SubscribersSortField } from '../data/types';
import type { Field, View } from '@wordpress/dataviews/wp';

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

/**
 * Subscribers DataViews table — server-driven pagination, sort, and search.
 *
 * Phase 2 brings field parity with Calypso (media + identity + plan + status + date),
 * sortable on name / plan / status / date. Filters land in Phase 3.
 *
 * @return The DataViews component bound to the subscribers query.
 */
export default function SubscribersDataViews(): JSX.Element {
	const [ view, setView ] = useState< View >( defaultView );

	const queryParams = useMemo(
		() => ( {
			page: view.page ?? 1,
			perPage: view.perPage ?? DEFAULT_PER_PAGE,
			sort: ( view.sort?.field as SubscribersSortField ) ?? 'date_subscribed',
			sortOrder: ( view.sort?.direction ?? 'desc' ) as 'asc' | 'desc',
			search: view.search ?? '',
			filters: [ 'all' as const ],
		} ),
		[ view.page, view.perPage, view.sort?.field, view.sort?.direction, view.search ]
	);

	const { data, isLoading, error } = useSubscribers( queryParams );

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

	const subscribers = data?.subscribers ?? [];
	const totalItems = data?.total ?? 0;
	const totalPages = data?.pages ?? 0;

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	if ( error ) {
		return (
			<div className="jetpack-subscribers-dashboard__error">
				<p>{ __( 'Could not load subscribers.', 'jetpack-subscribers-dashboard' ) }</p>
				<p className="jetpack-subscribers-dashboard__error-detail">{ error }</p>
			</div>
		);
	}

	return (
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
			actions={ [] }
		/>
	);
}
