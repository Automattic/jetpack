import { createContext, useCallback, useState } from 'react';
import { NoticeContextType, Notice } from './types';

const defaultNotice: Notice = {
	message: '',
	title: null,
	options: {
		level: 'info',
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

	const resetNotice = useCallback( () => {
		setCurrentNotice( defaultNotice );
	}, [] );

	const setNotice = useCallback(
		( notice: Notice ) => {
			// Only update notice if there is not already a notice or the new notice has a higher priority
			if ( ! currentNotice.message || notice.options.priority > currentNotice.options.priority ) {
				resetNotice();
				setCurrentNotice( notice );
			}
		},
		[ currentNotice.message, currentNotice.options.priority, resetNotice ]
	);

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
