import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type MutationNotice = {
	id: string;
	type: 'success' | 'error' | 'pending';
	message: string;
};

type Notices = {
	[ key: string ]: MutationNotice;
};

type NoticeContextType = {
	notices: Notices;
	setNotice: ( notice: MutationNotice ) => void;
	removeNotice: ( id: string ) => void;
};

const NoticeContext = createContext< NoticeContextType | undefined >( undefined );

type NoticeProviderProps = {
	children: ReactNode;
};

export const NoticeProvider = ( { children }: NoticeProviderProps ) => {
	const [ notices, setNotices ] = useState< Notices >( {} );

	const setNotice = useCallback(
		( notice: MutationNotice ) => {
			setNotices( ( prevNotices: Notices ) => ( {
				...prevNotices,
				[ notice.id ]: notice, // Add or update the notice by its ID
			} ) );
		},
		[ setNotices ]
	);

	const removeNotice = useCallback(
		( id: string ) => {
			setNotices( ( prevNotices: Notices ) => {
				const updatedNotices = { ...prevNotices };
				delete updatedNotices[ id ]; // Remove the notice by its ID

				return updatedNotices;
			} );
		},
		[ setNotices ]
	);

	return (
		<NoticeContext.Provider value={ { notices, setNotice, removeNotice } }>
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
