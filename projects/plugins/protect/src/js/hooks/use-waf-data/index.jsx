import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from 'react';
import API from '../../api';
import { STORE_ID } from '../../state/store';

const useWafData = () => {
	const { setWafConfig, setWafIsEnabled, setWafIsLoading } = useDispatch( STORE_ID );
	const waf = useSelect( select => select( STORE_ID ).getWaf() );

	const refreshWaf = useCallback( () => {
		setWafIsLoading( true );
		API.fetchWaf()
			.then( response => {
				setWafIsEnabled( response?.isEnabled );
				setWafConfig( response?.config );
			} )
			.finally( setWafIsLoading( false ) );
	}, [ setWafConfig, setWafIsEnabled, setWafIsLoading ] );

	useEffect( () => {
		if ( waf.config === undefined && ! waf.isFetching ) {
			refreshWaf();
		}
	}, [ waf.config, waf.isFetching, refreshWaf ] );

	return {
		...waf,
		refreshWaf,
	};
};

export default useWafData;
