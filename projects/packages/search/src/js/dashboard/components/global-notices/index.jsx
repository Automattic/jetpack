/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import SimpleNotice from 'components/notice/index.jsx';
import NoticeAction from 'components/notice/notice-action';

import './style.scss';

export default function NoticesList(
	props = { handleLocalNoticeDismissClick: null, notices: Object.freeze( [] ) }
) {
	let noticesList = props.notices.map( function ( notice, index ) {
		const onDismissClick = notice => () => {
			notice && props.handleLocalNoticeDismissClick( notice.id );
		};
		return (
			<SimpleNotice
				key={ 'notice-' + notice.id }
				status={ notice.status }
				duration={ notice.duration || null }
				text={ notice.text }
				isCompact={ notice.isCompact }
				onDismissClick={ onDismissClick( notice ) }
				showDismiss={ notice.showDismiss }
			>
				{ notice.button && (
					<NoticeAction href={ notice.href } onClick={ onDismissClick( notice ) }>
						{ notice.button }
					</NoticeAction>
				) }
			</SimpleNotice>
		);
	} );

	if ( ! noticesList.length ) {
		return null;
	}

	return (
		<div id={ props.id } className="global-notices">
			{ noticesList }
		</div>
	);
}
