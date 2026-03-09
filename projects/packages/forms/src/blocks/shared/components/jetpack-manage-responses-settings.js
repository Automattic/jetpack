import { Button, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { FULL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view.js';

const getResponsesHref = ref => {
	const baseUrl = window.jpFormsBlocks?.defaults?.formsResponsesUrl || FULL_RESPONSES_PATH;

	if ( ref ) {
		return addQueryArgs( baseUrl, { p: `/responses/inbox?sourceId=${ ref }` } );
	}

	return baseUrl;
};

const JetpackManageResponsesSettings = ( { attributes, setAttributes } ) => {
	const { saveResponses = true, ref } = attributes;

	const responsesHref = getResponsesHref( ref );

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
