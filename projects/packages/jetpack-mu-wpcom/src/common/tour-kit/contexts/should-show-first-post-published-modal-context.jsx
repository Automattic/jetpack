import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import * as React from 'react';
import { useContext } from 'react';

const ShouldShowFPPModalContext = React.createContext( false );

export const useShouldShowFirstPostPublishedModal = () => {
	return useContext( ShouldShowFPPModalContext );
};

export const ShouldShowFirstPostPublishedModalProvider = ( { children } ) => {
	const value = useSelect(
		select => select( 'automattic/wpcom-welcome-guide' ).getShouldShowFirstPostPublishedModal(),
		[]
	);

	const { fetchShouldShowFirstPostPublishedModal } = useDispatch(
		'automattic/wpcom-welcome-guide'
	);

	useEffect( () => {
		fetchShouldShowFirstPostPublishedModal();
	}, [ fetchShouldShowFirstPostPublishedModal ] );

	return (
		<ShouldShowFPPModalContext.Provider value={ value }>
			{ children }
		</ShouldShowFPPModalContext.Provider>
	);
};
