import { formatCurrency, formatNumber } from '@automattic/number-formatters';
import { DataViews } from '@wordpress/dataviews';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonLink, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SUBSCRIBERS_PER_PAGE, usePaidSubscriptions } from '../../data/subscribers';
import { trackSubscribersEvent } from '../../data/tracking';
import { getDocUrl } from '../overview/docs';
import CancelDialog from './cancel-dialog';
import DetailsDialog from './details-dialog';
import { getExportUrl, intervalLabel, isOneTime, startDateLabel } from './subscriptions';
import type { PaidSubscription } from '../../data/subscribers';
import type { Action, Field, View } from '@wordpress/dataviews';
import './style.scss';

// WordPress.com only pages, at a fixed size: no sorting, filtering or hiding.
const FIXED = { enableSorting: false, enableHiding: false, filterBy: false } as const;

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: SUBSCRIBERS_PER_PAGE,
	titleField: 'subscriber',
	fields: [ 'plan', 'type', 'total', 'since' ],
	layout: { enableMoving: false },
};

const DEFAULT_LAYOUTS = { table: {} };

const CONFIG = { perPageSizes: [ SUBSCRIBERS_PER_PAGE ] };

/**
 * The subscriber column: their name, with their email under it.
 *
 * @param props      - Field render props.
 * @param props.item - The subscription.
 * @return The cell.
 */
function SubscriberCell( { item }: { item: PaidSubscription } ) {
	return (
		<Stack direction="column" gap="xs">
			<span>{ item.name || item.email }</span>
			{ item.name && item.email && <Text variant="body-sm">{ item.email }</Text> }
		</Stack>
	);
}

/**
 * A row's key.
 *
 * @param item - The subscription.
 * @return The key.
 */
function getItemId( item: PaidSubscription ): string {
	return String( item.id );
}

/**
 * The table's columns.
 *
 * @return The fields.
 */
function useFields(): Field< PaidSubscription >[] {
	return useMemo(
		() => [
			{
				id: 'subscriber',
				label: __( 'Subscriber', 'jetpack-monetize' ),
				getValue: ( { item } ) => item.name || item.email,
				render: SubscriberCell,
				...FIXED,
			},
			{
				id: 'plan',
				label: __( 'Plan', 'jetpack-monetize' ),
				getValue: ( { item } ) => item.planTitle,
				...FIXED,
			},
			{
				id: 'type',
				label: __( 'Type', 'jetpack-monetize' ),
				getValue: ( { item } ) => intervalLabel( item ),
				...FIXED,
			},
			{
				id: 'total',
				label: __( 'Total paid', 'jetpack-monetize' ),
				getValue: ( { item } ) => formatCurrency( item.allTimeTotal, item.currency ),
				...FIXED,
			},
			{
				id: 'since',
				label: __( 'Since', 'jetpack-monetize' ),
				getValue: ( { item } ) => startDateLabel( item ),
				...FIXED,
			},
		],
		[]
	);
}

/**
 * The Paid subscribers tab: everyone with an active subscription or one-time payment.
 *
 * @return The tab.
 */
export default function Subscribers() {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const page = view.page ?? 1;
	const { data, isError, error, isFetching, isPlaceholderData, refetch } =
		usePaidSubscriptions( page );
	const [ viewing, setViewing ] = useState< PaidSubscription | null >( null );
	const [ cancelling, setCancelling ] = useState< PaidSubscription | null >( null );
	const fields = useFields();
	const exportUrl = getExportUrl();

	const total = data?.total ?? 0;
	const totalPages = Math.max( 1, Math.ceil( total / SUBSCRIBERS_PER_PAGE ) );

	// Cancelling the last row of the last page leaves that page empty.
	useEffect( () => {
		if ( data && ! isPlaceholderData && page > totalPages ) {
			setView( current => ( { ...current, page: totalPages } ) );
		}
	}, [ data, isPlaceholderData, page, totalPages ] );

	const openDetails = useCallback( ( subscription: PaidSubscription ) => {
		trackSubscribersEvent( 'details_view' );
		setViewing( subscription );
	}, [] );
	const closeDetails = useCallback( () => setViewing( null ), [] );
	const closeCancel = useCallback( () => setCancelling( null ), [] );
	const retry = useCallback( () => refetch(), [ refetch ] );
	const onExportClick = useCallback( () => trackSubscribersEvent( 'export_click' ), [] );

	const actions = useMemo< Action< PaidSubscription >[] >(
		() => [
			{
				id: 'view',
				label: __( 'View', 'jetpack-monetize' ),
				callback: ( [ item ] ) => openDetails( item ),
			},
			{
				id: 'cancel',
				label: ( [ item ] ) =>
					item && isOneTime( item )
						? __( 'Remove payment', 'jetpack-monetize' )
						: __( 'Cancel payment', 'jetpack-monetize' ),
				callback: ( [ item ] ) => setCancelling( item ),
			},
		],
		[ openDetails ]
	);

	let content;
	if ( isError && ! data ) {
		content = (
			<Notice.Root intent="error">
				<Notice.Description>
					{ error.message ||
						__(
							'Your paid subscribers could not be loaded. Please try again.',
							'jetpack-monetize'
						) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton onClick={ retry } loading={ isFetching } disabled={ isFetching }>
						{ __( 'Try again', 'jetpack-monetize' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	} else {
		content = (
			<Stack direction="column" gap="md">
				{ isError && (
					<Notice.Root intent="error">
						<Notice.Description>
							{ error.message ||
								__( 'This page could not be loaded. Please try again.', 'jetpack-monetize' ) }
						</Notice.Description>
					</Notice.Root>
				) }
				<DataViews< PaidSubscription >
					data={ data?.subscriptions ?? [] }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					actions={ actions }
					getItemId={ getItemId }
					onClickItem={ openDetails }
					isLoading={ ! data || isPlaceholderData }
					paginationInfo={ { totalItems: total, totalPages } }
					defaultLayouts={ DEFAULT_LAYOUTS }
					config={ CONFIG }
					search={ false }
					empty={
						<Text>
							{ __( 'You don’t have any paid subscribers yet.', 'jetpack-monetize' ) }{ ' ' }
							<Link href={ getDocUrl( 'payments' ) } openInNewTab>
								{ __( 'Learn how to collect payments', 'jetpack-monetize' ) }
							</Link>
						</Text>
					}
				/>
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" gap="md" align="center" justify="space-between">
					<Card.Title render={ <h2 /> }>
						{ total
							? sprintf(
									/* translators: %s: the number of paid subscribers. */
									__( 'Paid subscribers (%s)', 'jetpack-monetize' ),
									formatNumber( total )
								)
							: __( 'Paid subscribers', 'jetpack-monetize' ) }
					</Card.Title>
					{ exportUrl && total > 0 && (
						<ButtonLink
							size="compact"
							variant="outline"
							tone="neutral"
							href={ exportUrl }
							onClick={ onExportClick }
						>
							{ __( 'Export as CSV', 'jetpack-monetize' ) }
						</ButtonLink>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>{ content }</Card.Content>
			{ viewing && ! cancelling && (
				<DetailsDialog
					subscription={ viewing }
					onClose={ closeDetails }
					onCancel={ setCancelling }
				/>
			) }
			{ cancelling && (
				<CancelDialog
					subscription={ cancelling }
					onClose={ closeCancel }
					onCancelled={ closeDetails }
				/>
			) }
		</Card.Root>
	);
}
