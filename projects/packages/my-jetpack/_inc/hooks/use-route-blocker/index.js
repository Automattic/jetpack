import { useEffect } from 'react';
import { useNavigationType, NavigationType } from 'react-router-dom';
import { MyJetpackRoutes } from '../../constants';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

export default () => {
	const navigateHome = useMyJetpackNavigate( MyJetpackRoutes.Home );
	const type = useNavigationType();

	useEffect( () => {
		if ( type === NavigationType.Pop ) {
			navigateHome( { replace: true } );
		}
	}, [ type, navigateHome ] );
};
