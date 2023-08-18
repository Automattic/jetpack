import {
	isJetpackPlanWithAntiSpam,
	isJetpackPlanWithBackup,
	PLAN_JETPACK_SECURITY_T1_YEARLY,
	PLAN_JETPACK_VIDEOPRESS,
	PLAN_JETPACK_ANTI_SPAM,
	PLAN_JETPACK_BACKUP_T1_YEARLY,
	getPlanClass,
} from 'lib/plans/constants';
import { assign, difference, get, isArray, isEmpty, mergeWith, union } from 'lodash';
import {
	ONBOARDING_JETPACK_BACKUP,
	ONBOARDING_JETPACK_COMPLETE,
	ONBOARDING_JETPACK_SECURITY,
	ONBOARDING_JETPACK_STARTER,
	ONBOARDING_JETPACK_ANTI_SPAM,
	ONBOARDING_JETPACK_VIDEOPRESS,
	ONBOARDING_JETPACK_SEARCH,
	ONBOARDING_JETPACK_SCAN,
	ONBOARDING_JETPACK_GOLDEN_TOKEN,
	SUMMARY_SECTION_BY_ONBOARDING_NAME,
	RECOMMENDATION_WIZARD_STEP,
	ONBOARDING_SUPPORT_START_TIMESTAMP,
} from 'recommendations/constants';
import { combineReducers } from 'redux';
import {
	JETPACK_RECOMMENDATIONS_DATA_ADD_SELECTED_RECOMMENDATION,
	JETPACK_RECOMMENDATIONS_DATA_ADD_SKIPPED_RECOMMENDATION,
	JETPACK_RECOMMENDATIONS_DATA_ADD_VIEWED_RECOMMENDATION,
	JETPACK_RECOMMENDATIONS_DATA_FETCH,
	JETPACK_RECOMMENDATIONS_DATA_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_DATA_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_DATA_UPDATE,
	JETPACK_RECOMMENDATIONS_STEP_UPDATE,
	JETPACK_RECOMMENDATIONS_STEP_UPDATE_SUCCESS,
	JETPACK_RECOMMENDATIONS_STEP_UPDATE_FAIL,
	JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH,
	JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_UPSELL_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH,
	JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_RECEIVE,
	JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_FAIL,
	JETPACK_RECOMMENDATIONS_SITE_DISCOUNT_VIEWED,
	JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_START,
	JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_END,
	JETPACK_RECOMMENDATIONS_DATA_ONBOARDING_DATA_UPDATE,
} from 'state/action-types';
import { hasConnectedOwner } from 'state/connection';
import {
	getNewRecommendations,
	getInitialRecommendationsStep,
	getNewRecommendationsCount,
	isWooCommerceActive,
} from 'state/initial-state';
import { getRewindStatus } from 'state/rewind';
import { getSetting } from 'state/settings';
import {
	getSitePlan,
	getSitePurchases,
	hasActiveProductPurchase,
	hasActiveSecurityPurchase,
	siteHasFeature,
	isFetchingSiteData,
	hasActiveAntiSpamPurchase,
	hasSecurityComparableLegacyPlan,
	hasActiveBackupPurchase,
} from 'state/site';
import { isPluginActive } from 'state/site/plugins';
import { sortByOnboardingPriority, getOnboardingNameByProductSlug } from './onboarding-utils';

const mergeArrays = ( x, y ) => {
	if ( Array.isArray( x ) && Array.isArray( y ) ) {
		return union( x, y );
	}
};

const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_DATA_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_DATA_UPDATE:
			// Filter out deprecated slugs and convert them to new ones (if the new ones don't already exist)
			for ( const [ key, value ] of Object.entries( action.data ) ) {
				const actionData = action.data;
				if ( key === 'site-type-business' ) {
					const oldValue = actionData[ 'site-type-agency' ];

					actionData[ 'site-type-agency' ] = oldValue !== undefined ? oldValue : value;
					delete actionData[ 'site-type-business' ];
				}

				if ( key === 'site-type-other' ) {
					const oldValue = actionData[ 'site-type-personal' ];

					actionData[ 'site-type-personal' ] = oldValue !== undefined ? oldValue : value;
					delete actionData[ 'site-type-other' ];
				}
			}

			return assign( {}, state, action.data );
		case JETPACK_RECOMMENDATIONS_DATA_ADD_SELECTED_RECOMMENDATION: {
			const selectedState = mergeWith(
				{},
				state,
				{
					selectedRecommendations: [ action.slug ],
					skippedRecommendations: [],
					viewedRecommendations: [],
				},
				mergeArrays
			);
			selectedState.skippedRecommendations = difference( state.skippedRecommendations, [
				action.slug,
			] );
			return selectedState;
		}
		case JETPACK_RECOMMENDATIONS_DATA_ADD_SKIPPED_RECOMMENDATION: {
			const skippedState = mergeWith(
				{},
				state,
				{
					selectedRecommendations: [],
					skippedRecommendations: [ action.slug ],
					viewedRecommendations: [],
				},
				mergeArrays
			);
			skippedState.selectedRecommendations = difference( state.selectedRecommendations, [
				action.slug,
			] );
			return skippedState;
		}
		case JETPACK_RECOMMENDATIONS_DATA_ADD_VIEWED_RECOMMENDATION: {
			const viewedState = mergeWith(
				{},
				state,
				{
					selectedRecommendations: [],
					skippedRecommendations: [],
					viewedRecommendations: [ action.slug ],
				},
				mergeArrays
			);

			return viewedState;
		}
		case JETPACK_RECOMMENDATIONS_DATA_ONBOARDING_DATA_UPDATE: {
			const { active, viewed, hasStarted, totalSteps } = action.onboardingData;
			return Object.assign( {}, state, {
				...( active !== undefined ? { onboardingActive: active } : {} ),
				...( viewed !== undefined ? { onboardingViewed: viewed } : {} ),
				...( hasStarted !== undefined ? { onboardingHasStarted: hasStarted } : {} ),
				...( totalSteps !== undefined ? { onboardingTotalSteps: totalSteps } : {} ),
			} );
		}
		default:
			return state;
	}
};

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_DATA_FETCH:
			return assign( {}, state, { isFetchingRecommendationsData: true } );
		case JETPACK_RECOMMENDATIONS_DATA_FETCH_RECEIVE:
			return assign( {}, state, {
				isRecommendationsDataLoaded: true,
				isFetchingRecommendationsData: false,
			} );
		case JETPACK_RECOMMENDATIONS_DATA_FETCH_FAIL:
			return assign( {}, state, { isFetchingRecommendationsData: false } );
		case JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH:
			return assign( {}, state, { isFetchingRecommendationsProductSuggestions: true } );
		case JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_FAIL:
			return assign( {}, state, { isFetchingRecommendationsProductSuggestions: false } );
		case JETPACK_RECOMMENDATIONS_UPSELL_FETCH:
			return assign( {}, state, { isFetchingRecommendationsUpsell: true } );
		case JETPACK_RECOMMENDATIONS_UPSELL_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_UPSELL_FETCH_FAIL:
			return assign( {}, state, { isFetchingRecommendationsUpsell: false } );
		case JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH:
			return assign( {}, state, { isFetchingRecommendationsConditional: true } );
		case JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_RECEIVE:
			return assign( {}, state, {
				isRecommendationsConditionalLoaded: true,
				isFetchingRecommendationsConditional: false,
			} );
		case JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_FAIL:
			return assign( {}, state, { isFetchingRecommendationsConditional: false } );
		case JETPACK_RECOMMENDATIONS_STEP_UPDATE:
			return assign( {}, state, { isUpdatingRecommendationsStep: true } );
		case JETPACK_RECOMMENDATIONS_STEP_UPDATE_SUCCESS:
		case JETPACK_RECOMMENDATIONS_STEP_UPDATE_FAIL:
			return assign( {}, state, { isUpdatingRecommendationsStep: false } );
		default:
			return state;
	}
};

const stepReducer = ( state = '', action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_STEP_UPDATE:
			return action.step;
		default:
			return state;
	}
};

const productSuggestions = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_PRODUCT_SUGGESTIONS_FETCH_FAIL:
			return action.productSuggestions;
		default:
			return state;
	}
};

export const getProductSuggestions = state =>
	get( state.jetpack, [ 'recommendations', 'productSuggestions' ], [] );

const upsell = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_UPSELL_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_UPSELL_FETCH_FAIL:
			return action.upsell;
		default:
			return state;
	}
};

const conditional = ( state = [], action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_CONDITIONAL_FETCH_FAIL:
			return action.data;
		default:
			return state;
	}
};

const siteDiscount = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_SITE_DISCOUNT_VIEWED:
			return {
				...state,
				viewed: action.step,
			};
		default:
			return state;
	}
};

const installing = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_START:
			return Object.values( RECOMMENDATION_WIZARD_STEP ).includes( action.feature )
				? {
						...state,
						[ action.feature ]: true,
				  }
				: state;
		case JETPACK_RECOMMENDATIONS_FEATURE_INSTALL_END:
			return Object.values( RECOMMENDATION_WIZARD_STEP ).includes( action.feature )
				? {
						...state,
						[ action.feature ]: false,
				  }
				: state;
		default:
			return state;
	}
};

const getConditionalRecommendations = state => {
	return get( state.jetpack, [ 'recommendations', 'conditional' ] );
};

export const reducer = combineReducers( {
	data,
	requests,
	step: stepReducer,
	upsell,
	productSuggestions,
	conditional,
	siteDiscount,
	installing,
} );

export const isFetchingRecommendationsData = state => {
	return !! state.jetpack.recommendations.requests.isFetchingRecommendationsData;
};

export const isRecommendationsDataLoaded = state => {
	return !! state.jetpack.recommendations.requests.isRecommendationsDataLoaded;
};

export const isFetchingRecommendationsProductSuggestions = state => {
	return !! state.jetpack.recommendations.requests.isFetchingRecommendationsProductSuggestions;
};

export const isFetchingRecommendationsUpsell = state => {
	return !! state.jetpack.recommendations.requests.isFetchingRecommendationsUpsell;
};

export const isFetchingRecommendationsConditional = state => {
	return !! state.jetpack.recommendations.requests.isFetchingRecommendationsConditional;
};

export const isRecommendationsConditionalLoaded = state => {
	return !! state.jetpack.recommendations.requests.isRecommendationsConditionalLoaded;
};

export const isUpdatingRecommendationsStep = state => {
	return !! state.jetpack.recommendations.requests.isUpdatingRecommendationsStep;
};

export const recommendationsSiteDiscountViewedStep = state => {
	return state.jetpack.recommendations.siteDiscount.viewed || '';
};

export const getDataByKey = ( state, key ) => {
	return get( state.jetpack, [ 'recommendations', 'data', key ], false );
};

const stepToNextStepByPath = {
	default: {
		'setup-wizard-completed': 'summary',
		'banner-completed': 'agency',
		'not-started': 'site-type-question',
		'site-type-question': 'agency',
		agency: 'woocommerce',
		'product-suggestions': 'woocommerce',
		woocommerce: 'monitor',
		monitor: 'related-posts',
		'related-posts': 'newsletter',
		newsletter: 'site-accelerator',
		'site-accelerator': 'publicize',
		publicize: 'vaultpress-for-woocommerce',
		'vaultpress-for-woocommerce': 'vaultpress-backup', // falls back to vaultpress-backup so it only shows one of them
		'vaultpress-backup': 'summary',
		protect: 'summary',
		'anti-spam': 'summary',
		videopress: 'summary',
		'backup-plan': 'summary',
		boost: 'summary',
		summary: 'summary',
	},
	onboarding: {
		[ ONBOARDING_JETPACK_COMPLETE ]: {
			welcome__complete: 'backup-activated',
			'backup-activated': 'scan-activated',
			'scan-activated': 'antispam-activated',
			'antispam-activated': 'videopress-activated',
			'videopress-activated': 'search-activated',
			'search-activated': 'server-credentials',
			'server-credentials': 'summary',
		},
		[ ONBOARDING_JETPACK_SECURITY ]: {
			welcome__security: 'backup-activated',
			'backup-activated': 'scan-activated',
			'scan-activated': 'antispam-activated',
			'antispam-activated': 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'server-credentials',
			'server-credentials': 'summary',
		},
		[ ONBOARDING_JETPACK_STARTER ]: {
			welcome__starter: 'backup-activated',
			'backup-activated': 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'server-credentials',
			'server-credentials': 'summary',
		},
		[ ONBOARDING_JETPACK_BACKUP ]: {
			welcome__backup: 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'server-credentials',
			'server-credentials': 'summary',
		},
		[ ONBOARDING_JETPACK_ANTI_SPAM ]: {
			welcome__antispam: 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'summary',
		},
		[ ONBOARDING_JETPACK_VIDEOPRESS ]: {
			welcome__videopress: 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'related-posts',
			'related-posts': 'summary',
		},
		[ ONBOARDING_JETPACK_SEARCH ]: {
			welcome__search: 'related-posts',
			'related-posts': 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'summary',
		},
		[ ONBOARDING_JETPACK_SCAN ]: {
			welcome__scan: 'monitor',
			monitor: 'site-accelerator',
			'site-accelerator': 'summary',
		},
		[ ONBOARDING_JETPACK_GOLDEN_TOKEN ]: {
			welcome__golden_token: 'backup-activated',
			'backup-activated': 'scan-activated',
			'scan-activated': 'server-credentials',
			'server-credentials': 'summary',
		},
	},
};

export const stepToRoute = {
	'not-started': '#/recommendations/site-type',
	'site-type-question': '#/recommendations/site-type',
	'product-suggestions': '#/recommendations/product-suggestions',
	agency: '#/recommendations/agency',
	woocommerce: '#/recommendations/woocommerce',
	monitor: '#/recommendations/monitor',
	newsletter: '#/recommendations/newsletter',
	'related-posts': '#/recommendations/related-posts',
	'creative-mail': '#/recommendations/creative-mail',
	'site-accelerator': '#/recommendations/site-accelerator',
	publicize: '#/recommendations/publicize',
	protect: '#/recommendations/protect',
	'anti-spam': '#/recommendations/anti-spam',
	videopress: '#/recommendations/videopress',
	'backup-plan': '#/recommendations/backup-plan',
	boost: '#/recommendations/boost',
	summary: '#/recommendations/summary',
	'vaultpress-backup': '#/recommendations/vaultpress-backup',
	'vaultpress-for-woocommerce': '#/recommendations/vaultpress-for-woocommerce',
	// new steps (September 2022)
	welcome__backup: '#/recommendations/welcome-backup',
	welcome__complete: '#/recommendations/welcome-complete',
	welcome__security: '#/recommendations/welcome-security',
	welcome__starter: '#/recommendations/welcome-starter',
	welcome__antispam: '#/recommendations/welcome-antispam',
	welcome__videopress: '#/recommendations/welcome-videopress',
	welcome__search: '#/recommendations/welcome-search',
	welcome__scan: '#/recommendations/welcome-scan',
	welcome__golden_token: '#/recommendations/welcome-golden-token',
	'backup-activated': '#/recommendations/backup-activated',
	'scan-activated': '#/recommendations/scan-activated',
	'antispam-activated': '#/recommendations/antispam-activated',
	'videopress-activated': '#/recommendations/videopress-activated',
	'search-activated': '#/recommendations/search-activated',
	'server-credentials': '#/recommendations/server-credentials',
};

const getRecommendationsData = state => get( state.jetpack, [ 'recommendations', 'data' ] );

export const isStepViewed = ( state, featureSlug ) => {
	const recommendationsData = getRecommendationsData( state );
	return (
		recommendationsData.viewedRecommendations &&
		recommendationsData.viewedRecommendations.includes( featureSlug )
	);
};

export const isStepSkipped = ( state, featureSlug ) => {
	const recommendationsData = getRecommendationsData( state );
	return (
		recommendationsData.skippedRecommendations &&
		recommendationsData.skippedRecommendations.includes( featureSlug )
	);
};

export const isInstallingRecommendedFeature = ( state, featureSlug ) => {
	const featuresInstalling = get( state.jetpack, [ 'recommendations', 'installing' ] );
	return featuresInstalling[ featureSlug ] ?? false;
};

export const isFeatureActive = ( state, featureSlug ) => {
	switch ( featureSlug ) {
		case 'boost':
			return !! isPluginActive( state, 'jetpack-boost/jetpack-boost.php' );
		case 'creative-mail':
			return !! isPluginActive(
				state,
				'creative-mail-by-constant-contact/creative-mail-plugin.php'
			);
		case 'monitor':
			return !! getSetting( state, 'monitor' );
		case 'newsletter':
			return !! getSetting( state, 'subscriptions' );
		case 'related-posts':
			return !! getSetting( state, 'related-posts' );
		case 'site-accelerator':
			return !! getSetting( state, 'photon' ) && getSetting( state, 'photon-cdn' );
		case 'woocommerce':
			return !! isPluginActive( state, 'woocommerce/woocommerce.php' );
		case 'protect':
			return !! isPluginActive( state, 'jetpack-protect/jetpack-protect.php' );
		case 'publicize':
			return !! getSetting( state, 'publicize' );
		case 'videopress-activated':
		case 'videopress':
			return !! isPluginActive( state, 'videopress/jetpack-videopress.php' );
		case 'antispam-activated':
			return !! isPluginActive( state, 'akismet/akismet.php' );
		default:
			throw `Unknown featureSlug in isFeatureActive() in recommendations/reducer.js: ${ featureSlug }`;
	}
};

const isSiteEligibleForUpsell = state => {
	const sitePlan = getSitePlan( state );

	return 'jetpack_free' === sitePlan.product_slug && ! hasActiveProductPurchase( state );
};

export const isProductSuggestionsAvailable = state => {
	if ( ! isSiteEligibleForUpsell( state ) ) {
		return false;
	}

	const suggestionsResult = getProductSuggestions( state );

	return isArray( suggestionsResult ) && ! isEmpty( suggestionsResult );
};

export const getNonViewedRecommendationsCount = state => {
	const onboarding = getOnboardingData( state );

	if ( onboarding && onboarding.active ) {
		const { totalSteps: steps } = onboarding;
		const step = getStep( state );

		return steps.length - ( steps.indexOf( step ) + 1 );
	}

	return getNewRecommendationsCount( state );
};

export const getProductSlugForStep = ( state, step ) => {
	switch ( step ) {
		case 'publicize':
		case 'protect':
			if ( ! hasActiveSecurityPurchase( state ) && ! hasSecurityComparableLegacyPlan( state ) ) {
				return PLAN_JETPACK_SECURITY_T1_YEARLY;
			}
			break;
		case 'backup-plan':
			if (
				! hasActiveBackupPurchase( state ) &&
				! isJetpackPlanWithBackup( getSitePlan( state ) )
			) {
				return PLAN_JETPACK_BACKUP_T1_YEARLY;
			}
			break;
		case 'anti-spam':
			if (
				! isPluginActive( state, 'akismet/akismet.php' ) &&
				! hasActiveAntiSpamPurchase( state ) &&
				! isJetpackPlanWithAntiSpam( getSitePlan( state ) )
			) {
				return PLAN_JETPACK_ANTI_SPAM;
			}
			break;
		case 'videopress':
			if (
				! siteHasFeature( state, 'videopress-1tb-storage' ) &&
				! siteHasFeature( state, 'videopress-unlimited-storage' )
			) {
				return PLAN_JETPACK_VIDEOPRESS;
			}
			break;
	}

	return false;
};

const shouldRecommendVaultPress = ( state, isWooCommerceRequired = false ) => {
	const sitePlan = getSitePlan( state ).product_slug;
	const isFree = 'is-free-plan' === getPlanClass( sitePlan );

	return isFree && isWooCommerceActive( state ) === isWooCommerceRequired;
};

const isConditionalRecommendationEnabled = ( state, step ) => {
	const conditionalRecommendations = getConditionalRecommendations( state );
	return (
		Array.isArray( conditionalRecommendations ) && conditionalRecommendations.indexOf( step ) > -1
	);
};

const isStepEligibleToShow = ( state, step ) => {
	switch ( step ) {
		case 'setup-wizard-completed':
		case 'banner-completed':
		case 'not-started':
			return false;
		case 'site-type-question':
		case 'summary':
			return true;
		case 'product-suggestions':
			return isProductSuggestionsAvailable( state );
		case 'vaultpress-backup':
			return shouldRecommendVaultPress( state );
		case 'vaultpress-for-woocommerce':
			return shouldRecommendVaultPress( state, true );
		case 'agency':
			return !! getDataByKey( state, 'site-type-agency' );
		case 'woocommerce':
			return getDataByKey( state, 'site-type-store' ) ? ! isFeatureActive( state, step ) : false;
		case 'monitor':
			return hasConnectedOwner( state ) && ! isFeatureActive( state, step );
		case 'publicize':
			return isConditionalRecommendationEnabled( state, step ) && ! isFeatureActive( state, step );
		case 'protect':
			return (
				isConditionalRecommendationEnabled( state, step ) &&
				! isPluginActive( state, 'jetpack-protect/jetpack-protect.php' )
			);
		case 'anti-spam':
		case 'backup-plan':
			return isConditionalRecommendationEnabled( state, step );
		case 'videopress':
			return isConditionalRecommendationEnabled( state, step ) && ! isFeatureActive( state, step );
		case 'boost':
			return isConditionalRecommendationEnabled( state, step ) && ! isFeatureActive( state, step );
		case 'server-credentials':
			return 'awaiting_credentials' === getRewindStatus( state ).state;
		// Onboarding specific steps (`-activated` and `welcome__`):
		case 'backup-activated':
		case 'scan-activated':
		case 'search-activated':
		case 'welcome__complete':
		case 'welcome__security':
		case 'welcome__starter':
		case 'welcome__antispam':
		case 'welcome__videopress':
		case 'welcome__search':
		case 'welcome__scan':
		case 'welcome__backup':
		case 'welcome__golden_token':
			return true;
		case 'antispam-activated':
		case 'videopress-activated':
			return isFeatureActive( state, step );
		default:
			return ! isFeatureActive( state, step );
	}
};

const getNextEligibleStep = ( state, step ) => {
	const active = get( getOnboardingData( state ), 'active' );
	const stepToNextStep = get( stepToNextStepByPath, active ? `onboarding.${ active }` : 'default' );

	if ( ! stepToNextStep ) {
		// If we cannot find next step due to some reason - we just show the summary
		return 'summary';
	}

	let nextStep = stepToNextStep[ step ] || 'summary';

	while ( ! isStepEligibleToShow( state, nextStep ) ) {
		nextStep = stepToNextStep[ nextStep ];
	}

	return nextStep;
};

const getStepsForOnboarding = onboarding =>
	Object.keys( get( stepToNextStepByPath, `onboarding.${ onboarding }`, {} ) );

export const getInitialStepForOnboarding = onboarding => getStepsForOnboarding( onboarding )[ 0 ];

// Gets the step to show when one has not been set in the state yet.
export const getInitialStep = state => {
	// Gets new recommendations from initial state.
	const newRecommendations = getNewRecommendations( state );
	const initialStep = getInitialRecommendationsStep( state );
	const onboardingData = getOnboardingData( state );

	if ( onboardingData && onboardingData.active ) {
		return onboardingData.hasStarted
			? initialStep
			: getInitialStepForOnboarding( onboardingData.active );
	}

	if ( 'summary' === initialStep && ! isStepViewed( state, 'site-type-question' ) ) {
		return 'site-type-question';
	}

	// Jump to a new recommendation if there is one to show.
	if ( newRecommendations.length > 0 ) {
		return newRecommendations[ 0 ];
	}

	// Return the step from the initial React state.
	return initialStep;
};

const getProductsEligibleForPostPurchaseOnboarding = state =>
	getSitePurchases( state ).filter(
		( { active, subscribed_date } ) =>
			'1' === active && ONBOARDING_SUPPORT_START_TIMESTAMP < Date.parse( subscribed_date )
	);

const getEligibleOnboardings = state =>
	getProductsEligibleForPostPurchaseOnboarding( state )
		.map( ( { product_slug } ) => getOnboardingNameByProductSlug( product_slug ) )
		.filter( name => null !== name );

export const getOnboardingData = state => {
	if ( isFetchingSiteData( state ) || ! isRecommendationsDataLoaded( state ) ) {
		return null;
	}

	const eligibleOnboardings = getEligibleOnboardings( state );

	const onboarding = {
		active: getDataByKey( state, 'onboardingActive' ) || null,
		viewed: ( getDataByKey( state, 'onboardingViewed' ) || [] ).filter( viewedOnboarding =>
			eligibleOnboardings.includes( viewedOnboarding )
		),
		totalSteps: getDataByKey( state, 'onboardingTotalSteps' ) || [],
		hasStarted: getDataByKey( state, 'onboardingHasStarted' ) || false,
	};

	const newOnboardings = eligibleOnboardings.filter( name => ! onboarding.viewed.includes( name ) );

	// Start the new onboarding if one is found
	if ( newOnboardings.length > 0 ) {
		const sortedOnboardings = newOnboardings.sort( sortByOnboardingPriority );
		return {
			active: sortedOnboardings[ 0 ],
			totalSteps: getStepsForOnboarding( sortedOnboardings[ 0 ] ).filter( step =>
				isStepEligibleToShow( state, step )
			),
			viewed: union( onboarding.viewed, sortedOnboardings ),
			hasStarted: false,
		};
	}

	return onboarding;
};

export const getIsOnboardingActive = state => {
	const onboardingData = getOnboardingData( state );
	return null !== onboardingData && null !== onboardingData.active;
};

export const getStep = state => {
	const savedStep = get( state.jetpack, [ 'recommendations', 'step' ], '' );
	const step = '' !== savedStep ? savedStep : getInitialStep( state );

	// These steps are special cases set on the server. There is technically no
	// UI to display for them so the next eligible step is returned instead.
	if ( [ 'setup-wizard-completed', 'banner-completed' ].includes( step ) ) {
		return getNextEligibleStep( state, step );
	}

	return step;
};

export const getOnboardingStepProgressValueIfEligible = state => {
	const onboardingData = getOnboardingData( state );

	if ( ! onboardingData || ! onboardingData.active ) {
		return null;
	}

	const { totalSteps: steps } = onboardingData;
	const step = getStep( state );

	return {
		currentStepIndex: steps.indexOf( step ),
		totalSteps: steps.length,
	};
};

export const getNextRoute = state => {
	const currentStep = getStep( state );
	const nextStep = getNextEligibleStep( state, currentStep );
	return stepToRoute[ nextStep ];
};

export const getUpsell = state => get( state.jetpack, [ 'recommendations', 'upsell' ], {} );

const isFeatureEligibleToShowInSummary = ( state, slug ) => {
	switch ( slug ) {
		case 'woocommerce':
			return true === getDataByKey( state, 'site-type-store' );
		case 'agency':
			return true === getDataByKey( state, 'site-type-agency' );
		case 'monitor':
			return hasConnectedOwner( state );
		case 'boost':
			return isConditionalRecommendationEnabled( state, slug ) || isFeatureActive( state, slug );
		case 'publicize':
		case 'protect':
			return isConditionalRecommendationEnabled( state, slug ) || isFeatureActive( state, slug );
		case 'anti-spam':
		case 'backup-plan':
			return isConditionalRecommendationEnabled( state, slug );
		case 'videopress':
			return isConditionalRecommendationEnabled( state, slug ) || isFeatureActive( state, slug );
		default:
			return true;
	}
};

export const isOnboardingEligibleToShowInSummary = ( state, onboardingName ) => {
	const onboardingData = getOnboardingData( state );
	const viewedOnboardings = onboardingData ? onboardingData.viewed : [];

	if ( ! viewedOnboardings.includes( onboardingName ) ) {
		// If onboarding is not currently active - do not display it
		return false;
	}

	switch ( onboardingName ) {
		case ONBOARDING_JETPACK_COMPLETE:
			// Always show Complete plan
			return true;
		case ONBOARDING_JETPACK_VIDEOPRESS:
		case ONBOARDING_JETPACK_SEARCH:
		case ONBOARDING_JETPACK_SECURITY:
			// Don't show plans that overlap with active plan: Complete
			return ! viewedOnboardings.includes( ONBOARDING_JETPACK_COMPLETE );
		case ONBOARDING_JETPACK_BACKUP:
		case ONBOARDING_JETPACK_ANTI_SPAM:
		case ONBOARDING_JETPACK_SCAN:
			// Don't show plans that overlap with either active plans: Complete or Security
			return (
				! viewedOnboardings.includes( ONBOARDING_JETPACK_COMPLETE ) &&
				! viewedOnboardings.includes( ONBOARDING_JETPACK_SECURITY )
			);
		default:
			// Otherwise, show the onboarding in the summary until we create additional rule
			return true;
	}
};

export const getSummaryFeatureSlugs = state => {
	const featureSlugsInPreferenceOrder = [
		'woocommerce',
		'monitor',
		'related-posts',
		'creative-mail',
		'newsletter',
		'site-accelerator',
		'protect',
		'publicize',
		'videopress',
		'boost',
	];

	const featureSlugsEligibleToShow = featureSlugsInPreferenceOrder.filter( slug =>
		isFeatureEligibleToShowInSummary( state, slug )
	);

	const selected = [];
	const skipped = [];

	for ( const slug of featureSlugsEligibleToShow ) {
		if ( isFeatureActive( state, slug ) || isInstallingRecommendedFeature( state, slug ) ) {
			selected.push( slug );
		} else if ( isStepSkipped( state, slug ) ) {
			skipped.push( slug );
		}
	}

	return {
		selected,
		skipped,
	};
};

export const getSummaryResourceSlugs = state => {
	const resourceSlugs = [ 'agency', 'anti-spam', 'backup-plan' ];

	return resourceSlugs.filter( slug => isFeatureEligibleToShowInSummary( state, slug ) );
};

export const getSummaryPrimarySections = state => {
	const onboardingData = getOnboardingData( state );

	if ( ! onboardingData ) {
		return [];
	}

	return onboardingData.viewed
		.filter( onboarding => isOnboardingEligibleToShowInSummary( state, onboarding ) )
		.sort( sortByOnboardingPriority )
		.map( onboarding => SUMMARY_SECTION_BY_ONBOARDING_NAME[ onboarding ] );
};

export const getSidebarCardSlug = state => {
	const sitePlan = getSitePlan( state );
	const rewindStatus = getRewindStatus( state );

	const rewindState = rewindStatus.state;

	if ( ! sitePlan.product_slug || ! rewindState ) {
		return 'loading';
	}

	if ( isSiteEligibleForUpsell( state ) ) {
		return 'upsell';
	}

	if ( 'awaiting_credentials' === rewindState && ! siteHasFeature( state, 'scan' ) ) {
		return 'one-click-restores';
	}

	if ( [ 'active', 'provisioning' ].includes( rewindState ) ) {
		return 'manage-security';
	}

	return 'download-app';
};
