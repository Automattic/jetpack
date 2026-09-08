import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import { Notice } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

// The label ages while the notice sits on screen, so it re-renders on a timer.
const TICK_MS = 60 * 1000;

type StaleDataNoticeProps = {
	/** When the data still on screen was last fetched, in epoch ms. */
	updatedAt: number;

	/** Omit where retrying cannot help, and the notice drops the button with it. */
	onRetry?: () => void;

	isRetrying?: boolean;

	className?: string;
};

function useAgeSince( updatedAt: number ): number {
	const [ now, setNow ] = useState( () => Date.now() );

	useEffect( () => {
		const tick = setInterval( () => setNow( Date.now() ), TICK_MS );
		return () => clearInterval( tick );
	}, [] );

	return now - updatedAt;
}

/**
 * Tells the reader that the numbers in front of them did not refresh, without
 * taking them away: they are older than the reader asked for, not wrong.
 */
export function StaleDataNotice( {
	updatedAt,
	onRetry,
	isRetrying = false,
	className,
}: StaleDataNoticeProps ) {
	const age = useAgeSince( updatedAt );
	// Below a minute the relative label counts seconds, down to "0 seconds ago".
	const message =
		age < TICK_MS
			? __(
					"Couldn't refresh. Showing data from less than a minute ago.",
					'jetpack-premium-analytics-pkg'
			  )
			: sprintf(
					/* translators: %s: how long ago the data on screen was fetched, e.g. "5 minutes ago". */
					__( "Couldn't refresh. Showing data from %s.", 'jetpack-premium-analytics-pkg' ),
					formatRelativeSince( new Date( updatedAt ).toISOString(), new Date( updatedAt + age ) )
			  );

	return (
		// A fixed announcement, not `message`: the ageing label would interrupt a
		// screen reader every minute, and the default (children) would trail Retry's label.
		<Notice.Root
			intent="warning"
			className={ className }
			spokenMessage={ __(
				"Couldn't refresh. The numbers on screen may be out of date.",
				'jetpack-premium-analytics-pkg'
			) }
		>
			<Notice.Description>{ message }</Notice.Description>
			{ onRetry && (
				<Notice.Actions>
					<Notice.ActionButton
						variant="outline"
						onClick={ onRetry }
						disabled={ isRetrying }
						loading={ isRetrying }
					>
						{ __( 'Retry', 'jetpack-premium-analytics-pkg' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
