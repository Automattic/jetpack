import { useContext, useEffect, useRef } from 'react';
import { getJetpackStateNotice } from '../../components/jetpack-state-notice';
import { NOTICE_PRIORITY_HIGH, NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { assignLocation } from './assignLocation';

/**
 * Show what this page load's `Jetpack::state()` reports, such as a failed or finished connection, as Jetpack › Settings did.
 */
const useJetpackStateNotice = () => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	// The state lasts one page load, so a closed notice stays closed while the watchers re-run.
	const closed = useRef( false );

	useEffect( () => {
		if ( closed.current ) {
			return;
		}

		// Null while Settings keeps its notices.
		const { jetpackState, jetpackVersion } =
			getMyJetpackWindowInitialState( 'settingsNotices' ) ?? {};
		const notice = jetpackState && getJetpackStateNotice( jetpackState, { jetpackVersion } );
		if ( ! notice ) {
			return;
		}

		const { action } = notice;

		setNotice( {
			message: notice.content,
			options: {
				id: 'jetpack-state-notice',
				level: notice.level,
				// An error about the user's last action takes the top priority; a message about it doesn't.
				priority: jetpackState.message ? NOTICE_PRIORITY_MEDIUM : NOTICE_PRIORITY_HIGH,
				actions: action
					? [
							{
								label: action.label,
								url: action.href,
								isExternalLink: action.external,
								onClick: action.external ? undefined : () => assignLocation( action.href ),
								noDefaultClasses: true,
							},
						]
					: undefined,
				hideCloseButton: false,
				onClose: () => {
					closed.current = true;
					resetNotice();
				},
			},
		} );
	}, [ setNotice, resetNotice ] );
};

export default useJetpackStateNotice;
