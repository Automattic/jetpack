import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import camelize from 'camelize';
import { useCallback, useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const useWafData = () => {
	const { setWaf, setWafIsFetching } = useDispatch( STORE_ID );
	const { waf, wafIsFetching } = useSelect( select => ( {
		waf: select( STORE_ID ).getWaf(),
		wafIsFetching: select( STORE_ID ).getWafIsFetching(),
	} ) );

	const fetchWaf = useCallback( () => {
		setWafIsFetching( true );
		apiFetch( {
			path: 'jetpack-protect/v1/waf',
			method: 'GET',
		} )
			.then( response => {
				setWaf( camelize( response.data ) );
			} )
			.catch( () => {
				setWaf( false );
			} );
	}, [ setWaf, setWafIsFetching ] );

	useEffect( () => {
		if ( waf === undefined && ! wafIsFetching ) {
			fetchWaf();
		}
	}, [ fetchWaf, waf, wafIsFetching ] );

	return {
		waf,
		wafIsFetching,
		fetchWaf,
	};
};

export default useWafData;
