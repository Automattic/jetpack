/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { getCurrencyObject } from '@automattic/format-currency';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import ExternalLink from 'components/external-link';
import analytics from 'lib/analytics';
import { getSiteAdminUrl, getSiteRawUrl } from 'state/initial-state';

import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	updateRecommendationsData as updateRecommendationsDataAction,
	saveRecommendationsData as saveRecommendationsDataAction,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const generateCheckoutLink = ( { product, siteAdminUrl, siteRawUrl } ) => {
	return addQueryArgs( `https://wordpress.com/checkout/${ siteRawUrl }/${ product.product_slug }`, {
		redirect_to: siteAdminUrl + 'admin.php?page=jetpack#/recommendations/product-purchased',
	} );
};

const ProductSuggestionItemComponent = props => {
	const {
		product,
		title,
		description,
		externalLink,
		addSelectedRecommendation,
		updateRecommendationsData,
		saveRecommendationsData,
	} = props;

	const onPurchaseClick = useCallback( () => {
		analytics.tracks.recordEvent(
			'jetpack_recommendations_product_suggestion_click',
			product.product_slug
		);
		addSelectedRecommendation( 'product-suggestion' );
		updateRecommendationsData( { 'product-suggestion-selection': product.product_slug } );
		saveRecommendationsData();
	}, [ product, addSelectedRecommendation, updateRecommendationsData, saveRecommendationsData ] );

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent(
			'jetpack_recommendations_product_suggestion_learn_more_click',
			product.product_slug
		);
	}, [ product ] );

	const currencyObject = getCurrencyObject( product.cost / 12, product.currency_code );

	return (
		<div className="jp-recommendations-product-suggestion-item jp-recommendations-product-suggestion__item">
			<div className="jp-recommendations-product-suggestion-item__content">
				<h2 className="jp-recommendations-product-suggestion-item__title">{ title }</h2>
				<p className="jp-recommendations-product-suggestion-item__description">{ description }</p>
				<Button
					className="jp-recommendations-product-suggestion-item__checkout-button"
					primary
					href={ generateCheckoutLink( props ) }
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
		siteRawUrl: getSiteRawUrl( state ),
	} ),
	dispatch => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
		updateRecommendationsData: product => dispatch( updateRecommendationsDataAction( product ) ),
		saveRecommendationsData: () => dispatch( saveRecommendationsDataAction() ),
	} )
)( ProductSuggestionItemComponent );

export { ProductSuggestionItem };
