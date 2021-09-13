/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { includes } from 'lodash';

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
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_VIDEOPRESS,
} from 'lib/plans/constants';
import { ProgressBar } from '@automattic/components';
import JetpackBanner from 'components/jetpack-banner';
import { isModuleAvailable } from 'state/modules';
import { isOfflineMode } from 'state/connection';
import { getUpgradeUrl } from 'state/initial-state';
import { hasActiveVideoPressPurchase, getSitePlan, getVideoPressStorageUsed } from 'state/site';

class DashVideoPress extends Component {
	static propTypes = {
		isOfflineMode: PropTypes.bool.isRequired,
		isModuleAvailable: PropTypes.bool.isRequired,
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

		const planClass = getPlanClass( this.props.sitePlan.product_slug ),
			{ hasVideoPressPurchase, upgradeUrl, videoPressStorageUsed } = this.props;

		const shouldDisplayStorage = hasVideoPressPurchase && null !== videoPressStorageUsed;

		const hasUpgrade =
			includes(
				[
					'is-premium-plan',
					'is-business-plan',
					'is-daily-security-plan',
					'is-realtime-security-plan',
					'is-complete-plan',
				],
				planClass
			) || hasVideoPressPurchase;

		if ( this.props.getOptionValue( 'videopress' ) ) {
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
							{ ! hasUpgrade && (
								<JetpackBanner
									className="media__videopress-upgrade"
									callToAction={ __( 'Upgrade', 'jetpack' ) }
									title={ __(
										'You are limited to 1 video. Upgrade now for unlimited videos and 1TB of storage.',
										'jetpack'
									) }
									disableHref="false"
									eventFeature="videopress"
									icon="video"
									path={ 'dashboard' }
									plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEOPRESS ) }
									feature="jetpack_videopress"
									href={ upgradeUrl }
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
			>
				<p className="jp-dash-item__description">
					{ this.props.isOfflineMode
						? __( 'Unavailable in Offline Mode', 'jetpack' )
						: createInterpolateElement(
								__(
									'<a>Activate</a> to engage your visitors with high-resolution, ad-free video. Save time by uploading videos directly through the WordPress editor.',
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

export default connect( state => ( {
	isOfflineMode: isOfflineMode( state ),
	isModuleAvailable: isModuleAvailable( state, 'videopress' ),
	hasVideoPressPurchase: hasActiveVideoPressPurchase( state ),
	sitePlan: getSitePlan( state ),
	upgradeUrl: getUpgradeUrl( state, 'videopress-upgrade' ),
	videoPressStorageUsed: getVideoPressStorageUsed( state ),
} ) )( DashVideoPress );
