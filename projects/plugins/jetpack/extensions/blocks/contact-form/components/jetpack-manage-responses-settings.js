import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import React from 'react';
import InspectorHint from '../../../shared/components/inspector-hint';

const RESPONSES_PATH = `${ get( getJetpackData(), 'adminUrl', false ) }edit.php?post_type=feedback`;

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
				<span className="screen-reader-text">{ __( '(opens in a new tab)', 'jetpack' ) }</span>
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
