import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePluginInstallation } from '../hooks';

const PluginActionButton = ( { pluginSlug, pluginFile, isInstalled, onComplete, trackingId } ) => {
	const { isInstalling, installPlugin } = usePluginInstallation(
		pluginSlug,
		pluginFile,
		isInstalled,
		trackingId
	);

	const handleAction = async event => {
		// Always stop propagation since this button is used in clickable card headers
		event.stopPropagation();

		const success = await installPlugin();
		if ( success && onComplete ) {
			onComplete();
		}
	};

	const handleKeyDown = event => {
		// Always stop propagation for keyboard events too
		event.stopPropagation();
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
			onKeyDown={ handleKeyDown }
			disabled={ isInstalling }
			icon={ isInstalling ? <Icon icon="update" className="is-spinning" /> : undefined }
			__next40pxDefaultSize={ true }
		>
			{ getButtonText() }
		</Button>
	);
};

export default PluginActionButton;
