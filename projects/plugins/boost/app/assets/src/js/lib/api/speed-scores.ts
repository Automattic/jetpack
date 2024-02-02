type SpeedScores = {
	mobile: number;
	desktop: number;
};

type SpeedScoresSet = {
	current: SpeedScores;
	noBoost: SpeedScores;
	isStale: boolean;
};

/**
 * Determine the change in scores to pass through to other functions.
 *
 * @param scores
 * @return percentage
 */
export function getScoreMovementPercentage( scores: SpeedScoresSet ): number {
	const current = scores.current;
	const noBoost = scores.noBoost;
	let currentScore = 0;
	let noBoostScore = 0;

	if ( current !== null && noBoost !== null ) {
		currentScore = scores.current.mobile + scores.current.desktop;
		noBoostScore = scores.noBoost.mobile + scores.noBoost.desktop;
		const change = currentScore / noBoostScore - 1;
		return Math.round( change * 100 );
	}
	return 0;
}
