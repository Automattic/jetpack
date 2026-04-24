/* eslint-disable jsdoc/require-jsdoc */

import { Button, Notice } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { download } from '@wordpress/icons';

interface DownloadSuccessProps {
	downloadPointDate: string;
	downloadUrl: string;
	fileSizeBytes?: string;
}

function DownloadSuccess( {
	downloadPointDate,
	downloadUrl,
	fileSizeBytes,
}: DownloadSuccessProps ) {
	const handleDownloadClick = useCallback( () => {
		window.open( downloadUrl, '_blank' );
	}, [ downloadUrl ] );

	const label =
		__( 'Download file', 'jetpack-backup-pkg' ) + ( fileSizeBytes ? ` (${ fileSizeBytes })` : '' );

	return (
		<Notice status="success" isDismissible={ false }>
			<p>
				<strong>{ __( 'Backup download file is ready', 'jetpack-backup-pkg' ) }</strong>
			</p>
			<p>
				{ sprintf(
					/* translators: %s is the date of the download point */
					__( 'We’ve prepared your backup from %s.', 'jetpack-backup-pkg' ),
					downloadPointDate
				) }
			</p>
			<p>
				<Button variant="primary" icon={ download } onClick={ handleDownloadClick }>
					{ label }
				</Button>
			</p>
		</Notice>
	);
}

export default DownloadSuccess;
