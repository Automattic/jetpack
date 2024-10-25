import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { forwardRef, useMemo } from 'react';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useStartScanMutator from '../../data/scan/use-start-scan-mutation';

const ScanButton = forwardRef( ( { variant = 'secondary', children, ...props }, ref ) => {
	const startScanMutation = useStartScanMutator();
	const { data: status } = useScanStatusQuery();

	const disabled = useMemo( () => {
		return startScanMutation.isPending || isScanInProgress( status );
	}, [ startScanMutation.isPending, status ] );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			startScanMutation.mutate();
		};
	};

	return (
		<Button
			ref={ ref }
			variant={ variant }
			onClick={ handleScanClick() }
			disabled={ disabled }
			{ ...props }
		>
			{ children ?? __( 'Scan now', 'jetpack-protect' ) }
		</Button>
	);
} );

export default ScanButton;
