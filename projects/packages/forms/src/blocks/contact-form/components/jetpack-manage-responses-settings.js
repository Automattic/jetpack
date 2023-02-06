import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import React from 'react';
import InspectorHint from '../components/inspector-hint';

const RESPONSES_PATH = `${ get( getJetpackData(), 'adminUrl', false ) }edit.php?post_type=feedback`;

const JetpackManageResponsesSettings = ( {
	formTitle = '',
	isChildBlock = false,
	setAttributes,
} ) => {
	return (
		<>
			<InspectorHint>
				{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack-forms' ) }
			</InspectorHint>
			<Button variant="secondary" href={ RESPONSES_PATH } target="_blank">
				{ __( 'View Form Responses', 'jetpack-forms' ) }
				<span className="screen-reader-text">
					{ __( '(opens in a new tab)', 'jetpack-forms' ) }
				</span>
			</Button>
			{ /* Temporarily hiding the Form Title */ }
			{ false && ! isChildBlock && (
				<TextControl
					label={ __( 'Title of the Form', 'jetpack-forms' ) }
					value={ formTitle }
					onChange={ value => setAttributes( { formTitle: value } ) }
					help={ __( 'Optional - not visible to viewers', 'jetpack-forms' ) }
				/>
			) }
		</>
	);
};

export default JetpackManageResponsesSettings;
