/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useCallback, useMemo } from 'react';
import { PRODUCT_STATUSES } from '../../../constants';
import {
	PRODUCT_SLUGS,
	REST_API_GET_VIDEOPRESS_DATA,
	QUERY_GET_VIDEOPRESS_DATA_KEY,
} from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import ProductCard from '../../connected-product-card';
import { InfoTooltip } from '../../info-tooltip';
import useTooltipCopy from './use-tooltip-copy';
import useVideoPressCardDescription from './use-videopress-description';
import VideoPressValueSection from './videopress-value-section';
import type { ProductCardComponent } from '../types';

import './style.scss';

const slug = PRODUCT_SLUGS.VIDEOPRESS;

const VideopressCard: ProductCardComponent = props => {
	const { detail, isLoading: isLoadingProductData } = useProduct( slug );
	const { data: videopressData, isLoading: isLoadingVideopressData } =
		useSimpleQuery< VideopressData >( {
			name: QUERY_GET_VIDEOPRESS_DATA_KEY,
			query: {
				path: REST_API_GET_VIDEOPRESS_DATA,
			},
		} );

	const isLoading = isLoadingProductData || isLoadingVideopressData;

	const { status } = detail || {};

	const { activeAndNoVideos } = useTooltipCopy( videopressData );
	const { videoCount = 0, featuredStats } = videopressData || {};

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
			<VideoPressValueSection
				isPluginActive={ isPluginActive }
				data={ videopressData }
				isLoading={ isLoading }
			/>
		</ProductCard>
	);
};

export default VideopressCard;
