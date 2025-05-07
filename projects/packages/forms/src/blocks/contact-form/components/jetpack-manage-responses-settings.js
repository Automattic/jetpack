import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FULL_RESPONSES_PATH } from '../../../util/get-preferred-responses-view';
import InspectorHint from '../components/inspector-hint';

const JetpackManageResponsesSettings = () => {
	return (
		<>
			<InspectorHint>
				{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack-forms' ) }
			</InspectorHint>
			<Button variant="secondary" href={ FULL_RESPONSES_PATH } __next40pxDefaultSize={ true }>
				{ __( 'View Form Responses', 'jetpack-forms' ) }
				<span className="screen-reader-text">
					{ __( '(opens in a new tab)', 'jetpack-forms' ) }
				</span>
			</Button>
		</>
	);
};

export default JetpackManageResponsesSettings;
