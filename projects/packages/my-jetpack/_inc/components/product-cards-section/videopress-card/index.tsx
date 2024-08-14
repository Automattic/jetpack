/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useCallback } from 'react';
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

const VideopressCard: ProductCardComponent = ( { admin } ) => {
	const { detail } = useProduct( slug );
	const { status } = detail || {};
	const { videopress: data } = getMyJetpackWindowInitialState();
	const { activeAndNoVideos, inactiveWithVideos } = useTooltipCopy();
	const videoCount = data?.videoCount || 0;

	const isPluginActive =
		status === PRODUCT_STATUSES.ACTIVE || status === PRODUCT_STATUSES.CAN_UPGRADE;

	const descriptionText = useVideoPressCardDescription( {
		isPluginActive,
		videoCount,
	} );

	const isActiveWithNoVideos = isPluginActive && ! videoCount;
	const isInactiveWithVideos = ! isPluginActive && videoCount;
	const shouldShowTooltip = isActiveWithNoVideos || isInactiveWithVideos;

	const Description = useCallback( () => {
		return (
			<Text variant="body-small" className="description">
				{ descriptionText || detail.description }
				{ shouldShowTooltip && (
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
						{ isActiveWithNoVideos ? (
							<>
								<h3>{ activeAndNoVideos.title }</h3>
								<p>{ activeAndNoVideos.text }</p>
							</>
						) : (
							<>
								<h3>{ inactiveWithVideos.title }</h3>
								<p>{ inactiveWithVideos.text }</p>
							</>
						) }
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
		inactiveWithVideos,
		shouldShowTooltip,
		isActiveWithNoVideos,
	] );

	return (
		<ProductCard slug={ slug } showMenu admin={ admin } Description={ Description }>
			<VideoPressValueSection isPluginActive={ isPluginActive } data={ data } />
		</ProductCard>
	);
};

export default VideopressCard;
