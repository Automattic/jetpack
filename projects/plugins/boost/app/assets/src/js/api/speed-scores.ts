import { __ } from '@wordpress/i18n';
import { SupportUrl } from '../utils/paid-plan';

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

export type ScoreChangeMessage = {
	id: string;
	title: string;
	message: string;
	cta: string;
	ctaLink: string;
};

export function scoreChangeModal( scores: SpeedScoresSet ): ScoreChangeMessage | null {
	const changePercentage = getScoreMovementPercentage( scores );
	if ( changePercentage > 5 ) {
		return {
			id: 'score-increase',
			title: __( 'Your site got faster', 'jetpack-boost' ),
			message: __( `That's great! If you’re happy, why not rate Boost?`, 'jetpack-boost' ),
			cta: __( 'Rate the Plugin', 'jetpack-boost' ),
			ctaLink: 'https://wordpress.org/support/plugin/jetpack-boost/reviews/#new-post',
		};
	} else if ( changePercentage < -5 && Jetpack_Boost.preferences.prioritySupport ) {
		return {
			id: 'score-decrease',
			title: __( 'Speed score has fallen', 'jetpack-boost' ),
			message: __(
				'Jetpack Boost should not slow down your site. Try refreshing your score. If the problem persists please contact support',
				'jetpack-boost'
			),
			cta: __( 'Contact Support', 'jetpack-boost' ),
			ctaLink: SupportUrl,
		};
	}

	return null;
}
