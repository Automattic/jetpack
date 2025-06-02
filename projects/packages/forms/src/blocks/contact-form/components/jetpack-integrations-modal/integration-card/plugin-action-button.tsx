/**
 * External dependencies
 */
import { Button, Spinner, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
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

	const handleAction = async ( event: MouseEvent ) => {
		event.stopPropagation();
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

	return (
		<Tooltip text={ isInstalled ? tooltipTextActivate : tooltipTextInstall }>
			<Button
				variant="primary"
				onClick={ handleAction }
				disabled={ isInstalling }
				icon={ isInstalling ? <Spinner /> : undefined }
				__next40pxDefaultSize
			>
				{ getButtonText() }
			</Button>
		</Tooltip>
	);
};

export default PluginActionButton;
