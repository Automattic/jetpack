import { createContext, useState } from 'react';
import { NoticeContextType, Notice } from './types';

const defaultNotice = {
	message: '',
	options: {
		status: '',
		actions: {
			label: '',
			onClick: () => {},
		},
	},
};

export const NoticeContext = createContext< NoticeContextType >( {
	currentNotice: defaultNotice,
	setNotice: null,
} );

// Maybe todo: Add a clearNotice type function to remove any active notices
// No use case yet, but it might be useful in the future
const NoticeContextProvider = ( { children } ) => {
	const [ currentNotice, setCurrentNotice ] = useState< Notice >( defaultNotice );

	const setNotice = ( notice: Notice ) => {
		if ( ! currentNotice.message ) {
			setCurrentNotice( notice );
		}
	};

	return (
		<NoticeContext.Provider
			value={ {
				currentNotice,
				setNotice,
			} }
		>
			{ children }
		</NoticeContext.Provider>
	);
};

export default NoticeContextProvider;
