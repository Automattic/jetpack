import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import QueryIntroOffers from 'components/data/query-intro-offers';
import QueryRecommendationsConditional from 'components/data/query-recommendations-conditional';
import QueryRecommendationsData from 'components/data/query-recommendations-data';
import QueryRecommendationsProductSuggestions from 'components/data/query-recommendations-product-suggestions';
import QueryRecommendationsUpsell from 'components/data/query-recommendations-upsell';
import QueryRewindStatus from 'components/data/query-rewind-status';
import QuerySite from 'components/data/query-site';
import QuerySiteDiscount from 'components/data/query-site-discount';
import QuerySitePlugins from 'components/data/query-site-plugins';
import { JetpackLoadingIcon } from 'components/jetpack-loading-icon';
import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import { getNewRecommendations } from 'state/initial-state';
import {
	getStep,
	isRecommendationsDataLoaded,
	isRecommendationsConditionalLoaded,
} from 'state/recommendations';
import { RECOMMENDATION_WIZARD_STEP } from './constants';
import { ProductPurchased } from './product-purchased';
import { FeaturePrompt } from './prompts/feature-prompt';
import { ProductSuggestions } from './prompts/product-suggestions';
import { ResourcePrompt } from './prompts/resource-prompt';
import { SiteTypeQuestion } from './prompts/site-type';
import { Summary } from './summary';

const RecommendationsComponent = props => {
	const { isLoading, step, newRecommendations } = props;

	let redirectPath;

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
		case RECOMMENDATION_WIZARD_STEP.SECURITY_PLAN:
			redirectPath = '/security-plan';
			break;
		case RECOMMENDATION_WIZARD_STEP.ANTI_SPAM:
			redirectPath = '/anti-spam';
			break;
		case RECOMMENDATION_WIZARD_STEP.VIDEOPRESS:
			redirectPath = '/videopress';
			break;
		case RECOMMENDATION_WIZARD_STEP.BOOST:
			redirectPath = '/boost';
			break;
		case RECOMMENDATION_WIZARD_STEP.SUMMARY:
			redirectPath = '/summary';
			break;
		default:
			throw `Unknown step ${ step } in RecommendationsComponent`;
	}

	// Check to see if a step slug is "new" - has not been viewed yet.
	const isNew = stepSlug => {
		return newRecommendations && newRecommendations.includes( stepSlug );
	};

	return (
		<>
			<h1 className="screen-reader-text">{ __( 'Jetpack Recommendations', 'jetpack' ) }</h1>
			<QueryRecommendationsData />
			<QueryRecommendationsProductSuggestions />
			<QueryRecommendationsUpsell />
			<QueryRecommendationsConditional />
			<QueryRewindStatus />
			<QuerySite />
			<QuerySitePlugins />
			<QuerySiteDiscount />
			<QueryIntroOffers />
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
					<Route path="/recommendations/security-plan">
						<ResourcePrompt stepSlug="security-plan" isNew={ isNew( 'security-plan' ) } />
					</Route>
					<Route path="/recommendations/anti-spam">
						<ResourcePrompt stepSlug="anti-spam" isNew={ isNew( 'anti-spam' ) } />
					</Route>
					<Route path="/recommendations/videopress">
						<FeaturePrompt stepSlug="videopress" isNew={ isNew( 'videopress' ) } />
					</Route>
					<Route path="/recommendations/boost">
						<FeaturePrompt stepSlug="boost" isNew={ isNew( 'boost' ) } />
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
	isLoading:
		! isRecommendationsDataLoaded( state ) || ! isRecommendationsConditionalLoaded( state ),
	step: getStep( state ),
	newRecommendations: getNewRecommendations( state ),
} ) )( RecommendationsComponent );
