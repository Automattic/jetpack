import { ExternalLink } from '@wordpress/components';
import { Icon, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
// NOTE: InstallButton is a Jetpack composite wrapping Button + module install
// lifecycle analytics — not a pure UI primitive. Keep.
import InstallButton from 'components/install-button';
import analytics from 'lib/analytics';
import {
	startFeatureInstall as startFeatureInstallAction,
	endFeatureInstall as endFeatureInstallAction,
	isFeatureActive,
	isInstallingRecommendedFeature,
	stepToRoute,
} from 'state/recommendations';
import { mapDispatchToProps, mapStateToSummaryFeatureProps } from '../feature-utils';
import './style.scss';

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
		isInstalling,
		startFeatureInstall,
		endFeatureInstall,
	} = props;

	const onConfigureClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_configure_click', {
			feature: featureSlug,
		} );
	}, [ featureSlug ] );

	const onInstallClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_enable_click', {
			feature: featureSlug,
		} );
		startFeatureInstall( featureSlug );
		activateFeature().finally( () => {
			endFeatureInstall( featureSlug );
		} );
	}, [ activateFeature, featureSlug, startFeatureInstall, endFeatureInstall ] );

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
							className="dops-button"
							href={ configLink }
							onClick={ onConfigureClick }
						>
							{ configureButtonLabel }
						</ExternalLink>
					) : (
						<Button href={ configLink } onClick={ onConfigureClick }>
							{ configureButtonLabel }
						</Button>
					) }
				</>
			) : (
				<InstallButton primary isInstalling={ isInstalling } onClick={ onInstallClick }>
					{ summaryActivateButtonLabel }
				</InstallButton>
			) }
		</div>
	);

	return (
		<div
			className={ clsx( 'jp-recommendations-feature-summary', {
				'is-feature-enabled': props.isFeatureActive,
			} ) }
		>
			{ props.isFeatureActive && (
				<div className="jp-recommendations-feature-summary__checkmark">
					<Icon icon={ check } size={ 24 } />
				</div>
			) }
			<Button
				variant="ghost"
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
		isInstalling: isInstallingRecommendedFeature( state, ownProps.featureSlug ),
		isFeatureActive: isFeatureActive( state, ownProps.featureSlug ),
		...mapStateToSummaryFeatureProps( state, ownProps.featureSlug ),
		stepRoute: stepToRoute[ ownProps.featureSlug ],
	} ),
	( dispatch, ownProps ) => ( {
		...mapDispatchToProps( dispatch, ownProps.featureSlug ),
		startFeatureInstall: step => dispatch( startFeatureInstallAction( step ) ),
		endFeatureInstall: step => dispatch( endFeatureInstallAction( step ) ),
	} )
)( FeatureSummaryComponent );

export { FeatureSummary };
