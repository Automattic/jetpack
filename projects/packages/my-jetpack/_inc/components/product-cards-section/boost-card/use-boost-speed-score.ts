import {
	getScoreLetter,
	requestSpeedScores,
	calculateDaysSince,
} from '@automattic/jetpack-boost-score-api';
import { useEffect, useState, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../../hooks/use-analytics';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import type { SpeedScores } from './types';
import type { SetStateAction } from 'react';

/**
 * Load the site's speed score: from the cache while it is fresh, otherwise from the API.
 *
 * @return {object} The score, its letter grade, the increase since the last score, and load state.
 */
const useBoostSpeedScore = () => {
	const { recordEvent } = useAnalytics();
	const [ isLoading, setIsLoading ] = useState( false );
	const [ speedLetterGrade, setSpeedLetterGrade ] = useState( '' );
	const [ currentSpeedScore, setCurrentSpeedScore ] = useState< number | null >( null );
	const [ previousSpeedScore, setPreviousSpeedScore ] = useState< number | null >( null );
	const [ isSpeedScoreError, setIsSpeedScoreError ] = useState( false );

	const { siteUrl = '', latestBoostSpeedScores } = getMyJetpackWindowInitialState();
	const { apiRoot, apiNonce, isSiteConnected } = useMyJetpackConnection();
	const slug = 'boost';
	const { detail } = useProduct( slug );
	const { status } = detail;
	const isBoostActive =
		status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const getAverageSpeedScore = ( mobileScore: number, desktopScore: number ) => {
		return Math.round( ( mobileScore + desktopScore ) / 2 );
	};

	const updateScores = (
		setScores: ( value: SetStateAction< number > ) => void,
		scores: SpeedScores[ 'scores' ]
	) => {
		const { mobile, desktop } = scores || {};
		if ( mobile && desktop ) {
			setScores( getAverageSpeedScore( mobile, desktop ) );
		}
	};

	const updateLetterGrade = ( scores: SpeedScores[ 'scores' ] ) => {
		const { mobile, desktop } = scores || {};
		if ( mobile && desktop ) {
			setSpeedLetterGrade( getScoreLetter( mobile, desktop ) );
		}
	};

	// Returns whether the cache held a usable score.
	const setScoresFromCache = ( cachedSpeedScores: SpeedScores ) => {
		const { scores, previousScores } = cachedSpeedScores || {};
		if ( ! scores?.mobile || ! scores?.desktop ) {
			return false;
		}

		updateScores( setCurrentSpeedScore, scores );
		updateScores( setPreviousSpeedScore, previousScores );
		updateLetterGrade( scores );
		return true;
	};

	const getSpeedScores = async () => {
		if ( ! isSiteConnected ) {
			// Don't show the Boost Score
			setIsSpeedScoreError( true );
			return;
		}

		setIsSpeedScoreError( false );
		setIsLoading( true );
		requestSpeedScores( true, apiRoot, siteUrl, apiNonce )
			.then( scores => {
				const scoreLetter = getScoreLetter( scores.current.mobile, scores.current.desktop );
				setSpeedLetterGrade( scoreLetter );
				updateScores( setCurrentSpeedScore, scores.current );
				updateScores( setPreviousSpeedScore, latestBoostSpeedScores.scores );
				setIsLoading( false );
			} )
			.catch( err => {
				recordEvent( 'jetpack_boost_speed_score_error', {
					feature: 'jetpack-boost',
					position: 'my-jetpack',
					error: err,
				} );

				// If error, use the cached "latest" speed scores if they exist
				if ( ! setScoresFromCache( latestBoostSpeedScores ) ) {
					// Hide Boost scores if error and no cached scores
					setIsSpeedScoreError( true );
				}
				setIsLoading( false );
			} );
	};

	const boostScoreIncrease = useMemo( () => {
		if ( ! previousSpeedScore || ! currentSpeedScore ) {
			return null;
		}

		// Only return an increase. Don't return a negative value (decrease).
		if ( currentSpeedScore < previousSpeedScore ) {
			return null;
		}

		return currentSpeedScore - previousSpeedScore;
	}, [ currentSpeedScore, previousSpeedScore ] );

	useEffect( () => {
		if ( latestBoostSpeedScores ) {
			if ( isBoostActive ) {
				if ( calculateDaysSince( latestBoostSpeedScores.timestamp * 1000 ) < 1 ) {
					// When Boost plugin installed & active, use cache scores if they are less than 1 day old.
					// In other words, calculate a new score once every day.
					if ( ! setScoresFromCache( latestBoostSpeedScores ) ) {
						getSpeedScores();
					}
				} else {
					// Boost is active and cache scores are 1 or more days old.
					getSpeedScores();
				}
			} else if ( calculateDaysSince( latestBoostSpeedScores.timestamp * 1000 ) < 14 ) {
				// When Boost plugin is not installed or activated, use cache scores if they are less than 2 weeks old (14 days).
				if ( ! setScoresFromCache( latestBoostSpeedScores ) ) {
					getSpeedScores();
				}
			} else {
				// Boost is not active and cached scores are older than 2 weeks.
				getSpeedScores();
			}
		} else {
			getSpeedScores();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return {
		isLoading,
		isSiteConnected,
		speedLetterGrade,
		currentSpeedScore,
		boostScoreIncrease,
		isSpeedScoreError,
		retry: getSpeedScores,
	};
};

export default useBoostSpeedScore;
