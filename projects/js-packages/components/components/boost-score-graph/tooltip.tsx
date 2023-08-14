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
	const date = dateI18n( 'F j, Y', new Date( period.timestamp * 1000 ), false );

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
			<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
				<div className="jb-score-tooltip__column">
					{ __( 'Largest Contentful Paint', 'jetpack' ) }
				</div>
				<div className="jb-score-tooltip__column">
					{

						sprintf( '%0.2fs', desktop_lcp )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
				<div className="jb-score-tooltip__column">{ __( 'Total Blocking Time', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%0.2fs', 'jetpack' ), desktop_tbt )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
				<div className="jb-score-tooltip__column">
					{ __( 'Cumulative Layout Shift', 'jetpack' ) }
				</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( '%0.2f', desktop_cls )
					}
				</div>
			</div>
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
			<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
				<div className="jb-score-tooltip__column">
					{ __( 'Largest Contentful Paint', 'jetpack' ) }
				</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%0.2fs', 'jetpack' ), mobile_lcp )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
				<div className="jb-score-tooltip__column">{ __( 'Total Blocking Time', 'jetpack' ) }</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%0.2fs', 'jetpack' ), mobile_tbt )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__row jb-score-tooltip__row--secondary">
				<div className="jb-score-tooltip__column">
					{ __( 'Cumulative Layout Shift', 'jetpack' ) }
				</div>
				<div className="jb-score-tooltip__column">
					{
						/* translators: %d is the score */
						sprintf( __( '%0.2fs', 'jetpack' ), mobile_cls )
					}
				</div>
			</div>
			<div className="jb-score-tooltip__pointer"></div>
		</div>
	);
};
