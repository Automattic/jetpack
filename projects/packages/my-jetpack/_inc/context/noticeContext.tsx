import { createContext, useState } from '@wordpress/element';
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';

export const NoticeContext = createContext< {
	currentNotice: { message: string; options: { status: string } };
	setCurrentNotice: Dispatch< SetStateAction< { message: string; options: { status: string } } > >;
} | null >( null );

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
