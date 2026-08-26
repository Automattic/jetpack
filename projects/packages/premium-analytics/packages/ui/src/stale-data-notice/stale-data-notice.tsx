import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import { Notice } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

// The label ages while the notice sits on screen, so it re-renders on a timer.
// A minute keeps it roughly current without a render for every second.
const TICK_MS = 60 * 1000;

type StaleDataNoticeProps = {
	/**
	 * When the data still on screen was last fetched, in epoch ms.
	 */
	updatedAt: number;

	/**
	 * Retry handler. Omit it where retrying cannot help (auth, permissions, a
	 * malformed response) and the notice drops the button rather than offering a
	 * dead end.
	 */
	onRetry?: () => void;

	/**
	 * A retry is already in flight. The button stays visible but stops accepting
	 * clicks, so a slow refetch does not read as a dead button.
	 */
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
 *
 * @param {StaleDataNoticeProps} props            - Component props.
 * @param {number}               props.updatedAt  - When the data on screen was last fetched, in epoch ms.
 * @param {Function}             props.onRetry    - Retry handler; omitted where retrying cannot help.
 * @param {boolean}              props.isRetrying - Whether a retry is already in flight.
 * @param {string}               props.className  - Optional class for layout tweaks.
 * @return The notice element.
 */
export function StaleDataNotice( {
	updatedAt,
	onRetry,
	isRetrying = false,
	className,
}: StaleDataNoticeProps ) {
	const age = useAgeSince( updatedAt );
	// Below a minute the relative label counts seconds, down to "0 seconds ago"
	// — precision the reader has no use for, and a sentence that reads broken.
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
		// A fixed announcement, not `message`: the visible label ages every
		// minute, and announcing each new wording would interrupt a screen
		// reader for as long as the notice stays up. Left to default to the
		// children, it would also trail the Retry button's label.
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
