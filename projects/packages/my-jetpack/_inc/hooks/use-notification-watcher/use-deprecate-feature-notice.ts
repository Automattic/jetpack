import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import type { NoticeOptions } from '../../context/notices/types';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useDeprecateFeatureNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice, resetNotice } = useContext( NoticeContext );

	useEffect( () => {
		const deprecateAlerts = Object.keys( redBubbleAlerts ).filter( key =>
			key.endsWith( '-deprecate-feature' )
		) as Array< `${ string }-deprecate-feature` >;

		if ( deprecateAlerts.length === 0 ) {
			return;
		}

		const alert = redBubbleAlerts[ deprecateAlerts[ 0 ] ];
		const { text, link, id } = alert.data;

		const onCtaClick = () => {
			window.open( link.url );
		};

		const onCloseClick = () => {
			document.cookie = `jetpack_deprecate_dismissed[${ id }]=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=None;`;
			delete redBubbleAlerts[ deprecateAlerts[ 0 ] ];
			resetNotice();
		};

		const noticeOptions: NoticeOptions = {
			id: 'deprecate-feature-notice',
			level: 'error',
			actions: [
				{
					label: link.label,
					onClick: onCtaClick,
					noDefaultClasses: true,
				},
			],
			hideCloseButton: false,
			onClose: onCloseClick,
			priority: NOTICE_PRIORITY_MEDIUM,
		};

		setNotice( {
			message: text,
			options: noticeOptions,
		} );
	}, [ redBubbleAlerts, setNotice, resetNotice ] );
};

export default useDeprecateFeatureNotice;
