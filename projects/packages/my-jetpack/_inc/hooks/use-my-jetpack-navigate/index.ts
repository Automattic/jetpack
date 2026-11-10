import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { MyJetpackRoutes } from '../../constants';
import type { ConnectionScreenRoute } from '../../utils/connect-url';
import type { NavigateOptions } from 'react-router';

const useMyJetpackNavigate = (
	route: ( typeof MyJetpackRoutes )[ keyof typeof MyJetpackRoutes ] | ConnectionScreenRoute
) => {
	const navigate = useNavigate();
	return useCallback(
		( options?: NavigateOptions ) => navigate( route, options ),
		[ navigate, route ]
	);
};

export default useMyJetpackNavigate;
