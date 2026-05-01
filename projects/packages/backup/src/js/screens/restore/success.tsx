/* eslint-disable jsdoc/require-jsdoc */

import {
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

interface RestoreSuccessProps {
	restorePointDate: string;
}

function RestoreSuccess( { restorePointDate }: RestoreSuccessProps ) {
	return (
		<VStack spacing={ 4 }>
			<Notice status="success" isDismissible={ false }>
				{ __( 'Your site was restored.', 'jetpack-backup-pkg' ) }
			</Notice>
			{ restorePointDate && (
				<p>
					{ sprintf(
						/* translators: %s is the date of the restore point. */
						__( 'Restore point: %s', 'jetpack-backup-pkg' ),
						restorePointDate
					) }
				</p>
			) }
		</VStack>
	);
}

export default RestoreSuccess;
