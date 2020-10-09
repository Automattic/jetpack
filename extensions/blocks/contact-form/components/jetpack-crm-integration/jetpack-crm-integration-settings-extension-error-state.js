/**
 * External dependencies
 */
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { jetpackCreateInterpolateElement } from '../../../../shared/create-interpolate-element';

const ExtensionActivationErrorState = ( { error } ) => {
	return (
		<Notice isDismissible={ false } status="error">
			{ jetpackCreateInterpolateElement(
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
