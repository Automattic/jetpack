import { DataViews } from '@wordpress/dataviews/wp';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSubscribers } from '../data/use-subscribers';
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
	mediaField: 'avatar',
	fields: [ 'date_subscribed' ],
};

const defaultLayouts = {
	table: {},
};

/**
 * Best-effort subscription date — Calypso prefers `wpcom_date_subscribed`, falling back to the
 * email subscription date for email-only subscribers.
 *
 * @param subscriber - Subscriber.
 * @return ISO-ish date string or empty.
 */
function getSubscribedAt( subscriber: Subscriber ): string {
	return subscriber.wpcom_date_subscribed || subscriber.email_date_subscribed || '';
}

/**
 * Stable row id — prefers `email_subscription_id`, falls back to wpcom subscription id, then user
 * id, then the email address. Mirrors `getSubscriptionIdFromSubscriber()` in Calypso.
 *
 * @param subscriber - Subscriber.
 * @return DataViews row id.
 */
function getRowId( subscriber: Subscriber ): string {
	const id =
		subscriber.email_subscription_id || subscriber.wpcom_subscription_id || subscriber.user_id || 0;
	return id ? String( id ) : subscriber.email_address;
}

/**
 * Subscribers DataViews table — server-driven pagination, sort, and search.
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
				id: 'avatar',
				label: __( 'Media', 'jetpack-subscribers-dashboard' ),
				render: ( { item }: { item: Subscriber } ) =>
					item.avatar ? (
						<img
							src={ item.avatar }
							alt=""
							width={ 40 }
							height={ 40 }
							style={ { borderRadius: '50%', display: 'block' } }
						/>
					) : null,
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: 'name',
				label: __( 'Name', 'jetpack-subscribers-dashboard' ),
				getValue: ( { item }: { item: Subscriber } ) => item.display_name || item.email_address,
				render: ( { item }: { item: Subscriber } ) => (
					<div style={ { display: 'flex', flexDirection: 'column' } }>
						<strong>{ item.display_name || item.email_address }</strong>
						{ item.display_name && item.email_address ? (
							<span style={ { color: 'var(--wp-admin-theme-color-darker-10, #757575)' } }>
								{ item.email_address }
							</span>
						) : null }
					</div>
				),
				enableSorting: false,
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
			<div style={ { padding: '24px' } }>
				<p>{ __( 'Could not load subscribers.', 'jetpack-subscribers-dashboard' ) }</p>
				<p style={ { color: '#cc1818' } }>{ error }</p>
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
			getItemId={ getRowId }
			isLoading={ isLoading }
			search
			searchLabel={ __( 'Search subscribers…', 'jetpack-subscribers-dashboard' ) }
			actions={ [] }
		/>
	);
}
