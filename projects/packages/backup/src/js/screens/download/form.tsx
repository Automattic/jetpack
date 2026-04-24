/* eslint-disable jsdoc/require-jsdoc */

import { useMutation } from '@tanstack/react-query';
import {
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import { useState } from 'react';
import { initiateBackupDownload } from '../../data/fetchers';
import type { DownloadConfig } from '../../data/types';
import type { Field } from '@wordpress/dataviews';

// Six data-kind toggles ported verbatim from Calypso's download form
// (same order + descriptions). Default is "include everything" — user
// has to opt out of a kind to exclude it from the archive.
const fields: Field< DownloadConfig >[] = [
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

interface DownloadFormProps {
	rewindId: string;
	onDownloadInitiate: ( downloadId: number ) => void;
	onError: ( message: string ) => void;
}

function DownloadForm( { rewindId, onDownloadInitiate, onError }: DownloadFormProps ) {
	const { mutate, isPending } = useMutation( {
		mutationFn: ( types: DownloadConfig ) => initiateBackupDownload( { rewindId, types } ),
	} );

	const [ formData, setFormData ] = useState< DownloadConfig >( {
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

	const handleFormChange = useCallback( ( changes: Partial< DownloadConfig > ) => {
		setFormData( data => ( { ...data, ...changes } ) );
	}, [] );

	const handleSubmit = useCallback(
		( e: React.FormEvent ) => {
			e.preventDefault();
			mutate( formData, {
				onSuccess: downloadId => onDownloadInitiate( downloadId ),
				onError: () =>
					onError( __( 'Failed to initiate download. Please try again.', 'jetpack-backup-pkg' ) ),
			} );
		},
		[ formData, mutate, onDownloadInitiate, onError ]
	);

	const isFormValid = Object.values( formData ).some( value => value );

	return (
		<form onSubmit={ handleSubmit }>
			<VStack spacing={ 4 }>
				<p>
					{ __( 'Choose the items you wish to include in the download:', 'jetpack-backup-pkg' ) }
				</p>
				<DataForm< DownloadConfig >
					data={ formData }
					fields={ fields }
					form={ form }
					onChange={ handleFormChange }
				/>
				<div>
					<Button
						variant="primary"
						icon={ download }
						type="submit"
						isBusy={ isPending }
						disabled={ ! isFormValid || isPending }
					>
						{ __( 'Generate download', 'jetpack-backup-pkg' ) }
					</Button>
				</div>
			</VStack>
		</form>
	);
}

export default DownloadForm;
