import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Notice = {
	id: string;
	type: 'success' | 'error' | 'pending';
	message: string;
};

type NoticeContextType = {
	notices: Notice[];
	setNotice: ( notice: Notice ) => void;
	removeNotice: ( id: string ) => void;
};

const NoticeContext = createContext< NoticeContextType | undefined >( undefined );

type NoticeProviderProps = {
	children: ReactNode;
};

export const NoticeProvider = ( { children }: NoticeProviderProps ) => {
	const [ notices, setNotices ] = useState< Notice[] >( [] );

	const setNotice = useCallback( ( notice: Notice ) => {
		setNotices( prevNotices => {
			const existingIndex = prevNotices.findIndex( n => n.id === notice.id );
			if ( existingIndex > -1 ) {
				// Notice exists, update it
				const updatedNotices = [ ...prevNotices ];
				updatedNotices[ existingIndex ] = notice;

				return updatedNotices;
			}

			// Notice doesn't exist, add it
			return [ ...prevNotices, notice ];
		} );
	}, [] );

	const removeNotice = useCallback( ( id: string ) => {
		setNotices( prevNotices => prevNotices.filter( notice => notice.id !== id ) );
	}, [] );

	return (
		<NoticeContext.Provider value={ { notices, setNotice, removeNotice } }>
			{ children }
		</NoticeContext.Provider>
	);
};

export const useNotices = () => {
	const context = useContext( NoticeContext );
	if ( ! context ) {
		throw new Error( 'useNotices must be used within a NoticeProvider' );
	}

	return context;
};
