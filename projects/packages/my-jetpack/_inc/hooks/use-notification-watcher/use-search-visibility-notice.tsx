import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useRef } from 'react';
import { NOTICE_PRIORITY_LOW } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { assignLocation } from './assignLocation';

/**
 * Warn that the site discourages search engines, as Jetpack › Settings did.
 */
const useSearchVisibilityNotice = () => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const closed = useRef( false );

	useEffect( () => {
		if (
			closed.current ||
			getMyJetpackWindowInitialState( 'settingsNotices' )?.searchEnginesVisible !== false
		) {
			return;
		}

		setNotice( {
			message: __(
				"This site's visibility settings discourage or prevent search engines from indexing it.",
				'jetpack-my-jetpack'
			),
			options: {
				id: 'search-visibility-notice',
				level: 'warning',
				priority: NOTICE_PRIORITY_LOW,
				actions: [
					{
						label: __( 'Review site visibility settings', 'jetpack-my-jetpack' ),
						onClick: () => assignLocation( getAdminUrl( 'options-reading.php' ) ),
						noDefaultClasses: true,
					},
				],
				hideCloseButton: false,
				onClose: () => {
					closed.current = true;
					resetNotice();
				},
			},
		} );
	}, [ setNotice, resetNotice ] );
};

export default useSearchVisibilityNotice;
