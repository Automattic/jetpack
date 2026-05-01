/* eslint-disable jsdoc/require-jsdoc */

import { useMutation } from '@tanstack/react-query';
import {
	Button,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { rotateLeft } from '@wordpress/icons';
import { initiateBackupRestore } from '../../data/fetchers';
import type { RestoreConfig } from '../../data/types';
import type { Field } from '@wordpress/dataviews';

// Same six data-kind toggles as the Download form. Default is "include
// everything" so the user has to opt out to skip a kind.
const fields: Field< RestoreConfig >[] = [
	{
		id: 'themes',
		label: __( 'WordPress themes', 'jetpack-backup-pkg' ),
		Edit: 'checkbox',
	},
	{
		id: 'plugins',
		label: __( 'WordPress plugins', 'jetpack-backup-pkg' ),
		Edit: 'checkbox',
	},
	{
		id: 'roots',
		label: __( 'WordPress root', 'jetpack-backup-pkg' ),
		description: __( 'Includes wp-config.php and any non WordPress files.', 'jetpack-backup-pkg' ),
		Edit: 'checkbox',
	},
	{
		id: 'contents',
		label: __( 'WP-content directory', 'jetpack-backup-pkg' ),
		description: __( 'Excludes themes, plugins, and uploads.', 'jetpack-backup-pkg' ),
		Edit: 'checkbox',
	},
	{
		id: 'sqls',
		label: __( 'Site database', 'jetpack-backup-pkg' ),
		description: __( 'Includes pages, and posts.', 'jetpack-backup-pkg' ),
		Edit: 'checkbox',
	},
	{
		id: 'uploads',
		label: __( 'Media uploads', 'jetpack-backup-pkg' ),
		description: __(
			'You must also select Site database for restored media uploads to appear.',
			'jetpack-backup-pkg'
		),
		Edit: 'checkbox',
	},
];

interface RestoreFormProps {
	rewindId: string;
	onRestoreInitiate: ( restoreId: number ) => void;
	onError: ( message: string ) => void;
}

function RestoreForm( { rewindId, onRestoreInitiate, onError }: RestoreFormProps ) {
	const { mutate, isPending } = useMutation( {
		mutationFn: ( types: RestoreConfig ) => initiateBackupRestore( { rewindId, types } ),
	} );

	const [ formData, setFormData ] = useState< RestoreConfig >( {
		themes: true,
		plugins: true,
		roots: true,
		contents: true,
		sqls: true,
		uploads: true,
	} );

	const form = {
		type: 'regular' as const,
		fields: [ 'themes', 'plugins', 'roots', 'contents', 'sqls', 'uploads' ],
	};

	const handleFormChange = useCallback( ( changes: Partial< RestoreConfig > ) => {
		setFormData( data => ( { ...data, ...changes } ) );
	}, [] );

	const handleSubmit = useCallback(
		( e: React.FormEvent ) => {
			e.preventDefault();
			mutate( formData, {
				onSuccess: restoreId => onRestoreInitiate( restoreId ),
				onError: () =>
					onError( __( 'Failed to start the restore. Please try again.', 'jetpack-backup-pkg' ) ),
			} );
		},
		[ formData, mutate, onRestoreInitiate, onError ]
	);

	const isFormValid = Object.values( formData ).some( value => value );

	return (
		<form onSubmit={ handleSubmit }>
			<VStack spacing={ 4 }>
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Restoring will overwrite the matching parts of your live site with the contents of this backup. This cannot be undone.',
						'jetpack-backup-pkg'
					) }
				</Notice>
				<p>{ __( 'Choose the items you wish to restore:', 'jetpack-backup-pkg' ) }</p>
				<DataForm< RestoreConfig >
					data={ formData }
					fields={ fields }
					form={ form }
					onChange={ handleFormChange }
				/>
				<div>
					<Button
						variant="primary"
						icon={ rotateLeft }
						type="submit"
						isBusy={ isPending }
						disabled={ ! isFormValid || isPending }
					>
						{ __( 'Confirm restore', 'jetpack-backup-pkg' ) }
					</Button>
				</div>
			</VStack>
		</form>
	);
}

export default RestoreForm;
