/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import JetpackBanner from 'components/jetpack-banner';
import { getJetpackProductUpsellByFeature, FEATURE_JETPACK_AI } from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import {
	connectUser,
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
} from 'state/connection';
import { getSiteAdminUrl, showMyJetpack } from 'state/initial-state';
import { siteHasFeature } from 'state/site';

/**
 * Jetpack AI Dashboard card.
 * @param {object} props - Component props
 * @return {object} DashJetpackAi component
 */
function DashJetpackAi( props ) {
	const { hasFeature, hasConnectedOwner, isOffline, isMyJetpackReachable } = props;
	const cardText = __(
		'Turn your ideas into ready-to-publish content at light speed. Generate content, images and optimize your publishing process with just a few clicks.',
		'jetpack'
	);
	const support = {
		text: cardText,
		link: getRedirectUrl( 'org-ai' ),
	};

	const learnMoreLink = createInterpolateElement(
		__( '<ExternalLink>Learn more</ExternalLink>', 'jetpack' ),
		{
			ExternalLink: <ExternalLink href={ getRedirectUrl( 'org-ai' ) } />,
		}
	);

	// TODO: useExperiment to switch upgradeUrl between add-jetpack-ai (default from getProductDescriptionUrl) and jetpack-ai

	const showConnectBanner = ! hasConnectedOwner && ! isOffline;
	const showUpgradeBanner =
		hasConnectedOwner && isMyJetpackReachable && ! isOffline && ! hasFeature;
	const showTeaserBanner = hasConnectedOwner && isMyJetpackReachable && ! isOffline && hasFeature;

	return (
		<DashItem
			label="AI"
			module="ai-assistant"
			support={ isOffline ? support : {} }
			noToggle={ true }
			className={ isOffline || ! hasFeature ? 'jp-dash-item__is-inactive' : '' }
			overrideContent={
				( showConnectBanner && (
					<JetpackBanner
						title={ __(
							'Connect your WordPress.com account to enable AI features and assistant.',
							'jetpack'
						) }
						plan={ getJetpackProductUpsellByFeature( FEATURE_JETPACK_AI ) }
						callToAction={ __( 'Connect', 'jetpack' ) }
						onClick={ props.connectUser }
						eventFeature="ai-assistant"
						path="dashboard"
						eventProps={ { type: 'connect' } }
					/>
				) ) ||
				( showUpgradeBanner && (
					<JetpackBanner
						title={ cardText }
						description={ learnMoreLink }
						plan={ getJetpackProductUpsellByFeature( FEATURE_JETPACK_AI ) }
						callToAction={ __( 'Upgrade', 'jetpack' ) }
						href={ props.upgradeUrl }
						eventFeature="ai-assistant"
						path="dashboard"
					/>
				) ) ||
				( showTeaserBanner && (
					<JetpackBanner
						title={ cardText }
						callToAction={ __( 'All features', 'jetpack' ) }
						href={ `${ props.siteAdminUrl }admin.php?page=my-jetpack#/jetpack-ai` }
						eventFeature="ai-assistant"
						path="dashboard"
						eventProps={ { type: 'teaser' } }
						plan={ getJetpackProductUpsellByFeature( FEATURE_JETPACK_AI ) }
					/>
				) ) ||
				null
			}
		>
			{ isOffline && (
				<div className="jp-dash-item__description">
					{ __( 'Unavailable in Offline Mode', 'jetpack' ) }
				</div>
			) }
			{ ! isOffline && (
				<div className="jp-dash-item__description">
					{ cardText }
					<br />
					{ learnMoreLink }
				</div>
			) }
		</DashItem>
	);
}

export default connect(
	state => ( {
		hasConnectedOwner: hasConnectedOwnerSelector( state ),
		isOffline: isOfflineMode( state ),
		// TODO: feature (ai-assistant) differs from product (jetpack-ai), see myJetpack (package) routes and maybe change those to ai-assistant
		upgradeUrl: getProductDescriptionUrl( state, 'jetpack-ai' ),
		hasFeature: siteHasFeature( state, 'ai-assistant' ),
		siteAdminUrl: getSiteAdminUrl( state ),
		isMyJetpackReachable: showMyJetpack( state ),
	} ),
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashJetpackAi );
