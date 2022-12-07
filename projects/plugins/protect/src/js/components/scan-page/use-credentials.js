import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const useCredentials = () => {
	const { checkCredentials } = useDispatch( STORE_ID );
	const credentials = useSelect( select => select( STORE_ID ).getCredentials() );

	useEffect( () => {
		if ( ! credentials ) {
			checkCredentials();
		}
	}, [ checkCredentials, credentials ] );
};

export default useCredentials;
