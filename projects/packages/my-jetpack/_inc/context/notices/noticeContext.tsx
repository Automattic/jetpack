import React, { createContext, useState } from 'react';
import { NoticeContextType } from './types';

export const NoticeContext = createContext< NoticeContextType | null >( null );

const NoticeContextProvider = ( { children } ) => {
	const [ currentNotice, setCurrentNotice ] = useState( {
		message: '',
		options: {
			status: '',
		},
	} );

	return (
		<NoticeContext.Provider
			value={ {
				currentNotice,
				setCurrentNotice,
			} }
		>
			{ children }
		</NoticeContext.Provider>
	);
};

export default NoticeContextProvider;
