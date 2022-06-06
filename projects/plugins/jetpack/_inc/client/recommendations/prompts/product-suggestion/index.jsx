import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	getUpsell,
} from 'state/recommendations';
import { getSiteDiscount } from 'state/site';
import { ProductCardUpsell } from '../../product-card-upsell';
import { isCouponValid } from '../../utils';

const ProductSuggestionComponent = ( {
	product,
	addSelectedRecommendation,
	upsell,
	discountData,
} ) => {
	const hasDiscount = useMemo( () => isCouponValid( discountData ), [ discountData ] );

	const onClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_click', {
			product_slug: product.slug,
			discount: hasDiscount,
		} );

		addSelectedRecommendation( 'product-suggestions' );
	}, [ product, addSelectedRecommendation, hasDiscount ] );
	const onMount = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_display', {
			product_slug: product.slug,
			discount: hasDiscount,
		} );
	}, [ product, hasDiscount ] );

	return (
		<ProductCardUpsell
			{ ...product }
			isRecommended={ product.slug === upsell?.product_slug }
			onClick={ onClick }
			onMount={ onMount }
		/>
	);
};

ProductSuggestionComponent.propTypes = {
	product: PropTypes.object.isRequired,
};

const ProductSuggestion = connect(
	state => ( {
		upsell: getUpsell( state ),
		discountData: getSiteDiscount( state ),
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
	} )
)( ProductSuggestionComponent );

export { ProductSuggestion };
