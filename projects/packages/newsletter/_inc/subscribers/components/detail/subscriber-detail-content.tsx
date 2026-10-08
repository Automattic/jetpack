import Gravatar from '@automattic/jetpack-components/gravatar';
import { Spinner } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useCallback } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { useSendBounceConfirmationMutation } from '../../data/use-send-bounce-confirmation-mutation';
import {
	useSubscribedNewsletterCategories,
	useSubscriberDetails,
	useSubscriberStats,
} from '../../data/use-subscriber-details';
import { formatMetric, formatRate } from '../../lib/format-metric';
import { getSubscribedAt } from '../../lib/subscriber-helpers';
import SubscriptionStatusCell from '../cells/subscription-status-cell';
import SubscriptionTypeCell from '../cells/subscription-type-cell';
import type { BounceRetry, Subscriber } from '../../data/types';
import type { JSX } from 'react';

type Props = {
	open: {
		subscriptionId?: number;
		userId?: number;
	};
};

/**
 * Format a date in the site's locale; returns empty if the value can't be parsed.
 *
 * @param value - ISO-ish date.
 * @return Formatted date.
 */
function formatDate( value?: string | null ): string {
	if ( ! value ) {
		return '';
	}
	return dateI18n( getDateSettings().formats.date, value, undefined );
}

/**
 * Compute a percentage from numerator/denominator, clamped 0–100. Returns null when there's no
 * denominator (so the caller can render a dash instead of 0%).
 *
 * @param numerator   - Top of the ratio.
 * @param denominator - Bottom of the ratio.
 * @return Percentage (0–100) or null when denominator is 0/undefined.
 */
function ratePercent( numerator: number, denominator: number ): number | null {
	if ( ! denominator ) {
		return null;
	}
	const pct = Math.round( ( numerator / denominator ) * 100 );
	return Math.min( 100, Math.max( 0, pct ) );
}

/**
 * Stat tile in the detail view's hero row (Emails sent / Open rate / Click rate).
 *
 * @param props       - Tile props.
 * @param props.label - Stat label.
 * @param props.value - Stat value (string already formatted).
 * @return Card containing the labeled stat.
 */
function StatCard( { label, value }: { label: string; value: string } ): JSX.Element {
	return (
		<Card.Root className="jetpack-newsletter__detail-stat">
			<Card.Content>
				<Text variant="heading-sm" className="jetpack-newsletter__detail-stat-label">
					{ label }
				</Text>
				<Text
					variant="heading-xl"
					render={ <span /> }
					className="jetpack-newsletter__detail-stat-value"
				>
					{ value }
				</Text>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * Section heading for the grouped sections in the detail view.
 *
 * @param props          - Section props.
 * @param props.title    - Section heading.
 * @param props.children - Section body (rows).
 * @return Card containing a header and the body.
 */
function DetailSection( {
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
} ): JSX.Element {
	return (
		<Card.Root className="jetpack-newsletter__detail-section">
			<Card.Header>
				<Card.Title>
					<Text variant="heading-sm" render={ <h3 /> }>
						{ title }
					</Text>
				</Card.Title>
			</Card.Header>
			<Card.Content>{ children }</Card.Content>
		</Card.Root>
	);
}

/**
 * Row inside a `DetailSection`. Renders a label / value pair; hides itself when the value is
 * empty so optional fields don't leave gaps.
 *
 * @param props       - Row props.
 * @param props.label - Field label.
 * @param props.value - Field value (string, node, or null).
 * @return The row, or null when empty.
 */
function DetailRow( {
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
} ): JSX.Element | null {
	if ( value == null || value === '' ) {
		return null;
	}
	return (
		<Stack
			direction="row"
			align="center"
			justify="space-between"
			gap="md"
			wrap="wrap"
			className="jetpack-newsletter__detail-row"
		>
			<Text variant="body-sm" className="jetpack-newsletter__detail-row-label">
				{ label }
			</Text>
			<Text variant="body-md" render={ <span /> }>
				{ value }
			</Text>
		</Stack>
	);
}

/**
 * Bounce explanation and "Send confirmation email" button for a bounced subscriber.
 *
 * @param props                     - Component props.
 * @param props.emailSubscriptionId - Email subscription id; the button is hidden without one.
 * @param props.bounceRetry         - Bounce retry state from the API.
 * @return Bounce retry block.
 */
function BounceRetryNotice( {
	emailSubscriptionId,
	bounceRetry,
}: {
	emailSubscriptionId?: number;
	bounceRetry?: BounceRetry | null;
} ): JSX.Element {
	const { mutate, isPending } = useSendBounceConfirmationMutation();
	const canRetry = !! bounceRetry?.can_retry;

	const send = useCallback( () => {
		if ( emailSubscriptionId ) {
			mutate( emailSubscriptionId );
		}
	}, [ emailSubscriptionId, mutate ] );

	let note = '';
	if ( bounceRetry?.sent_on ) {
		note = sprintf(
			// translators: %s: date the confirmation email was sent.
			__( 'Confirmation email sent on %s.', 'jetpack-newsletter' ),
			formatDate( bounceRetry.sent_on )
		);
	} else if ( bounceRetry?.available_on && ! canRetry ) {
		note = sprintf(
			// translators: %s: date after which a confirmation email can be sent.
			__( 'You can send a confirmation email after %s.', 'jetpack-newsletter' ),
			formatDate( bounceRetry.available_on )
		);
	}

	return (
		<Stack direction="column" gap="sm" align="start">
			<Text variant="body-sm">
				{ __(
					"We stopped sending emails to this subscriber after their address bounced. If you're sure their address is correct, you can send one confirmation email to ask to restart their subscription.",
					'jetpack-newsletter'
				) }
			</Text>
			{ emailSubscriptionId ? (
				<Button
					variant="outline"
					tone="neutral"
					size="compact"
					loading={ isPending }
					disabled={ isPending || ! canRetry }
					onClick={ send }
				>
					{ __( 'Send confirmation email', 'jetpack-newsletter' ) }
				</Button>
			) : null }
			{ note ? <Text variant="body-sm">{ note }</Text> : null }
		</Stack>
	);
}

/**
 * Body content for the subscriber detail view — header (avatar + name + email), 3-column stat
 * row (Emails sent / Open rate / Click rate), then grouped Subscription details and Subscriber
 * information sections. Layout-agnostic: renders identically inside the desktop side-panel and
 * the mobile Modal.
 *
 * @param props      - Component props.
 * @param props.open - Subscriber identifiers (must be non-null; the parent gates rendering).
 * @return Detail body.
 */
export default function SubscriberDetailContent( { open }: Props ): JSX.Element {
	const detailsQuery = useSubscriberDetails( {
		subscription_id: open.subscriptionId,
		user_id: open.userId,
	} );

	const statsQuery = useSubscriberStats( {
		subscription_id: open.subscriptionId,
		user_id: open.userId,
	} );

	const categoriesQuery = useSubscribedNewsletterCategories( {
		subscription_id: open.subscriptionId,
		user_id: open.userId,
	} );

	const { refetch } = detailsQuery;
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	const subscriber = detailsQuery.data;
	const stats = statsQuery.data;

	const categoriesEnabled = !! categoriesQuery.data?.enabled;
	// WordPress stores term names HTML-encoded (`Tips &amp; Tricks`) and WP.com passes them through
	// as stored, so they have to be decoded before rendering as text.
	const subscribedCategories = ( categoriesQuery.data?.newsletter_categories ?? [] )
		.filter( category => category.subscribed )
		.map( category => decodeEntities( category.name ) );

	if ( detailsQuery.isError && ! subscriber ) {
		return (
			<Notice.Root intent="error">
				<Notice.Title>
					{ __( 'Could not load subscriber details.', 'jetpack-newsletter' ) }
				</Notice.Title>
				<Notice.Description>{ detailsQuery.error.message }</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton loading={ detailsQuery.isFetching } onClick={ retry }>
						{ __( 'Try again', 'jetpack-newsletter' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	}

	if ( detailsQuery.isLoading || ! subscriber ) {
		return (
			<Stack
				direction="row"
				align="center"
				justify="center"
				className="jetpack-newsletter__detail-loading"
			>
				<Spinner />
			</Stack>
		);
	}

	const showEmail =
		!! subscriber.email_address && subscriber.email_address !== subscriber.display_name;

	const emailsSent = stats?.emails_sent ?? 0;
	const uniqueOpens = stats?.unique_opens ?? 0;
	const uniqueClicks = stats?.unique_clicks ?? 0;
	const openRate = ratePercent( uniqueOpens, emailsSent );
	const clickRate = ratePercent( uniqueClicks, emailsSent );
	const dash = '—';

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="row" align="center" gap="md">
				{ subscriber.email_address ? (
					<Gravatar
						email={ subscriber.email_address }
						displayName={ subscriber.display_name }
						size={ 64 }
						className="jetpack-newsletter__detail-avatar"
					/>
				) : null }
				<Stack direction="column" gap="xs">
					<Text variant="heading-lg" render={ <h2 /> }>
						{ subscriber.display_name || subscriber.email_address }
					</Text>
					{ showEmail ? (
						<Text variant="body-md" className="jetpack-newsletter__detail-email">
							{ subscriber.email_address }
						</Text>
					) : null }
				</Stack>
			</Stack>

			<Stack direction="row" gap="sm" wrap="wrap" className="jetpack-newsletter__detail-stats">
				<StatCard
					label={ __( 'Emails sent', 'jetpack-newsletter' ) }
					value={ statsQuery.isLoading ? dash : formatMetric( emailsSent ) }
				/>
				<StatCard
					label={ __( 'Open rate', 'jetpack-newsletter' ) }
					value={ statsQuery.isLoading ? dash : formatRate( openRate ) }
				/>
				<StatCard
					label={ __( 'Click rate', 'jetpack-newsletter' ) }
					value={ statsQuery.isLoading ? dash : formatRate( clickRate ) }
				/>
			</Stack>

			<DetailSection title={ __( 'Newsletter subscription details', 'jetpack-newsletter' ) }>
				<Stack direction="column" gap="md">
					<DetailRow
						label={ __( 'Date subscribed', 'jetpack-newsletter' ) }
						value={ formatDate( getSubscribedAt( subscriber ) ) }
					/>
					{ categoriesEnabled ? (
						<DetailRow
							label={ __( 'Receives emails for', 'jetpack-newsletter' ) }
							value={
								subscribedCategories.length
									? subscribedCategories.join( ', ' )
									: __( 'Not subscribed to any newsletter categories', 'jetpack-newsletter' )
							}
						/>
					) : null }
					<DetailRow
						label={ __( 'Email subscription', 'jetpack-newsletter' ) }
						value={
							subscriber.subscription_status ? (
								<SubscriptionStatusCell
									status={ subscriber.subscription_status }
									reason={ subscriber.subscription_status_reason }
								/>
							) : null
						}
					/>
					{ subscriber.subscription_status_reason === 'bounced' ? (
						<BounceRetryNotice
							emailSubscriptionId={ subscriber.email_subscription_id }
							bounceRetry={ subscriber.bounce_retry }
						/>
					) : null }
					<DetailRow
						label={ __( 'Subscription type', 'jetpack-newsletter' ) }
						value={ <SubscriptionTypeCell subscriber={ subscriber as Subscriber } /> }
					/>
				</Stack>
			</DetailSection>

			<DetailSection title={ __( 'Subscriber information', 'jetpack-newsletter' ) }>
				<Stack direction="column" gap="md">
					<DetailRow
						label={ __( 'Email', 'jetpack-newsletter' ) }
						value={ subscriber.email_address }
					/>
					<DetailRow
						label={ __( 'Country', 'jetpack-newsletter' ) }
						value={ subscriber.country?.name }
					/>
					<DetailRow
						label={ __( 'Site', 'jetpack-newsletter' ) }
						value={
							subscriber.url ? (
								<Link href={ subscriber.url } openInNewTab tone="neutral">
									{ subscriber.url }
								</Link>
							) : null
						}
					/>
				</Stack>
			</DetailSection>
		</Stack>
	);
}
