/**
 * External dependencies
 */
import React from 'react';
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
} from 'state/recommendations';
import { isFetchingSiteDiscount, getSiteDiscount } from 'state/site/reducer';
import { ProductSuggestion } from '../product-suggestion';
import BackButton from '../../back-button';
import Timer from '../../timer';

/**
 * Style dependencies
 */
import './style.scss';

const ProductSuggestionsComponent = props => {
	const { isFetchingSuggestions, suggestions, isLoadingDiscount, discountData } = props;
	const expiryDate = discountData?.expiry_date;
	const discount = discountData?.discount;

	if ( isFetchingSuggestions ) {
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
				{ ! isLoadingDiscount && discount && (
					<>
						<span>
							{ __(
								'* Discount is for first term only, all renewals are at full price.',
								'jetpack'
							) }
						</span>
						{ expiryDate && (
							<span className="jp-recommendations-product-suggestion__timer">
								<span>{ __( 'Offer ends in:', 'jetpack' ) }</span>
								<Timer
									className="jp-recommendations-product-suggestion__time"
									expiryDate={ expiryDate }
								/>
							</span>
						) }
					</>
				) }
			</footer>
		</section>
	);
};

export const ProductSuggestions = connect( state => ( {
	suggestions: getProductSuggestions( state ),
	isFetchingSuggestions: isFetchingRecommendationsProductSuggestions( state ),
	isLoadingDiscount: isFetchingSiteDiscount( state ),
	discountData: getSiteDiscount( state ),
} ) )( ProductSuggestionsComponent );
