import { useContext, useEffect } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import type { NoticeType } from '../../context/notices/types';

const useNotice = ( { message, options, shouldShow = true }: NoticeType ) => {
	const { setCurrentNotice } = useContext( NoticeContext );

	useEffect( () => {
		if ( shouldShow ) {
			setCurrentNotice?.( { message, options } );
		}
		// We only want to update the notice if isError or message changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ shouldShow, message ] );
};

export default useNotice;
