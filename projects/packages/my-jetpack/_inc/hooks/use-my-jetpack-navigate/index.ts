import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MyJetpackRoutes } from '../../constants';
import type { NavigateOptions } from 'react-router-dom';

const useMyJetpackNavigate = (
	route: ( typeof MyJetpackRoutes )[ keyof typeof MyJetpackRoutes ]
) => {
	const navigate = useNavigate();
	return useCallback(
		( options?: NavigateOptions ) => navigate( route, options ),
		[ navigate, route ]
	);
};

export default useMyJetpackNavigate;
