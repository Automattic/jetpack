/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
/**
 * Internal dependencies
 */
import { useProduct } from '../../hooks/use-product';
import ProductCard from '../connected-product-card';
import { PRODUCT_STATUSES } from '../product-card/action-buton';
import productCardStyles from '../product-card/style.module.scss';

const AiCard = ( { admin } ) => {
	const { detail = {} } = useProduct( 'jetpack-ai' );
	const aiAssistantFeature = detail?.[ 'ai-assistant-feature' ];
	const { status, isPluginActive } = detail;

	const requestsLimit = aiAssistantFeature?.[ 'requests-limit' ] || 20;
	const requestsCount = 3;
	const requestsLeft = Math.max( 0, requestsLimit - requestsCount );
	const limitReached = aiAssistantFeature?.limit_reached;

	let statsMessage = null;

	if ( ! isPluginActive ) {
		return <ProductCard admin={ admin } slug="jetpack-ai" />;
	}

	if ( status === PRODUCT_STATUSES.NEEDS_PURCHASE ) {
		statsMessage = createInterpolateElement(
			__( 'You have <stats /> free requests left.', 'jetpack-my-jetpack' ),
			{
				stats: (
					<strong
						className={ `jetpack-ai-assistant__stats${
							limitReached ? ' was-limit-achieved' : ''
						}` }
					>
						{ requestsLeft }
					</strong>
				),
			}
		);
	} else {
		statsMessage = __( 'You have unlimited requests.', 'jetpack-my-jetpack' );
	}

	return (
		<ProductCard admin={ admin } slug="jetpack-ai">
			<Text variant="body-small" className={ productCardStyles.description }>
				{ statsMessage }
			</Text>
		</ProductCard>
	);
};

AiCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AiCard;
