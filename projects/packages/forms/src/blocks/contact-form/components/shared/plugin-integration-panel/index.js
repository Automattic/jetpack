import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Icon, Spinner, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { installAndActivatePlugin, activatePlugin } from '../../../util/plugin-management';
import './styles.css';

const PluginIntegrationPanel = ( {
	pluginSlug,
	pluginPath,
	installText,
	activateText,
	description,
	tracksEventName,
	children,
	title,
	initialOpen = false,
} ) => {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ isActivating, setIsActivating ] = useState( false );
	const { invalidateResolution } = useDispatch( coreStore );
	const { tracks } = useAnalytics();

	const { pluginStatus, isLoading } = useSelect( () => {
		const installedPlugins = window?.wp?.data?.select( 'core' )?.getPlugins?.();

		if ( ! installedPlugins ) {
			return { isLoading: true };
		}

		const plugin = installedPlugins.find( p => p.plugin === pluginPath );

		return {
			isLoading: false,
			pluginStatus: {
				isInstalled: !! plugin,
				isActive: plugin?.status === 'active',
			},
		};
	}, [ pluginPath ] );

	const handleButtonClick = useCallback( () => {
		const func = pluginStatus?.isInstalled ? activatePlugin : installAndActivatePlugin;
		const arg = pluginStatus?.isInstalled ? pluginPath : pluginSlug;
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
		} );
	}, [
		pluginStatus?.isInstalled,
		pluginPath,
		pluginSlug,
		tracksEventName,
		setIsInstalling,
		setIsActivating,
		invalidateResolution,
		tracks,
	] );

	const renderActionButton = () => {
		const getButtonLabel = () => {
			if ( isActivating ) {
				return __( 'Activating…', 'jetpack-forms' );
			}
			if ( isInstalling ) {
				return __( 'Installing…', 'jetpack-forms' );
			}
			return pluginStatus?.isInstalled ? activateText : installText;
		};

		if ( isInstalling || isActivating ) {
			return (
				<Button
					variant="secondary"
					icon={ <Icon className="jetpack-plugin-integration__spinner-icon" icon="update" /> }
					disabled
					aria-label={ getButtonLabel() }
				>
					{ getButtonLabel() }
				</Button>
			);
		}

		return (
			<Button variant="secondary" onClick={ handleButtonClick }>
				{ getButtonLabel() }
			</Button>
		);
	};

	const renderContent = () => {
		// Loading State
		if ( isLoading ) {
			return (
				<div className="jetpack-plugin-integration__status">
					<div>
						<Spinner />
						<span>{ __( 'Checking plugin status…', 'jetpack-forms' ) }</span>
					</div>
				</div>
			);
		}

		// Error State
		if ( ! pluginStatus || typeof pluginStatus.isInstalled === 'undefined' ) {
			return (
				<div className="jetpack-plugin-integration__status">
					<Icon icon="warning" />
					<span>
						{ __( 'Unable to determine plugin status. Please refresh the page.', 'jetpack-forms' ) }
					</span>
				</div>
			);
		}

		// Not Installed State
		if ( ! pluginStatus.isInstalled ) {
			return (
				<div className="jetpack-contact-form__integration-panel">
					<div className="jetpack-contact-form__integration-panel-content">
						<div>{ description }</div>
						{ renderActionButton() }
					</div>
				</div>
			);
		}

		// Installed but Not Active State
		if ( ! pluginStatus.isActive ) {
			return (
				<div className="jetpack-contact-form__integration-panel">
					<div className="jetpack-contact-form__integration-panel-content">
						<div>
							{ __(
								"You already have the plugin installed, but it's not activated.",
								'jetpack-forms'
							) }
						</div>
						{ renderActionButton() }
					</div>
				</div>
			);
		}

		// Active State - Final state when all checks pass
		return children;
	};

	return (
		<PanelBody title={ title } initialOpen={ initialOpen }>
			<div className="jetpack-plugin-integration__content" aria-live="polite">
				{ renderContent() }
			</div>
		</PanelBody>
	);
};

export default PluginIntegrationPanel;
