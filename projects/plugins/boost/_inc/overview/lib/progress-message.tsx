import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { getScoreTier } from './score-utils';
import type { SpeedScoreProgress } from './use-speed-scores';
import type { ReactElement, ReactNode } from 'react';

function getStepText( stage: SpeedScoreProgress[ 'stage' ], percent: number | undefined ): string {
	switch ( stage ) {
		case 'queued':
			return percent === undefined
				? __( 'Waiting to start…', 'jetpack-boost' )
				: sprintf(
						/* translators: %d: how much of the speed test is done, as a percentage. */
						__( 'Waiting to start… <pct>%d%%</pct>', 'jetpack-boost' ),
						percent
					);
		case 'mobile':
			return percent === undefined
				? __( 'Testing mobile…', 'jetpack-boost' )
				: sprintf(
						/* translators: %d: how much of the speed test is done, as a percentage. */
						__( 'Testing mobile… <pct>%d%%</pct>', 'jetpack-boost' ),
						percent
					);
		case 'desktop':
			return percent === undefined
				? __( 'Testing desktop…', 'jetpack-boost' )
				: sprintf(
						/* translators: %d: how much of the speed test is done, as a percentage. */
						__( 'Testing desktop… <pct>%d%%</pct>', 'jetpack-boost' ),
						percent
					);
		default:
			return percent === undefined
				? __( 'Checking site speed…', 'jetpack-boost' )
				: sprintf(
						/* translators: %d: how much of the speed test is done, as a percentage. */
						__( 'Checking site speed… <pct>%d%%</pct>', 'jetpack-boost' ),
						percent
					);
	}
}

function FinishedScore( { score, children }: { score: number; children: string } ) {
	return (
		<span
			className={ `jetpack-boost-overview__early-score jetpack-boost-overview__tier--${ getScoreTier(
				score
			) }` }
		>
			{ children }
		</span>
	);
}

/**
 * The running speed test's step, its estimated percent, and any device score already measured.
 *
 * @param progress   - The latest progress the server reported, if any.
 * @param percent    - Estimated percent done, or undefined when there is nothing to estimate from.
 * @param percentTag - Element that wraps the percent, so a live region can hide it from screen readers.
 * @return The message to show while the test runs.
 */
export function getProgressMessage(
	progress: SpeedScoreProgress | undefined,
	percent: number | undefined,
	percentTag: ReactElement
): ReactNode {
	const step = createInterpolateElement( getStepText( progress?.stage, percent ), {
		pct: percentTag,
	} );
	const { mobile, desktop } = progress?.scores ?? {};

	return (
		<>
			{ step }
			{ mobile !== undefined && (
				<FinishedScore score={ mobile }>
					{ sprintf(
						/* translators: %d: the mobile speed score, out of 100. */
						__( 'Mobile: %d', 'jetpack-boost' ),
						mobile
					) }
				</FinishedScore>
			) }
			{ desktop !== undefined && (
				<FinishedScore score={ desktop }>
					{ sprintf(
						/* translators: %d: the desktop speed score, out of 100. */
						__( 'Desktop: %d', 'jetpack-boost' ),
						desktop
					) }
				</FinishedScore>
			) }
		</>
	);
}
