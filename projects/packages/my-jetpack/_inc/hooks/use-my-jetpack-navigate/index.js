import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom My Jetpack navigator hook
 *
 * @param {string} route - route to navigate to
 * @returns {Function} - navigate function
 */
export default function useMyJetpackNavigate( route ) {
	const navigate = useNavigate();
	return useCallback( () => navigate( route ), [ navigate, route ] );
}
