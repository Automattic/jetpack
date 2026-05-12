import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, dashboard, desktop, info, mobile } from '@wordpress/icons';
import { Card, Stack } from '@wordpress/ui';
import { getScoreTier } from './lib/score-utils';
import ScoreCard from './score-card';
import type { SpeedScoresSet } from './lib/use-speed-scores';
import type { ReactNode } from 'react';

type Props = {
	scores: SpeedScoresSet;
	isLoading?: boolean;
	/** Slot rendered in the card header's top-right — used to mount the Refresh button. */
	headerAction?: ReactNode;
};

/**
 * The unified "Performance scores" card — one outer `Card.Root` whose
 * content area divides into three score sections (Overall / Desktop /
 * Mobile). The section row sits directly inside the card (skipping
 * `Card.Content`) so the dividers between sections can run flush to the
 * outer card edge, matching the design.
 *
 * @param props              - Component props.
 * @param props.scores       - Current + without-Boost score set returned by `useSpeedScores`.
 * @param props.isLoading    - When true, sections render their loading state (em-dashes).
 * @param props.headerAction
 * @return The performance scores card.
 */
export default function ScoreCards( { scores, isLoading, headerAction }: Props ): JSX.Element {
	const { current, noBoost } = scores;
	const letter = isLoading ? '—' : getScoreLetter( current.mobile, current.desktop );
	// Overall tier reads from the average so the qualitative label moves
	// with the letter grade — `B` averages above 75 (Lighthouse "Good"),
	// `C` averages above 50 ("Could be improved"), and so on.
	const overallTier = isLoading
		? ''
		: getScoreTier( Math.round( ( current.mobile + current.desktop ) / 2 ) );

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title>{ __( 'Performance scores', 'jetpack-boost' ) }</Card.Title>
					{ headerAction }
				</Stack>
			</Card.Header>
			<div className="jetpack-boost-overview__score-row">
				<ScoreCard
					icon={ <Icon icon={ dashboard } size={ 20 } /> }
					label={ __( 'Overall grade', 'jetpack-boost' ) }
					labelTrailing={
						<Tooltip
							text={ __(
								'A combined letter grade based on your average Desktop and Mobile scores.',
								'jetpack-boost'
							) }
						>
							<span
								className="jetpack-boost-overview__info-trigger"
								role="img"
								aria-label={ __( 'About the overall grade', 'jetpack-boost' ) }
								tabIndex={ 0 }
							>
								<Icon icon={ info } size={ 16 } />
							</span>
						</Tooltip>
					}
					value={ letter }
					tierLabel={ overallTier }
					isLoading={ isLoading }
				/>
				<ScoreCard
					icon={ <Icon icon={ desktop } size={ 20 } /> }
					label={ __( 'Desktop', 'jetpack-boost' ) }
					value={ current.desktop }
					score={ current.desktop }
					noBoost={ noBoost?.desktop ?? null }
					isLoading={ isLoading }
				/>
				<ScoreCard
					icon={ <Icon icon={ mobile } size={ 20 } /> }
					label={ __( 'Mobile', 'jetpack-boost' ) }
					value={ current.mobile }
					score={ current.mobile }
					noBoost={ noBoost?.mobile ?? null }
					isLoading={ isLoading }
				/>
			</div>
		</Card.Root>
	);
}
