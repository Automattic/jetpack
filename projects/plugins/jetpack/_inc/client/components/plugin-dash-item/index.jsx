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
		pluginName: PropTypes.string.isRequired,
		pluginFile: PropTypes.string.isRequired,
		pluginSlug: PropTypes.string.isRequired,
		icon: PropTypes.string.isRequired,
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



	renderNotInstalled() {
		const { installOrActivatePrompt, pluginName } = this.props;

		return (
			<JetpackBanner
				callToAction={ 
					/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
					sprintf( __( 'Install %s', 'jetpack' ), pluginName )
				}
				title={ installOrActivatePrompt }
				onClick={ this.activateOrInstallPlugin }
			/>
		);
	}

	renderNotActivated() {
		const { installOrActivatePrompt, pluginName } = this.props;

		return (
			<JetpackBanner
				callToAction={ 
					/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
					sprintf( __( 'Activate %s', 'jetpack' ), pluginName )
				}
				title={ installOrActivatePrompt }
				onClick={ this.activateOrInstallPlugin }
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
		const { pluginName } = this.props;

		return <DashItem label={ pluginName } isModule={ false } overrideContent={ this.renderContent() } />;
	}
}

export default connect( ( state, ownProps ) => ( {
	isFetchingPluginsData: getIsFetchingPluginsData( state ),
	pluginIsInstalled: isPluginInstalled( state, ownProps.pluginFile ),
	pluginIsActive: isPluginActive( state, ownProps.pluginFile ),
	siteAdminUrl: getSiteAdminUrl( state ),
} ) )( PluginDashItem );
