/* eslint-disable jsdoc/require-jsdoc */

import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface DownloadErrorProps {
	onRetry: () => void;
}

function DownloadError( { onRetry }: DownloadErrorProps ) {
	return (
		<Notice status="error" isDismissible={ false }>
			<p>
				<strong>{ __( 'Download failed', 'jetpack-backup-pkg' ) }</strong>
			</p>
			<p>
				{ __( 'An error occurred while preparing your backup download.', 'jetpack-backup-pkg' ) }
			</p>
			<p>
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack-backup-pkg' ) }
				</Button>
			</p>
		</Notice>
	);
}

export default DownloadError;
