import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePluginInstallation } from '../hooks';

const PluginActionButton = ( {
	pluginSlug,
	pluginFile,
	isInstalled,
	refreshStatus,
	trackEventName,
} ) => {
	const { isInstalling, installPlugin } = usePluginInstallation(
		pluginSlug,
		pluginFile,
		isInstalled,
		trackEventName
	);

	const handleAction = async () => {
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

	return (
		<Button
			variant="primary"
			onClick={ handleAction }
			disabled={ isInstalling }
			icon={ isInstalling ? <Icon icon="update" className="is-spinning" /> : undefined }
			__next40pxDefaultSize={ true }
		>
			{ getButtonText() }
		</Button>
	);
};

export default PluginActionButton;
