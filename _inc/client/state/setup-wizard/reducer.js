/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get, intersection, reduce, union } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { featureGroups, featureRecommendations } from './feature-recommendations';
import {
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE,
	JETPACK_SETUP_WIZARD_STATUS_UPDATE,
} from 'state/action-types';
import { getInitialSetupWizardStatus } from 'state/initial-state';

const questionnaire = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE:
			return assign( {}, state, action.questionnaire );
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE:
			return assign( {}, state, action.answer );
		default:
			return state;
	}
};

const requests = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH:
			return assign( {}, state, { isFetchingSetupQuestionnaire: true } );
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE:
		case JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL:
			return assign( {}, state, { isFetchingSetupQuestionnaire: false } );
		default:
			return state;
	}
};

const status = ( state = '', action ) => {
	switch ( action.type ) {
		case JETPACK_SETUP_WIZARD_STATUS_UPDATE:
			return action.status;
		default:
			return state;
	}
};

export const reducer = combineReducers( { questionnaire, requests, status } );

export const isFetchingSetupWizardQuestionnaire = state => {
	return !! state.jetpack.setupWizard.requests.isFetchingSetupQuestionnaire;
};

export const getSetupWizardAnswer = ( state, question ) => {
	return get( state.jetpack.setupWizard.questionnaire, question );
};

export const getRecommendedFeatureGroups = state => {
	const answers = state.jetpack.setupWizard.questionnaire;

	if ( ! answers ) {
		return [];
	}

	const listOfRecommendedFeatures = [ featureRecommendations.all ];

	if ( 'business' === answers.use ) {
		listOfRecommendedFeatures.push( featureRecommendations[ 'business-use' ] );
	}

	if ( answers[ 'advertising-revenue' ] ) {
		listOfRecommendedFeatures.push( featureRecommendations[ 'advertising-revenue' ] );
	}

	if ( answers[ 'store-revenue' ] ) {
		listOfRecommendedFeatures.push( featureRecommendations[ 'store-revenue' ] );
	}

	if ( answers[ 'site-updates' ] ) {
		listOfRecommendedFeatures.push( featureRecommendations[ 'blog-posts' ] );
	}

	const recommendedFeatures = reduce(
		listOfRecommendedFeatures,
		( acc, curr ) => union( acc, curr ),
		[]
	);

	// Note these are in a list here to guarantee order
	return [ 'security', 'marketing', 'performance', 'publishing' ].map( featureGroupKey => ( {
		...getFeatureGroupContent( featureGroupKey ),
		features: intersection( featureGroups[ featureGroupKey ], recommendedFeatures ),
	} ) );
};

function getFeatureGroupContent( featureGroupKey ) {
	switch ( featureGroupKey ) {
		case 'security':
			return {
				title: __( 'Security', 'jetpack' ),
				details: __(
					'Keep your site backed up, prevent unwanted intrusions, find issues with malware scanning, and stop spammers in their tracks.',
					'jetpack'
				),
			};
		case 'performance':
			return {
				title: __( 'Performance', 'jetpack' ),
				details: __(
					'Load pages faster! Shorter load times can lead to happier readers, more page views, and — if you’re running a store — improved sales.',
					'jetpack'
				),
			};
		case 'marketing':
			return {
				title: __( 'Marketing', 'jetpack' ),
				details: __(
					'Increase visitors with social integrations, keep them engaged with related content, and so much more.',
					'jetpack'
				),
			};
		case 'publishing':
			return {
				title: __( 'Design & Publishing', 'jetpack' ),
				details: __(
					'Customize your homepage, blog posts, sidebars, and widgets — all without touching any code.',
					'jetpack'
				),
			};
	}
}

export const getSetupWizardStatus = state => {
	return '' === state.jetpack.setupWizard.status
		? getInitialSetupWizardStatus( state )
		: state.jetpack.setupWizard.status;
};
