import { __ } from '@wordpress/i18n';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
	getNextRoute,
	isProductSuggestionsAvailable as isProductSuggestionsAvailableCheck,
	getProductSuggestions,
	isFetchingRecommendationsProductSuggestions,
	isFetchingRecommendationsUpsell,
} from 'state/recommendations';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import BackButton from '../../back-button';
import Timer from '../../timer';
import { isCouponValid } from '../../utils';
import { ProductSuggestion } from '../product-suggestion';

import './style.scss';

const ProductSuggestionsComponent = ( {
	nextRoute,
	isProductSuggestionsAvailable,
	isFetchingSuggestions,
	isFetchingDiscount,
	isFetchingUpsell,
	suggestions,
	discountData,
} ) => {
	const { expiry_date: expiryDate } = discountData;
	const hasDiscount = useMemo( () => isCouponValid( discountData ), [ discountData ] );

	if ( isFetchingSuggestions || isFetchingUpsell ) {
		return <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
	}

	// Redirect the user to the next step if they are not eligible for the product
	// suggestions step.
	if ( ! isProductSuggestionsAvailable ) {
		// We have to remove the first "#" value from the next route value
		// so React Router will match it with one of the other recommendations paths.
		// E.g. "#/recommendations/monitor" => "/recommendations/monitor".
		return <Redirect to={ nextRoute.substring( 1 ) } />;
	}

	return (
		<section className="jp-recommendations-question__main">
			<header className="jp-recommendations-product-suggestion__header">
				<BackButton />
			</header>
			<div className="jp-recommendations-product-suggestion__container">
				<div className="jp-recommendations-product-suggestion__items">
					{ suggestions.map( ( item, key ) => (
						<div className="jp-recommendations-product-suggestion__item" key={ key }>
							<ProductSuggestion product={ item } />
						</div>
					) ) }
				</div>
				<div className="jp-recommendations-product-suggestion__money-back-guarantee">
					<MoneyBackGuarantee text={ __( '14-day money-back guarantee', 'jetpack' ) } />
				</div>
			</div>
			{ ! isFetchingDiscount && (
				<footer className="jp-recommendations-product-suggestion__footer">
					<span>
						{ hasDiscount &&
							__(
								'* Discount is for first term only, all renewals are at full price.',
								'jetpack'
							) }
						{ ! hasDiscount &&
							__( 'Special introductory pricing, all renewals are at full price.', 'jetpack' ) }
					</span>
					{ hasDiscount && expiryDate && (
						<div className="jp-recommendations-product-suggestion__timer">
							<Timer
								timeClassName="jp-recommendations-product-suggestion__time"
								label={ __( 'Discount ends in:', 'jetpack' ) }
								expiryDate={ expiryDate }
							/>
						</div>
					) }
				</footer>
			) }
		</section>
	);
};

export const ProductSuggestions = connect( state => ( {
	nextRoute: getNextRoute( state ),
	isProductSuggestionsAvailable: isProductSuggestionsAvailableCheck( state ),
	isFetchingSuggestions: isFetchingRecommendationsProductSuggestions( state ),
	isFetchingDiscount: isFetchingSiteDiscount( state ),
	isFetchingUpsell: isFetchingRecommendationsUpsell( state ),
	suggestions: getProductSuggestions( state ),
	discountData: getSiteDiscount( state ),
} ) )( ProductSuggestionsComponent );
