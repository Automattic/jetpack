/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { isArray } from 'lodash';
import { __, _x } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import { PromptLayout } from '../prompts/prompt-layout';
import { LoadingCard } from '../sidebar/loading-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import {
	getProductSuggestions,
	getNextRoute,
	isFetchingRecommendationsProductSuggestions as isFetchingSuggestionsAction,
} from 'state/recommendations';
import {
	getSitePlan,
	getActiveProductPurchases,
	isFetchingSiteData as isFetchingSiteDataState,
} from 'state/site';

/**
 * Style dependencies
 */
import './style.scss';

const getPurchasedSuggestion = ( sitePlan, activePurchases, suggestions ) => {
	if ( ! suggestions || ! isArray( suggestions ) ) {
		return false;
	}

	const matchingPlan = suggestions.find( suggestion => suggestion.slug === sitePlan.product_slug );

	if ( matchingPlan ) {
		return matchingPlan;
	}

	if ( isArray( activePurchases ) ) {
		const matchingProduct = suggestions.find( suggestion => {
			if (
				activePurchases.find( activePurchase => suggestion.slug === activePurchase.product_slug )
			) {
				return suggestion;
			}
		} );

		if ( matchingProduct ) {
			return matchingProduct;
		}
	}

	return false;
};

const ProductPurchasedComponent = props => {
	const {
		sitePlan,
		activePurchases,
		isFetchingSiteData,
		isFetchingSuggestions,
		nextRoute,
		suggestions,
	} = props;

	let suggestion = false;

	useEffect( () => {
		if ( suggestion ) {
			analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_purchased', {
				type: suggestion.slug,
			} );
		}
	}, [ suggestion ] );

	if ( isFetchingSiteData || isFetchingSuggestions ) {
		return <LoadingCard />;
	}

	suggestion = getPurchasedSuggestion( sitePlan, activePurchases, suggestions );

	const answerSection = (
		<div className="jp-recommendations-product-purchased">
			<ul className="jp-recommendations-product-purchased__features">
				{ suggestion &&
					suggestion.features.map( ( feature, key ) => (
						<li
							className="jp-recommenconst ProductPurchasedComponent = props => {dations-product-purchased__feature"
							key={ key }
						>
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
			question={ __( 'Your plan has been upgraded!', 'jetpack' ) }
			description={ __( 'You now have access to these benefits:', 'jetpack' ) }
			illustrationPath={ 'recommendations/product-purchased-illustration.svg' }
			answer={ answerSection }
		/>
	);
};

export const ProductPurchased = connect( state => ( {
	activePurchases: getActiveProductPurchases( state ),
	isFetchingSiteData: isFetchingSiteDataState( state ),
	isFetchingSuggestions: isFetchingSuggestionsAction( state ),
	nextRoute: getNextRoute( state ),
	sitePlan: getSitePlan( state ),
	suggestions: getProductSuggestions( state ),
} ) )( ProductPurchasedComponent );
