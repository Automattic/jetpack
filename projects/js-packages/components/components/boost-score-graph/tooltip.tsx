import { __, sprintf } from '@wordpress/i18n';
import { type FunctionComponent } from 'react';
import './style-tooltip.scss';

type TooltipProps = {
	date: string;
	desktopScore: number;
	mobileScore: number;
};
export const Tooltip: FunctionComponent = ( { date, desktopScore, mobileScore }: TooltipProps ) => {
	const scoreLetter = 'A';

	if ( ! desktopScore || ! mobileScore ) {
		return null;
	}

	return (
		<div className="jb-score-tooltip">
			<div className="jb-score-tooltip__date">{ date }</div>
			<div className="jb-score-tooltip__row">
				<div className="jb-score-tooltip__column">{ __( 'Overall score', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">{ scoreLetter }</div>
			</div>
			<div className="jb-score-tooltip__row">
				<div className="jb-score-tooltip__column">{ __( 'Desktop score', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%d / 100', 'jetpack' ), desktopScore )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__row">
				<div className="jb-score-tooltip__column">{ __( 'Mobile score', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%d / 100', 'jetpack' ), mobileScore )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__pointer"></div>
		</div>
	);
};
