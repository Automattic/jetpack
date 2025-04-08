import { Col, Text } from '@automattic/jetpack-components';
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
			<Col>
				<Text className="my-jetpack-deprecate-notice-title" mb={ 1 }>
					{ title }
				</Text>
				<Text mb={ 1 }>{ text }</Text>
				<a
					href={ link.url }
					target="_blank"
					rel="noreferrer"
					className="jetpack-deprecation-notice-link"
				>
					{ link.label }
				</a>
				<svg
					className="gridicons-external"
					height="14"
					width="14"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 22 20"
				>
					<g>
						<path d="M19 13v6c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2h6v2H5v12h12v-6h2zM13 3v2h4.586l-7.793 7.793 1.414 1.414L19 6.414V11h2V3h-8z"></path>
					</g>
				</svg>
			</Col>
		);

		const onCloseClick = () => {
			document.cookie = `jetpack_deprecate_dismissed[${ id }]=1; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=None; Secure`;
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
			message: noticeText,
			options: noticeOptions,
		} );
	}, [ redBubbleAlerts, setNotice, resetNotice ] );
};

export default useDeprecateFeatureNotice;
