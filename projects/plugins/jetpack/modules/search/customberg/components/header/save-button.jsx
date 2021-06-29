/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useEntityRecordState from '../../hooks/use-entity-record-state';

/**
 * Component for saving pending entity record changes.
 *
 * @returns {React.Element} component instance
 */
export default function SaveButton() {
	const { isSaving, hasUnsavedEdits, saveRecords } = useEntityRecordState();

	return (
		<Button
			aria-disabled={ isSaving }
			disabled={ ! hasUnsavedEdits }
			isBusy={ isSaving }
			isPrimary
			onClick={ isSaving ? undefined : saveRecords }
		>
			{ isSaving ? __( 'Saving…', 'jetpack' ) : __( 'Save', 'jetpack' ) }
		</Button>
	);
}
