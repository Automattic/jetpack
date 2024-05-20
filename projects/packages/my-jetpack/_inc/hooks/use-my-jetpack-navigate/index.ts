import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyJetpackRoutes } from '../../constants';
import type { NavigateOptions } from 'react-router-dom';

/**
 * Custom My Jetpack navigator hook
 *
 * @param {string} route - route to navigate to
 * @returns {Function} - navigate function
 */
export default function useMyJetpackNavigate(
	route: ( typeof MyJetpackRoutes )[ keyof typeof MyJetpackRoutes ]
) {
	const navigate = useNavigate();
	return useCallback(
		( options?: NavigateOptions ) => navigate( route, options ),
		[ navigate, route ]
	);
}
