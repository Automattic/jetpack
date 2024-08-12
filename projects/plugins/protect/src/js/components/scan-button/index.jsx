import { Button } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { forwardRef } from 'react';
import { STORE_ID } from '../../state/store';

const ScanButton = forwardRef( ( { variant = 'secondary', children, ...props }, ref ) => {
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
			ref={ ref }
			variant={ variant }
			isLoading={ scanIsEnqueuing }
			onClick={ handleScanClick() }
			{ ...props }
		>
			{ children ?? __( 'Scan now', 'jetpack-protect' ) }
		</Button>
	);
} );

export default ScanButton;
