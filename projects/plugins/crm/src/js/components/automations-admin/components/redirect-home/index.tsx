import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const RedirectHome: React.FC = () => {
	const navigate = useNavigate();

	useEffect( () => {
		navigate( '/automations' );
	} );

	return null;
};
