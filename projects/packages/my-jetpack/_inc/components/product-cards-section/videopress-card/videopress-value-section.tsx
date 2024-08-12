import { __ } from '@wordpress/i18n';
import formatNumber from '../../../utils/format-number';
import formatTime from '../../../utils/format-time';
import baseStyles from '../style.module.scss';
import type { FC } from 'react';

import './style.scss';

interface VideoPressValueSectionProps {
	isPluginActive: boolean;
	data: Window[ 'myJetpackInitialState' ][ 'videopress' ];
}

const VideoPressValueSection: FC< VideoPressValueSectionProps > = ( { isPluginActive, data } ) => {
	const { videoCount, featuredStats } = data || {};
	const shortenedNumberConfig: Intl.NumberFormatOptions = {
		maximumFractionDigits: 1,
		notation: 'compact',
	};

	if ( ! videoCount ) {
		return null;
	}

	if ( ! isPluginActive ) {
		return <span className="videopress-card__video-count">{ videoCount }</span>;
	}

	const currentViews = featuredStats?.data?.views?.current;
	const currentWatchTime = featuredStats?.data?.watch_time?.current;

	return (
		<div className="videopress-card__value-section">
			<div className="videopress-card__value-section__container">
				<span className={ baseStyles.valueSectionHeading }>
					{ __( '30-Day views', 'jetpack-my-jetpack' ) }
				</span>

				<span className="videopress-card__value-section__value">
					{ formatNumber( currentViews, shortenedNumberConfig ) }
				</span>
			</div>

			<div className="videopress-card__value-section__container">
				<span className={ baseStyles.valueSectionHeading }>
					{ __( 'Total time watched', 'jetpack-my-jetpack' ) }
				</span>

				<span className="videopress-card__value-section__value">
					{ formatTime( currentWatchTime ) }
				</span>
			</div>
		</div>
	);
};

export default VideoPressValueSection;
