import { Button, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FULL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view';
import InspectorHint from './inspector-hint';

const JetpackManageResponsesSettings = ( { attributes, setAttributes } ) => {
	const { saveResponses = 'yes' } = attributes;

	return (
		<>
			<ToggleControl
				label={ __( 'Save responses', 'jetpack-forms' ) }
				help={ __(
					'Store form submissions in your WordPress admin for review and export.',
					'jetpack-forms'
				) }
				checked={ saveResponses === 'yes' }
				onChange={ value => setAttributes( { saveResponses: value ? 'yes' : 'no' } ) }
				__nextHasNoMarginBottom={ true }
			/>
			<InspectorHint>
				{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack-forms' ) }
			</InspectorHint>
			<Button variant="secondary" href={ FULL_RESPONSES_PATH } __next40pxDefaultSize={ true }>
				{ __( 'View form responses', 'jetpack-forms' ) }
				<span className="screen-reader-text">
					{ __( '(opens in a new tab)', 'jetpack-forms' ) }
				</span>
			</Button>
		</>
	);
};

export default JetpackManageResponsesSettings;
