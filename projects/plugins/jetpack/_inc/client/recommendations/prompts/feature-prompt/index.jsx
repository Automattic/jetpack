import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import React, { useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import {
	addSelectedRecommendation as addSelectedRecommendationAction,
	addSkippedRecommendation as addSkippedRecommendationAction,
	addViewedRecommendation as addViewedRecommendationAction,
	updateRecommendationsStep as updateRecommendationsStepAction,
	startFeatureInstall as startFeatureInstallAction,
	endFeatureInstall as endFeatureInstallAction,
	getNextRoute,
	getStep,
	isUpdatingRecommendationsStep,
	recommendationsSiteDiscountViewedStep,
	isProductSuggestionsAvailable,
	isFeatureActive,
	isStepViewed,
	getProductSlugForStep,
} from 'state/recommendations';
import { DEFAULT_ILLUSTRATION } from '../../constants';
import {
	getStepContent,
	mapStateToSummaryFeatureProps,
	mapDispatchToProps,
} from '../../feature-utils';
import DiscountCard from '../../sidebar/discount-card';
import { ProductSpotlight } from '../../sidebar/product-spotlight';
import { PromptLayout } from '../prompt-layout';
const FeaturePromptComponent = props => {
	const {
		activateFeature,
		addSelectedRecommendation,
		addSkippedRecommendation,
		addViewedRecommendation,
		startFeatureInstall,
		endFeatureInstall,
		ctaText,
		description,
		descriptionLink,
		descriptionList,
		descriptionSecondary,
		illustration,
		nextRoute,
		progressValue,
		question,
		stepSlug,
		stateStepSlug,
		updatingStep,
		updateRecommendationsStep,
		spotlightProduct,
		isNew,
		canShowProductSuggestions,
		discountViewedStep,
		featureActive,
		configureButtonLabel,
		configLink,
		summaryViewed,
	} = props;

	useEffect( () => {
		// Both addViewedRecommendation and updateRecommendationsStep update the same option under the hood.
		// These actions run with mutually exclusive conditions so they do not over-write one another.
		if ( stepSlug !== stateStepSlug ) {
			updateRecommendationsStep( stepSlug );
		} else if ( stepSlug === stateStepSlug && ! updatingStep ) {
			addViewedRecommendation( stepSlug );
			analytics.tracks.recordEvent( 'jetpack_recommendations_recommendation_viewed', {
				feature: stepSlug,
			} );
		}
	}, [
		stepSlug,
		stateStepSlug,
		updatingStep,
		updateRecommendationsStep,
		addViewedRecommendation,
	] );

	// Show card if it hasn't been viewed yet, or if it has been viewed at this step already.
	const showDiscountCard = ! discountViewedStep || discountViewedStep === stepSlug;

	const onExternalLinkClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_learn_more_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onInstallClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_enable_click', {
			feature: stepSlug,
		} );
		addSelectedRecommendation( stepSlug );
		startFeatureInstall( stepSlug );
		activateFeature().finally( () => {
			endFeatureInstall( stepSlug );
		} );
	}, [
		activateFeature,
		addSelectedRecommendation,
		stepSlug,
		startFeatureInstall,
		endFeatureInstall,
	] );

	const onConfigureClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_configure_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const onDecideLaterClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_decide_later_click', {
			feature: stepSlug,
		} );
		addSkippedRecommendation( stepSlug );
	}, [ addSkippedRecommendation, stepSlug ] );

	const onBackToSummaryClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommended_feature_back_to_summary_click', {
			feature: stepSlug,
		} );
	}, [ stepSlug ] );

	const configLinkIsExternal = useMemo( () => {
		return configLink.match( /^https:\/\/jetpack.com\/redirect/ );
	}, [ configLink ] );

	let sidebarCard = null;

	if ( spotlightProduct ) {
		sidebarCard = <ProductSpotlight productSlug={ spotlightProduct } stepSlug={ stepSlug } />;
	} else if ( showDiscountCard && canShowProductSuggestions ) {
		sidebarCard = <DiscountCard />;
	}

	return (
		<PromptLayout
			progressBar={
				progressValue ? <ProgressBar color={ '#00A32A' } value={ progressValue } /> : null
			}
			isNew={ isNew }
			question={ question }
			description={ createInterpolateElement( description, {
				br: <br />,
				strong: <strong />,
				ExternalLink: <ExternalLink href={ descriptionLink } onClick={ onExternalLinkClick } />,
			} ) }
			content={
				descriptionList || descriptionSecondary ? (
					<React.Fragment>
						{ descriptionList && (
							<ul className="jp-recommendations-question__description-list">
								{ descriptionList.map( ( item, index ) => (
									<li key={ index }>{ item }</li>
								) ) }
							</ul>
						) }
						{ descriptionSecondary && (
							<p className="jp-recommendations-question__description">{ descriptionSecondary }</p>
						) }
					</React.Fragment>
				) : null
			}
			answer={
				<div className="jp-recommendations-question__install-section">
					{ featureActive ? (
						<>
							<div className="jp-recommendations-question__feature-enabled">
								<div className="jp-recommendations-question__checkmark">
									<Gridicon icon="checkmark-circle" size={ 24 } />
								</div>
								<span>{ __( 'Feature Enabled', 'jetpack' ) }</span>
							</div>
							<div className="jp-recommendations-question__settings-button">
								{ configLinkIsExternal ? (
									<ExternalLink
										type="button"
										className="dops-button is-rna"
										href={ configLink }
										onClick={ onConfigureClick }
									>
										{ configureButtonLabel }
									</ExternalLink>
								) : (
									<Button rna href={ configLink } onClick={ onConfigureClick }>
										{ configureButtonLabel }
									</Button>
								) }
							</div>
						</>
					) : (
						<Button primary rna href={ nextRoute } onClick={ onInstallClick }>
							{ ctaText }
						</Button>
					) }
					<div className="jp-recommendations-question__jump-nav">
						<a href={ nextRoute } onClick={ onDecideLaterClick }>
							{ /* This formatting is more verbose than necessary to avoid a js optimization error */ }
							{ featureActive && __( 'Next', 'jetpack' ) }
							{ ! featureActive && __( 'Not now', 'jetpack' ) }
						</a>
						{ summaryViewed && ( // If the summary screen has already been reached, provide a way to get back to it.
							<>
								<span className="jp-recommendations-question__jump-nav-separator">|</span>
								<a onClick={ onBackToSummaryClick } href={ '#/recommendations/summary' }>
									{ __( 'View Summary', 'jetpack' ) }{ ' ' }
								</a>
							</>
						) }
					</div>
				</div>
			}
			sidebarCard={ sidebarCard }
			illustration={ illustration || DEFAULT_ILLUSTRATION }
		/>
	);
};

const FeaturePrompt = connect(
	( state, ownProps ) => ( {
		nextRoute: getNextRoute( state ),
		...getStepContent( ownProps.stepSlug ),
		...mapStateToSummaryFeatureProps( state, ownProps.stepSlug ),
		stateStepSlug: getStep( state ),
		updatingStep: isUpdatingRecommendationsStep( state ),
		canShowProductSuggestions: isProductSuggestionsAvailable( state ),
		discountViewedStep: recommendationsSiteDiscountViewedStep( state ),
		featureActive: isFeatureActive( state, ownProps.stepSlug ),
		summaryViewed: isStepViewed( state, 'summary' ),
		spotlightProduct: getProductSlugForStep( state, ownProps.stepSlug ),
	} ),
	( dispatch, ownProps ) => ( {
		addSelectedRecommendation: stepSlug => dispatch( addSelectedRecommendationAction( stepSlug ) ),
		addSkippedRecommendation: stepSlug => dispatch( addSkippedRecommendationAction( stepSlug ) ),
		addViewedRecommendation: stepSlug => dispatch( addViewedRecommendationAction( stepSlug ) ),
		updateRecommendationsStep: step => dispatch( updateRecommendationsStepAction( step ) ),
		startFeatureInstall: step => dispatch( startFeatureInstallAction( step ) ),
		endFeatureInstall: step => dispatch( endFeatureInstallAction( step ) ),
		...mapDispatchToProps( dispatch, ownProps.stepSlug ),
	} )
)( FeaturePromptComponent );

export { FeaturePrompt };
