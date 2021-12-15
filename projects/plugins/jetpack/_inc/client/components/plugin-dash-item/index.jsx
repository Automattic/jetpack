/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import {
	fetchPluginsData as dispatchFetchPluginsData,
	isPluginActive,
	isPluginInstalled,
	isFetchingPluginsData as getIsFetchingPluginsData,
} from 'state/site/plugins';
import JetpackBanner from 'components/jetpack-banner';
import SectionHeader from 'components/section-header';
import { getSiteAdminUrl } from 'state/initial-state';

/**
 * Style dependencies
 */
import './style.scss';

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

	state = {
		isActivating: false,
		isInstalling: false,
	};

	activateOrInstallPlugin = () => {
		const { fetchPluginsData, pluginIsActive, pluginIsInstalled, pluginSlug } = this.props;

		if ( ! pluginIsInstalled ) {
			this.setState( { isInstalling: true } );
		} else if ( ! pluginIsActive ) {
			this.setState( { isActivating: true } );
		} else if ( pluginIsInstalled && pluginIsActive ) {
			// do not try to do anything to an installed, active plugin
			return Promise.resolve();
		}

		return apiFetch( {
			path: '/jetpack/v4/plugins',
			method: 'POST',
			data: {
				slug: pluginSlug,
				status: 'active',
			},
		} )
			.then( () => {
				return fetchPluginsData();
			} )
			.finally( () => {
				this.setState( {
					isActivating: false,
					isInstalling: false,
				} );
			} );
	};

	renderContent() {
		const {
			isFetchingPluginsData,
			pluginName,
			pluginIsActive,
			pluginIsInstalled,
			installOrActivatePrompt,
		} = this.props;
		const { isInstalling, isActivating } = this.state;

		if ( isFetchingPluginsData ) {
			return (
				<Card className="plugin-dash-item__content">
					<p>{ __( 'Loading…', 'jetpack' ) }</p>
				</Card>
			);
		} else if ( isInstalling ) {
			return (
				<Card className="plugin-dash-item__content">
					<Spinner />
					<p>
						{ sprintf(
							/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
							__( 'Installing %s', 'jetpack' ),
							pluginName
						) }
					</p>
				</Card>
			);
		} else if ( isActivating ) {
			return (
				<Card className="plugin-dash-item__content">
					<Spinner />
					<p>
						{ sprintf(
							/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
							__( 'Activating %s', 'jetpack' ),
							pluginName
						) }
					</p>
				</Card>
			);
		} else if ( ! pluginIsInstalled ) {
			return (
				<JetpackBanner
					callToAction={ sprintf(
						/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
						__( 'Install %s', 'jetpack' ),
						pluginName
					) }
					icon="plugins"
					title={ installOrActivatePrompt }
					onClick={ this.activateOrInstallPlugin }
				/>
			);
		} else if ( ! pluginIsActive ) {
			return (
				<JetpackBanner
					callToAction={ sprintf(
						/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
						__( 'Activate %s', 'jetpack' ),
						pluginName
					) }
					icon="plugins"
					title={ installOrActivatePrompt }
					onClick={ this.activateOrInstallPlugin }
				/>
			);
		}
		return (
			<Card className="plugin-dash-item__content">
				<p>{ __( 'Plugin is installed & active.', 'jetpack' ) }</p>
			</Card>
		);
	}

	render() {
		const { pluginName } = this.props;

		return (
			<div className="plugin-dash-item">
				<SectionHeader className="plugin-dash-item__section-header" label={ pluginName } />
				{ this.renderContent() }
			</div>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		isFetchingPluginsData: getIsFetchingPluginsData( state ),
		pluginIsInstalled: isPluginInstalled( state, ownProps.pluginFile ),
		pluginIsActive: isPluginActive( state, ownProps.pluginFile ),
		siteAdminUrl: getSiteAdminUrl( state ),
	} ),
	dispatch => ( { fetchPluginsData: () => dispatch( dispatchFetchPluginsData() ) } )
)( PluginDashItem );
