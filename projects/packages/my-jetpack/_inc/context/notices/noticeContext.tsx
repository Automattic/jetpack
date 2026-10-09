import { createContext, useCallback, useState } from 'react';
import { NoticeContextType, Notice, NoticeOptions } from './types';

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
		// If onClose is not provided in the "notice", and close button is not hidden, use the custom onClose function
		( notice: Notice, onClose?: NoticeOptions[ 'onClose' ] ) => {
			const newOptions = {
				...notice.options,
				onClose:
					notice.options?.onClose || ( ! notice.options?.hideCloseButton ? onClose : undefined ),
			};

			// Compare against the queued state: watchers call this several times in one effect pass.
			setCurrentNotice( prev =>
				! prev.message || notice.options.priority > prev.options.priority
					? { ...notice, options: newOptions }
					: prev
			);
		},
		// Changing identity on each notice change re-runs the watchers, e.g. to show the next notice after a close.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ currentNotice.message, currentNotice.options.priority ]
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
