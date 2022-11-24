import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import camelize from 'camelize';
import { useCallback, useEffect } from 'react';
import { STORE_ID } from '../../state/store';

const useWafData = () => {
	const { setWafConfig, setWafIsEnabled, setWafIsLoading } = useDispatch( STORE_ID );
	const waf = useSelect( select => select( STORE_ID ).getWaf() );

	const fetchWaf = useCallback( () => {
		setWafIsLoading( true );
		apiFetch( {
			path: 'jetpack-protect/v1/waf',
			method: 'GET',
		} ).then( response => {
			response = camelize( response );
			setWafIsEnabled( response?.isEnabled );
			setWafConfig( camelize( response?.config ) );
		} );
	}, [ setWafConfig, setWafIsEnabled, setWafIsLoading ] );

	useEffect( () => {
		if ( waf.config === undefined && ! waf.isFetching ) {
			fetchWaf();
		}
	}, [ waf.config, waf.isFetching, fetchWaf ] );

	return {
		...waf,
		fetchWaf,
	};
};

export default useWafData;
