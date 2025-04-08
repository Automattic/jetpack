import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Spinner, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { installAndActivatePlugin, activatePlugin } from '../../../util/plugin-management';
import PluginActionButton from './plugin-action-button';
import './styles.css';

const PluginIntegrationPanel = ( {
	title,
	pluginSlug,
	pluginPath,
	pluginTitle,
	installText,
	activateText,
	description,
	tracksEventName,
	children,
	initialOpen = false,
	onPluginActivated,
} ) => {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ isActivating, setIsActivating ] = useState( false );
	const { invalidateResolution } = useDispatch( coreStore );
	const { tracks } = useAnalytics();

	const { isLoading, isInstalled, isActive } = useSelect(
		select => {
			const installedPlugins = select( coreStore ).getPlugins();
			const plugin = installedPlugins
				? installedPlugins.find( p => p.plugin === pluginPath )
				: null;
			return {
				isLoading: ! installedPlugins,
				isInstalled: !! plugin,
				isActive: plugin && plugin.status === 'active',
			};
		},
		[ pluginPath ]
	);

	const handleButtonClick = useCallback( () => {
		const func = isInstalled ? activatePlugin : installAndActivatePlugin;
		const arg = isInstalled ? pluginPath : pluginSlug;
		const isActivationCall = func === activatePlugin;

		setIsInstalling( true );
		setIsActivating( isActivationCall );

		if ( tracksEventName ) {
			tracks.recordEvent( tracksEventName );
		}

		func( arg ).finally( () => {
			invalidateResolution( 'getPlugins' );
			setIsInstalling( false );
			setIsActivating( false );

			if ( isActivationCall && onPluginActivated ) {
				onPluginActivated();
			}
		} );
	}, [
		isInstalled,
		pluginPath,
		pluginSlug,
		tracksEventName,
		setIsInstalling,
		setIsActivating,
		invalidateResolution,
		tracks,
		onPluginActivated,
	] );

	return (
		<PanelBody title={ title } initialOpen={ initialOpen }>
			<div className="jetpack-plugin-integration__content" aria-live="polite">
				{ isLoading && (
					<div className="jetpack-plugin-integration__status">
						<div>
							<Spinner />
							<span>{ __( 'Checking plugin status…', 'jetpack-forms' ) }</span>
						</div>
					</div>
				) }

				{ ! isLoading && ! isInstalled && (
					<div className="jetpack-plugin-integration__panel">
						<div className="jetpack-plugin-integration__panel-content">
							<div>{ description }</div>
							<PluginActionButton
								isInstalling={ isInstalling }
								isActivating={ isActivating }
								isInstalled={ isInstalled }
								installText={ installText }
								activateText={ activateText }
								onClick={ handleButtonClick }
							/>
						</div>
					</div>
				) }

				{ ! isLoading && isInstalled && ! isActive && (
					<div className="jetpack-plugin-integration__panel">
						<div className="jetpack-plugin-integration__panel-content">
							<div>
								{ sprintf(
									/* translators: %s: plugin name */
									__( "You already have %s installed, but it's not activated.", 'jetpack-forms' ),
									pluginTitle || __( 'the plugin', 'jetpack-forms' )
								) }
							</div>
							<PluginActionButton
								isInstalling={ isInstalling }
								isActivating={ isActivating }
								isInstalled={ isInstalled }
								installText={ installText }
								activateText={ activateText }
								onClick={ handleButtonClick }
							/>
						</div>
					</div>
				) }

				{ ! isLoading && isInstalled && isActive && children }
			</div>
		</PanelBody>
	);
};

export default PluginIntegrationPanel;
