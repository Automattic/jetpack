import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { TemplateVars } from '../utils/copy-dom-template';

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
	message: {
		text: string;
		vars?: TemplateVars;
	};
	cta: string;
	ctaLink: string;
};

export function scoreChangeModal( scores: SpeedScoresSet ): ScoreChangeMessage | null {
	const changePercentage = getScoreMovementPercentage( scores );
	if ( changePercentage > 5 ) {
		return {
			id: 'score-increase',
			title: __( 'Your site got faster', 'jetpack-boost' ),
			message: {
				text: __( `That's great! If you’re happy, why not rate Boost?`, 'jetpack-boost' ),
			},
			cta: __( 'Rate the Plugin', 'jetpack-boost' ),
			ctaLink: 'https://wordpress.org/support/plugin/jetpack-boost/reviews/#new-post',
		};
	} else if ( changePercentage < -5 ) {
		return {
			id: 'score-decrease',
			title: __( 'Speed score has fallen', 'jetpack-boost' ),
			message: {
				text: __(
					'Most of the time Jetpack Boost will increase your site speed, but there may be cases where your score does not increase.<br/><br/>Try refreshing your score, and if it doesn’t help, check our guide on improving your site speed score:',
					'jetpack-boost'
				),
			},
			cta: __( 'Read the guide', 'jetpack-boost' ),
			ctaLink: getRedirectUrl( 'boost-improve-site-speed-score' ),
		};
	}

	return null;
}
