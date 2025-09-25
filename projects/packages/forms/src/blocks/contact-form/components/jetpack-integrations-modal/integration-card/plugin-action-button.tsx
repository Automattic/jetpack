/**
 * External dependencies
 */
import { Button, Spinner, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useFormsConfig from '../../../../../hooks/use-forms-config';
import { usePluginInstallation } from '../hooks/use-plugin-installation';

type PluginActionButtonProps = {
	slug: string;
	pluginFile: string;
	isInstalled: boolean;
	refreshStatus: () => void;
	trackEventName: string;
};

const PluginActionButton = ( {
	slug,
	pluginFile,
	isInstalled,
	refreshStatus,
	trackEventName,
}: PluginActionButtonProps ) => {
	const { isInstalling, installPlugin } = usePluginInstallation(
		slug,
		pluginFile,
		isInstalled,
		trackEventName
	);

	// Permissions from consolidated Forms config (shared across editor and dashboard)
	const config = useFormsConfig();
	const canUserInstallPlugins = Boolean( config?.canInstallPlugins );
	const canUserActivatePlugins = Boolean( config?.canActivatePlugins );

	const canPerformAction = isInstalled ? canUserActivatePlugins : canUserInstallPlugins;
	const isDisabled = isInstalling || ! canPerformAction;

	const handleAction = async ( event: MouseEvent ) => {
		event.stopPropagation();
		if ( isDisabled ) {
			return;
		}
		const success = await installPlugin();

		if ( success && refreshStatus ) {
			refreshStatus();
		}
	};

	const getButtonText = () => {
		return (
			( isInstalling && isInstalled && __( 'Activating…', 'jetpack-forms' ) ) ||
			( isInstalling && __( 'Installing…', 'jetpack-forms' ) ) ||
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
		if ( isInstalled && ! canUserActivatePlugins ) {
			return tooltipTextNoActivatePerms;
		}
		if ( ! isInstalled && ! canUserInstallPlugins ) {
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
					icon={ isInstalling ? <Spinner /> : undefined }
					__next40pxDefaultSize
				>
					{ getButtonText() }
				</Button>
			</span>
		</Tooltip>
	);
};

export default PluginActionButton;
