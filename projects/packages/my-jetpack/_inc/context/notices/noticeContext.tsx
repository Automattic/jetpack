import { createContext, useState } from 'react';
import { NoticeContextType, Notice } from './types';

const defaultNotice: Notice = {
	message: '',
	title: null,
	options: {
		level: '',
		priority: 0,
	},
};

export const NoticeContext = createContext< NoticeContextType >( {
	currentNotice: defaultNotice,
	setNotice: null,
	resetNotice: null,
} );

// Maybe todo: Add a clearNotice type function to remove any active notices
// No use case yet, but it might be useful in the future
const NoticeContextProvider = ( { children } ) => {
	const [ currentNotice, setCurrentNotice ] = useState< Notice >( defaultNotice );

	const setNotice = ( notice: Notice ) => {
		// Only update notice if there is not already a notice or the new notice has a higher priority
		if ( ! currentNotice.message || notice.options.priority > currentNotice.options.priority ) {
			setCurrentNotice( notice );
		}
	};

	const resetNotice = () => {
		setCurrentNotice( defaultNotice );
	};

	return (
		<NoticeContext.Provider
			value={ {
				currentNotice,
				setNotice,
				resetNotice,
			} }
		>
			{ children }
		</NoticeContext.Provider>
	);
};

export default NoticeContextProvider;
