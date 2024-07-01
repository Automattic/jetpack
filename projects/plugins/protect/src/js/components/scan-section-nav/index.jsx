import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ButtonGroup from '../button-group';

/**
 * Navigation for scan sections.
 *
 * @returns {React.Element} The React Component.
 */
export default function ScanSectionNav() {
	const navigate = useNavigate();
	const location = useLocation();

	const navigateToScanPage = useCallback( () => navigate( '/scan' ), [ navigate ] );
	const navigateToHistoryPage = useCallback( () => navigate( '/scan/history' ), [ navigate ] );

	return (
		<ButtonGroup>
			<Button
				variant="secondary"
				onClick={ navigateToScanPage }
				disabled={ location.pathname === '/scan' }
			>
				{ __( 'Scanner', 'jetpack-protect' ) }
			</Button>
			<Button
				variant="secondary"
				onClick={ navigateToHistoryPage }
				disabled={ location.pathname.includes( 'scan/history' ) }
			>
				{ __( 'History', 'jetpack-protect' ) }
			</Button>
		</ButtonGroup>
	);
}
