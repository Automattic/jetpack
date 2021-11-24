/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import DashItem from 'components/dash-item';
import {
	isPluginActive,
	isPluginInstalled,
	isFetchingPluginsData as getIsFetchingPluginsData,
} from 'state/site/plugins';
import JetpackBanner from 'components/jetpack-banner';
import { getSiteAdminUrl } from 'state/initial-state';

class PluginDashItem extends Component {
	static propTypes = {
		label: PropTypes.string.isRequired,
		pluginFile: PropTypes.string.isRequired,
		pluginSlug: PropTypes.string.isRequired,
		installOrActivatePrompt: PropTypes.element.isRequired,

		// connected properties
		pluginIsActive: PropTypes.bool,
		pluginIsInstalled: PropTypes.bool,
		siteAdminUrl: PropTypes.string,
	};

	activateOrInstallPlugin = () => {
		apiFetch( {
			path: '/jetpack/v4/plugins',
			method: 'POST',
			data: {
				slug: this.props.pluginSlug,
				status: 'active',
			},
		} ).then( () => {} );
	};


	// wp_nonce_url( self_admin_url( 'update.php?action=install-plugin&plugin=' . $plugin_slug ), 'install-plugin_' . $plugin_slug );
	// wp_nonce_url( 'plugins.php?action=activate&amp;plugin=' . rawurlencode( $plugin_file ) . '&amp;plugin_status=all&amp;paged=1', 'activate-plugin_' . $plugin_file );

	renderNotInstalled() {
		return (
			<JetpackBanner
				callToAction={ __( 'Install', 'jetpack' ) }
				title={ this.props.installOrActivatePrompt }
				// disableHref="false"
				// href={ getRedirectUrl( 'calypso-plugins-setup', {
				// 	site: this.props.siteRawUrl,
				// 	query: 'only=backups',
				// } ) }
				// href={ site }
				// eventFeature="boost"
				onClick={ this.activateOrInstallPlugin }
				// path="dashboard"
				// icon="plans"
				// trackBannerDisplay={ this.props.trackUpgradeButtonView }
			/>
		);
	}

	renderNotActivated() {
		const { installOrActivatePrompt } = this.props;

		return (
			<JetpackBanner
				callToAction={ __( 'Activate', 'jetpack' ) }
				title={ installOrActivatePrompt }
				// disableHref="false"
				// eventFeature="boost"
				onClick={ this.activateOrInstallPlugin }
				// path="dashboard"
				// icon="plans"
				// trackBannerDisplay={ this.props.trackUpgradeButtonView }
			/>
		);
	}

	renderContent() {
		const { pluginIsActive, pluginIsInstalled } = this.props;

		if ( ! pluginIsInstalled ) {
			return this.renderNotInstalled();
		} else if ( ! pluginIsActive ) {
			return this.renderNotActivated();
		} else {
			return <div></div>;
		}
	}

	render() {
		const { label } = this.props;

		return <DashItem label={ label } isModule={ false } overrideContent={ this.renderContent() } />;
	}
}

export default connect( ( state, ownProps ) => ( {
	isFetchingPluginsData: getIsFetchingPluginsData( state ),
	pluginIsInstalled: isPluginInstalled( state, ownProps.pluginFile ),
	pluginIsActive: isPluginActive( state, ownProps.pluginFile ),
	siteAdminUrl: getSiteAdminUrl( state ),
} ) )( PluginDashItem );
