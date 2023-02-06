import { useEffect } from 'react';
import { useNavigationType, useNavigate } from 'react-router-dom';

export default () => {
	const type = useNavigationType();
	const navigate = useNavigate();

	useEffect( () => {
		if ( type === 'POP' ) {
			navigate( '/', { replace: true } );
		}
	}, [ type, navigate ] );
};
