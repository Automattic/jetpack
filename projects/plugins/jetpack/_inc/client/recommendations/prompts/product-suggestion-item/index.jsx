/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { getCurrencyObject } from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import ExternalLink from 'components/external-link';
import analytics from 'lib/analytics';
import { getSiteAdminUrl } from 'state/initial-state';
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	updateRecommendationsData as updateRecommendationsDataAction,
	saveRecommendationsData as saveRecommendationsDataAction,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const ProductSuggestionItemComponent = props => {
	const {
		product,
		title,
		description,
		externalLink,
		siteAdminUrl,
		addSelectedRecommendation,
		updateRecommendationsData,
		saveRecommendationsData,
	} = props;

	const onPurchaseClick = useCallback( () => {
		analytics.tracks.recordEvent(
			'jetpack_recommendations_product_suggestion_selected',
			product.product_slug
		);
		addSelectedRecommendation( 'product-suggestion' );
		updateRecommendationsData( { 'product-suggestion-selection': product.product_slug } );
		saveRecommendationsData();
	}, [ product, addSelectedRecommendation, updateRecommendationsData, saveRecommendationsData ] );

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent(
			'jetpack_recommended_product_suggestion_learn_more_click',
			product.product_slug
		);
	}, [ product ] );

	const currencyObject = getCurrencyObject( product.cost / 12, product.currency_code );

	const checkoutLink =
		'https://wordpress.com/checkout/jetpack/' +
		product.product_slug +
		'?checkoutBackUrl=' +
		siteAdminUrl +
		'admin.php?page=jetpack#/recommendations/woocommerce';

	return (
		<div className="jp-recommendations-product-suggestion-item jp-recommendations-product-suggestion__item">
			<div className="jp-recommendations-product-suggestion-item__content">
				<h2 className="jp-recommendations-product-suggestion-item__title">{ title }</h2>
				<p className="jp-recommendations-product-suggestion-item__description">{ description }</p>
				<Button
					className="jp-recommendations-product-suggestion-item__checkout-button"
					primary
					href={ checkoutLink }
					onClick={ onPurchaseClick }
				>
					{ sprintf(
						/* translators: %s: Name of a Jetpack product. */
						__( 'Continue with %s', 'jetpack' ),
						title
					) }
				</Button>
				{ externalLink && (
					<ExternalLink
						className="jp-recommendations-product-suggestion-item__external-link"
						href={ externalLink }
						target="_blank"
						icon={ true }
						iconSize={ 16 }
						onClick={ onExternalLinkClick }
						children={ __( 'Learn More', 'jetpack' ) }
					/>
				) }
			</div>
			<div className="jp-recommendations-product-suggestion-item__price">
				<h3 className="jp-recommendations-product-suggestion-item__raw-price">
					<sup className="jp-recommendations-product-suggestion-item__currency-symbol">
						{ currencyObject.symbol }
					</sup>
					<span className="jp-recommendations-product-suggestion-item__price-integer">
						{ currencyObject.integer }
					</span>
					<sup className="jp-recommendations-product-suggestion-item__price-fraction">
						{ currencyObject.fraction }
					</sup>
				</h3>
				<span className="jp-recommendations-product-suggestion-item__billing-time-frame">
					{ __( 'per month', 'jetpack' ) },
					<br />
					{ __( 'paid yearly', 'jetpack' ) }
				</span>
			</div>
		</div>
	);
};

ProductSuggestionItemComponent.propTypes = {
	productSlug: PropTypes.object.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	externalLink: PropTypes.string,
};

const ProductSuggestionItem = connect(
	state => ( {
		siteAdminUrl: getSiteAdminUrl( state ),
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
		updateRecommendationsData: product => dispatch( updateRecommendationsDataAction( product ) ),
		saveRecommendationsData: () => dispatch( saveRecommendationsDataAction() ),
	} )
)( ProductSuggestionItemComponent );

export { ProductSuggestionItem };
