import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import styles from './style.module.scss';

/**
 * The pending step of the connection flow, held while the service's connect
 * popup is open.
 *
 * The popup is opened by whichever interaction led here, so this step only
 * reports the wait. Its outcome moves the flow on.
 *
 * @return The authorizing step.
 */
export function Authorizing() {
	return (
		<div className={ styles.pending } role="status">
			<Spinner className={ styles.spinner } />
			<Text variant="body-md" render={ <p className={ styles.message } /> }>
				{ __( 'Connecting account…', 'jetpack-publicize-pkg' ) }
			</Text>
		</div>
	);
}
