import { useEffect, useState } from 'react';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';

type WindowState = Window[ 'myJetpackInitialState' ];

type QueryParams< P > = {
	name: string;
	key: P;
};

const useWindowStateQuery = < A extends keyof WindowState >( {
	name,
	key,
}: QueryParams< A > ): WindowState[ A ] | undefined => {
	const [ isLoading, setIsLoading ] = useState( true );
	const state = window.myJetpackInitialState[ key ];
	const isError = ! ( 'myJetpackInitialState' in window ) || state === undefined;

	useEffect( () => {
		setTimeout( () => {
			setIsLoading( false );
		}, 1_000 );
	}, [] );

	useFetchingErrorNotice( {
		infoName: name,
		isError: ! isLoading && isError,
	} );

	return state;
};

export default useWindowStateQuery;
