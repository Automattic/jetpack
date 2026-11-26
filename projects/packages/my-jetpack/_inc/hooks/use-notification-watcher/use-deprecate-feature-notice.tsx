import { Link, Stack, Text } from '@wordpress/ui';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import type { NoticeOptions } from '../../context/notices/types';

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
		const { title, text, link, id } = alert.data;

		const noticeText = (
			<Stack direction="column" gap="sm">
				<Text render={ <p /> }>{ text }</Text>
				<Text render={ <p /> }>
					<Link href={ link.url } openInNewTab rel="noreferrer">
						{ link.label }
					</Link>
				</Text>
			</Stack>
		);

		const onCloseClick = () => {
			document.cookie = `jetpack_deprecate_dismissed[${ id }]=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/; SameSite=None; Secure`;
			delete redBubbleAlerts[ deprecateAlerts[ 0 ] ];
			resetNotice();
		};

		const noticeOptions: NoticeOptions = {
			id: 'deprecate-feature-notice',
			level: 'info',
			hideCloseButton: false,
			onClose: onCloseClick,
			priority: NOTICE_PRIORITY_MEDIUM,
		};

		setNotice( {
			title,
			message: noticeText,
			options: noticeOptions,
		} );
	}, [ redBubbleAlerts, setNotice, resetNotice ] );
};

export default useDeprecateFeatureNotice;
