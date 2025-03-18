import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PluginActionButton = ( {
	isInstalling,
	isActivating,
	isInstalled,
	installText,
	activateText,
	onClick,
} ) => {
	const isLoading = isInstalling || isActivating;

	return (
		<Button
			variant="secondary"
			onClick={ isLoading ? undefined : onClick }
			disabled={ isLoading }
			icon={
				isLoading ? (
					<Icon className="jetpack-plugin-integration__spinner-icon" icon="update" />
				) : undefined
			}
			aria-label={
				( isActivating && __( 'Activating…', 'jetpack-forms' ) ) ||
				( isInstalling && __( 'Installing…', 'jetpack-forms' ) ) ||
				( isInstalled ? activateText : installText )
			}
		>
			{ ( isActivating && __( 'Activating…', 'jetpack-forms' ) ) ||
				( isInstalling && __( 'Installing…', 'jetpack-forms' ) ) ||
				( isInstalled ? activateText : installText ) }
		</Button>
	);
};

export default PluginActionButton;
