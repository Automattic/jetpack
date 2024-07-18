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
import DashItem from 'components/dash-item';
import JetpackBanner from 'components/jetpack-banner';
import { getJetpackProductUpsellByFeature, PLAN_JETPACK_AI_YEARLY } from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { connect } from 'react-redux';
import {
	connectUser,
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
} from 'state/connection';
import { getSiteAdminUrl } from 'state/initial-state';
import { siteHasFeature } from 'state/site';

/**
 * Jetpack AI Dashboard card.
 * @param {object} props - Component props
 * @returns {object} DashJetpackAi component
 */
function DashJetpackAi( props ) {
	const { hasFeature, isOffline, hasConnectedOwner } = props;
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

	const showConnectBanner = ! hasConnectedOwner && ! isOffline;
	const showUpgradeBanner = hasConnectedOwner && ! isOffline && ! hasFeature;
	const showTeaserBanner = hasConnectedOwner && ! isOffline && hasFeature;

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
						noIcon={ true }
						plan={ getJetpackProductUpsellByFeature( PLAN_JETPACK_AI_YEARLY ) }
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
						noIcon={ true }
						description={ learnMoreLink }
						plan={ getJetpackProductUpsellByFeature( PLAN_JETPACK_AI_YEARLY ) }
						callToAction={ __( 'Upgrade', 'jetpack' ) }
						href={ props.upgradeUrl }
						eventFeature="ai-assistant"
						path="dashboard"
					/>
				) ) ||
				( showTeaserBanner && (
					<JetpackBanner
						title={ cardText }
						noIcon={ true }
						callToAction={ __( 'All features', 'jetpack' ) }
						href={ `${ props.siteAdminUrl }admin.php?page=my-jetpack#/jetpack-ai` }
						eventFeature="ai-assistant"
						path="dashboard"
						eventProps={ { type: 'teaser' } }
					/>
				) ) ||
				null
			}
		>
			{ isOffline && (
				<p className="jp-dash-item__description">
					{ __( 'Unavailable in Offline Mode', 'jetpack' ) }
				</p>
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
	} ),
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashJetpackAi );
