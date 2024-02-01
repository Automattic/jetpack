import restApi from '@automattic/jetpack-api';
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import Card from 'components/card';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
import { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import {
	fetchPluginsData as dispatchFetchPluginsData,
	isPluginActive,
	isPluginInstalled,
	isFetchingPluginsData as getIsFetchingPluginsData,
} from 'state/site/plugins';

const PluginInstallSection = ( {
	fetchPluginsData,
	isFetchingPluginsData,
	aPluginIsActive,
	aPluginIsInstalled,
	pluginName,
	pluginSlug,
	pluginLink,
	installOrActivatePrompt,
	installedPrompt,
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
				title={ installOrActivatePrompt }
				onClick={ activateOrInstallPlugin }
				noIcon
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
				title={ installOrActivatePrompt }
				onClick={ activateOrInstallPlugin }
				noIcon
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
			title={ installedPrompt ?? __( 'Plugin is installed & active.', 'jetpack' ) }
			href={ pluginLink }
			noIcon
		/>
	);
};

export default connect(
	( state, { pluginFiles } ) => ( {
		isFetchingPluginsData: getIsFetchingPluginsData( state ),
		aPluginIsInstalled: pluginFiles.some( pluginFile => isPluginInstalled( state, pluginFile ) ),
		aPluginIsActive: pluginFiles.some( pluginFile => isPluginActive( state, pluginFile ) ),
	} ),
	dispatch => ( {
		fetchPluginsData: () => dispatch( dispatchFetchPluginsData() ),
	} )
)( PluginInstallSection );
