import { __ } from '@wordpress/i18n';
import formatNumber from '../../../utils/format-number';
import formatTime from '../../../utils/format-time';
import { InfoTooltip } from '../../info-tooltip';
import baseStyles from '../style.module.scss';
import useTooltipCopy from './use-tooltip-copy';
import type { FC } from 'react';

import './style.scss';

interface VideoPressValueSectionProps {
	isPluginActive: boolean;
	data: Window[ 'myJetpackInitialState' ][ 'videopress' ];
	status: ProductStatus;
}

const VideoPressValueSection: FC< VideoPressValueSectionProps > = ( {
	isPluginActive,
	data,
	status,
} ) => {
	const { videoCount, featuredStats } = data || {};
	const { inactiveWithVideos } = useTooltipCopy();
	const shortenedNumberConfig: Intl.NumberFormatOptions = {
		maximumFractionDigits: 1,
		notation: 'compact',
	};

	if ( ! videoCount ) {
		return null;
	}

	if ( ! isPluginActive ) {
		return (
			<span className="videopress-card__video-count">
				{ videoCount }
				<InfoTooltip
					className="videopress-card__tooltip"
					tracksEventName="videopress_card_tooltip_open"
					tracksEventProps={ {
						location: 'video_count',
						feature: 'jetpack-videopress',
						status,
						video_count: videoCount,
					} }
				>
					<h3>{ inactiveWithVideos.title }</h3>
					<p>{ inactiveWithVideos.text }</p>
				</InfoTooltip>
			</span>
		);
	}

	const currentViews = featuredStats?.data?.views?.current;
	const currentWatchTime = featuredStats?.data?.watch_time?.current;

	if ( currentViews === undefined || currentWatchTime === undefined ) {
		return null;
	}

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
