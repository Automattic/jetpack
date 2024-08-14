import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ButtonGroup from '../../components/button-group';

/**
 * Navigation for scan sections.
 *
 * @returns {React.Element} The React Component.
 */
export default function ScanSectionNavigation() {
	const navigate = useNavigate();
	const location = useLocation();

	const navigateToScanPage = useCallback( () => navigate( '/scan' ), [ navigate ] );
	const navigateToHistoryPage = useCallback( () => navigate( '/scan/history' ), [ navigate ] );

	return (
		<div>
			<ButtonGroup>
				<ButtonGroup.Button
					variant={ location.pathname === '/scan' ? 'primary' : 'secondary' }
					onClick={ navigateToScanPage }
				>
					{ __( 'Scanner', 'jetpack-protect' ) }
				</ButtonGroup.Button>
				<ButtonGroup.Button
					variant={ location.pathname.includes( '/scan/history' ) ? 'primary' : 'secondary' }
					onClick={ navigateToHistoryPage }
				>
					{ __( 'History', 'jetpack-protect' ) }
				</ButtonGroup.Button>
			</ButtonGroup>
		</div>
	);
}
