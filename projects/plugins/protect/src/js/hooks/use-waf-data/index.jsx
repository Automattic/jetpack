import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const useWafData = () => {
	const { setWaf } = useDispatch( STORE_ID );
	const { waf, wafIsFetching } = useSelect( select => ( {
		waf: select( STORE_ID ).getWaf(),
		wafIsFetching: select( STORE_ID ).getWafIsFetching(),
	} ) );

	useEffect( () => {
		if ( waf === undefined && ! wafIsFetching ) {
			apiFetch( {
				path: 'jetpack-protect/v1/waf',
				method: 'GET',
			} ).then( response => {
				setWaf( response );
			} );
		}
	}, [ setWaf, waf, wafIsFetching ] );

	return {
		waf,
		wafIsFetching,
	};
};

export default useWafData;
