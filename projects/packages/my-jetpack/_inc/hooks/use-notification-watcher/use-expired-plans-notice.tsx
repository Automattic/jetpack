import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { useGetExpiredNoticeContent } from './use-get-expired-notice-content';
import type { NoticeOptions } from '../../context/notices/types';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useExpiredPlansNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	const planExpiredAlerts = Object.keys( redBubbleAlerts ).filter( key =>
		key.endsWith( '--plan_expired' )
	) as Array< `${ string }--plan_expired` >;

	const { product_slug, product_name, manage_url } =
		redBubbleAlerts[ planExpiredAlerts[ 0 ] ] || {};

	const { noticeTitle, noticeMessage, learnMoreUrl } =
		useGetExpiredNoticeContent( { product_slug, product_name } ) || {};

	const onPrimaryCtaClick = useCallback( () => {
		window.open( manage_url );
		recordEvent( 'jetpack_my_jetpack_plan_expired_notice_primary_cta_click', {
			product_slug,
		} );
	}, [ manage_url, product_slug, recordEvent ] );

	const onSecondaryCtaClick = useCallback( () => {
		window.open( learnMoreUrl );
		recordEvent( 'jetpack_my_jetpack_plan_expired_notice_secondary_cta_click', {
			product_slug,
		} );
	}, [ learnMoreUrl, product_slug, recordEvent ] );

	useEffect( () => {
		if ( planExpiredAlerts.length === 0 ) {
			return;
		}

		const noticeOptions: NoticeOptions = {
			id: 'plan-expired-notice',
			level: 'error',
			actions: [
				{
					label: __( 'Resume my plan', 'jetpack-my-jetpack' ),
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
		noticeMessage,
		noticeTitle,
		onPrimaryCtaClick,
		onSecondaryCtaClick,
		planExpiredAlerts,
		setNotice,
	] );
};

export default useExpiredPlansNotice;
