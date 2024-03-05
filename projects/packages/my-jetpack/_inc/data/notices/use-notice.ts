import { useContext, useEffect } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';

type Notice = {
	message: string;
	options: { status: string };
	isError: boolean;
};

const useNotice = ( { message, options, isError }: Notice ) => {
	const { setCurrentNotice } = useContext( NoticeContext );

	useEffect( () => {
		if ( isError ) {
			setCurrentNotice?.( { message, options } );
		}
		// We only want to update the notice if isError changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isError ] );
};

export default useNotice;
