/**
 * External dependencies
 */
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import restApi from '@automattic/jetpack-api';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	fetchPluginsData as dispatchFetchPluginsData,
	isPluginActive,
	isPluginInstalled,
	isFetchingPluginsData as getIsFetchingPluginsData,
} from 'state/site/plugins';
import analytics from 'lib/analytics';
import Card from 'components/card';
import JetpackBanner from 'components/jetpack-banner';
import SectionHeader from 'components/section-header';

/**
 * Style dependencies
 */
import './style.scss';

export class PluginDashItem extends Component {
	static propTypes = {
		pluginName: PropTypes.string.isRequired,
		pluginFile: PropTypes.string.isRequired,
		pluginSlug: PropTypes.string.isRequired,
		pluginLink: PropTypes.string.isRequired,
		installOrActivatePrompt: PropTypes.element.isRequired,
		iconAlt: PropTypes.string,
		iconSrc: PropTypes.string,

		// connected properties
		isFetchingPluginsData: PropTypes.bool,
		pluginIsActive: PropTypes.bool,
		pluginIsInstalled: PropTypes.bool,
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

		analytics.tracks.recordJetpackClick( {
			target: 'plugin_dash_item',
			type: pluginIsInstalled ? 'install' : 'activate',
			feature: pluginSlug,
		} );

		return (
			restApi
				.installPlugin( pluginSlug, 'active' )
				// take a little break to avoid any race conditions with plugin data being updated
				.then( () => new Promise( resolve => setTimeout( resolve, 2500 ) ) )
				.then( () => {
					return fetchPluginsData();
				} )
				.finally( () => {
					this.setState( {
						isActivating: false,
						isInstalling: false,
					} );
				} )
		);
	};

	renderContent() {
		const {
			iconAlt,
			iconSrc,
			isFetchingPluginsData,
			pluginLink,
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
					icon={ iconSrc ? undefined : 'plugins' }
					iconAlt={ iconAlt }
					iconSrc={ iconSrc }
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
					icon={ iconSrc ? undefined : 'plugins' }
					iconAlt={ iconAlt }
					iconSrc={ iconSrc }
					title={ installOrActivatePrompt }
					onClick={ this.activateOrInstallPlugin }
				/>
			);
		}
		return (
			<JetpackBanner
				callToAction={ sprintf(
					/* translators: "%s" is the name of the plugin. i.e. Boost, CRM, etc. */
					__( 'Manage %s', 'jetpack' ),
					pluginName
				) }
				icon={ iconSrc ? undefined : 'plugins' }
				iconAlt={ iconAlt }
				iconSrc={ iconSrc }
				title={ __( 'Plugin is installed & active.', 'jetpack' ) }
				href={ pluginLink }
			/>
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
	} ),
	dispatch => ( { fetchPluginsData: () => dispatch( dispatchFetchPluginsData() ) } )
)( PluginDashItem );
