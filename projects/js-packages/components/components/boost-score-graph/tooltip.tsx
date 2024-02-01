import { getScoreLetter } from '@automattic/jetpack-boost-score-api';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { type FunctionComponent } from 'react';
import './style-tooltip.scss';
import { Period } from '.';

export const Tooltip: FunctionComponent = ( { period }: { period: Period } ) => {
	if ( ! period || ! period.dimensions || ! period.timestamp ) {
		return null;
	}
	const {
		mobile_overall_score,
		desktop_overall_score,
		desktop_cls,
		desktop_lcp,
		desktop_tbt,
		mobile_cls,
		mobile_lcp,
		mobile_tbt,
	} = period.dimensions;
	const scoreLetter = getScoreLetter( mobile_overall_score, desktop_overall_score );
	const date = dateI18n( 'F j, Y', new Date( period.timestamp ), false );

	// If any of the key properties are missing, don't render the tooltip.
	if ( ! scoreLetter || ! mobile_overall_score || ! desktop_overall_score || ! date ) {
		return null;
	}

	return (
		<div className="jb-score-tooltip">
			<div className="jb-score-tooltip__date">{ date }</div>
			<div className="jb-score-tooltip__row">
				<div className="jb-score-tooltip__column">{ __( 'Overall score', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">{ scoreLetter }</div>
			</div>
			<hr />
			<div className="jb-score-tooltip__row">
				<div className="jb-score-tooltip__column">{ __( 'Desktop score', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%d / 100', 'jetpack' ), desktop_overall_score )
					}
				</div>
			</div>
			{ typeof desktop_lcp === 'number' && (
				<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
					<div className="jb-score-tooltip__column">
						{ __( 'Largest Contentful Paint', 'jetpack' ) }
					</div>
					<div className="jb-score-tooltip__column">{ sprintf( '%0.2fs', desktop_lcp ) }</div>
				</div>
			) }
			{ typeof desktop_tbt === 'number' && (
				<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
					<div className="jb-score-tooltip__column">{ __( 'Total Blocking Time', 'jetpack' ) }</div>
					<div className="jb-score-tooltip__column">{ sprintf( '%0.2fs', desktop_tbt ) }</div>
				</div>
			) }
			{ typeof desktop_cls === 'number' && (
				<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
					<div className="jb-score-tooltip__column">
						{ __( 'Cumulative Layout Shift', 'jetpack' ) }
					</div>
					<div className="jb-score-tooltip__column">{ sprintf( '%0.2f', desktop_cls ) }</div>
				</div>
			) }
			<hr />
			<div className="jb-score-tooltip__row">
				<div className="jb-score-tooltip__column">{ __( 'Mobile score', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%d / 100', 'jetpack' ), mobile_overall_score )
					}
				</div>
			</div>
			{ typeof mobile_lcp === 'number' && (
				<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
					<div className="jb-score-tooltip__column">
						{ __( 'Largest Contentful Paint', 'jetpack' ) }
					</div>
					<div className="jb-score-tooltip__column">{ sprintf( '%0.2fs', mobile_lcp ) }</div>
				</div>
			) }
			{ typeof mobile_tbt === 'number' && (
				<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
					<div className="jb-score-tooltip__column">{ __( 'Total Blocking Time', 'jetpack' ) }</div>
					<div className="jb-score-tooltip__column">{ sprintf( '%0.2fs', mobile_tbt ) }</div>
				</div>
			) }
			{ typeof mobile_cls === 'number' && (
				<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
					<div className="jb-score-tooltip__column">
						{ __( 'Cumulative Layout Shift', 'jetpack' ) }
					</div>
					<div className="jb-score-tooltip__column">{ sprintf( '%0.2f', mobile_cls ) }</div>
				</div>
			) }
			<div className="jb-score-tooltip__pointer"></div>
		</div>
	);
};
