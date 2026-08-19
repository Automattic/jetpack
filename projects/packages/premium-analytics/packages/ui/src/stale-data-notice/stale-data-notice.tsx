import { formatRelativeSince } from '@jetpack-premium-analytics/datetime';
import { Notice } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

// The label ages while the notice sits on screen, so it is re-rendered on the
// coarsest unit it can show.
const TICK_MS = 60 * 1000;

type StaleDataNoticeProps = {
	/**
	 * When the data still on screen was last fetched, in epoch ms.
	 */
	updatedAt: number;

	/**
	 * Retry handler. Omit it where retrying cannot help (auth, permissions) and
	 * the notice drops the button rather than offering a dead end.
	 */
	onRetry?: () => void;

	className?: string;
};

function useRelativeSince( updatedAt: number ): string {
	const [ now, setNow ] = useState( () => new Date() );

	useEffect( () => {
		const tick = setInterval( () => setNow( new Date() ), TICK_MS );
		return () => clearInterval( tick );
	}, [] );

	return formatRelativeSince( new Date( updatedAt ).toISOString(), now );
}

/**
 * Tells the reader that the numbers in front of them did not refresh, without
 * taking them away: they are older than the reader asked for, not wrong.
 *
 * @param {StaleDataNoticeProps} props           - Component props.
 * @param {number}               props.updatedAt - When the data on screen was last fetched, in epoch ms.
 * @param {Function}             props.onRetry   - Retry handler; omitted where retrying cannot help.
 * @param {string}               props.className - Optional class for layout tweaks.
 * @return The notice element.
 */
export function StaleDataNotice( { updatedAt, onRetry, className }: StaleDataNoticeProps ) {
	const since = useRelativeSince( updatedAt );
	const message = sprintf(
		/* translators: %s: how long ago the data on screen was fetched, e.g. "5 minutes ago". */
		__( 'Couldn’t refresh. Showing data from %s.', 'jetpack-premium-analytics-pkg' ),
		since
	);

	return (
		// The announcement is the sentence alone: left to default to the
		// children, it trails the Retry button's label.
		<Notice.Root intent="warning" className={ className } spokenMessage={ message }>
			<Notice.Description>{ message }</Notice.Description>
			{ onRetry && (
				<Notice.Actions>
					<Notice.ActionButton variant="outline" onClick={ onRetry }>
						{ __( 'Retry', 'jetpack-premium-analytics-pkg' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
