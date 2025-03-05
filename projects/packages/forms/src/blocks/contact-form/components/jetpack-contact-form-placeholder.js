import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '..';

export const ContactFormPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const enableModule = () => {
		return changeStatus( true );
	};

	return (
		<Placeholder
			icon={ settings.icon.src }
			instructions={ __(
				'You’ll need to activate the Forms feature to use this block.',
				'jetpack-forms'
			) }
			label={ settings.title }
		>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ enableModule }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Forms', 'jetpack-forms' )
					: __( 'Activate Forms', 'jetpack-forms', 0 ) }
			</Button>
		</Placeholder>
	);
};
