/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { __, _x } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import { PromptLayout } from '../prompts/prompt-layout';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import {
	getProductSuggestions,
	getDataByKey,
	getNextRoute,
	isFetchingRecommendationsProductSuggestions as isFetchingSuggestionsAction,
} from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const ProductPurchasedComponent = props => {
	const { isFetchingSuggestions, nextRoute, purchasedProductSlug, suggestions } = props;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_purchased', {
			type: purchasedProductSlug,
		} );
	}, [ purchasedProductSlug ] );

	let features = [];

	if ( ! isFetchingSuggestions ) {
		const purchasedProduct = suggestions.find( product => purchasedProductSlug === product.slug );

		if ( purchasedProduct && purchasedProduct.hasOwnProperty( 'features' ) ) {
			features = purchasedProduct.features;
		}
	}

	const answerSection = (
		<div className="jp-recommendations-product-purchased">
			{ isFetchingSuggestions && (
				<p className="jp-recommendations-product-purchased">{ __( 'Loading…', 'jetpack' ) }</p>
			) }
			<ul className="jp-recommendations-product-purchased__features">
				{ features.map( ( feature, key ) => (
					<li className="jp-recommendations-product-purchased__feature" key={ key }>
						<Gridicon icon="checkmark" />
						{ feature }
					</li>
				) ) }
			</ul>
			<Button primary className="jp-recommendations-product-purchased__next" href={ nextRoute }>
				{ _x( 'Configure your site', 'Recommendations Product Purchased', 'jetpack' ) }
			</Button>
		</div>
	);

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '33' } /> }
			question={ _x(
				'Your plan has been upgraded!',
				'Recommendations Product Purchased',
				'jetpack'
			) }
			description={ _x(
				'You now have access to these benefits:',
				'Recommendations Product Purchased',
				'jetpack'
			) }
			illustrationPath={ 'recommendations/product-purchased-illustration.svg' }
			answer={ answerSection }
		/>
	);
};

export const ProductPurchased = connect( state => ( {
	isFetchingSuggestions: isFetchingSuggestionsAction( state ),
	nextRoute: getNextRoute( state ),
	purchasedProductSlug: getDataByKey( state, 'product-suggestions-selection' ),
	suggestions: getProductSuggestions( state ),
} ) )( ProductPurchasedComponent );
