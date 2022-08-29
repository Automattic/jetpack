import restApi from '@automattic/jetpack-api';
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import Card from 'components/card';
import JetpackBanner from 'components/jetpack-banner';
import SectionHeader from 'components/section-header';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';
import {
	fetchPluginsData as dispatchFetchPluginsData,
	isPluginActive,
	isPluginInstalled,
	isFetchingPluginsData as getIsFetchingPluginsData,
} from 'state/site/plugins';

import './style.scss';

export const PluginDashItem = ( {
	fetchPluginsData,
	iconAlt,
	iconSrc,
	installOrActivatePrompt,
	isFetchingPluginsData,
	aPluginIsActive,
	aPluginIsInstalled,
	pluginLink,
	pluginName,
	pluginSlug,
} ) => {
	const [ isActivating, setIsActivating ] = useState( false );
	const [ isInstalling, setIsInstalling ] = useState( false );

	const activateOrInstallPlugin = useCallback( () => {
		if ( ! aPluginIsInstalled ) {
			setIsInstalling( true );
		} else if ( ! aPluginIsActive ) {
			setIsActivating( true );
		} else if ( aPluginIsInstalled && aPluginIsActive ) {
			// do not try to do anything to an installed, active plugin
			return Promise.resolve();
		}
		analytics.tracks.recordJetpackClick( {
			target: 'plugin_dash_item',
			type: aPluginIsInstalled ? 'install' : 'activate',
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
					setIsActivating( false );
					setIsInstalling( false );
				} )
		);
	}, [ fetchPluginsData, aPluginIsActive, aPluginIsInstalled, pluginSlug ] );

	const renderContent = () => {
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
		} else if ( ! aPluginIsInstalled ) {
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
					onClick={ activateOrInstallPlugin }
				/>
			);
		} else if ( ! aPluginIsActive ) {
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
					onClick={ activateOrInstallPlugin }
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
	};

	return (
		<div className="plugin-dash-item">
			<SectionHeader className="plugin-dash-item__section-header" label={ pluginName } />
			{ renderContent() }
		</div>
	);
};

PluginDashItem.propTypes = {
	pluginName: PropTypes.string.isRequired,
	pluginFiles: PropTypes.arrayOf( PropTypes.string ).isRequired,
	pluginSlug: PropTypes.string.isRequired,
	pluginLink: PropTypes.string.isRequired,
	installOrActivatePrompt: PropTypes.element.isRequired,
	iconAlt: PropTypes.string,
	iconSrc: PropTypes.string,

	// connected properties
	isFetchingPluginsData: PropTypes.bool,
	aPluginIsActive: PropTypes.bool,
	aPluginIsInstalled: PropTypes.bool,
};

export default connect(
	( state, { pluginFiles } ) => ( {
		isFetchingPluginsData: getIsFetchingPluginsData( state ),
		aPluginIsInstalled: pluginFiles.some( pluginFile => isPluginInstalled( state, pluginFile ) ),
		aPluginIsActive: pluginFiles.some( pluginFile => isPluginActive( state, pluginFile ) ),
	} ),
	dispatch => ( { fetchPluginsData: () => dispatch( dispatchFetchPluginsData() ) } )
)( PluginDashItem );
