/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import { getCurrencyObject } from '@automattic/format-currency';
import { getRedirectUrl } from '@automattic/jetpack-components';

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
	return getRedirectUrl( 'jetpack-recommendations-product-checkout', {
		site: siteRawUrl,
		path: product.slug,
		query: `redirect_to=${ siteAdminUrl }admin.php?jp-react-redirect=product-purchased`,
	} );
};

const ProductSuggestionComponent = props => {
	const {
		product,
		addSelectedRecommendation,
		updateRecommendationsData,
		saveRecommendationsData,
	} = props;

	const onPurchaseClick = useCallback(
		event => {
			event.preventDefault();

			analytics.tracks.recordEvent(
				'jetpack_recommendations_product_suggestion_click',
				product.slug
			);

			addSelectedRecommendation( 'product-suggestions' );
			updateRecommendationsData( { 'product-suggestions-selection': product.slug } );
			saveRecommendationsData();

			window.location.href = event.target.href;
		},
		[ product, addSelectedRecommendation, updateRecommendationsData, saveRecommendationsData ]
	);

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent(
			'jetpack_recommendations_product_suggestion_learn_more_click',
			product.slug
		);
	}, [ product ] );

	const currencyObject = getCurrencyObject( product.cost, product.currency_code );

	return (
		<div className="jp-recommendations-product-suggestion-item jp-recommendations-product-suggestion__item">
			<div className="jp-recommendations-product-suggestion-item__content">
				<h2 className="jp-recommendations-product-suggestion-item__title">{ product.title }</h2>
				<p className="jp-recommendations-product-suggestion-item__description">
					{ product.description }
				</p>
				<Button
					className="jp-recommendations-product-suggestion-item__checkout-button"
					primary
					href={ generateCheckoutLink( props ) }
					onClick={ onPurchaseClick }
				>
					{ sprintf(
						/* translators: %s: Name of a Jetpack product. */
						__( 'Continue with %s', 'jetpack' ),
						product.title
					) }
				</Button>
				{ !! product.cta_link && !! product.cta_text && (
					<ExternalLink
						className="jp-recommendations-product-suggestion-item__external-link"
						href={ product.cta_link }
						target="_blank"
						icon={ true }
						iconSize={ 16 }
						onClick={ onExternalLinkClick }
						children={ product.cta_text }
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
					{ product.cost_timeframe },
					<br />
					{ product.billing_timeframe }
				</span>
			</div>
		</div>
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
		updateRecommendationsData: product => dispatch( updateRecommendationsDataAction( product ) ),
		saveRecommendationsData: () => dispatch( saveRecommendationsDataAction() ),
	} )
)( ProductSuggestionComponent );

export { ProductSuggestion };
