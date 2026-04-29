import { Spinner } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useSubscriberDetails, useSubscriberStats } from '../../data/use-subscriber-details';
import { getSubscribedAt } from '../../lib/subscriber-helpers';
import { getSubscriptionStatusLabel } from '../../lib/subscription-status';
import SubscriptionTypeCell from '../cells/subscription-type-cell';
import type { Subscriber } from '../../data/types';
import type { OpenSubscriber } from '../../lib/use-open-subscriber';

type Props = {
	open: NonNullable< OpenSubscriber >;
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
 * Render a single label/value row in the detail grid. Hides itself when the value is empty.
 *
 * @param props       - Row props.
 * @param props.label - Field label.
 * @param props.value - Field value (string, node, or null).
 * @return Label + value pair.
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
		<div className="jetpack-subscribers-dashboard__detail-row">
			<span className="jetpack-subscribers-dashboard__detail-row-label">{ label }</span>
			<span className="jetpack-subscribers-dashboard__detail-row-value">{ value }</span>
		</div>
	);
}

/**
 * Body content for the subscriber detail view — fetches profile + stats and lays them out in a
 * label/value grid plus an Engagement section. Layout-agnostic: renders identically inside the
 * desktop side-panel and the mobile Modal.
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

	const subscriber = detailsQuery.data;
	const stats = statsQuery.data;

	if ( detailsQuery.isLoading || ! subscriber ) {
		return (
			<div className="jetpack-subscribers-dashboard__detail-loading">
				<Spinner />
			</div>
		);
	}

	return (
		<>
			<div className="jetpack-subscribers-dashboard__detail-header">
				{ subscriber.avatar ? (
					<img
						className="jetpack-subscribers-dashboard__detail-avatar"
						src={ subscriber.avatar }
						alt=""
						width={ 64 }
						height={ 64 }
					/>
				) : null }
				<div>
					<div className="jetpack-subscribers-dashboard__detail-name">
						{ subscriber.display_name || subscriber.email_address }
					</div>
					{ subscriber.email_address && subscriber.email_address !== subscriber.display_name ? (
						<p className="jetpack-subscribers-dashboard__detail-email">
							{ subscriber.email_address }
						</p>
					) : null }
				</div>
			</div>

			<div className="jetpack-subscribers-dashboard__detail-grid">
				<DetailRow
					label={ __( 'Date subscribed', 'jetpack-subscribers-dashboard' ) }
					value={ formatDate( getSubscribedAt( subscriber ) ) }
				/>
				<DetailRow
					label={ __( 'Email subscription', 'jetpack-subscribers-dashboard' ) }
					value={ getSubscriptionStatusLabel( subscriber.subscription_status ) }
				/>
				<DetailRow
					label={ __( 'Subscription type', 'jetpack-subscribers-dashboard' ) }
					value={ <SubscriptionTypeCell subscriber={ subscriber as Subscriber } /> }
				/>
				<DetailRow
					label={ __( 'Country', 'jetpack-subscribers-dashboard' ) }
					value={ subscriber.country?.name }
				/>
				<DetailRow
					label={ __( 'Site', 'jetpack-subscribers-dashboard' ) }
					value={
						subscriber.url ? (
							<a href={ subscriber.url } target="_blank" rel="noreferrer">
								{ subscriber.url }
							</a>
						) : null
					}
				/>
			</div>

			<h3 className="jetpack-subscribers-dashboard__detail-section-title">
				{ __( 'Engagement', 'jetpack-subscribers-dashboard' ) }
			</h3>
			<div className="jetpack-subscribers-dashboard__detail-stats">
				{ statsQuery.isLoading ? (
					<Spinner />
				) : (
					<>
						<DetailRow
							label={ __( 'Emails sent', 'jetpack-subscribers-dashboard' ) }
							value={ stats?.emails_sent ?? 0 }
						/>
						<DetailRow
							label={ __( 'Unique opens', 'jetpack-subscribers-dashboard' ) }
							value={ stats?.unique_opens ?? 0 }
						/>
						<DetailRow
							label={ __( 'Unique clicks', 'jetpack-subscribers-dashboard' ) }
							value={ stats?.unique_clicks ?? 0 }
						/>
					</>
				) }
			</div>

			{ stats?.blog_registration_date ? (
				<p className="jetpack-subscribers-dashboard__detail-meta">
					{ sprintf(
						// translators: %s: date the subscriber registered with the blog.
						__( 'Joined %s.', 'jetpack-subscribers-dashboard' ),
						formatDate( stats.blog_registration_date )
					) }
				</p>
			) : null }

			{ stats && ( stats.emails_sent ?? 0 ) > 0 && typeof stats.unique_opens === 'number' ? (
				<p className="jetpack-subscribers-dashboard__detail-meta">
					{ sprintf(
						// translators: %1$d: emails sent. %2$d: unique opens.
						_n(
							'%1$d email sent · %2$d open.',
							'%1$d emails sent · %2$d opens.',
							stats.emails_sent ?? 0,
							'jetpack-subscribers-dashboard'
						),
						stats.emails_sent ?? 0,
						stats.unique_opens ?? 0
					) }
				</p>
			) : null }
		</>
	);
}
