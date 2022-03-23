/**
 * External dependencies
 */
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getStepContent,
	mapDispatchToProps,
	mapStateToSummaryFeatureProps,
} from '../feature-utils';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import InstallButton from 'components/install-button';
import analytics from 'lib/analytics';
import { isFeatureActive } from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';

const FeatureSummaryComponent = props => {
	const {
		activateFeature,
		configLink,
		configureButtonLabel,
		displayName,
		featureSlug,
		learnMoreLink,
		summaryActivateButtonLabel,
		isNew,
	} = props;

	const [ isInstalling, setIsInstalling ] = useState( false );

	const onConfigureClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_configure_click', {
			feature: featureSlug,
		} );
	}, [ featureSlug ] );

	const onLearnMoreClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_learn_more_click', {
			feature: featureSlug,
		} );
	}, [ featureSlug ] );

	const onInstallClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_enable_click', {
			feature: featureSlug,
		} );
		setIsInstalling( true );
		activateFeature().finally( () => {
			setIsInstalling( false );
		} );
	}, [ activateFeature, featureSlug, setIsInstalling ] );

	const ctaButton = (
		<div className="jp-recommendations-feature-summary__cta">
			{ props.isFeatureActive ? (
				<Button rna href={ configLink } onClick={ onConfigureClick }>
					{ configureButtonLabel }
				</Button>
			) : (
				<InstallButton primary rna isInstalling={ isInstalling } onClick={ onInstallClick }>
					{ summaryActivateButtonLabel }
				</InstallButton>
			) }
		</div>
	);

	return (
		<div
			className={ classNames( 'jp-recommendations-feature-summary', {
				'is-feature-enabled': props.isFeatureActive,
			} ) }
		>
			{ props.isFeatureActive && (
				<div className="jp-recommendations-feature-summary__checkmark">
					<Gridicon icon="checkmark-circle" size={ 24 } />
				</div>
			) }
			<div className="jp-recommendations-feature-summary__display-name">
				<ExternalLink href={ learnMoreLink } onClick={ onLearnMoreClick } rel="noopener noreferrer">
					{ displayName }
				</ExternalLink>
				{ isNew && (
					/* translators: 'New' is shown as a badge to indicate that this content has not been viewed before. */
					<span className="jp-recommendations__new-badge">{ __( 'New', 'jetpack' ) }</span>
				) }
			</div>
			<div className="jp-recommendations-feature-summary__actions">{ ctaButton }</div>
		</div>
	);
};

const FeatureSummary = connect(
	( state, ownProps ) => ( {
		isFeatureActive: isFeatureActive( state, ownProps.featureSlug ),
		...mapStateToSummaryFeatureProps( state, ownProps.featureSlug ),
		learnMoreLink: getStepContent( ownProps.featureSlug ).descriptionLink,
	} ),
	( dispatch, ownProps ) => ( {
		...mapDispatchToProps( dispatch, ownProps.featureSlug ),
	} )
)( FeatureSummaryComponent );

export { FeatureSummary };
