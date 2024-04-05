import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_LOW } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import {
	QUERY_ACTIVATE_PRODUCT_KEY,
	QUERY_INSTALL_PRODUCT_KEY,
	QUERY_PURCHASES_KEY,
} from '../constants';

type ErrorNotice = {
	infoName: string;
	isError: boolean;
	overrideMessage?: string;
};

// We only want to show error notices for certain queries.
const errorNoticeWhitelist = [
	QUERY_PURCHASES_KEY,
	QUERY_ACTIVATE_PRODUCT_KEY,
	QUERY_INSTALL_PRODUCT_KEY,
];

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
		if ( isError && errorNoticeWhitelist.includes( infoName ) ) {
			setNotice( {
				message,
				options: {
					level: 'error',
					priority: NOTICE_PRIORITY_LOW,
				},
			} );
		}
	}, [ message, setNotice, isError, infoName ] );
};
