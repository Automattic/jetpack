import { useContext, useEffect } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';

const useNotice = ( { message, options, isError } ) => {
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
