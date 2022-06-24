import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { __, _x } from '@wordpress/i18n';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import analytics from 'lib/analytics';
import { isArray } from 'lodash';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
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
import { PromptLayout } from '../prompts/prompt-layout';

import './style.scss';

const getPurchasedSuggestion = ( {
	activePurchases,
	isFetchingSiteData,
	isFetchingSuggestions,
	sitePlan,
	suggestions,
} ) => {
	if ( isFetchingSiteData || isFetchingSuggestions ) {
		return false;
	}

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
	const { nextRoute } = props;
	const suggestion = getPurchasedSuggestion( props );

	useEffect( () => {
		if ( suggestion ) {
			analytics.tracks.recordEvent( 'jetpack_recommendations_product_suggestion_purchased', {
				type: suggestion.slug,
			} );
		}
	}, [ suggestion ] );

	if ( ! suggestion ) {
		return <JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />;
	}

	const answerSection = (
		<div className="jp-recommendations-product-purchased">
			<ul className="jp-recommendations-product-purchased__features">
				{ suggestion &&
					suggestion.features.map( ( feature, key ) => (
						<li className="jp-recommendations-product-purchased__feature" key={ key }>
							<Gridicon icon="checkmark" />
							{ feature }
						</li>
					) ) }
			</ul>
			<Button primary rna className="jp-recommendations-product-purchased__next" href={ nextRoute }>
				{ _x( 'Configure your site', 'Recommendations Product Purchased', 'jetpack' ) }
			</Button>
		</div>
	);

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '33' } /> }
			question={ __( 'Your plan has been upgraded!', 'jetpack' ) }
			description={ __( 'You now have access to these benefits:', 'jetpack' ) }
			answer={ answerSection }
			illustration="assistant-product-purchased"
			illustrationClassName="jp-recommendations-product-purchased__illustration"
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
