/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getSiteAdminUrl, getSiteRawUrl } from 'state/initial-state';
import { addSelectedRecommendation as addSelectedRecommendationAction } from 'state/recommendations';
import { ProductCardUpsell } from '../../product-card-upsell';

const generateCheckoutLink = ( { product, siteAdminUrl, siteRawUrl } ) => {
	return getRedirectUrl( 'jetpack-recommendations-product-checkout', {
		site: siteRawUrl,
		path: product.slug,
		query: `redirect_to=${ siteAdminUrl }admin.php?jp-react-redirect=product-purchased`,
	} );
};

const recommendedProductSlug = 'jetpack_security_t1_yearly';

const ProductSuggestionComponent = props => {
	const { product, addSelectedRecommendation } = props;

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
			upgradeUrl={ generateCheckoutLink( props ) }
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
