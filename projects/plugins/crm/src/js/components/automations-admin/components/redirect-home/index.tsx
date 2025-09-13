import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { FC } from 'react';

export const RedirectHome: FC = () => {
	const navigate = useNavigate();

	useEffect( () => {
		navigate( '/automations' );
	} );

	return null;
};
