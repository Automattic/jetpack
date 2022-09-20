import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { __, sprintf } from '@wordpress/i18n';
import Button from 'components/button';
import analytics from 'lib/analytics';
import { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { getSiteTitle } from 'state/initial-state';
import {
	getDataByKey,
	getNextRoute,
	saveRecommendationsData as saveRecommendationsDataAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
	isProductSuggestionsAvailable,
} from 'state/recommendations';
import { DEFAULT_ILLUSTRATION } from '../../constants';
import DiscountCard from '../../sidebar/discount-card';
import { CheckboxAnswer } from '../checkbox-answer';
import { PromptLayout } from '../prompt-layout';

import './style.scss';
const SiteTypeQuestionComponent = props => {
	const {
		answers,
		nextRoute,
		saveRecommendationsData,
		siteTitle,
		updateRecommendationsStep,
		canShowProductSuggestions,
	} = props;

	useEffect( () => {
		updateRecommendationsStep( 'site-type-question' );
	}, [ updateRecommendationsStep ] );

	const onContinueClick = useCallback( () => {
		saveRecommendationsData();
		analytics.tracks.recordEvent( 'jetpack_recommendations_site_type_answered', answers );
	}, [ answers, saveRecommendationsData ] );

	const answerSection = (
		<div className="jp-recommendations-question__site-type-answer-container">
			<div className="jp-recommendations-question__site-type-checkboxes">
				<CheckboxAnswer
					answerKey={ 'site-type-agency' }
					title={ __( 'I build or manage this site for a client', 'jetpack' ) }
					info={ __( 'Need more info', 'jetpack' ) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-e-commerce' }
					title={ __( 'This is an e-commerce site', 'jetpack' ) }
					info={ __( 'Need more info', 'jetpack' ) }
				/>
				<CheckboxAnswer
					answerKey={ 'site-type-personal' }
					title={ __( 'This is my personal site', 'jetpack' ) }
					info={ __( 'Need more info', 'jetpack' ) }
				/>
			</div>
			<Button primary rna href={ nextRoute } onClick={ onContinueClick }>
				{ __( 'Continue', 'jetpack' ) }
			</Button>
			<div className="jp-recommendations-site-type-question__continue-description">
				{ __(
					'All of Jetpack’s great features await you and we’ll recommend some of our favorites.',
					'jetpack'
				) }
			</div>
		</div>
	);

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '17' } /> }
			question={
				/* translators: placeholder is the title of the site */
				sprintf( __( 'Tell us more about %s?', 'jetpack' ), siteTitle )
			}
			description={ __(
				'To help you get the most from Jetpack, tell us about your site. Check all that apply:',
				'jetpack'
			) }
			answer={ answerSection }
			sidebarCard={ canShowProductSuggestions ? <DiscountCard /> : null }
			illustration={ DEFAULT_ILLUSTRATION }
			illustrationClassName="jp-recommendations-site-type__illustration"
		/>
	);
};

export const SiteTypeQuestion = connect(
	state => ( {
		nextRoute: getNextRoute( state ),
		siteTitle: getSiteTitle( state ),
		answers: {
			personal: getDataByKey( state, 'site-type-personal' ),
			business: getDataByKey( state, 'site-type-business' ),
			store: getDataByKey( state, 'site-type-store' ),
			other: getDataByKey( state, 'site-type-other' ),
		},
		canShowProductSuggestions: isProductSuggestionsAvailable( state ),
	} ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
		saveRecommendationsData: () => dispatch( saveRecommendationsDataAction() ),
	} )
)( SiteTypeQuestionComponent );
