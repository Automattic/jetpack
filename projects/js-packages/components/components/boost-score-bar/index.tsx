import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Gridicon from '../gridicon';
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
	const desktopIconLabel = __( 'Desktop score', 'jetpack' );
	const mobileIconLabel = __( 'Mobile score', 'jetpack' );

	const getIcon = () => {
		if ( scoreBarType === 'desktop' ) {
			return <Gridicon icon="computer" size={ 24 } />;
		}

		return <Gridicon icon="phone" size={ 24 } />;
	};

	const getFillColor = () => {
		// This shows the loading color unless a score already exists.
		// In that case, shows the color based on the current score while refreshing.
		if ( isLoading && ! score ) {
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
		<div className={ clsx( 'jb-score-bar', `jb-score-bar--${ scoreBarType }` ) }>
			<div className="jb-score-bar__label">
				{ getIcon() }
				<div>{ scoreBarType === 'desktop' ? desktopIconLabel : mobileIconLabel }</div>
			</div>

			<div className="jb-score-bar__bounds">
				<div
					className={ clsx( 'jb-score-bar__filler', getFillColor() ) }
					style={ { width: `${ score }%` } }
				>
					{ isLoading ? (
						<div className="jb-score-bar__loading">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128">
								<g>
									<path d="M64 0a7 7 0 11-7 7 7 7 0 017-7zm29.86 12.2a2.8 2.8 0 11-3.83 1.02 2.8 2.8 0 013.83-1.02zm22.16 21.68a3.15 3.15 0 11-4.3-1.15 3.15 3.15 0 014.3 1.15zm.87 60.53a4.2 4.2 0 11-1.57-5.7 4.2 4.2 0 011.54 5.73zm7.8-30.5a3.85 3.85 0 11-3.85-3.85 3.85 3.85 0 013.85 3.84zm-30 53.2a4.55 4.55 0 111.66-6.23 4.55 4.55 0 01-1.67 6.22zM64 125.9a4.9 4.9 0 114.9-4.9 4.9 4.9 0 01-4.9 4.9zm-31.06-8.22a5.25 5.25 0 117.17-1.93 5.25 5.25 0 01-7.14 1.93zM9.9 95.1a5.6 5.6 0 117.65 2.06A5.6 5.6 0 019.9 95.1zM1.18 63.9a5.95 5.95 0 115.95 5.94 5.95 5.95 0 01-5.96-5.94zm8.1-31.6a6.3 6.3 0 112.32 8.6 6.3 6.3 0 01-2.3-8.6zM32.25 8.87a6.65 6.65 0 11-2.44 9.1 6.65 6.65 0 012.46-9.1z" />
									<animateTransform
										attributeName="transform"
										type="rotate"
										values="0 64 64;30 64 64;60 64 64;90 64 64;120 64 64;150 64 64;180 64 64;210 64 64;240 64 64;270 64 64;300 64 64;330 64 64"
										calcMode="discrete"
										dur="1080ms"
										repeatCount="indefinite"
									/>
								</g>
							</svg>
						</div>
					) : (
						<div className="jb-score-bar__score">{ score }</div>
					) }

					{ showPrevScores && !! prevScore && prevScore < score && (
						<div
							className="jb-score-bar__no_boost_score"
							style={ { left: `min(${ prevScoreOffset }%, calc( 100% - var(--clearance-space))` } }
						>
							{ prevScore }
							{ noBoostScoreTooltip && (
								<div role="tooltip" className="jb-score-bar__no_boost_score_tooltip">
									{ noBoostScoreTooltip }
								</div>
							) }
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default BoostScoreBar;
