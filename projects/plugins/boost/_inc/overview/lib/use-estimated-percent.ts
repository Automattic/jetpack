import { useEffect, useState } from 'react';
import { getEstimatedPercent } from './score-utils';
import type { SpeedScoreProgress } from './use-speed-scores';

/**
 * Percent done of a running speed test, advancing every second between polls.
 *
 * @param progress - The latest progress the server reported, if any.
 * @return Percent done, or undefined when there is nothing to estimate from.
 */
export function useEstimatedPercent( progress?: SpeedScoreProgress ): number | undefined {
	const [ now, setNow ] = useState( Date.now );
	useEffect( () => {
		if ( ! progress ) {
			return;
		}
		setNow( Date.now() );
		const timer = window.setInterval( () => setNow( Date.now() ), 1000 );
		return () => window.clearInterval( timer );
	}, [ progress ] );

	if ( ! progress ) {
		return undefined;
	}
	const elapsed = progress.elapsed + Math.max( 0, now - progress.receivedAt ) / 1000;
	return getEstimatedPercent( elapsed, progress.expected );
}
