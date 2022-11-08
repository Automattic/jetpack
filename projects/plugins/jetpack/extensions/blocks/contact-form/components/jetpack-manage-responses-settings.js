import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import InspectorHint from '../../../shared/components/inspector-hint';

const RESPONSES_PATH = '/wp-admin/edit.php?post_type=feedback';

const JetpackManageResponsesSettings = ( {
	formTitle = '',
	isChildBlock = false,
	setAttributes,
} ) => {
	return (
		<>
			<InspectorHint>
				{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack' ) }
			</InspectorHint>
			<Button
				variant="secondary"
				href={ RESPONSES_PATH }
				target="_blank"
				style={ { marginBottom: isChildBlock ? '12px' : '24px' } }
			>
				{ __( 'View Form Responses', 'jetpack' ) }
			</Button>
			{ ! isChildBlock && (
				<TextControl
					label={ __( 'Title of the Form', 'jetpack' ) }
					value={ formTitle }
					onChange={ value => setAttributes( { formTitle: value } ) }
					help={ __( 'Optional - not visible to viewers', 'jetpack' ) }
				/>
			) }
		</>
	);
};

export default JetpackManageResponsesSettings;
