import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { settings } from '..';

export const ContactFormPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const { tracks } = useAnalytics();

	const enableModule = () => {
		return changeStatus( true );
	};

	return (
		<Placeholder
			icon={ settings.icon }
			instructions={ __(
				"You'll need to activate the Contact Form plugin to use this block.",
				'jetpack'
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
					? __( 'Activating Contact Form', 'jetpack' )
					: __( 'Activate Contact Form', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
			</Button>
		</Placeholder>
	);
};
