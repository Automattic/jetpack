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
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	getUpsell,
} from 'state/recommendations';
import { ProductCardUpsell } from '../../product-card-upsell';

const ProductSuggestionComponent = ( { product, addSelectedRecommendation, upsell } ) => {
	const onPurchaseClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_click', {
			type: product.slug,
		} );

		addSelectedRecommendation( 'product-suggestions' );
	}, [ product, addSelectedRecommendation ] );

	return (
		<ProductCardUpsell
			{ ...product }
			isRecommended={ product.slug === upsell?.product_slug }
			onClick={ onPurchaseClick }
		/>
	);
};

ProductSuggestionComponent.propTypes = {
	product: PropTypes.object.isRequired,
};

const ProductSuggestion = connect(
	state => ( {
		upsell: getUpsell( state ),
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
	} )
)( ProductSuggestionComponent );

export { ProductSuggestion };
