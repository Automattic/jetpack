/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get, intersection, reduce, union } from 'lodash';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { featureGroups, featureRecommendations } from './feature-recommendations';
import {
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_RECEIVE,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_FETCH_FAIL,
	JETPACK_SETUP_WIZARD_QUESTIONNAIRE_UPDATE,
} from 'state/action-types';

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

export const reducer = combineReducers( { questionnaire, requests } );

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
	return [ 'security', 'performance', 'marketing', 'publishing' ].map( featureGroupKey => ( {
		...getFeatureGroupContent( featureGroupKey ),
		features: intersection( featureGroups[ featureGroupKey ], recommendedFeatures ).sort(),
	} ) );
};

function getFeatureGroupContent( featureGroupKey ) {
	switch ( featureGroupKey ) {
		case 'security':
			return {
				title: __( 'Security' ),
				details: __(
					'Keep your site backed up, prevent unwanted intrusions, find issues with malware scanning, and stop spammers in their tracks.'
				),
			};
		case 'performance':
			return {
				title: __( 'Performance' ),
				details: __(
					'Load pages faster! Shorter load times can lead to happier readers, more page views, and — if you’re running a store — improved sales.'
				),
			};
		case 'marketing':
			return {
				title: __( 'Marketing' ),
				details: __(
					'Increase visitors with social integrations, keep them engaged with related content, and so much more.'
				),
			};
		case 'publishing':
			return {
				title: __( 'Design & Publishing' ),
				details: __(
					'Customize your homepage, blog posts, sidebars, and widgets — all without touching any code.'
				),
			};
	}
}
