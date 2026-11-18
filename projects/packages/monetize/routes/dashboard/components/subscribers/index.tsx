import { formatCurrency, formatNumber } from '@automattic/number-formatters';
import { __, sprintf } from '@wordpress/i18n';
import { Button, ButtonLink, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback, useState } from 'react';
import { usePaidSubscriptions } from '../../data/subscribers';
import { trackSubscribersEvent } from '../../data/tracking';
import { getDocUrl } from '../overview/docs';
import ListRow from '../payments/list-row';
import CancelDialog from './cancel-dialog';
import DetailsDialog from './details-dialog';
import { getExportUrl, isOneTime, startDateLabel, subscriptionPriceLabel } from './subscriptions';
import type { PaidSubscription } from '../../data/subscribers';
import '../payments/style.scss';
import './style.scss';

/**
 * One subscriber's actions.
 *
 * @param props              - Component props.
 * @param props.subscription - The subscription.
 * @param props.onView       - Opens its details.
 * @param props.onCancel     - Opens the cancel dialog.
 * @return The buttons.
 */
function RowActions( {
	subscription,
	onView,
	onCancel,
}: {
	subscription: PaidSubscription;
	onView: ( subscription: PaidSubscription ) => void;
	onCancel: ( subscription: PaidSubscription ) => void;
} ) {
	const view = useCallback( () => onView( subscription ), [ onView, subscription ] );
	const cancel = useCallback( () => onCancel( subscription ), [ onCancel, subscription ] );
	const who = subscription.name || subscription.email;
	const oneTime = isOneTime( subscription );
	/* translators: %s: the subscriber's name or email address. */
	const viewLabel = sprintf( __( 'View %s', 'jetpack-monetize' ), who );
	const cancelLabel = oneTime
		? /* translators: %s: the subscriber's name or email address. */
			sprintf( __( 'Remove payment from %s', 'jetpack-monetize' ), who )
		: /* translators: %s: the subscriber's name or email address. */
			sprintf( __( 'Cancel payment from %s', 'jetpack-monetize' ), who );

	return (
		<Stack direction="row" gap="xs">
			<Button
				variant="minimal"
				tone="neutral"
				size="compact"
				onClick={ view }
				aria-label={ viewLabel }
			>
				{ __( 'View', 'jetpack-monetize' ) }
			</Button>
			<Button
				variant="minimal"
				tone="neutral"
				size="compact"
				onClick={ cancel }
				aria-label={ cancelLabel }
			>
				{ oneTime
					? __( 'Remove payment', 'jetpack-monetize' )
					: __( 'Cancel payment', 'jetpack-monetize' ) }
			</Button>
		</Stack>
	);
}

/**
 * A subscription's badges: its total and start date.
 *
 * @param subscription - The subscription.
 * @return The badges.
 */
function subscriptionBadges( subscription: PaidSubscription ): string[] {
	const badges: string[] = [
		sprintf(
			/* translators: %s: an amount, e.g. $25.00. */
			__( '%s paid in total', 'jetpack-monetize' ),
			formatCurrency( subscription.allTimeTotal, subscription.currency )
		),
	];
	const since = startDateLabel( subscription );
	if ( since ) {
		/* translators: %s: a date, e.g. March 3, 2026. */
		badges.push( sprintf( __( 'Since %s', 'jetpack-monetize' ), since ) );
	}
	return badges;
}

/**
 * The Paid subscribers tab: everyone with an active subscription or one-time payment.
 *
 * @return The tab.
 */
export default function Subscribers() {
	const {
		data,
		isError,
		error,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		refetch,
		isFetching,
	} = usePaidSubscriptions();
	const [ viewing, setViewing ] = useState< PaidSubscription | null >( null );
	const [ cancelling, setCancelling ] = useState< PaidSubscription | null >( null );
	const exportUrl = getExportUrl();

	const openDetails = useCallback( ( subscription: PaidSubscription ) => {
		trackSubscribersEvent( 'details_view' );
		setViewing( subscription );
	}, [] );
	const closeDetails = useCallback( () => setViewing( null ), [] );
	const closeCancel = useCallback( () => setCancelling( null ), [] );
	const loadMore = useCallback( () => fetchNextPage(), [ fetchNextPage ] );
	const retry = useCallback( () => refetch(), [ refetch ] );
	const onExportClick = useCallback( () => trackSubscribersEvent( 'export_click' ), [] );

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
	} else if ( ! data ) {
		content = <Text>{ __( 'Loading…', 'jetpack-monetize' ) }</Text>;
	} else if ( ! data.subscriptions.length ) {
		content = (
			<Text>
				{ __( 'You don’t have any paid subscribers yet.', 'jetpack-monetize' ) }{ ' ' }
				<Link href={ getDocUrl( 'payments' ) } openInNewTab>
					{ __( 'Learn how to collect payments', 'jetpack-monetize' ) }
				</Link>
			</Text>
		);
	} else {
		content = (
			<Stack direction="column" gap="lg">
				{ data.subscriptions.map( subscription => (
					<ListRow
						key={ subscription.id }
						title={ subscription.name || subscription.email }
						description={ subscription.name ? subscription.email : '' }
						price={ sprintf(
							/* translators: %1$s: a plan's name. %2$s: its price, e.g. $5.00/month. */
							__( '%1$s: %2$s', 'jetpack-monetize' ),
							subscription.planTitle,
							subscriptionPriceLabel( subscription )
						) }
						badges={ subscriptionBadges( subscription ) }
					>
						<RowActions
							subscription={ subscription }
							onView={ openDetails }
							onCancel={ setCancelling }
						/>
					</ListRow>
				) ) }
				{ isError && (
					<Notice.Root intent="error">
						<Notice.Description>
							{ error.message ||
								__(
									'More paid subscribers could not be loaded. Please try again.',
									'jetpack-monetize'
								) }
						</Notice.Description>
					</Notice.Root>
				) }
				{ hasNextPage && (
					<div>
						<Button
							variant="outline"
							tone="neutral"
							onClick={ loadMore }
							loading={ isFetchingNextPage }
							disabled={ isFetchingNextPage }
						>
							{ __( 'Load more', 'jetpack-monetize' ) }
						</Button>
					</div>
				) }
			</Stack>
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" gap="md" align="center" justify="space-between">
					<Card.Title render={ <h2 /> }>
						{ data?.total
							? sprintf(
									/* translators: %s: the number of paid subscribers. */
									__( 'Paid subscribers (%s)', 'jetpack-monetize' ),
									formatNumber( data.total )
								)
							: __( 'Paid subscribers', 'jetpack-monetize' ) }
					</Card.Title>
					{ exportUrl && Boolean( data?.subscriptions.length ) && (
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
