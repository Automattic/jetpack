/**
 * External dependencies
 */
import { Button, Spinner, Tooltip } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { usePluginInstallation } from '../../../../../hooks/use-plugin-installation.ts';

type PluginActionButtonProps = {
	slug: string;
	pluginFile: string;
	isInstalled: boolean;
	isActive: boolean;
	refreshStatus: () => void;
	trackEventName: string;
};

const PluginActionButton = ( {
	slug,
	pluginFile,
	isInstalled,
	isActive,
	refreshStatus,
	trackEventName,
}: PluginActionButtonProps ) => {
	const trackEventProps = {
		screen: 'block-editor',
	};

	const { isInstalling, installPlugin, canInstallPlugins, canActivatePlugins } =
		usePluginInstallation( {
			slug,
			pluginPath: pluginFile,
			isInstalled,
			trackEventName,
			trackEventProps,
		} );

	const canPerformAction = isInstalled ? canActivatePlugins : canInstallPlugins;
	const [ isReconcilingStatus, setIsReconcilingStatus ] = useState( false );
	const isDisabled = isInstalling || isReconcilingStatus || ! canPerformAction;

	const handleAction = async ( event: React.MouseEvent< HTMLButtonElement > ) => {
		event.stopPropagation();
		if ( isDisabled ) {
			return;
		}
		const success = await installPlugin();

		if ( success && refreshStatus ) {
			setIsReconcilingStatus( true ); // Keeps button in loading state until integrations refresh.
			refreshStatus();
		}
	};

	useEffect( () => {
		if ( isReconcilingStatus && isActive ) {
			setIsReconcilingStatus( false ); // Removes button loading state when integratoin status is recevied and isActive.
		}
	}, [ isReconcilingStatus, isActive ] );

	const getButtonText = () => {
		return (
			( ( isInstalling || isReconcilingStatus ) &&
				isInstalled &&
				__( 'Activating…', 'jetpack-forms' ) ) ||
			( ( isInstalling || isReconcilingStatus ) && __( 'Installing…', 'jetpack-forms' ) ) ||
			( isInstalled && __( 'Activate', 'jetpack-forms' ) ) ||
			__( 'Install', 'jetpack-forms' )
		);
	};

	const tooltipTextActivate = __( 'Activate this plugin', 'jetpack-forms' );
	const tooltipTextInstall = __( 'Install this plugin', 'jetpack-forms' );
	const tooltipTextNoInstallPerms = __(
		'You do not have permission to install plugins.',
		'jetpack-forms'
	);
	const tooltipTextNoActivatePerms = __(
		'You do not have permission to activate plugins.',
		'jetpack-forms'
	);

	const getTooltipText = (): string => {
		if ( isInstalled && ! canActivatePlugins ) {
			return tooltipTextNoActivatePerms;
		}
		if ( ! isInstalled && ! canInstallPlugins ) {
			return tooltipTextNoInstallPerms;
		}
		return String( isInstalled ? tooltipTextActivate : tooltipTextInstall );
	};

	return (
		<Tooltip text={ getTooltipText() }>
			<span style={ { display: 'inline-flex' } }>
				<Button
					variant="primary"
					onClick={ handleAction }
					disabled={ isDisabled }
					style={ isDisabled ? { pointerEvents: 'none' } : undefined }
					icon={ isInstalling || isReconcilingStatus ? <Spinner /> : undefined }
					__next40pxDefaultSize
				>
					{ getButtonText() }
				</Button>
			</span>
		</Tooltip>
	);
};

export default PluginActionButton;
