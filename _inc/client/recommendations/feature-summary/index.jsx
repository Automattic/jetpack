/**
 * External dependencies
 */
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getFeatureDispatch, getFeatureState } from '../feature-utils';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import InstallButton from 'components/install-button';
import analytics from 'lib/analytics';
import { isFeatureActive } from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const FeatureSummaryComponent = props => {
	const {
		activateFeature,
		configLink,
		configureButtonLabel,
		displayName,
		featureSlug,
		summaryActivateButtonLabel,
	} = props;

	const [ isInstalling, setIsInstalling ] = useState( false );

	const onConfigureClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_configure_click', {
			feature: featureSlug,
		} );
	} );

	const onInstallClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_enable_click', {
			feature: featureSlug,
		} );
		setIsInstalling( true );
		activateFeature().finally( () => {
			setIsInstalling( false );
		} );
	}, [ featureSlug ] );

	const ctaButton = (
		<div className="jp-recommendations-feature-summary__cta">
			{ props.isFeatureActive ? (
				<Button href={ configLink } onClick={ onConfigureClick }>
					{ configureButtonLabel }
				</Button>
			) : (
				<InstallButton primary isInstalling={ isInstalling } onClick={ onInstallClick }>
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
			<div className="jp-recommendations-feature-summary__display-name">{ displayName }</div>
			<div className="jp-recommendations-feature-summary__cta">{ ctaButton }</div>
		</div>
	);
};

const FeatureSummary = connect(
	( state, ownProps ) => ( {
		isFeatureActive: isFeatureActive( state, ownProps.featureSlug ),
		...getFeatureState( state, ownProps.featureSlug ),
	} ),
	( dispatch, ownProps ) => ( {
		...getFeatureDispatch( dispatch, ownProps.featureSlug ),
	} )
)( FeatureSummaryComponent );

export { FeatureSummary };
