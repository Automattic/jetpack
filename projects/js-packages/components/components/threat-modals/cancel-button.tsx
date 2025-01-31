import { ThreatsContext } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext } from 'react';
import { Button } from '@automattic/jetpack-components';

/**
 * Cancel Button
 *
 * @return {JSX.Element} CancelButton Component.
 */
export default function CancelButton(): JSX.Element {
	const { setActionToConfirm } = useContext( ThreatsContext );

	const onCancelClick = useCallback( () => {
		setActionToConfirm( undefined );
	}, [ setActionToConfirm ] );

	return (
		<Button variant="tertiary" onClick={ onCancelClick }>
			{ __( 'Cancel', 'jetpack-components' ) }
		</Button>
	);
}
