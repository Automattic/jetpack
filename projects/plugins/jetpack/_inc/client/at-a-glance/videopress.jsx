import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import DashItem from 'components/dash-item';
import JetpackBanner from 'components/jetpack-banner';
import { getJetpackProductUpsellByFeature, FEATURE_VIDEOPRESS } from 'lib/plans/constants';
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
import {
	isFetchingSitePurchases,
	getSitePlan,
	getVideoPressStorageUsed,
	siteHasFeature,
} from 'state/site';

class DashVideoPress extends Component {
	static propTypes = {
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
		const labelName = __( 'VideoPress', 'jetpack' );

		const support = {
			text: __(
				'Engage your visitors with high-resolution, ad-free video. Save time by uploading videos directly through the WordPress editor. With Jetpack VideoPress, you can customize your video player to deliver your message without the distraction.',
				'jetpack'
			),
			link: getRedirectUrl( 'jetpack-support-videopress' ),
		};

		const {
			hasConnectedOwner,
			hasVideoPressFeature,
			hasVideoPressUnlimitedStorage,
			isFetching,
			isOffline,
			upgradeUrl,
			videoPressStorageUsed,
		} = this.props;

		const shouldDisplayStorage =
			hasVideoPressFeature && ! hasVideoPressUnlimitedStorage && null !== videoPressStorageUsed;
		const shouldDisplayBanner =
			hasConnectedOwner && ! hasVideoPressFeature && ! isOffline && ! isFetching;

		const bannerText =
			! hasVideoPressFeature && null !== videoPressStorageUsed && 0 === videoPressStorageUsed
				? __(
						'1 free video available. Upgrade now to unlock more videos and 1TB of storage.',
						'jetpack'
				  )
				: __(
						'You have used your free video. Upgrade now to unlock more videos and 1TB of storage.',
						'jetpack',
						/* dummy arg to avoid bad minification */ 0
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
								'Connect your Jetpack account to enable high-quality, ad-free video.',
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
		hasVideoPressFeature:
			siteHasFeature( state, 'videopress-1tb-storage' ) ||
			siteHasFeature( state, 'videopress-unlimited-storage' ) ||
			siteHasFeature( state, 'videopress' ),
		hasVideoPressUnlimitedStorage: siteHasFeature( state, 'videopress-unlimited-storage' ),
		isModuleAvailable: isModuleAvailable( state, 'videopress' ),
		isOffline: isOfflineMode( state ),
		isFetching: isFetchingSitePurchases( state ),
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
