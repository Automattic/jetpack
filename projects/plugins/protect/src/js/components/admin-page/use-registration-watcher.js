import { useConnection } from '@automattic/jetpack-connection';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const useRegistrationWatcher = () => {
	const { isRegistered } = useConnection();
	const { refreshStatus } = useDispatch( STORE_ID );
	const status = useSelect( select => select( STORE_ID ).getStatus() );

	useEffect( () => {
		if ( isRegistered && ! status.status ) {
			refreshStatus();
		}
		// We don't want to run the effect if status changes. Only on changes on isRegistered.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isRegistered ] );
};

export default useRegistrationWatcher;
