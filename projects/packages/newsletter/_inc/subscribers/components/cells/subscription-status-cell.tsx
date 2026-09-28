import { Badge, Tooltip } from '@wordpress/ui';
import {
	getSubscriptionStatusLabel,
	getSubscriptionStatusReasonLabel,
} from '../../lib/subscription-status';
import type { SubscriptionStatus, SubscriptionStatusReason } from '../../data/types';
import './subscription-status-cell.scss';

type Props = {
	status?: SubscriptionStatus;
	reason?: SubscriptionStatusReason | null;
};

type BadgeIntent = React.ComponentProps< typeof Badge >[ 'intent' ];

/**
 * Map a `SubscriptionStatus` onto a `Badge` intent so the table communicates
 * the state through color rather than text alone (Subscribed → stable,
 * Not confirmed → low/pending, Not sending → high, Not subscribed → draft).
 *
 * @param status - Raw status string from the API.
 * @return Badge intent paired with the status.
 */
function getBadgeIntent( status: SubscriptionStatus ): BadgeIntent {
	switch ( status ) {
		case 'Subscribed':
			return 'stable';
		case 'Not confirmed':
		case 'Unconfirmed':
			return 'low';
		case 'Not sending':
		case 'Blocked':
			return 'high';
		case 'Not subscribed':
			return 'draft';
		default:
			return 'none';
	}
}

/**
 * Email-subscription status cell — renders the translated label as a `Badge` with a semantic
 * intent so the state communicates through color in addition to text. Returns null when the
 * status is missing so callers don't have to guard their JSX (the individual-subscriber endpoint
 * occasionally omits `subscription_status`, where the list endpoint always includes it).
 *
 * @param props        - Component props.
 * @param props.status - Raw status string from the API.
 * @param props.reason - Raw subscription_status_reason from the API; names the badge and adds a tooltip.
 * @return Status badge, or null when status is missing.
 */
export default function SubscriptionStatusCell( { status, reason }: Props ): JSX.Element | null {
	if ( ! status ) {
		return null;
	}

	const badgeLabel = getSubscriptionStatusLabel( status, reason );
	const badge = <Badge intent={ getBadgeIntent( status ) }>{ badgeLabel }</Badge>;
	const description = getSubscriptionStatusReasonLabel( reason );

	if ( ! description ) {
		return badge;
	}

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				className="jetpack-newsletter__status-reason-trigger"
				aria-label={ `${ badgeLabel }: ${ description }` }
			>
				{ badge }
			</Tooltip.Trigger>
			<Tooltip.Popup>{ description }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
