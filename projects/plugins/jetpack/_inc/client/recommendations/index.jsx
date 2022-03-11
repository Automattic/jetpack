/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { FeaturePrompt } from './prompts/feature-prompt';
import { ProductSuggestions } from './prompts/product-suggestions';
import { ProductPurchased } from './product-purchased';
import { SiteTypeQuestion } from './prompts/site-type';
import { Summary } from './summary';
import QueryRecommendationsData from 'components/data/query-recommendations-data';
import QueryRecommendationsProductSuggestions from 'components/data/query-recommendations-product-suggestions';
import QueryRecommendationsUpsell from 'components/data/query-recommendations-upsell';
import QueryRecommendationsConditional from 'components/data/query-recommendations-conditional';
import QueryRewindStatus from 'components/data/query-rewind-status';
import QuerySite from 'components/data/query-site';
import QuerySitePlugins from 'components/data/query-site-plugins';
import {
	getStep,
	isRecommendationsDataLoaded,
	isRecommendationsConditionalLoaded,
	getNewConditionalRecommendations,
} from 'state/recommendations';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import { RECOMMENDATION_WIZARD_STEP } from './constants';

const RecommendationsComponent = props => {
	const { isLoading, isConditionalLoading, step, newConditionalRecommendations } = props;

	let redirectPath;
	const [ newRecommendations, setNewRecommendations ] = useState( [] );

	switch ( step ) {
		case RECOMMENDATION_WIZARD_STEP.NOT_STARTED:
		case RECOMMENDATION_WIZARD_STEP.SITE_TYPE:
			redirectPath = '/site-type';
			break;
		case RECOMMENDATION_WIZARD_STEP.PRODUCT_SUGGESTIONS:
			redirectPath = '/product-suggestions';
			break;
		case RECOMMENDATION_WIZARD_STEP.PRODUCT_PURCHASED:
			redirectPath = '/product-purchased';
			break;
		case RECOMMENDATION_WIZARD_STEP.WOOCOMMERCE:
			redirectPath = '/woocommerce';
			break;
		case RECOMMENDATION_WIZARD_STEP.MONITOR:
			redirectPath = '/monitor';
			break;
		case RECOMMENDATION_WIZARD_STEP.RELATED_POSTS:
			redirectPath = '/related-posts';
			break;
		case RECOMMENDATION_WIZARD_STEP.CREATIVE_MAIL:
			redirectPath = '/creative-mail';
			break;
		case RECOMMENDATION_WIZARD_STEP.SITE_ACCELERATOR:
			redirectPath = '/site-accelerator';
			break;
		case RECOMMENDATION_WIZARD_STEP.PUBLICIZE:
			redirectPath = '/publicize';
			break;
		case RECOMMENDATION_WIZARD_STEP.SUMMARY:
			redirectPath = '/summary';
			break;
		default:
			throw `Unknown step ${ step } in RecommendationsComponent`;
	}

	// Collect a snapshot of the new recommendations just after the data has loaded.
	// This will allow us to persist which recommendations are "new" for this load even after they have been viewed and state has changed.
	// This is used to show a "New" badge on the recommendation step and on the summary screen.
	useEffect( () => {
		// data has loaded
		if ( ! isLoading && ! isConditionalLoading ) {
			setNewRecommendations( [ ...newConditionalRecommendations ] );
		}
	}, [ isLoading, isConditionalLoading, newConditionalRecommendations ] );

	// Check to see if a step slug is "new" - has not been viewed yet.
	const isNew = stepSlug => {
		return newRecommendations && newRecommendations.includes( stepSlug );
	};

	return (
		<>
			<QueryRecommendationsData />
			<QueryRecommendationsProductSuggestions />
			<QueryRecommendationsUpsell />
			<QueryRecommendationsConditional />
			<QueryRewindStatus />
			<QuerySite />
			<QuerySitePlugins />
			{ isLoading ? (
				<div className="jp-recommendations__loading">
					<JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />
				</div>
			) : (
				<Switch>
					<Redirect exact from={ '/recommendations' } to={ '/recommendations' + redirectPath } />
					<Route path="/recommendations/site-type">
						<SiteTypeQuestion />
					</Route>
					<Route path="/recommendations/product-suggestions">
						<ProductSuggestions />
					</Route>
					<Route path="/recommendations/product-purchased">
						<ProductPurchased />
					</Route>
					<Route path="/recommendations/woocommerce">
						<FeaturePrompt stepSlug="woocommerce" />
					</Route>
					<Route path="/recommendations/monitor">
						<FeaturePrompt stepSlug="monitor" />
					</Route>
					<Route path="/recommendations/related-posts">
						<FeaturePrompt stepSlug="related-posts" />
					</Route>
					<Route path="/recommendations/creative-mail">
						<FeaturePrompt stepSlug="creative-mail" />
					</Route>
					<Route path="/recommendations/site-accelerator">
						<FeaturePrompt stepSlug="site-accelerator" />
					</Route>
					<Route path="/recommendations/publicize">
						<FeaturePrompt stepSlug="publicize" isNew={ isNew( 'publicize' ) } />
					</Route>
					<Route path="/recommendations/summary">
						<Summary newRecommendations={ newRecommendations } />
					</Route>
				</Switch>
			) }
			<div className="jp-footer">
				<li className="jp-footer__link-item">
					<a
						role="button"
						tabIndex="0"
						className="jp-footer__link"
						href={ getRedirectUrl( 'jetpack-support-getting-started' ) }
					>
						{ __( 'Learn how to get started with Jetpack', 'jetpack' ) }
					</a>
				</li>
				<li className="jp-footer__link-item">
					<a
						role="button"
						tabIndex="0"
						className="jp-footer__link"
						href={ getRedirectUrl( 'jetpack-support' ) }
					>
						{ __( 'Search our support site', 'jetpack' ) }
					</a>
				</li>
			</div>
		</>
	);
};

export const Recommendations = connect( state => ( {
	isLoading: ! isRecommendationsDataLoaded( state ),
	isConditionalLoading: ! isRecommendationsConditionalLoaded( state ),
	step: getStep( state ),
	newConditionalRecommendations: getNewConditionalRecommendations( state ),
} ) )( RecommendationsComponent );
