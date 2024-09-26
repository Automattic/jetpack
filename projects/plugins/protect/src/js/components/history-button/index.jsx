import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { forwardRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const HistoryButton = forwardRef( ( { variant = 'primary', children, ...props }, ref ) => {
	const navigate = useNavigate();

	const navigateToHistoryPage = useCallback( () => navigate( '/scan/history' ), [ navigate ] );

	return (
		<Button ref={ ref } variant={ variant } onClick={ navigateToHistoryPage } { ...props }>
			{ children ?? __( 'View history', 'jetpack-protect' ) }
		</Button>
	);
} );

export default HistoryButton;
