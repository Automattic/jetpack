import { __ } from '@wordpress/i18n';
import { arrowUp, arrowDown, Icon } from '@wordpress/icons';
import clsx from 'clsx';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import formatNumber from '../../../utils/format-number';
import formatTime from '../../../utils/format-time';
import { InfoTooltip } from '../../info-tooltip';
import LoadingBlock from '../../loading-block';
import baseStyles from '../style.module.scss';
import useTooltipCopy from './use-tooltip-copy';
import type { FC } from 'react';

import './style.scss';

interface VideoPressValueSectionProps {
	isPluginActive: boolean;
	data: VideopressData;
	isLoading: boolean;
}

interface ValueSectionProps {
	value: number;
	previousValue: number;
	formattedValue: string;
	formattedDifference: string;
	period: VideopressData[ 'featuredStats' ][ 'period' ];
}

const ValueSection: FC< ValueSectionProps > = ( {
	value,
	previousValue,
	formattedValue,
	formattedDifference,
	period,
} ) => {
	const hasValueIncreased = value > previousValue;
	return (
		<div className="videopress-card__value-section__value-container">
			<span className="videopress-card__value-section__value">{ formattedValue }</span>

			{ value !== previousValue && period === 'day' && (
				<div
					className={ clsx(
						'videopress-card__value-section__previous-value',
						hasValueIncreased ? 'increase' : 'decrease'
					) }
				>
					<Icon size={ 18 } icon={ hasValueIncreased ? arrowUp : arrowDown } />
					<span>{ formattedDifference }</span>
				</div>
			) }
		</div>
	);
};

const VideoPressValueSection: FC< VideoPressValueSectionProps > = ( {
	isPluginActive,
	data,
	isLoading,
} ) => {
	const { detail } = useProduct( PRODUCT_SLUGS.VIDEOPRESS );
	const { status, hasPaidPlanForProduct } = detail || {};
	const { videoCount, featuredStats } = data || {};
	const { inactiveWithVideos, viewsWithoutPlan, viewsWithPlan, watchTime } = useTooltipCopy( data );

	if ( ! videoCount && ! isLoading ) {
		return null;
	}

	const tracksProps = {
		feature: 'jetpack-videopress',
		has_paid_plan: hasPaidPlanForProduct,
		status,
	};

	if ( ! isPluginActive ) {
		return (
			<div className="videopress-card__value-section">
				<div className="videopress-card__value-section__container">
					<span className={ baseStyles.valueSectionHeading }>
						{ __( 'Existing videos', 'jetpack-my-jetpack' ) }
						{ isLoading ? (
							<LoadingBlock height="32px" width="100%" />
						) : (
							<>
								<InfoTooltip
									className="videopress-card__no-video-tooltip"
									tracksEventName={ 'videopress_card_tooltip_open' }
									tracksEventProps={ {
										location: 'existing_videos',
										feature: 'jetpack-videopress',
										status,
										video_count: videoCount,
									} }
								>
									<h3>{ inactiveWithVideos.title }</h3>
									<p>{ inactiveWithVideos.text }</p>
								</InfoTooltip>
							</>
						) }
					</span>
					<span className="videopress-card__video-count">{ videoCount }</span>
				</div>
			</div>
		);
	}

	const currentViews = featuredStats?.data?.views?.current;
	const currentWatchTime = featuredStats?.data?.watch_time?.current;
	const previousViews = featuredStats?.data?.views?.previous;
	const previousWatchTime = featuredStats?.data?.watch_time?.previous;
	const period = featuredStats?.period;

	const viewsDifference = Math.abs( currentViews - previousViews );
	const watchTimeDifference = Math.abs( currentWatchTime - previousWatchTime );

	if ( ! isLoading && ( currentViews === undefined || currentWatchTime === undefined ) ) {
		return null;
	}

	const thirtyDayViews = __( '30-Day views', 'jetpack-my-jetpack' );
	const yearlyViews = __( 'Yearly views', 'jetpack-my-jetpack' );

	return (
		<div className="videopress-card__value-section">
			<div className="videopress-card__value-section__container">
				<span
					className={ clsx(
						baseStyles.valueSectionHeading,
						'videopress-card__value-section__heading'
					) }
				>
					{ period === 'day' ? thirtyDayViews : yearlyViews }

					<InfoTooltip
						tracksEventName="videopress_card_tooltip_open"
						tracksEventProps={ {
							location: 'views',
							current_views: currentViews,
							previous_views: previousViews,
							period,
							...tracksProps,
						} }
					>
						{ hasPaidPlanForProduct || currentViews === 0 ? (
							<>
								<h3>{ viewsWithPlan.title }</h3>
								<p>{ viewsWithPlan.text }</p>
							</>
						) : (
							<>
								<h3>{ viewsWithoutPlan.title }</h3>
								<p>{ viewsWithoutPlan.text }</p>
							</>
						) }
					</InfoTooltip>
				</span>

				{ isLoading ? (
					<LoadingBlock height="32px" width="100%" />
				) : (
					<ValueSection
						value={ currentViews }
						previousValue={ previousViews }
						formattedValue={ formatNumber( currentViews ) }
						formattedDifference={ formatNumber( viewsDifference ) }
						period={ period }
					/>
				) }
			</div>

			<div className="videopress-card__value-section__container">
				<span
					className={ clsx(
						baseStyles.valueSectionHeading,
						'videopress-card__value-section__heading'
					) }
				>
					{ __( 'Total time watched', 'jetpack-my-jetpack' ) }

					<InfoTooltip
						tracksEventName="videopress_card_tooltip_open"
						tracksEventProps={ {
							location: 'watch_time',
							current_watch_time: currentWatchTime,
							previous_watch_time: previousWatchTime,
							period,
							...tracksProps,
						} }
					>
						<h3>{ watchTime.title }</h3>
						<p>{ watchTime.text }</p>
					</InfoTooltip>
				</span>

				{ isLoading ? (
					<LoadingBlock height="32px" width="100%" />
				) : (
					<ValueSection
						value={ currentWatchTime }
						previousValue={ previousWatchTime }
						formattedValue={ formatTime( currentWatchTime ) }
						formattedDifference={ formatTime( watchTimeDifference ) }
						period={ period }
					/>
				) }
			</div>
		</div>
	);
};

export default VideoPressValueSection;
