/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { find, includes } from 'lodash';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { FEATURE_VIDEO_HOSTING_JETPACK, getPlanClass } from 'lib/plans/constants';
import { FormLegend } from 'components/forms';
import JetpackBanner from 'components/jetpack-banner';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getActiveProductPurchases, getSitePlan } from 'state/site';

class Media extends React.Component {
	render() {
		const foundVideoPress = this.props.isModuleFound( 'videopress' );

		if ( ! foundVideoPress ) {
			return null;
		}

		const videoPress = this.props.module( 'videopress' ),
			planClass = getPlanClass( this.props.sitePlan.product_slug ),
			{ activeProducts } = this.props;

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
			) || find( activeProducts, { product_slug: 'jetpack_videopress' } );

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
			</SettingsGroup>
		);

		const videoPressForcedInactive = 'inactive' === this.props.getModuleOverride( 'videopress' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Media', 'jetpack' ) }
				feature={ ! videoPressForcedInactive && FEATURE_VIDEO_HOSTING_JETPACK }
				hideButton
			>
				{ foundVideoPress && videoPressSettings }
				{ foundVideoPress && ! hasUpgrade && (
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
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		sitePlan: getSitePlan( state ),
		activeProducts: getActiveProductPurchases( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( Media ) );
