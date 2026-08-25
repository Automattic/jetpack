import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { LinkButton } from '@wordpress/ui';
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
				<LinkButton variant="outline" href={ responsesHref }>
					{ __( 'View form responses', 'jetpack-forms' ) }
				</LinkButton>
			) }
		</>
	);
};

export default JetpackManageResponsesSettings;
