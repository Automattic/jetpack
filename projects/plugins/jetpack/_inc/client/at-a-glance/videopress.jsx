/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { getPlanClass } from 'lib/plans/constants';
import DashItem from 'components/dash-item';
import { ProgressBar } from '@automattic/components';
import JetpackBanner from 'components/jetpack-banner';
import { isModuleAvailable } from 'state/modules';
import { isOfflineMode } from 'state/connection';
import { getActiveProductPurchases, getSitePlan, getVideoPressStorageUsed } from 'state/site';
import { find, includes } from 'lodash';

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
			{ activeProducts, videoPressStorageUsed } = this.props;

		const hasVideoPressProduct = find( activeProducts, { product_slug: 'jetpack_videopress' } );
		const shouldDisplayStorage = hasVideoPressProduct && null !== videoPressStorageUsed;

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
			) || hasVideoPressProduct;

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
										'VideoPress is enabled and will optimize your videos for smooth playback on any device. To add a new video, just upload it to the Media Library or Post Editor.',
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
									icon="video"
									plan={ 'free' }
									feature="jetpack_videopress"
									href="https://jetpack.com/pricing"
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
	sitePlan: getSitePlan( state ),
	activeProducts: getActiveProductPurchases( state ),
	videoPressStorageUsed: getVideoPressStorageUsed( state ),
} ) )( DashVideoPress );
