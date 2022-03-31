/**
 * External dependencies
 */
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import {
	getProductSuggestions,
	isFetchingRecommendationsProductSuggestions,
	isFetchingRecommendationsUpsell,
} from 'state/recommendations';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import { ProductSuggestion } from '../product-suggestion';
import BackButton from '../../back-button';
import Timer from '../../timer';

/**
 * Style dependencies
 */
import './style.scss';

const ProductSuggestionsComponent = ( {
	isFetchingSuggestions,
	isFetchingDiscount,
	isFetchingUpsell,
	suggestions,
	discountData,
} ) => {
	const { discount, expiry_date: expiryDate, is_used: isUsed } = discountData;
	const hasDiscount = useMemo(
		() => discount && ! isUsed && new Date( expiryDate ).valueOf() - Date.now() > 0,
		[ discount, isUsed, expiryDate ]
	);

	if ( isFetchingSuggestions || isFetchingUpsell ) {
		return <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
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
				<div></div>
			</div>
			<footer className="jp-recommendations-product-suggestion__footer">
				{ ! isFetchingDiscount && hasDiscount && (
					<>
						<span>
							{ __(
								'* Discount is for first term only, all renewals are at full price.',
								'jetpack'
							) }
						</span>
						{ expiryDate && (
							<div className="jp-recommendations-product-suggestion__timer">
								<Timer
									timeClassName="jp-recommendations-product-suggestion__time"
									label={ __( 'Discount ends in:', 'jetpack' ) }
									expiryDate={ expiryDate }
								/>
							</div>
						) }
					</>
				) }
			</footer>
		</section>
	);
};

export const ProductSuggestions = connect( state => ( {
	isFetchingSuggestions: isFetchingRecommendationsProductSuggestions( state ),
	isFetchingDiscount: isFetchingSiteDiscount( state ),
	isFetchingUpsell: isFetchingRecommendationsUpsell( state ),
	suggestions: getProductSuggestions( state ),
	discountData: getSiteDiscount( state ),
} ) )( ProductSuggestionsComponent );
