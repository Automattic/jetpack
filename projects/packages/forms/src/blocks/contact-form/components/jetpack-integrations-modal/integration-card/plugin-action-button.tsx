/**
 * External dependencies
 */
import { Button, Spinner, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { config as dashboardConfig } from '../../../../../dashboard';
import { usePluginInstallation } from '../hooks/use-plugin-installation';
import type { JPFormsBlocksDefaults } from '../../../../../types';

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

	// Permissions checks. We need to check both the editor-provided jpFormsBlocks
	// and the dashboard config since this component loads in both places.
	// In a future PR, we should consolidate this to a single source of truth.
	const jpDefaults: JPFormsBlocksDefaults | undefined = window.jpFormsBlocks?.defaults;
	const canUserInstallPlugins =
		Boolean( jpDefaults?.canInstallPlugins ) || Boolean( dashboardConfig( 'canInstallPlugins' ) );
	const canUserActivatePlugins =
		Boolean( jpDefaults?.canActivatePlugins ) || Boolean( dashboardConfig( 'canActivatePlugins' ) );

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
