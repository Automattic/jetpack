/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getSiteAdminUrl, getSiteRawUrl } from 'state/initial-state';
import { addSelectedRecommendation as addSelectedRecommendationAction } from 'state/recommendations';
import { ProductCardUpsell } from '../../product-card-upsell';
import { generateCheckoutLink } from '../../utils';

const recommendedProductSlug = 'jetpack_security_t1_yearly';

const ProductSuggestionComponent = props => {
	const { product, addSelectedRecommendation, siteAdminUrl, siteRawUrl } = props;

	const onPurchaseClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_click', {
			type: product.slug,
		} );

		addSelectedRecommendation( 'product-suggestions' );
	}, [ product, addSelectedRecommendation ] );

	return (
		<ProductCardUpsell
			{ ...product }
			product_slug={ product.slug }
			price={ product.cost }
			upgradeUrl={ generateCheckoutLink( product.slug, siteAdminUrl, siteRawUrl ) }
			isRecommended={ product.slug === recommendedProductSlug }
			onClick={ onPurchaseClick }
		/>
	);
};

ProductSuggestionComponent.propTypes = {
	product: PropTypes.object.isRequired,
};

const ProductSuggestion = connect(
	state => ( {
		siteAdminUrl: getSiteAdminUrl( state ),
		siteRawUrl: getSiteRawUrl( state ),
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
	} )
)( ProductSuggestionComponent );

export { ProductSuggestion };
