import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import { QUERY_PRODUCT_KEY, QUERY_VIDEOPRESS_STATS_KEY } from '../constants';

type ErrorNotice = {
	infoName: string;
	isError: boolean;
	overrideMessage?: string;
};

const queriesToSuppressErrors = [ QUERY_PRODUCT_KEY, QUERY_VIDEOPRESS_STATS_KEY ];

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
		if ( isError && ! queriesToSuppressErrors.includes( infoName ) ) {
			setNotice( {
				message,
				options: { status: 'error' },
			} );
		}
	}, [ message, setNotice, isError, infoName ] );
};
