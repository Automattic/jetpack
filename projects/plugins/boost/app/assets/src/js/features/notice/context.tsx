import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Notice = {
	id: string;
	type: 'success' | 'error' | 'pending';
	message: string;
};

type Notices = {
	[ key: string ]: Notice;
};

type NoticeContextType = {
	notices: Notices;
	setNotice: ( notice: Notice ) => void;
	removeNotice: ( id: string ) => void;
	hasNotice: ( id: string ) => boolean;
};

const NoticeContext = createContext< NoticeContextType | undefined >( undefined );

type NoticeProviderProps = {
	children: ReactNode;
};

export const NoticeProvider = ( { children }: NoticeProviderProps ) => {
	const [ notices, setNotices ] = useState< Notices >( {} );

	const setNotice = useCallback( ( notice: Notice ) => {
		setNotices( ( prevNotices: Notices ) => ( {
			...prevNotices,
			[ notice.id ]: notice, // Add or update the notice by its ID
		} ) );
	}, [] );

	const removeNotice = useCallback( ( id: string ) => {
		setNotices( ( prevNotices: Notices ) => {
			const updatedNotices = { ...prevNotices };
			delete updatedNotices[ id ]; // Remove the notice by its ID

			return updatedNotices;
		} );
	}, [] );

	const hasNotice = useCallback( ( id: string ) => {
		return !! notices[ id ];
		// WELP. I DON'T KNOW WHY ADDING [ notices ] TRIGGERS AND INFINITE LOOP
		// But hey, this works....
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return (
		<NoticeContext.Provider value={ { notices, setNotice, removeNotice, hasNotice } }>
			{ children }
		</NoticeContext.Provider>
	);
};

export const useNotices = (): NoticeContextType => {
	const context = useContext( NoticeContext );
	if ( ! context ) {
		throw new Error( 'useNotices must be used within a NoticeProvider' );
	}

	return context;
};
