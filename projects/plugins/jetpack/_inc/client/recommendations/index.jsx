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
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import { getNewRecommendations } from 'state/initial-state';
import {
	getStep,
	getOnboardingData,
	isRecommendationsDataLoaded,
	isRecommendationsConditionalLoaded,
	updateRecommendationsOnboardingData as updateRecommendationsOnboardingDataAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
} from 'state/recommendations';
import { isFetchingSiteData } from 'state/site';
import { RECOMMENDATION_WIZARD_STEP } from './constants';
import { ProductPurchased } from './product-purchased';
import { FeaturePrompt } from './prompts/feature-prompt';
import { ProductSuggestions } from './prompts/product-suggestions';
import { ResourcePrompt } from './prompts/resource-prompt';
import { SiteTypeQuestion } from './prompts/site-type';
import { Summary } from './summary';

const RecommendationsComponent = props => {
	const {
		isLoading,
		step,
		newRecommendations,
		onboardingData,
		updateOnboardingData,
		updateStep,
	} = props;

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
		case RECOMMENDATION_WIZARD_STEP.AGENCY:
			redirectPath = '/agency';
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
		case RECOMMENDATION_WIZARD_STEP.PROTECT:
			redirectPath = '/protect';
			break;
		case RECOMMENDATION_WIZARD_STEP.ANTI_SPAM:
			redirectPath = '/anti-spam';
			break;
		case RECOMMENDATION_WIZARD_STEP.VIDEOPRESS:
			redirectPath = '/videopress';
			break;
		case RECOMMENDATION_WIZARD_STEP.BACKUP_PLAN:
			redirectPath = '/backup-plan';
			break;
		case RECOMMENDATION_WIZARD_STEP.BOOST:
			redirectPath = '/boost';
			break;
		case RECOMMENDATION_WIZARD_STEP.SUMMARY:
			redirectPath = '/summary';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__BACKUP:
			redirectPath = '/welcome-backup';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__COMPLETE:
			redirectPath = '/welcome-complete';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__SECURITY:
			redirectPath = '/welcome-security';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__ANTISPAM:
			redirectPath = '/welcome-antispam';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__VIDEOPRESS:
			redirectPath = '/welcome-videopress';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__SEARCH:
			redirectPath = '/welcome-search';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__SCAN:
			redirectPath = '/welcome-scan';
			break;
		case RECOMMENDATION_WIZARD_STEP.SERVER_CREDENTIALS:
			redirectPath = '/server-credentials';
			break;
		case RECOMMENDATION_WIZARD_STEP.BACKUP_ACTIVATED:
			redirectPath = '/backup-activated';
			break;
		case RECOMMENDATION_WIZARD_STEP.SCAN_ACTIVATED:
			redirectPath = '/scan-activated';
			break;
		case RECOMMENDATION_WIZARD_STEP.ANTISPAM_ACTIVATED:
			redirectPath = '/antispam-activated';
			break;
		case RECOMMENDATION_WIZARD_STEP.VIDEOPRESS_ACTIVATED:
			redirectPath = '/videopress-activated';
			break;
		case RECOMMENDATION_WIZARD_STEP.SEARCH_ACTIVATED:
			redirectPath = '/search-activated';
			break;
		default:
			redirectPath = '/summary';
			break;
	}

	// Check to see if a step slug is "new" - has not been viewed yet.
	const isNew = stepSlug => {
		return newRecommendations && newRecommendations.includes( stepSlug );
	};

	useEffect( () => {
		const { active, hasStarted } = onboardingData;
		if ( ! isLoading && active && ! hasStarted ) {
			updateStep( step );
			updateOnboardingData( { ...onboardingData, hasStarted: true } );
		}
	}, [ isLoading, onboardingData, updateOnboardingData, step, updateStep ] );

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
					{ /* TODO: Why we don't redirect inproper step paths? */ }
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
					<Route path="/recommendations/agency">
						<ResourcePrompt stepSlug="agency" />
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
					<Route path="/recommendations/protect">
						<FeaturePrompt stepSlug="protect" isNew={ isNew( 'protect' ) } />
					</Route>
					<Route path="/recommendations/anti-spam">
						<ResourcePrompt stepSlug="anti-spam" isNew={ isNew( 'anti-spam' ) } />
					</Route>
					<Route path="/recommendations/videopress">
						<FeaturePrompt stepSlug="videopress" isNew={ isNew( 'videopress' ) } />
					</Route>
					<Route path="/recommendations/backup-plan">
						<ResourcePrompt stepSlug="backup-plan" isNew={ isNew( 'backup-plan' ) } />
					</Route>
					<Route path="/recommendations/boost">
						<FeaturePrompt stepSlug="boost" isNew={ isNew( 'boost' ) } />
					</Route>
					<Route path="/recommendations/welcome-backup">
						<ResourcePrompt stepSlug="welcome__backup" />
					</Route>
					<Route path="/recommendations/welcome-complete">
						<ResourcePrompt stepSlug="welcome__complete" />
					</Route>
					<Route path="/recommendations/welcome-security">
						<ResourcePrompt stepSlug="welcome__security" />
					</Route>
					<Route path="/recommendations/welcome-antispam">
						<ResourcePrompt stepSlug="welcome__antispam" />
					</Route>
					<Route path="/recommendations/welcome-videopress">
						<ResourcePrompt stepSlug="welcome__videopress" />
					</Route>
					<Route path="/recommendations/welcome-search">
						<ResourcePrompt stepSlug="welcome__search" />
					</Route>
					<Route path="/recommendations/welcome-scan">
						<ResourcePrompt stepSlug="welcome__scan" />
					</Route>
					<Route path="/recommendations/backup-activated">
						<ResourcePrompt stepSlug="backup-activated" />
					</Route>
					<Route path="/recommendations/scan-activated">
						<ResourcePrompt stepSlug="scan-activated" />
					</Route>
					<Route path="/recommendations/antispam-activated">
						<ResourcePrompt stepSlug="antispam-activated" />
					</Route>
					<Route path="/recommendations/videopress-activated">
						<ResourcePrompt stepSlug="videopress-activated" />
					</Route>
					<Route path="/recommendations/search-activated">
						<ResourcePrompt stepSlug="search-activated" />
					</Route>
					<Route path="/recommendations/server-credentials">
						<ResourcePrompt stepSlug="server-credentials" />
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

export const Recommendations = connect(
	state => ( {
		isLoading:
			! isRecommendationsDataLoaded( state ) ||
			! isRecommendationsConditionalLoaded( state ) ||
			isFetchingSiteData( state ),
		step: getStep( state ),
		onboardingData: getOnboardingData( state ),
		newRecommendations: getNewRecommendations( state ),
	} ),
	dispatch => ( {
		updateOnboardingData: onboardingData =>
			dispatch( updateRecommendationsOnboardingDataAction( onboardingData ) ),
		updateStep: step => dispatch( updateRecommendationsStepAction( step ) ),
	} )
)( RecommendationsComponent );
