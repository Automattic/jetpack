import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { useGetExpiringSoonNoticeContent } from './use-get-expiring-soon-notice-content';
import type { NoticeOptions } from '../../context/notices/types';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useExpiringSoonPlansNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	const planExpiredAlerts = Object.keys( redBubbleAlerts ).filter( key =>
		key.endsWith( '--plan_expiring_soon' )
	) as Array< `${ string }--plan_expiring_soon` >;

	const { product_slug, product_name, expiry_date, manage_url } =
		redBubbleAlerts[ planExpiredAlerts[ 0 ] ] || {};

	const { noticeTitle, noticeMessage, learnMoreUrl } =
		useGetExpiringSoonNoticeContent( { product_slug, product_name, expiry_date } ) || {};

	const onPrimaryCtaClick = useCallback( () => {
		window.open( manage_url );
		recordEvent( 'jetpack_my_jetpack_plan_expiring_soon_notice_primary_cta_click', {
			product_slug,
		} );
	}, [ manage_url, product_slug, recordEvent ] );

	const onSecondaryCtaClick = useCallback( () => {
		window.open( learnMoreUrl );
		recordEvent( 'jetpack_my_jetpack_plan_expiring_soon_notice_secondary_cta_click', {
			product_slug,
		} );
	}, [ learnMoreUrl, product_slug, recordEvent ] );

	useEffect( () => {
		if ( planExpiredAlerts.length === 0 ) {
			return;
		}

		const noticeOptions: NoticeOptions = {
			id: 'plan-expiring-soon-notice',
			level: 'warning',
			actions: [
				{
					label: __( 'Renew my plan', 'jetpack-my-jetpack' ),
					onClick: onPrimaryCtaClick,
					noDefaultClasses: true,
				},
				{
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: onSecondaryCtaClick,
					isExternalLink: true,
				},
			],
			priority: NOTICE_PRIORITY_MEDIUM,
		};

		setNotice( {
			title: noticeTitle,
			message: noticeMessage,
			options: noticeOptions,
		} );
	}, [
		redBubbleAlerts,
		setNotice,
		recordEvent,
		planExpiredAlerts.length,
		onPrimaryCtaClick,
		onSecondaryCtaClick,
		noticeTitle,
		noticeMessage,
	] );
};

export default useExpiringSoonPlansNotice;
