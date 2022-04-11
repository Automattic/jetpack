/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';
import { combineReducers } from 'redux';
import { assign, difference, get, isArray, isEmpty, mergeWith, union } from 'lodash';

/**
 * Internal dependencies
 */
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
} from 'state/action-types';
import { getRewindStatus } from 'state/rewind';
import { getSetting } from 'state/settings';
import { getSitePlan, hasActiveProductPurchase, hasActiveScanPurchase } from 'state/site';
import { hasConnectedOwner } from 'state/connection';
import { isPluginActive } from 'state/site/plugins';
import { getNewRecommendations, getInitialRecommendationsStep } from 'state/initial-state';

const mergeArrays = ( x, y ) => {
	if ( Array.isArray( x ) && Array.isArray( y ) ) {
		return union( x, y );
	}
};

const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_RECOMMENDATIONS_DATA_FETCH_RECEIVE:
		case JETPACK_RECOMMENDATIONS_DATA_UPDATE:
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

export const getDataByKey = ( state, key ) => {
	return get( state.jetpack, [ 'recommendations', 'data', key ], false );
};

const stepToNextStep = {
	'setup-wizard-completed': 'summary',
	'banner-completed': 'woocommerce',
	'not-started': 'site-type-question',
	'site-type-question': 'product-suggestions',
	'product-suggestions': 'woocommerce',
	woocommerce: 'monitor',
	monitor: 'related-posts',
	'related-posts': 'creative-mail',
	'creative-mail': 'site-accelerator',
	'site-accelerator': 'publicize',
	publicize: 'summary',
	'security-plan': 'summary',
	videopress: 'summary',
	summary: 'summary',
};

const stepToRoute = {
	'not-started': '#/recommendations/site-type',
	'site-type-question': '#/recommendations/site-type',
	'product-suggestions': '#/recommendations/product-suggestions',
	woocommerce: '#/recommendations/woocommerce',
	monitor: '#/recommendations/monitor',
	'related-posts': '#/recommendations/related-posts',
	'creative-mail': '#/recommendations/creative-mail',
	'site-accelerator': '#/recommendations/site-accelerator',
	publicize: '#/recommendations/publicize',
	'security-plan': '#/recommendations/security-plan',
	videopress: '#/recommendations/videopress',
	summary: '#/recommendations/summary',
};

export const isFeatureActive = ( state, featureSlug ) => {
	switch ( featureSlug ) {
		case 'creative-mail':
			return !! isPluginActive(
				state,
				'creative-mail-by-constant-contact/creative-mail-plugin.php'
			);
		case 'monitor':
			return !! getSetting( state, 'monitor' );
		case 'related-posts':
			return !! getSetting( state, 'related-posts' );
		case 'site-accelerator':
			return !! getSetting( state, 'photon' ) && getSetting( state, 'photon-cdn' );
		case 'woocommerce':
			return !! isPluginActive( state, 'woocommerce/woocommerce.php' );
		case 'publicize':
			return !! getSetting( state, 'publicize' );
		case 'videopress':
			return !! getSetting( state, 'videopress' );
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
		case 'woocommerce':
			return getDataByKey( state, 'site-type-store' ) ? ! isFeatureActive( state, step ) : false;
		case 'monitor':
			return hasConnectedOwner( state ) && ! isFeatureActive( state, step );
		case 'publicize':
			return isConditionalRecommendationEnabled( state, step ) && ! isFeatureActive( state, step );
		case 'security-plan':
			return isConditionalRecommendationEnabled( state, step );
		case 'videopress':
			return isConditionalRecommendationEnabled( state, step ) && ! isFeatureActive( state, step );
		default:
			return ! isFeatureActive( state, step );
	}
};

const getNextEligibleStep = ( state, step ) => {
	let nextStep = stepToNextStep[ step ];
	while ( ! isStepEligibleToShow( state, nextStep ) ) {
		nextStep = stepToNextStep[ nextStep ];
	}
	return nextStep;
};

// Gets the step to show when one has not been set in the state yet.
const getInitialStep = state => {
	// Gets new recommendations from initial state.
	const newRecommendations = getNewRecommendations( state );

	// Jump to a new recommendation if there is one to show.
	if ( newRecommendations.length > 0 ) {
		return newRecommendations[ 0 ];
	}

	// Return the step from the initial React state.
	return getInitialRecommendationsStep( state );
};

export const getStep = state => {
	const step =
		'' === get( state.jetpack, [ 'recommendations', 'step' ], '' )
			? getInitialStep( state )
			: state.jetpack.recommendations.step;

	// These steps are special cases set on the server. There is technically no
	// UI to display for them so the next eligible step is returned instead.
	if ( [ 'setup-wizard-completed', 'banner-completed' ].includes( step ) ) {
		return getNextEligibleStep( state, step );
	}

	return step;
};

export const getNextRoute = state => {
	const currentStep = getStep( state );
	const nextStep = getNextEligibleStep( state, currentStep );
	return stepToRoute[ nextStep ];
};

export const getSiteTypeDisplayName = state => {
	const siteTypeKeysInPreferenceOrder = [
		'site-type-store',
		'site-type-business',
		'site-type-personal',
		'site-type-other',
	];

	const siteTypeDisplayNamesByKey = {
		/* translators: A name for a website that sells things */
		'site-type-store': _x( 'store', 'Site type display name', 'jetpack' ),
		/* translators: A name for a website for a business */
		'site-type-business': _x( 'business site', 'Site type display name', 'jetpack' ),
		/* translators: A name for a website for personal use */
		'site-type-personal': _x( 'personal site', 'Site type display name', 'jetpack' ),
		/* translators: A generic name for a website */
		'site-type-other': _x( 'site', 'Site type display name', 'jetpack' ),
	};

	for ( const key of siteTypeKeysInPreferenceOrder ) {
		if ( true === getDataByKey( state, key ) ) {
			return siteTypeDisplayNamesByKey[ key ];
		}
	}

	return siteTypeDisplayNamesByKey[ 'site-type-other' ];
};

export const getUpsell = state => get( state.jetpack, [ 'recommendations', 'upsell' ], {} );

const isFeatureEligibleToShowInSummary = ( state, slug ) => {
	switch ( slug ) {
		case 'woocommerce':
			return true === getDataByKey( state, 'site-type-store' );
		case 'monitor':
			return hasConnectedOwner( state );
		case 'publicize':
			return isConditionalRecommendationEnabled( state, slug ) || isFeatureActive( state, slug );
		case 'security-plan':
			return isConditionalRecommendationEnabled( state, slug );
		case 'videopress':
			return isConditionalRecommendationEnabled( state, slug ) || isFeatureActive( state, slug );
		default:
			return true;
	}
};

export const getSummaryFeatureSlugs = state => {
	const featureSlugsInPreferenceOrder = [
		'woocommerce',
		'monitor',
		'related-posts',
		'creative-mail',
		'site-accelerator',
		'publicize',
		'videopress',
	];

	const featureSlugsEligibleToShow = featureSlugsInPreferenceOrder.filter( slug =>
		isFeatureEligibleToShowInSummary( state, slug )
	);

	const selected = [];
	const skipped = [];

	for ( const slug of featureSlugsEligibleToShow ) {
		if ( isFeatureActive( state, slug ) ) {
			selected.push( slug );
		} else {
			skipped.push( slug );
		}
	}

	return {
		selected,
		skipped,
	};
};

export const getSummaryResourceSlugs = state => {
	const resourceSlugs = [ 'security-plan' ];

	return resourceSlugs.filter( slug => isFeatureEligibleToShowInSummary( state, slug ) );
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

	if ( 'awaiting_credentials' === rewindState && ! hasActiveScanPurchase( state ) ) {
		return 'one-click-restores';
	}

	if ( [ 'active', 'provisioning' ].includes( rewindState ) ) {
		return 'manage-security';
	}

	return 'download-app';
};
