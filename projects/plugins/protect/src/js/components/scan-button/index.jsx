import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { forwardRef } from 'react';
import useStartScanMutator from '../../data/scan/use-start-scan-mutation';

const ScanButton = forwardRef( ( { variant = 'secondary', children, ...props }, ref ) => {
	const startScanMutation = useStartScanMutator();

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			startScanMutation.mutate();
		};
	};

	return (
		<Button ref={ ref } variant={ variant } onClick={ handleScanClick() } { ...props }>
			{ children ?? __( 'Scan now', 'jetpack-protect' ) }
		</Button>
	);
} );

export default ScanButton;
