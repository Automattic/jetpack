/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { useCallback } from 'react';
import { PRODUCT_SLUGS } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import ProductCard from '../../connected-product-card';
import useVideoPressCardDescription from './use-videopress-description';
import VideoPressValueSection from './videopress-value-section';
import type { ProductCardComponent } from '../types';

import './style.scss';

const slug = PRODUCT_SLUGS.VIDEOPRESS;

const VideopressCard: ProductCardComponent = ( { admin } ) => {
	const { detail } = useProduct( slug );
	const { isPluginActive = false } = detail || {};
	const { videopress: data } = getMyJetpackWindowInitialState();

	const descriptionText = useVideoPressCardDescription( {
		isPluginActive,
		videoCount: data.videoCount,
	} );

	const Description = useCallback( () => {
		if ( ! descriptionText ) {
			return null;
		}

		return (
			<Text variant="body-small" className="description">
				{ descriptionText }
			</Text>
		);
	}, [ descriptionText ] );

	return (
		<ProductCard slug={ slug } showMenu admin={ admin } Description={ Description }>
			<VideoPressValueSection isPluginActive={ isPluginActive } data={ data } />
		</ProductCard>
	);
};

export default VideopressCard;
