import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ButtonLink } from '@wordpress/ui';
import { getResponsesUrl } from '../../../form-editor/plugins/utils.ts';
import { FULL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';

const JetpackManageResponsesSettings = ( { attributes, setAttributes } ) => {
	const { saveResponses = true, ref } = attributes;

	const responsesHref = ref ? getResponsesUrl( ref ) : FULL_RESPONSES_PATH;

	return (
		<>
			<ToggleControl
				label={ __( 'Save responses', 'jetpack-forms' ) }
				checked={ saveResponses }
				onChange={ value => setAttributes( { saveResponses: value } ) }
				__nextHasNoMarginBottom={ true }
			/>
			{ saveResponses && (
				<ButtonLink
					className="jetpack-contact-form__view-responses-button"
					variant="outline"
					href={ responsesHref }
				>
					{ __( 'View form responses', 'jetpack-forms' ) }
				</ButtonLink>
			) }
		</>
	);
};

export default JetpackManageResponsesSettings;
