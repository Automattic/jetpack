import { applyFilters } from '@wordpress/hooks';
import { useContext, useEffect } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import type { Notice } from '../../context/notices/types';

// Module scope, so a closed notice stays closed when the screen remounts.
const closedIds = new Set< string >();

/**
 * Offer the highest-priority notice added through the `myJetpack.notices` filter,
 * such as WordPress.com's plan expiry notice. Each needs a unique `options.id`.
 *
 * @param isLoading - Whether the red bubble alerts, which the other watchers wait for, are still loading.
 */
const useFilteredNotices = ( isLoading: boolean ) => {
	const { setNotice, resetNotice } = useContext( NoticeContext );

	useEffect( () => {
		if ( isLoading ) {
			return;
		}
		const [ notice ] = ( applyFilters( 'myJetpack.notices', [] ) as Notice[] )
			.filter( ( { options } ) => options?.id && ! closedIds.has( options.id ) )
			.sort( ( a, b ) => ( b.options?.priority ?? 0 ) - ( a.options?.priority ?? 0 ) );
		if ( ! notice ) {
			return;
		}
		setNotice( {
			...notice,
			options: {
				...notice.options,
				onClose: () => {
					closedIds.add( notice.options.id );
					resetNotice();
					notice.options.onClose?.();
				},
			},
		} );
	}, [ isLoading, setNotice, resetNotice ] );
};

export default useFilteredNotices;
