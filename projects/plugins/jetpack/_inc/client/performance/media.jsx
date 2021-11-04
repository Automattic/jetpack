/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { includes } from 'lodash';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import {
	isVideoPressLegacySecurityPlan,
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_VIDEOPRESS,
	FEATURE_VIDEO_HOSTING_JETPACK,
} from 'lib/plans/constants';
import { FormLegend } from 'components/forms';
import JetpackBanner from 'components/jetpack-banner';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getUpgradeUrl } from 'state/initial-state';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { hasConnectedOwner as hasConnectedOwnerSelector, isOfflineMode } from 'state/connection';
import {
	getSitePlan,
	getSitePurchases,
	getVideoPressStorageUsed,
	hasActiveVideoPressPurchase,
	isFetchingSitePurchases,
} from 'state/site';

class Media extends React.Component {
	render() {
		const foundVideoPress = this.props.isModuleFound( 'videopress' );

		if ( ! foundVideoPress ) {
			return null;
		}

		const videoPress = this.props.module( 'videopress' );
		const planClass = getPlanClass( this.props.sitePlan.product_slug );
		const {
			hasConnectedOwner,
			hasVideoPressLegacySecurityPlan,
			hasVideoPressPurchase,
			isFetching,
			isOffline,
			upgradeUrl,
			videoPressStorageUsed,
		} = this.props;

		const shouldDisplayStorage = hasVideoPressPurchase && null !== videoPressStorageUsed;

		const hasUpgrade =
			includes( [ 'is-premium-plan', 'is-business-plan', 'is-complete-plan' ], planClass ) ||
			hasVideoPressLegacySecurityPlan ||
			hasVideoPressPurchase;

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

		const videoPressSettings = (
			<SettingsGroup
				hasChild
				disableInOfflineMode
				module={ videoPress }
				support={ {
					link: getRedirectUrl( 'jetpack-support-videopress' ),
				} }
			>
				<FormLegend className="jp-form-label-wide">{ __( 'VideoPress', 'jetpack' ) }</FormLegend>
				<p>
					{ ' ' }
					{ __(
						'Engage your visitors with high-resolution, ad-free video. Save time by uploading videos directly through the WordPress editor. With Jetpack VideoPress, you can customize your video player to deliver your message without the distraction.',
						'jetpack'
					) }{ ' ' }
				</p>
				{ shouldDisplayStorage && (
					<div className="media__videopress-storage">
						<span>{ __( 'Video storage used out of 1TB:', 'jetpack' ) }</span>
						<ProgressBar value={ videoPressStorageUsed / 10000 } />
					</div>
				) }
				{ hasConnectedOwner && (
					<ModuleToggle
						slug="videopress"
						disabled={ this.props.isUnavailableInOfflineMode( 'videopress' ) }
						activated={ this.props.getOptionValue( 'videopress' ) }
						toggling={ this.props.isSavingAnyOption( 'videopress' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ __( 'Enable VideoPress', 'jetpack' ) }
						</span>
					</ModuleToggle>
				) }
			</SettingsGroup>
		);

		const videoPressForcedInactive = 'inactive' === this.props.getModuleOverride( 'videopress' );
		const shouldDisplayBanner =
			foundVideoPress && ! hasUpgrade && hasConnectedOwner && ! isOffline && ! isFetching;

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Media', 'jetpack' ) }
				feature={ ! videoPressForcedInactive && FEATURE_VIDEO_HOSTING_JETPACK }
				hideButton
			>
				{ foundVideoPress && videoPressSettings }
				{ shouldDisplayBanner && (
					<JetpackBanner
						className="media__videopress-upgrade"
						callToAction={ __( 'Upgrade', 'jetpack' ) }
						title={ bannerText }
						eventFeature="videopress"
						icon="video"
						plan={ getJetpackProductUpsellByFeature( FEATURE_VIDEOPRESS ) }
						feature="jetpack_videopress"
						href={ upgradeUrl }
					/>
				) }
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		sitePlan: getSitePlan( state ),
		hasVideoPressPurchase: hasActiveVideoPressPurchase( state ),
		hasVideoPressLegacySecurityPlan: getSitePurchases( state ).find(
			isVideoPressLegacySecurityPlan
		),
		hasConnectedOwner: hasConnectedOwnerSelector( state ),
		isOffline: isOfflineMode( state ),
		isFetching: isFetchingSitePurchases( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		upgradeUrl: getUpgradeUrl( state, 'videopress-upgrade' ),
		videoPressStorageUsed: getVideoPressStorageUsed( state ),
	};
} )( withModuleSettingsFormHelpers( Media ) );
