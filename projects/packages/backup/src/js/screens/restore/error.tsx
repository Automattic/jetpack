/* eslint-disable jsdoc/require-jsdoc */

import {
	Button,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface RestoreErrorProps {
	reason?: string;
	onRetry: () => void;
}

function RestoreError( { reason, onRetry }: RestoreErrorProps ) {
	return (
		<VStack spacing={ 4 }>
			<Notice status="error" isDismissible={ false }>
				{ reason ?? __( 'The restore did not finish successfully.', 'jetpack-backup-pkg' ) }
			</Notice>
			<div>
				<Button variant="secondary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack-backup-pkg' ) }
				</Button>
			</div>
		</VStack>
	);
}

export default RestoreError;
