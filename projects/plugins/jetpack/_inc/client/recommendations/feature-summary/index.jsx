/**
 * External dependencies
 */
import classNames from 'classnames';
import React, { useCallback, useState, useMemo } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { mapDispatchToProps, mapStateToSummaryFeatureProps } from '../feature-utils';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import InstallButton from 'components/install-button';
import analytics from 'lib/analytics';
import { isFeatureActive, stepToRoute } from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

const FeatureSummaryComponent = props => {
	const {
		activateFeature,
		configLink,
		configureButtonLabel,
		displayName,
		featureSlug,
		stepRoute,
		summaryActivateButtonLabel,
		isNew,
	} = props;

	const [ isInstalling, setIsInstalling ] = useState( false );

	const onConfigureClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_configure_click', {
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

	const onStepNameClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_step_name_click', {
			feature: featureSlug,
		} );
	}, [ featureSlug ] );

	const configLinkIsExternal = useMemo( () => {
		return configLink.match( /^https:\/\/jetpack.com\/redirect/ );
	}, [ configLink ] );

	const ctaButton = (
		<div className="jp-recommendations-feature-summary__cta">
			{ props.isFeatureActive ? (
				<>
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
				</>
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
			<Button
				borderless
				href={ stepRoute }
				onClick={ onStepNameClick }
				className="jp-recommendations-feature-summary__display-name"
			>
				<span className="jp-recommendations-feature-summary__display-name-text">
					{ displayName }
				</span>
				{ isNew && (
					/* translators: 'New' is shown as a badge to indicate that this content has not been viewed before. */
					<span className="jp-recommendations__new-badge">{ __( 'New', 'jetpack' ) }</span>
				) }
			</Button>
			<div className="jp-recommendations-feature-summary__actions">{ ctaButton }</div>
		</div>
	);
};

const FeatureSummary = connect(
	( state, ownProps ) => ( {
		isFeatureActive: isFeatureActive( state, ownProps.featureSlug ),
		...mapStateToSummaryFeatureProps( state, ownProps.featureSlug ),
		stepRoute: stepToRoute[ ownProps.featureSlug ],
	} ),
	( dispatch, ownProps ) => ( {
		...mapDispatchToProps( dispatch, ownProps.featureSlug ),
	} )
)( FeatureSummaryComponent );

export { FeatureSummary };
