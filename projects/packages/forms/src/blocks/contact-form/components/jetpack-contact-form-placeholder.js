import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '..';

export const ContactFormPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const enableModule = () => {
		return changeStatus( true );
	};

	return (
		<Placeholder
			icon={ settings.icon }
			instructions={ __(
				'You’ll need to activate the Contact Form feature to use this block.',
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
					? __( 'Activating Contact Form', 'jetpack-forms' )
					: __( 'Activate Contact Form', 'jetpack-forms', 0 ) }
			</Button>
		</Placeholder>
	);
};
