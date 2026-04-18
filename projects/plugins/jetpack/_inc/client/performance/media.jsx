import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Fieldset } from '@wordpress/ui';
import { Component } from 'react';
import { connect } from 'react-redux';
// Jetpack composite helpers — kept as-is because they wrap Redux state,
// analytics, module-override gating, and shared form infrastructure that
// must not be duplicated inline.
// NOTE: JetpackBanner is a marketing/upgrade card with bespoke layout (icon
// slot, title, CTA, feature tracking). There is no @wordpress/ui primitive
// equivalent (Notice is a system-message component with different visual
// treatment), so the composite is preserved.
import JetpackBanner from 'components/jetpack-banner';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import {
	getJetpackProductUpsellByFeature,
	FEATURE_VIDEOPRESS,
	FEATURE_VIDEO_HOSTING_JETPACK,
} from 'lib/plans/constants';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { hasConnectedOwner as hasConnectedOwnerSelector, isOfflineMode } from 'state/connection';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import {
	getSitePlan,
	getVideoPressStorageUsed,
	siteHasFeature,
	isFetchingSitePurchases,
} from 'state/site';

class Media extends Component {
	togglePrivacySetting = () => {
		this.props.updateOptions( {
			videopress_private_enabled_for_site: ! this.props.getOptionValue(
				'videopress_private_enabled_for_site'
			),
		} );
	};

	render() {
		const foundVideoPress = this.props.isModuleFound( 'videopress' );

		if ( ! foundVideoPress ) {
			return null;
		}

		const videoPress = this.props.module( 'videopress' );
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

		const videoPressSettings = (
			<SettingsGroup
				hasChild
				disableInOfflineMode
				module={ videoPress }
				support={ {
					link: getRedirectUrl( 'jetpack-support-videopress' ),
				} }
			>
				<Fieldset.Root>
					<Fieldset.Legend className="jp-form-label-wide">
						{ __( 'VideoPress', 'jetpack' ) }
					</Fieldset.Legend>
					<p>
						{ ' ' }
						{ __(
							'Engage your visitors with high-resolution, ad-free video. Save time by uploading videos directly through the WordPress editor. With Jetpack VideoPress, you can customize your video player to deliver your message without the distraction.',
							'jetpack'
						) }{ ' ' }
					</p>
					{ shouldDisplayStorage && (
						<div className="media__videopress-storage">
							<progress
								className="jp-videopress-storage__progress"
								max="100"
								value={ Math.min( 100, videoPressStorageUsed / 1000000 ) }
							/>
							<span>
								{ createInterpolateElement(
									sprintf(
										/* translators: %d is a number (disk space used) */
										__( 'Using <strong>%dGB</strong> of 1TB', 'jetpack' ),
										Math.round( videoPressStorageUsed / 1024 )
									),
									{ strong: <strong /> }
								) }
							</span>
						</div>
					) }
					{ hasConnectedOwner && (
						<>
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
							<Fieldset.Root>
								<ToggleControl
									id="videopress-site-privacy"
									disabled={ ! this.props.getOptionValue( 'videopress' ) }
									checked={ this.props.getOptionValue( 'videopress_private_enabled_for_site' ) }
									onChange={ this.togglePrivacySetting }
									label={
										<span className="jp-form-toggle-explanation">
											{ __( 'Video Privacy: Restrict views to members of this site', 'jetpack' ) }
										</span>
									}
								/>
							</Fieldset.Root>
						</>
					) }
				</Fieldset.Root>
			</SettingsGroup>
		);

		const videoPressForcedInactive = 'inactive' === this.props.getModuleOverride( 'videopress' );
		const shouldDisplayBanner =
			foundVideoPress && ! hasVideoPressFeature && hasConnectedOwner && ! isOffline && ! isFetching;

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
						callToAction={ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
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
		hasVideoPressFeature:
			siteHasFeature( state, 'videopress-1tb-storage' ) ||
			siteHasFeature( state, 'videopress-unlimited-storage' ) ||
			siteHasFeature( state, 'videopress' ),
		hasVideoPressUnlimitedStorage: siteHasFeature( state, 'videopress-unlimited-storage' ),
		hasConnectedOwner: hasConnectedOwnerSelector( state ),
		isOffline: isOfflineMode( state ),
		isFetching: isFetchingSitePurchases( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		upgradeUrl: getProductDescriptionUrl( state, 'videopress' ),
		videoPressStorageUsed: getVideoPressStorageUsed( state ),
	};
} )( withModuleSettingsFormHelpers( Media ) );
