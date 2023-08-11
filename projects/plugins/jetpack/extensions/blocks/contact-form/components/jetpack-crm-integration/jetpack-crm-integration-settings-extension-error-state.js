import { Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ExtensionActivationErrorState = ( { error } ) => {
	return (
		<Notice isDismissible={ false } status="error">
			{ createInterpolateElement(
				__(
					'The CRM Jetpack Form extension failed to activate. The error message was "<error />".',
					'jetpack'
				),
				{
					error: <span>{ error }</span>,
				}
			) }
		</Notice>
	);
};

export default ExtensionActivationErrorState;
