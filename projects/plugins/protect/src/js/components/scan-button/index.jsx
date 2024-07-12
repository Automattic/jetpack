import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { STORE_ID } from '../../state/store';

/**
 * Scan Button Component
 *
 * @param {object} props - The component props.
 * @returns {React.ReactElement} Button that triggers a scan on click.
 */
export default function ScanButton( { ...props } ) {
	const { scan } = useDispatch( STORE_ID );
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing(), [] );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

	return (
		<Button
			variant="secondary"
			isLoading={ scanIsEnqueuing }
			onClick={ handleScanClick() }
			{ ...props }
		>
			{ __( 'Scan now', 'jetpack-protect' ) }
		</Button>
	);
}
