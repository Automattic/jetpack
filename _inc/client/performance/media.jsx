/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import { includes } from 'lodash';
import getRedirectUrl from 'lib/jp-redirect';

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

		const videoPressSettings = includes( [ 'is-premium-plan', 'is-business-plan' ], planClass ) && (
			<SettingsGroup
				hasChild
				disableInDevMode
				module={ videoPress }
				support={ {
					link: getRedirectUrl( 'jetpack-support-videopress' ),
				} }
			>
				<FormLegend className="jp-form-label-wide">{ __( 'Video' ) }</FormLegend>
				<p>
					{ ' ' }
					{ __(
						'Make the content you publish more engaging with high-resolution video. ' +
							'With Jetpack Video you can customize your media player and deliver ' +
							'high-speed, ad-free, and unbranded videos to your visitors. Videos are hosted on our WordPress.com servers and do not subtract space from your hosting plan!'
					) }{ ' ' }
				</p>
				<ModuleToggle
					slug="videopress"
					disabled={ this.props.isUnavailableInDevMode( 'videopress' ) }
					activated={ this.props.getOptionValue( 'videopress' ) }
					toggling={ this.props.isSavingAnyOption( 'videopress' ) }
					toggleModule={ this.props.toggleModuleNow }
				>
					<span className="jp-form-toggle-explanation">
						{ __( 'Enable high-speed, ad-free video player' ) }
					</span>
				</ModuleToggle>
			</SettingsGroup>
		);

		const videoPressForcedInactive = 'inactive' === this.props.getModuleOverride( 'videopress' );

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Media' ) }
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
