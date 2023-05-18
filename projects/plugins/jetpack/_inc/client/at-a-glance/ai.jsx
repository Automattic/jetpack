import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import DashItem from 'components/dash-item';
import JetpackBanner from 'components/jetpack-banner';
import { getJetpackProductUpsellByFeature, FEATURE_AI_ASSISTANT } from 'lib/plans/constants';
import { noop } from 'lodash';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	connectUser,
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
} from 'state/connection';
import { isModuleAvailable } from 'state/modules';
import { isFetchingSitePurchases, getSitePlan, siteHasFeature } from 'state/site';

class DashJetpackAi extends Component {
	static propTypes = {
		hasAiFeature: PropTypes.bool.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
		isOffline: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
		trackUpgradeButtonView: PropTypes.func,
	};

	static defaultProps = {
		trackUpgradeButtonView: noop,
	};

	activateVideoPress = () => this.props.updateOptions( { videopress: true } );

	getContent() {
		const labelName = __( 'Jetpack AI', 'jetpack' );

		const support = {
			text: __(
				'Your AI-Powered assistant helps you with smart text generation, dynamic image creation, content translation and more. Seamlessly integrated with WordPress.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack' ), // TODO: Add jetpack ai support link
		};

		const {
			hasConnectedOwner,
			hasAiFeature,
			isFetching,
			isOffline,
			upgradeUrl,
			videoPressStorageUsed,
		} = this.props;

		const shouldDisplayBanner = hasConnectedOwner && ! hasAiFeature && ! isOffline && ! isFetching;

		const bannerText =
			! hasAiFeature && null !== videoPressStorageUsed && 0 === videoPressStorageUsed
				? __(
						'1 free video available. Upgrade now to unlock more videos and 1TB of storage.',
						'jetpack'
				  )
				: __(
						'You have used your free video. Upgrade now to unlock more videos and 1TB of storage.',
						'jetpack',
						/* dummy arg to avoid bad minification */ 0
				  );

		if ( this.props.getOptionValue( 'ai' ) && hasConnectedOwner ) {
			return (
				<DashItem
					className="jp-dash-item__videopress"
					label={ labelName }
					module="ai"
					support={ support }
					status="is-working"
					overrideContent={
						<>
							<div className="dops-card jp-dash-item__card">
								<p className="jp-dash-item__description">
									{ __(
										'Jetpack AI is enabled and will empower your content creation with smart text generation, dynamic image creation and more. Check it in your Post Editor.',
										'jetpack'
									) }
								</p>
							</div>
							{ shouldDisplayBanner && (
								<JetpackBanner
									className="media__videopress-upgrade"
									callToAction={ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
									title={ bannerText }
									disableHref="false"
									eventFeature="ai"
									noIcon
									path={ 'dashboard' }
									plan={ getJetpackProductUpsellByFeature( FEATURE_AI_ASSISTANT ) }
									feature="ai"
									href={ upgradeUrl }
									trackBannerDisplay={ this.props.trackUpgradeButtonView }
								/>
							) }
						</>
					}
				/>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="ai"
				support={ support }
				className="jp-dash-item__is-inactive"
				noToggle={ ! hasConnectedOwner }
				overrideContent={
					! hasConnectedOwner &&
					! isOffline && (
						<JetpackBanner
							callToAction={ __( 'Connect', 'jetpack' ) }
							title={ __(
								'Connect your WordPress.com account to enable AI-Powered WordPress Assistant.',
								'jetpack'
							) }
							disableHref="false"
							onClick={ this.props.connectUser }
							eventFeature="ai"
							path="dashboard"
							plan={ getJetpackProductUpsellByFeature( FEATURE_AI_ASSISTANT ) }
						/>
					)
				}
			>
				<p className="jp-dash-item__description">
					{ isOffline
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: __(
								'Empower your content creation with your AI-Powered WordPress Assistant. Generate text, images, translate your content and more.',
								'jetpack'
						  ) }
				</p>
			</DashItem>
		);
	}

	render() {
		return this.props.isModuleAvailable && this.getContent();
	}
}

export default connect(
	state => ( {
		hasConnectedOwner: hasConnectedOwnerSelector( state ),
		hasAiFeature: siteHasFeature( state, 'ai-assistant' ),
		isModuleAvailable: isModuleAvailable( state, 'ai' ),
		isOffline: isOfflineMode( state ),
		isFetching: isFetchingSitePurchases( state ),
		sitePlan: getSitePlan( state ),
		upgradeUrl: getProductDescriptionUrl( state, 'ai' ),
	} ),
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashJetpackAi );
