import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import Desktop from './assets/desktop.svg';
import Mobile from './assets/mobile.svg';
import Spinner from './assets/spinner.svg';
import type { BoostScoreBarProps } from './types';
import type { FunctionComponent } from 'react';

import './style.scss';

export const BoostScoreBar: FunctionComponent< BoostScoreBarProps > = ( {
	score,
	isLoading,
	showPrevScores,
	active,
	prevScore = 0,
	scoreBarType,
	noBoostScoreTooltip,
} ) => {
	if ( ! active ) {
		return null;
	}

	const prevScoreOffset = ( prevScore / score ) * 100;
	const icon = scoreBarType === 'desktop' ? <Desktop /> : <Mobile />;
	const iconLabel =
		scoreBarType === 'desktop' ? __( 'Desktop score', 'jetpack' ) : __( 'Mobile score', 'jetpack' );

	const getFillColor = () => {
		if ( isLoading ) {
			return 'fill-loading';
		}

		if ( score > 70 ) {
			return 'fill-good';
		}

		if ( score > 50 ) {
			return 'fill-mediocre';
		}

		return 'fill-bad';
	};

	return (
		<div className={ classNames( 'jb-score-bar', `jb-score-bar--${ scoreBarType }` ) }>
			<div className="jb-score-bar__label">
				{ icon }
				<div>{ iconLabel }</div>
			</div>

			<div className="jb-score-bar__bounds">
				<div
					className={ classNames( 'jb-score-bar__filler', getFillColor() ) }
					style={ { width: `${ score }%` } }
				>
					{ isLoading ? (
						<div className="jb-score-bar__loading">
							<Spinner />
						</div>
					) : (
						<div className="jb-score-bar__score">{ score }</div>
					) }

					{ showPrevScores && prevScore && prevScore < score && (
						<div
							className="jb-score-bar__no_boost_score"
							style={ { left: `min(${ prevScoreOffset }%, calc( 100% - var(--clearance-space))` } }
						>
							{ prevScore }
							{ noBoostScoreTooltip && (
								<div className="jb-score-bar__no_boost_score_tooltip">{ noBoostScoreTooltip }</div>
							) }
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default BoostScoreBar;
