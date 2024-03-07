import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';

type ErrorNotice = {
	infoName: string;
	isError: boolean;
	overrideMessage?: string;
};

export const useFetchingErrorNotice = ( { infoName, isError, overrideMessage }: ErrorNotice ) => {
	const { setNotice } = useContext( NoticeContext );
	const message =
		overrideMessage ??
		sprintf(
			// translators: %s is the name of the information being fetched, e.g. "site purchases".
			__(
				'There was an error fetching your %s information. Check your site connectivity and try again.',
				'jetpack-my-jetpack'
			),
			infoName
		);

	useEffect( () => {
		if ( isError ) {
			setNotice( {
				message,
				options: { status: 'error' },
			} );
		}
	}, [ message, setNotice, isError ] );
};
