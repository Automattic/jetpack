import { Button, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getResponsesUrl } from '../../../form-editor/plugins/utils.ts';
import { FULL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';

const JetpackManageResponsesSettings = ( { attributes, setAttributes } ) => {
	const { saveResponses = true, ref } = attributes;

	const responsesHref = ref ? getResponsesUrl( ref ) : FULL_RESPONSES_PATH;

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
				<Button variant="secondary" href={ responsesHref } __next40pxDefaultSize={ true }>
					{ __( 'View form responses', 'jetpack-forms' ) }
				</Button>
			) }
		</>
	);
};

export default JetpackManageResponsesSettings;
