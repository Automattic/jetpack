import { Notice } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';

import './style.scss';

const STATUS_TO_INTENT = {
	'is-success': 'success',
	'is-error': 'error',
	'is-warning': 'warning',
	'is-info': 'info',
};

const NoticeItem = ( { notice, onDismissNotice } ) => {
	const { id, duration, showDismiss = true, status, text } = notice;

	const handleDismiss = useCallback( () => onDismissNotice( id ), [ onDismissNotice, id ] );

	useEffect( () => {
		if ( duration > 0 ) {
			const timer = setTimeout( handleDismiss, duration );
			return () => clearTimeout( timer );
		}
	}, [ duration, handleDismiss ] );

	return (
		<Notice.Root intent={ STATUS_TO_INTENT[ status ] ?? 'neutral' } spokenMessage={ text }>
			{ text && <Notice.Description>{ text }</Notice.Description> }
			{ showDismiss && <Notice.CloseIcon onClick={ handleDismiss } /> }
		</Notice.Root>
	);
};

/**
 * NoticesList component
 *
 * @param {*} props - Props
 * @return {import('react').Component} - NoticesList component
 */
export default function NoticesList(
	props = { handleLocalNoticeDismissClick: null, notices: Object.freeze( [] ) }
) {
	const onDismissNotice = useCallback(
		noticeId => props.handleLocalNoticeDismissClick?.( noticeId ),
		[ props ]
	);

	if ( ! props.notices.length ) {
		return null;
	}

	return (
		<div id={ props.id } className="global-notices">
			{ props.notices.map( notice => (
				<NoticeItem
					key={ 'notice-' + notice.id }
					notice={ notice }
					onDismissNotice={ onDismissNotice }
				/>
			) ) }
		</div>
	);
}
