import { formatNumber } from '@automattic/number-formatters';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice, Progress, Stack } from '@wordpress/ui';
import { isBulkRemoveActive } from '../data/use-bulk-remove';
import { isNarrowed } from '../lib/bulk-remove-scope';
import type { BulkRemoveJob } from '../data/types';
import type { JSX } from 'react';

// A finished removal stays on the screen for a day, so someone who left the page sees how it went.
const SHOW_FINISHED_FOR_SECONDS = 24 * 60 * 60;
const DISMISSED_KEY = 'jetpack-newsletter-bulk-remove-dismissed';

/**
 * Read the id of the last finished removal the viewer closed. Storage can be missing or blocked,
 * so this falls back to none.
 *
 * @return Job id, or 0.
 */
function readDismissed(): number {
	try {
		return Number( window.localStorage.getItem( DISMISSED_KEY ) ) || 0;
	} catch {
		return 0;
	}
}

/**
 * Remember that the viewer closed this finished removal's notice.
 *
 * @param jobId - Job id.
 */
function writeDismissed( jobId: number ): void {
	try {
		window.localStorage.setItem( DISMISSED_KEY, String( jobId ) );
	} catch {
		// The notice comes back on the next load, which is fine.
	}
}

type Props = {
	job: BulkRemoveJob | null;
};

/**
 * Progress of a bulk removal above the table: a bar while it runs, then what it removed and how
 * many subscribers are left. Shows the site's running removal on load too, so leaving the page
 * and coming back keeps the progress.
 *
 * @param props     - Component props.
 * @param props.job - The current or latest removal, from the status route.
 * @return Notice, or null when there is nothing to show.
 */
export default function BulkRemoveNotice( { job }: Props ): JSX.Element | null {
	const [ dismissed, setDismissed ] = useState( readDismissed );
	const dismiss = useCallback( () => {
		if ( job ) {
			writeDismissed( job.id );
			setDismissed( job.id );
		}
	}, [ job ] );

	if ( ! job ) {
		return null;
	}

	const matching = isNarrowed( job.filters ?? [], job.search ?? '' );
	const total = job.total;

	if ( isBulkRemoveActive( job ) ) {
		// `total` stays 0 until the backup is written. Removing everyone removes the whole list, so
		// its size from before can stand in; a filtered removal has no count until then.
		const expected = total || ( matching ? 0 : ( job.counts_before?.total ?? 0 ) );
		let label: string;
		if ( ! expected ) {
			label = matching
				? __(
						'Removing matching subscribers. This can take a few minutes, and you can leave this page.',
						'jetpack-newsletter'
					)
				: __(
						'Removing subscribers. This can take a few minutes, and you can leave this page.',
						'jetpack-newsletter'
					);
		} else {
			label = matching
				? sprintf(
						// translators: %s: number of subscribers.
						_n(
							'Removing %s matching subscriber. This can take a few minutes, and you can leave this page.',
							'Removing %s matching subscribers. This can take a few minutes, and you can leave this page.',
							expected,
							'jetpack-newsletter'
						),
						formatNumber( expected )
					)
				: sprintf(
						// translators: %s: number of subscribers.
						_n(
							'Removing %s subscriber. This can take a few minutes, and you can leave this page.',
							'Removing %s subscribers. This can take a few minutes, and you can leave this page.',
							expected,
							'jetpack-newsletter'
						),
						formatNumber( expected )
					);
		}
		const processed = Math.min( job.processed, total );
		return (
			<Notice.Root intent="info" className="jetpack-newsletter__bulk-remove-notice">
				<Stack direction="column" gap="sm">
					<Notice.Description>{ label }</Notice.Description>
					<Progress.Root
						value={ total ? processed : null }
						max={ total || 1 }
						aria-label={ __( 'Subscriber removal progress', 'jetpack-newsletter' ) }
					>
						<Progress.Track>
							<Progress.Indicator />
						</Progress.Track>
						<Progress.Value>
							{ () =>
								job.status === 'removing' || job.status === 'finishing'
									? sprintf(
											// translators: %1$s: subscribers removed so far. %2$s: total to remove.
											__( '%1$s of %2$s', 'jetpack-newsletter' ),
											formatNumber( processed ),
											formatNumber( total )
										)
									: __( 'Saving a backup first…', 'jetpack-newsletter' )
							}
						</Progress.Value>
					</Progress.Root>
				</Stack>
			</Notice.Root>
		);
	}

	const finishedAt = job.finished_at ?? job.updated_at;
	const isRecent = Date.now() / 1000 - finishedAt < SHOW_FINISHED_FOR_SECONDS;
	if ( ! isRecent || dismissed === job.id ) {
		return null;
	}

	const left = job.counts_after?.total;
	const removedLine = sprintf(
		// translators: %s: number of subscribers removed.
		_n( 'Removed %s subscriber.', 'Removed %s subscribers.', job.removed, 'jetpack-newsletter' ),
		formatNumber( job.removed )
	);
	const failedLine = job.failed
		? sprintf(
				// translators: %s: number of subscribers that could not be removed.
				_n(
					'%s subscriber could not be removed.',
					'%s subscribers could not be removed.',
					job.failed,
					'jetpack-newsletter'
				),
				formatNumber( job.failed )
			)
		: '';
	let leftLine = '';
	if ( left === 0 ) {
		leftLine = __( 'Your list is now empty.', 'jetpack-newsletter' );
	} else if ( typeof left === 'number' ) {
		leftLine = sprintf(
			// translators: %s: number of subscribers still on the list.
			_n(
				'%s subscriber is still on your list.',
				'%s subscribers are still on your list.',
				left,
				'jetpack-newsletter'
			),
			formatNumber( left )
		);
	}

	if ( job.status === 'done' ) {
		return (
			<Notice.Root intent="success" className="jetpack-newsletter__bulk-remove-notice">
				<Notice.Description>
					{ [ removedLine, failedLine, leftLine ].filter( Boolean ).join( ' ' ) }
				</Notice.Description>
				<Notice.CloseIconButton onClick={ dismiss } />
			</Notice.Root>
		);
	}

	// Failed, stopped, or stalled with no progress for an hour.
	const stoppedLine = sprintf(
		// translators: %1$s: subscribers removed. %2$s: total the removal meant to remove.
		_n(
			'The removal stopped after removing %1$s of %2$s subscriber.',
			'The removal stopped after removing %1$s of %2$s subscribers.',
			total,
			'jetpack-newsletter'
		),
		formatNumber( job.removed ),
		formatNumber( total )
	);
	return (
		<Notice.Root intent="error" className="jetpack-newsletter__bulk-remove-notice">
			<Notice.Description>
				{ stoppedLine }{ ' ' }
				{ __(
					'You can start it again from the menu above, or contact support if it keeps stopping.',
					'jetpack-newsletter'
				) }
			</Notice.Description>
			<Notice.CloseIconButton onClick={ dismiss } />
		</Notice.Root>
	);
}
