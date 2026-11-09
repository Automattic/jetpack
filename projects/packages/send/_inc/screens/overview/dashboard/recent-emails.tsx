import { useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Card, Skeleton, Stack, Text } from '@wordpress/ui';
import Avatar from '../../../components/avatar';
import ResentBadge from '../../../components/resent-badge';
import RouteLink from '../../../components/route-link';
import { emailTime, fullTime, parseUtc } from '../../../data/dates';
import { failureSummary } from '../../../data/failure-reasons';
import { logEntryHref } from '../../../data/log-link';
import { retentionLabel } from '../../../data/period';
import StatusBadge from '../../log/status-badge';
import TestBadge from '../../log/test-badge';
import { shortSubject } from './dashboard-state';
import type { LogRow } from '../../../data/types';

type Props = {
	rows: LogRow[] | null;
	error: string | null;
	now: number;
	/** The sending domain, for the plain failure reason. */
	domain: string;
	/** The site's title, which WordPress puts in front of its own subjects. */
	siteTitle?: string;
	/** Accounts come from the local development provisioner. */
	devMode?: boolean;
	/** The dashboard has counted emails, so an empty list means the log deleted them. */
	hasHistory?: boolean;
	/** Days the log keeps emails; 0 for forever. */
	retentionDays?: number;
};

/** Rows the list holds once loaded, so the placeholder takes the same space. */
const ROWS = 5;

/**
 * The last five emails, each linking to its row in the Log: who it went to and when under the
 * subject, and the status badges lined up on the right edge.
 *
 * @param props               - Component props.
 * @param props.rows          - Rows, or null while loading.
 * @param props.error         - The load error, if any.
 * @param props.now           - The current time in ms.
 * @param props.domain        - The sending domain.
 * @param props.siteTitle     - The site's title.
 * @param props.devMode       - Accounts come from the local development provisioner.
 * @param props.hasHistory    - The dashboard has counted emails.
 * @param props.retentionDays - Days the log keeps emails.
 * @return The card.
 */
const RecentEmails = ( {
	rows,
	error,
	now,
	domain,
	siteTitle = '',
	devMode = false,
	hasHistory = false,
	retentionDays = 0,
}: Props ) => {
	const titleId = useId();
	let body;
	if ( error ) {
		body = (
			<Text variant="body-lg" render={ <p /> } className="jetpack-send-card__text">
				{ error }
			</Text>
		);
	} else if ( ! rows ) {
		body = (
			<div aria-hidden="true" className="jetpack-send-list jetpack-send-list--recent">
				{ Array.from( { length: ROWS }, ( _, index ) => (
					<div key={ index } className="jetpack-send-list__row">
						<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--avatar" />
						<Skeleton className="jetpack-send-skeleton jetpack-send-skeleton--line" />
					</div>
				) ) }
			</div>
		);
	} else if ( rows.length === 0 ) {
		let empty: string = __( 'No emails yet.', 'jetpack-send-pkg' );
		if ( hasHistory && retentionDays > 0 ) {
			empty = sprintf(
				/* translators: %s: how long the log keeps emails, e.g. "1 week". */
				__( 'No emails in the log right now. It keeps emails for %s.', 'jetpack-send-pkg' ),
				retentionLabel( retentionDays )
			);
		} else if ( hasHistory ) {
			empty = __( 'No emails in the log right now.', 'jetpack-send-pkg' );
		}
		body = (
			<Text
				variant="body-lg"
				render={ <p /> }
				className="jetpack-send-card__text jetpack-send-muted"
			>
				{ empty }
			</Text>
		);
	} else {
		body = (
			<ul
				className="jetpack-send-list jetpack-send-list--recent"
				role="list"
				aria-labelledby={ titleId }
			>
				{ rows.map( row => {
					const subject = row.subject || __( '(No subject)', 'jetpack-send-pkg' );
					const sentAt = parseUtc( row.created_at );
					const valid = ! isNaN( sentAt.getTime() );
					return (
						<li key={ row.id } className="jetpack-send-list__row">
							<Avatar name={ row.recipients } url={ row.avatar_url } />
							<span className="jetpack-send-list__main">
								<Text variant="body-lg" className="jetpack-send-list__subject">
									<RouteLink
										href={ logEntryHref( row.id ) }
										className="jetpack-send-list__truncate jetpack-send-list__title"
										title={ subject }
										plain
									>
										{ shortSubject( subject, siteTitle ) }
									</RouteLink>
									{ row.source === 'test' && <TestBadge className="jetpack-send-list__badge" /> }
									{ row.source === 'resend' && (
										<ResentBadge className="jetpack-send-list__badge" />
									) }
								</Text>
								<Text variant="body-md" className="jetpack-send-muted jetpack-send-list__meta">
									<span className="jetpack-send-list__truncate" title={ row.recipients }>
										{ sprintf(
											/* translators: %s: who the email went to. */
											__( 'to %s', 'jetpack-send-pkg' ),
											row.recipients
										) }
									</span>
									<span aria-hidden="true">·</span>
									<time
										className="jetpack-send-list__time"
										dateTime={ valid ? sentAt.toISOString() : undefined }
										title={ valid ? fullTime( sentAt ) : undefined }
									>
										{ emailTime( sentAt, now ) }
									</time>
								</Text>
							</span>
							<span className="jetpack-send-list__status">
								<StatusBadge
									status={ row.status }
									error={ row.status === 'sent' ? '' : failureSummary( row, domain, { devMode } ) }
								/>
							</span>
						</li>
					);
				} ) }
			</ul>
		);
	}

	return (
		<Card.Root className="jetpack-send-dashboard__card">
			<Card.Header>
				<Card.Title id={ titleId } render={ <h2 /> }>
					{ __( 'Recent emails', 'jetpack-send-pkg' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					{ body }
					{ !! rows?.length && (
						<Text variant="body-lg" render={ <div /> } className="jetpack-send-dashboard__footer">
							<RouteLink href="/log">{ __( 'View all in Log', 'jetpack-send-pkg' ) }</RouteLink>
						</Text>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default RecentEmails;
