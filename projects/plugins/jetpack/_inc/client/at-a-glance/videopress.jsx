/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { includes, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import DashItem from 'components/dash-item';
import {
	isVideoPressLegacySecurityPlan,
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_VIDEOPRESS,
} from 'lib/plans/constants';
import { ProgressBar } from '@automattic/components';
import JetpackBanner from 'components/jetpack-banner';
import { isModuleAvailable } from 'state/modules';
import {
	connectUser,
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
} from 'state/connection';
import {
	hasActiveVideoPressPurchase,
	getSitePlan,
	getSitePurchases,
	getVideoPressStorageUsed,
} from 'state/site';
import { getProductDescriptionUrl } from 'product-descriptions/utils';

class DashVideoPress extends Component {
	static propTypes = {
		hasConnectedOwner: PropTypes.bool.isRequired,
		isOfflineMode: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
		trackUpgradeButtonView: PropTypes.func,
	};

	static defaultProps = {
		trackUpgradeButtonView: noop,
	};

	activateVideoPress = () => this.props.updateOptions( { videopress: true } );

	getContent() {
		const labelName = __( 'VideoPress', 'jetpack' );

		const support = {
			text: __(
				'Engage your visitors with high-resolution, ad-free video. Save time by uploading videos directly through the WordPress editor. With Jetpack VideoPress, you can customize your video player to deliver your message without the distraction.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-videopress' ),
		};

		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		const {
			hasConnectedOwner,
			hasLegacySecurityDailyPlan,
			hasVideoPressPurchase,
			isOffline,
			upgradeUrl,
			videoPressStorageUsed,
		} = this.props;

		const hasUpgrade =
			includes( [ 'is-premium-plan', 'is-business-plan', 'is-complete-plan' ], planClass ) ||
			hasLegacySecurityDailyPlan ||
			hasVideoPressPurchase;

		const shouldDisplayStorage = hasVideoPressPurchase && null !== videoPressStorageUsed;
		const shouldDisplayBanner = hasConnectedOwner && ! hasUpgrade && ! isOffline;

		const bannerText =
			! hasVideoPressPurchase && null !== videoPressStorageUsed && 0 === videoPressStorageUsed
				? __(
						'1 free video available. Upgrade now to unlock more videos and 1TB of storage.',
						'jetpack'
				  )
				: __(
						'You have used your free video. Upgrade now to unlock more videos and 1TB of storage.',
						'jetpack'
				  );

		if ( this.props.getOptionValue( 'videopress' ) && hasConnectedOwner ) {
			return (
				<DashItem
					className="jp-dash-item__videopress"
					label={ labelName }
					module="videopress"
					support={ support }
					status="is-working"
					overrideContent={
						<>
							<div className="dops-card jp-dash-item__card">
								<p className="jp-dash-item__description">
									{ __(
										'VideoPress is enabled and will optimize your videos for smooth playback on any device. To add a new video, upload it to the Media Library or Post Editor.',
										'jetpack'
									) }
								</p>
								{ shouldDisplayStorage && (
									<div className="jp-dash-item__videopress-storage">
										<span>{ __( 'Video storage used out of 1TB:', 'jetpack' ) }</span>
										<ProgressBar value={ videoPressStorageUsed / 10000 } />
									</div>
								) }
							</div>
							{ shouldDisplayBanner && (
								<JetpackBanner
									className="media__videopress-upgrade"
									callToAction={ __( 'Upgrade', 'jetpack' ) }
									title={ bannerText }
									disableHref="false"
									eventFeature="videopress"
									icon="video"
									path={ 'dashboard' }
									plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEOPRESS ) }
									feature="jetpack_videopress"
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
				module="videopress"
				support={ support }
				className="jp-dash-item__is-inactive"
				noToggle={ ! hasConnectedOwner }
				overrideContent={
					! hasConnectedOwner &&
					! isOffline && (
						<JetpackBanner
							callToAction={ __( 'Connect', 'jetpack' ) }
							title={ __(
								'Connect your WordPress.com account to enable high-quality, ad-free video.',
								'jetpack'
							) }
							disableHref="false"
							onClick={ this.props.connectUser }
							eventFeature="videopress"
							path="dashboard"
							plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEOPRESS ) }
							icon="video"
						/>
					)
				}
			>
				<p className="jp-dash-item__description">
					{ isOffline
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: createInterpolateElement(
								__(
									'<a>Activate</a> to engage your visitors with high-resolution, ad-free video. Save time by uploading videos directly through the WordPress editor. Try it for free.',
									'jetpack'
								),
								{
									a: <a href="javascript:void(0)" onClick={ this.activateVideoPress } />,
								}
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
		hasVideoPressPurchase: hasActiveVideoPressPurchase( state ),
		hasLegacySecurityDailyPlan: getSitePurchases( state ).find( isVideoPressLegacySecurityPlan ),
		isModuleAvailable: isModuleAvailable( state, 'videopress' ),
		isOffline: isOfflineMode( state ),
		sitePlan: getSitePlan( state ),
		upgradeUrl: getProductDescriptionUrl( state, 'videopress' ),
		videoPressStorageUsed: getVideoPressStorageUsed( state ),
	} ),
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashVideoPress );
