import { BoostScoreBar } from '@automattic/jetpack-components';
import { Popover, Spinner } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { arrowUp, Icon } from '@wordpress/icons';
import { useEffect, useState, useCallback } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import useBoostSpeedScore from './use-boost-speed-score';
import { useBoostTooltipCopy } from './use-boost-tooltip-copy';
import type { BoostSpeedScoreType } from './types';

import './style.scss';

/**
 * Creates the text read by screen readers for the Boost Speed Score card.
 *
 * @param {string} speedLetterGrade     - Letter grade for the speed score (e.g. 'A', 'B', etc)
 * @param {number} currentSpeedScore    - Current numerical speed score (0-100)
 * @param {number} [boostScoreIncrease] - Optional score increase/decrease amount
 * @param {string} [cta]                - Optional call-to-action text
 * @return {string} Screen reader text describing the speed score
 */

const createSpeedScoreSRText = (
	speedLetterGrade: string,
	currentSpeedScore: number,
	boostScoreIncrease?: number,
	cta?: string
) => {
	if ( ! speedLetterGrade || typeof currentSpeedScore !== 'number' ) {
		return '';
	}

	const fragments = [];

	fragments.push(
		sprintf(
			// translators: %1$s: speed grade (e.g. 'A'), %2$s: numerical speed score (e.g. '95').
			__( 'Your website’s overall speed score is %1$s, or %2$d out of 100.', 'jetpack-my-jetpack' ),
			speedLetterGrade,
			currentSpeedScore
		)
	);

	if ( typeof boostScoreIncrease === 'number' ) {
		fragments.push(
			boostScoreIncrease > 0
				? sprintf(
						// translators: %d: score increase (e.g. '10')
						__( 'Your website’s overall speed score increased by %d.', 'jetpack-my-jetpack' ),
						boostScoreIncrease
					)
				: sprintf(
						// translators: %d: score increase (e.g. '10')
						__( 'Your website’s overall speed score decreased by %d.', 'jetpack-my-jetpack' ),
						boostScoreIncrease
					)
		);
	}

	if ( cta ) {
		fragments.push( cta );
	}

	return fragments.join( ' ' );
};

const BoostSpeedScore: BoostSpeedScoreType = () => {
	const { recordEvent } = useAnalytics();
	const [ shouldShowTooltip, setShouldShowTooltip ] = useState( false );
	const [ hasTooltipBeenViewed, setHasTooltipBeenViewed ] = useState( false );
	const isMobileViewport: boolean = useViewportMatch( 'medium', '<' );
	const { isLoading, speedLetterGrade, currentSpeedScore, boostScoreIncrease, isSpeedScoreError } =
		useBoostSpeedScore();

	const tooltipCopy = useBoostTooltipCopy( { speedLetterGrade, boostScoreIncrease } );

	const handleEnter = useCallback( () => {
		setShouldShowTooltip( true );
	}, [ setShouldShowTooltip ] );

	const handleOut = useCallback( () => {
		setShouldShowTooltip( false );
	}, [ setShouldShowTooltip ] );

	useEffect( () => {
		if ( ! isLoading && shouldShowTooltip && ! hasTooltipBeenViewed ) {
			recordEvent( 'jetpack_boost_card_tooltip_viewed', {
				feature: 'jetpack-boost',
				position: 'my-jetpack',
			} );
			setHasTooltipBeenViewed( true );
		}
	}, [ isLoading, shouldShowTooltip, recordEvent, hasTooltipBeenViewed ] );

	return (
		! isSpeedScoreError && (
			<div
				className="mj-boost-speed-score"
				role="presentation"
				onMouseEnter={ handleEnter }
				onMouseLeave={ handleOut }
				onClick={ shouldShowTooltip ? handleOut : handleEnter }
				onFocus={ handleEnter }
				onBlur={ handleOut }
			>
				{ isLoading ? (
					<Spinner />
				) : (
					<>
						<div className="screen-reader-text">
							{ createSpeedScoreSRText(
								speedLetterGrade,
								currentSpeedScore,
								boostScoreIncrease,
								tooltipCopy
							) }
						</div>
						<div aria-hidden="true">
							<div className="mj-boost-speed-score__grade">
								<span>{ __( 'Your website’s overall speed score:', 'jetpack-my-jetpack' ) }</span>
								<span className="mj-boost-speed-score__grade--letter">
									{ speedLetterGrade }
									{ ! isLoading && shouldShowTooltip && (
										<Popover
											placement={ isMobileViewport ? 'top-end' : 'top-start' }
											noArrow={ false }
											offset={ 10 }
										>
											<div className={ 'boost-score-tooltip__parent' }>
												<p className={ 'boost-score-tooltip__heading' }>
													{ /* Add the `&nbsp;` at the end to prevent widows. */ }
													{ __( 'Site speed performance:', 'jetpack-my-jetpack' ) }&nbsp;
													{ speedLetterGrade }
												</p>
												<p className={ 'boost-score-tooltip__content' }>{ tooltipCopy }</p>
											</div>
										</Popover>
									) }
								</span>
							</div>
							<div className="mj-boost-speed-score__bar">
								<BoostScoreBar
									score={ currentSpeedScore }
									active={ currentSpeedScore > 0 }
									isLoading={ isLoading }
									showPrevScores={ false }
									scoreBarType="desktop"
									noBoostScoreTooltip={ null }
								/>
							</div>
							{ !! boostScoreIncrease && (
								<div className="mj-boost-speed-score__increase">
									<Icon size={ 18 } icon={ arrowUp } />
									<span>{ boostScoreIncrease }</span>
								</div>
							) }
						</div>
					</>
				) }
			</div>
		)
	);
};

export default BoostSpeedScore;
