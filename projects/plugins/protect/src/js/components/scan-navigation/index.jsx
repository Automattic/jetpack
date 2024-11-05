import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import usePlan from '../../hooks/use-plan';
import ButtonGroup from '../button-group';

/**
 * Navigation for scan sections.
 *
 * @return {React.Element} The React Component.
 */
export default function ScanNavigation() {
	const navigate = useNavigate();
	const location = useLocation();
	const { hasPlan } = usePlan();

	const viewingScanPage = location.pathname === '/scan';
	const viewingHistoryPage = location.pathname.includes( '/scan/history' );
	const navigateToScanPage = useCallback( () => navigate( '/scan' ), [ navigate ] );
	const navigateToHistoryPage = useCallback( () => navigate( '/scan/history' ), [ navigate ] );

	if ( ! hasPlan || ( ! viewingScanPage && ! viewingHistoryPage ) ) {
		return null;
	}

	return (
		<>
			<ButtonGroup>
				<ButtonGroup.Button
					variant={ viewingScanPage ? 'primary' : 'secondary' }
					onClick={ navigateToScanPage }
				>
					{ __( 'Scanner', 'jetpack-protect' ) }
				</ButtonGroup.Button>
				<ButtonGroup.Button
					variant={ viewingHistoryPage ? 'primary' : 'secondary' }
					onClick={ navigateToHistoryPage }
				>
					{ __( 'History', 'jetpack-protect' ) }
				</ButtonGroup.Button>
			</ButtonGroup>
		</>
	);
}
