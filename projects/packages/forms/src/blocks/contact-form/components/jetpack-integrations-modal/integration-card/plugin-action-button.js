import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePluginInstallation } from '../hooks/usePluginInstallation';

const PluginActionButton = ( { slug, pluginFile, isInstalled, refreshStatus, trackEventName } ) => {
	const { isInstalling, installPlugin } = usePluginInstallation(
		slug,
		pluginFile,
		isInstalled,
		trackEventName
	);

	const handleAction = async event => {
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

	return (
		<Button
			variant="primary"
			onClick={ handleAction }
			disabled={ isInstalling }
			icon={ isInstalling ? <Spinner /> : undefined }
		>
			{ getButtonText() }
		</Button>
	);
};

export default PluginActionButton;
