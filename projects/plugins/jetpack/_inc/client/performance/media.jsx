/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { includes } from 'lodash';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { FEATURE_VIDEO_HOSTING_JETPACK, getPlanClass } from 'lib/plans/constants';
import { FormLegend } from 'components/forms';
import { ModuleToggle } from 'components/module-toggle';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSitePlan } from 'state/site';

class Media extends React.Component {
	render() {
		const foundVideoPress = this.props.isModuleFound( 'videopress' );

		if ( ! foundVideoPress ) {
			return null;
		}

		const videoPress = this.props.module( 'videopress' ),
			planClass = getPlanClass( this.props.sitePlan.product_slug );

		const videoPressSettings = this.props.hasConnectedOwner &&
			includes(
				[
					'is-premium-plan',
					'is-business-plan',
					'is-daily-security-plan',
					'is-realtime-security-plan',
					'is-complete-plan',
				],
				planClass
			) && (
				<SettingsGroup
					hasChild
					disableInOfflineMode
					module={ videoPress }
					support={ {
						link: getRedirectUrl( 'jetpack-support-videopress' ),
					} }
				>
					<FormLegend className="jp-form-label-wide">{ __( 'Video', 'jetpack' ) }</FormLegend>
					<p>
						{ ' ' }
						{ __(
							'Make the content you publish more engaging with high-resolution video. With Jetpack Video you can customize your media player and deliver high-speed, ad-free, and unbranded videos to your visitors. Videos are hosted on our WordPress.com servers and do not subtract space from your hosting plan!',
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
							{ __( 'Enable high-speed, ad-free video player', 'jetpack' ) }
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
			</SettingsCard>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		sitePlan: getSitePlan( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( withModuleSettingsFormHelpers( Media ) );
