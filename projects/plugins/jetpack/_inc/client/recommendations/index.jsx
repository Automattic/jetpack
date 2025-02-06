import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Route, Routes, Navigate } from 'react-router-dom';
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
import QuerySiteProducts from '../components/data/query-site-products';
import { RECOMMENDATION_WIZARD_STEP } from './constants';
import { ProductPurchased } from './product-purchased';
import { FeaturePrompt } from './prompts/feature-prompt';
import { ProductSuggestions } from './prompts/product-suggestions';
import { ResourcePrompt } from './prompts/resource-prompt';
import { SiteTypeQuestion } from './prompts/site-type';
import { Summary } from './summary';

const useInitOnboarding = ( {
	step,
	isLoading,
	onboardingData,
	updateOnboardingData,
	updateStep,
} ) => {
	const [ isInitialized, setIsInitialized ] = useState( false );
	useEffect( () => {
		if ( ! isInitialized && onboardingData && ! isLoading ) {
			const { active, hasStarted, viewed } = onboardingData;

			setIsInitialized( true );

			if ( active && ! hasStarted ) {
				updateStep( step );
				updateOnboardingData( { ...onboardingData, hasStarted: true } );
			} else {
				// If no onboarding to start, sync only viewed onboardings
				updateOnboardingData( { viewed } );
			}
		}
	}, [ isLoading, onboardingData, updateOnboardingData, step, updateStep, isInitialized ] );
};

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
		case RECOMMENDATION_WIZARD_STEP.AGENCY:
			redirectPath = '/agency';
			break;
		case RECOMMENDATION_WIZARD_STEP.WOOCOMMERCE:
			redirectPath = '/woocommerce';
			break;
		case RECOMMENDATION_WIZARD_STEP.MONITOR:
			redirectPath = '/monitor';
			break;
		case RECOMMENDATION_WIZARD_STEP.NEWSLETTER:
			redirectPath = '/newsletter';
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
		case RECOMMENDATION_WIZARD_STEP.VAULTPRESS_BACKUP:
			redirectPath = '/vaultpress-backup';
			break;
		case RECOMMENDATION_WIZARD_STEP.VAULTPRESS_FOR_WOOCOMMERCE:
			redirectPath = '/vaultpress-for-woocommerce';
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
		case RECOMMENDATION_WIZARD_STEP.WELCOME__STARTER:
			redirectPath = '/welcome-starter';
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
		case RECOMMENDATION_WIZARD_STEP.WELCOME__SOCIAL_BASIC:
			redirectPath = '/welcome-social-basic';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__SOCIAL_V1:
			redirectPath = '/welcome-social-v1';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__SOCIAL_IMAGE_GENERATOR:
			redirectPath = 'welcome-social-image-generator';
			break;
		case RECOMMENDATION_WIZARD_STEP.WELCOME__GOLDEN_TOKEN:
			redirectPath = '/welcome-golden-token';
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
		case RECOMMENDATION_WIZARD_STEP.UNLIMITED_SHARING_ACTIVATED:
			redirectPath = '/unlimited-sharing-activated';
			break;
		case RECOMMENDATION_WIZARD_STEP.SOCIAL_V1_ACTIVATED:
			redirectPath = '/social-v1-activated';
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

	useInitOnboarding( props );

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
			<QuerySiteProducts />
			<QueryIntroOffers />
			{ isLoading ? (
				<div className="jp-recommendations__loading">
					<JetpackLoadingIcon altText={ __( 'Loading recommendations', 'jetpack' ) } />
				</div>
			) : (
				<Routes>
					<Route
						path=""
						element={ <Navigate to={ '/recommendations' + redirectPath } replace /> }
					/>
					<Route path="site-type" element={ <SiteTypeQuestion /> } />
					<Route path="product-suggestions" element={ <ProductSuggestions /> } />
					<Route path="product-purchased" element={ <ProductPurchased /> } />
					<Route path="agency" element={ <ResourcePrompt stepSlug="agency" /> } />
					<Route path="woocommerce" element={ <FeaturePrompt stepSlug="woocommerce" /> } />
					<Route path="monitor" element={ <FeaturePrompt stepSlug="monitor" /> } />
					<Route path="newsletter" element={ <FeaturePrompt stepSlug="newsletter" /> } />
					<Route path="related-posts" element={ <FeaturePrompt stepSlug="related-posts" /> } />
					<Route path="creative-mail" element={ <FeaturePrompt stepSlug="creative-mail" /> } />
					<Route
						path="/site-accelerator"
						element={ <FeaturePrompt stepSlug="site-accelerator" /> }
					/>
					<Route
						path="/vaultpress-backup"
						element={ <ResourcePrompt stepSlug="vaultpress-backup" /> }
					/>
					<Route
						path="/vaultpress-for-woocommerce"
						element={ <ResourcePrompt stepSlug="vaultpress-for-woocommerce" /> }
					/>
					<Route
						path="/publicize"
						element={ <FeaturePrompt stepSlug="publicize" isNew={ isNew( 'publicize' ) } /> }
					/>
					<Route
						path="/protect"
						element={ <FeaturePrompt stepSlug="protect" isNew={ isNew( 'protect' ) } /> }
					/>
					<Route
						path="/anti-spam"
						element={ <ResourcePrompt stepSlug="anti-spam" isNew={ isNew( 'anti-spam' ) } /> }
					/>
					<Route
						path="/videopress"
						element={ <FeaturePrompt stepSlug="videopress" isNew={ isNew( 'videopress' ) } /> }
					/>
					<Route
						path="/backup-plan"
						element={ <ResourcePrompt stepSlug="backup-plan" isNew={ isNew( 'backup-plan' ) } /> }
					/>
					<Route
						path="/boost"
						element={ <FeaturePrompt stepSlug="boost" isNew={ isNew( 'boost' ) } /> }
					/>
					<Route path="/welcome-backup" element={ <ResourcePrompt stepSlug="welcome__backup" /> } />
					<Route
						path="/welcome-complete"
						element={ <ResourcePrompt stepSlug="welcome__complete" /> }
					/>
					<Route
						path="/welcome-starter"
						element={ <ResourcePrompt stepSlug="welcome__starter" /> }
					/>
					<Route
						path="/welcome-security"
						element={ <ResourcePrompt stepSlug="welcome__security" /> }
					/>
					<Route
						path="/welcome-antispam"
						element={ <ResourcePrompt stepSlug="welcome__antispam" /> }
					/>
					<Route
						path="/welcome-videopress"
						element={ <ResourcePrompt stepSlug="welcome__videopress" /> }
					/>
					<Route path="/welcome-search" element={ <ResourcePrompt stepSlug="welcome__search" /> } />
					<Route path="/welcome-scan" element={ <ResourcePrompt stepSlug="welcome__scan" /> } />
					<Route
						path="/welcome-social-basic"
						element={ <ResourcePrompt stepSlug="welcome__social_basic" /> }
					/>
					<Route
						path="/welcome-social-v1"
						element={ <ResourcePrompt stepSlug="welcome__social_v1" /> }
					/>
					<Route
						path="/welcome-social-image-generator"
						element={ <ResourcePrompt stepSlug="welcome__social_image_generator" /> }
					/>
					<Route
						path="/welcome-golden-token"
						element={ <ResourcePrompt stepSlug="welcome__golden_token" /> }
					/>
					<Route
						path="/backup-activated"
						element={ <ResourcePrompt stepSlug="backup-activated" /> }
					/>
					<Route path="/scan-activated" element={ <ResourcePrompt stepSlug="scan-activated" /> } />
					<Route
						path="/unlimited-sharing-activated"
						element={ <ResourcePrompt stepSlug="unlimited-sharing-activated" /> }
					/>
					<Route
						path="/social-v1-activated"
						element={ <ResourcePrompt stepSlug="social-v1-activated" /> }
					/>
					<Route
						path="/antispam-activated"
						element={ <ResourcePrompt stepSlug="antispam-activated" /> }
					/>
					<Route
						path="/videopress-activated"
						element={ <ResourcePrompt stepSlug="videopress-activated" /> }
					/>
					<Route
						path="/search-activated"
						element={ <ResourcePrompt stepSlug="search-activated" /> }
					/>
					<Route
						path="/server-credentials"
						element={ <ResourcePrompt stepSlug="server-credentials" /> }
					/>
					<Route
						path="/summary"
						element={ <Summary newRecommendations={ newRecommendations } /> }
					/>
				</Routes>
			) }
			<div className="jp-recommendations__links">
				<a role="button" tabIndex="0" href={ getRedirectUrl( 'jetpack-support-getting-started' ) }>
					{ __( 'Learn how to get started with Jetpack', 'jetpack' ) }
				</a>
				<a role="button" tabIndex="0" href={ getRedirectUrl( 'jetpack-support' ) }>
					{ __( 'Search our support site', 'jetpack' ) }
				</a>
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
