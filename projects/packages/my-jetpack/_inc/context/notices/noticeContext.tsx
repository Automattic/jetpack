import { createContext, useCallback, useState } from 'react';
import { NoticeContextType, Notice, NoticeOptions } from './types';

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

	const setNotice = useCallback(
		// If onClose is not provided in the "notice", and close button is not hidden, use the custom onClose function
		( notice: Notice, onClose?: NoticeOptions[ 'onClose' ] ) => {
			// Only update notice if there is not already a notice or the new notice has a higher priority
			if ( ! currentNotice.message || notice.options.priority > currentNotice.options.priority ) {
				const newOptions = {
					...notice.options,
					onClose:
						notice.options?.onClose || ( ! notice.options?.hideCloseButton ? onClose : undefined ),
				};

				setCurrentNotice( { ...notice, options: newOptions } );
			}
		},
		[ currentNotice.message, currentNotice.options.priority ]
	);

	const resetNotice = useCallback( () => {
		setCurrentNotice( defaultNotice );
	}, [] );

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
