import { Button, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FULL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';

const JetpackManageResponsesSettings = ( { attributes, setAttributes } ) => {
	const { saveResponses = true } = attributes;

	return (
		<>
			<ToggleControl
				label={ __( 'Save responses', 'jetpack-forms' ) }
				help={ __(
					'Keep responses saved, or set up email/integration to avoid losing them.',
					'jetpack-forms'
				) }
				checked={ saveResponses }
				onChange={ value => setAttributes( { saveResponses: value } ) }
				__nextHasNoMarginBottom={ true }
			/>
			{ saveResponses && (
				<Button variant="secondary" href={ FULL_RESPONSES_PATH } __next40pxDefaultSize={ true }>
					{ __( 'View form responses', 'jetpack-forms' ) }
				</Button>
			) }
		</>
	);
};

export default JetpackManageResponsesSettings;
