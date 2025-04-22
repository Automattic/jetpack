import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import InspectorHint from '../components/inspector-hint';

const preferredView = window?.jpFormsBlocks?.defaults?.preferredView;

const RESPONSES_PATH =
	get( getJetpackData(), 'adminUrl', false ) +
	( preferredView === 'classic' ? 'edit.php?post_type=feedback' : 'admin.php?page=jetpack-forms' );

const JetpackManageResponsesSettings = () => {
	return (
		<>
			<InspectorHint>
				{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack-forms' ) }
			</InspectorHint>
			<Button variant="secondary" href={ RESPONSES_PATH } __next40pxDefaultSize={ true }>
				{ __( 'View Form Responses', 'jetpack-forms' ) }
				<span className="screen-reader-text">
					{ __( '(opens in a new tab)', 'jetpack-forms' ) }
				</span>
			</Button>
		</>
	);
};

export default JetpackManageResponsesSettings;
