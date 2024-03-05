import { createContext, useState } from 'react';
import { NoticeContextType } from './types';

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
	setCurrentNotice: null,
} );

const NoticeContextProvider = ( { children } ) => {
	const [ currentNotice, setCurrentNotice ] = useState( defaultNotice );

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
