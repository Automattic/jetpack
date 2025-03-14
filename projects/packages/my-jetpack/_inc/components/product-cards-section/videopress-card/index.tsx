/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import ProductCard from '../../connected-product-card';
import { InfoTooltip } from '../../info-tooltip';
import useTooltipCopy from './use-tooltip-copy';
import useVideoPressCardDescription from './use-videopress-description';
import VideoPressValueSection from './videopress-value-section';
import type { ProductCardComponent } from '../types';

import './style.scss';

const slug = PRODUCT_SLUGS.VIDEOPRESS;

const VideopressCard: ProductCardComponent = props => {
	const { detail } = useProduct( slug );
	const { status } = detail || {};
	const { videopress: data } = getMyJetpackWindowInitialState();
	const { activeAndNoVideos } = useTooltipCopy();
	const { videoCount = 0, featuredStats } = data || {};

	const isPluginActive =
		status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const descriptionText = useVideoPressCardDescription( {
		isPluginActive,
		videoCount,
	} );

	const customLoadTracks = useMemo( () => {
		return {
			stats_period: featuredStats?.period,
			video_count: videoCount,
		};
	}, [ featuredStats, videoCount ] );

	const Description = useCallback( () => {
		return (
			<Text variant="body-small" className="description">
				{ descriptionText || detail.description }
				{ isPluginActive && ! videoCount && (
					<InfoTooltip
						className="videopress-card__no-video-tooltip"
						tracksEventName={ 'videopress_card_tooltip_open' }
						tracksEventProps={ {
							location: 'description',
							feature: 'jetpack-videopress',
							status,
							video_count: videoCount,
						} }
					>
						<h3>{ activeAndNoVideos.title }</h3>
						<p>{ activeAndNoVideos.text }</p>
					</InfoTooltip>
				) }
			</Text>
		);
	}, [
		descriptionText,
		detail.description,
		videoCount,
		status,
		activeAndNoVideos,
		isPluginActive,
	] );

	return (
		<ProductCard
			{ ...props }
			slug={ slug }
			showMenu
			Description={ Description }
			customLoadTracks={ customLoadTracks }
		>
			<VideoPressValueSection isPluginActive={ isPluginActive } data={ data } />
		</ProductCard>
	);
};

export default VideopressCard;
