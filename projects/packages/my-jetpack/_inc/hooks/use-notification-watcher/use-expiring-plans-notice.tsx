import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { useGetExpiredNoticeContent } from './use-get-expired-notice-content';
import { useGetExpiringSoonNoticeContent } from './use-get-expiring-soon-notice-content';
import type { NoticeOptions } from '../../context/notices/types';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useExpiringPlansNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	const planExpiredAlerts = Object.keys( redBubbleAlerts ).filter(
		key => key.endsWith( '--plan_expiring_soon' ) || key.endsWith( '--plan_expired' )
	) as Array< `${ string }--plan_expiring_soon` | `${ string }--plan_expired` >;

	const expiredAlerts = planExpiredAlerts.filter( alert => alert.endsWith( '--plan_expired' ) );
	const expiringSoonAlerts = planExpiredAlerts.filter( alert =>
		alert.endsWith( '--plan_expiring_soon' )
	);

	// Already expired alerts take precidence over expiring alerts.
	// i.e.- Display 'expired' alert if there is one, otherwise display 'expiring soon' alert.
	const alertToDisplay = expiredAlerts.length ? expiredAlerts[ 0 ] : expiringSoonAlerts[ 0 ];
	const isExpiredAlert = alertToDisplay.endsWith( '--plan_expired' );

	const { product_slug, product_name, expiry_date, manage_url, products_effected } =
		redBubbleAlerts[ alertToDisplay ] || {};

	const {
		noticeTitle: expiredTitle,
		noticeMessage: expiredMessage,
		learnMoreUrl: expiredLearnMoreUrl,
	} = useGetExpiredNoticeContent( { product_slug, product_name, expiry_date, products_effected } );
	const {
		noticeTitle: expiringTitle,
		noticeMessage: expiringMessage,
		learnMoreUrl: expiringLearnMoreUrl,
	} = useGetExpiringSoonNoticeContent( {
		product_slug,
		product_name,
		expiry_date,
		products_effected,
	} );

	const onPrimaryCtaClick = useCallback( () => {
		window.open( manage_url );
		recordEvent(
			isExpiredAlert
				? 'jetpack_my_jetpack_plan_expired_notice_primary_cta_click'
				: 'jetpack_my_jetpack_plan_expiring_soon_notice_primary_cta_click',
			{
				product_slug,
			}
		);
	}, [ isExpiredAlert, manage_url, product_slug, recordEvent ] );

	const onSecondaryCtaClick = useCallback( () => {
		window.open( isExpiredAlert ? expiredLearnMoreUrl : expiringLearnMoreUrl );
		recordEvent(
			isExpiredAlert
				? 'jetpack_my_jetpack_plan_expired_notice_secondary_cta_click'
				: 'jetpack_my_jetpack_plan_expiring_soon_notice_secondary_cta_click',
			{
				product_slug,
			}
		);
	}, [ expiredLearnMoreUrl, expiringLearnMoreUrl, isExpiredAlert, product_slug, recordEvent ] );

	useEffect( () => {
		if ( ! alertToDisplay ) {
			return;
		}

		const noticeOptions: NoticeOptions = {
			id: isExpiredAlert ? 'plan-expired-notice' : 'plan-expiring-soon-notice',
			level: isExpiredAlert ? 'error' : 'warning',
			actions: [
				{
					label: isExpiredAlert
						? __( 'Resume my plan', 'jetpack-my-jetpack' )
						: __( 'Renew my plan', 'jetpack-my-jetpack' ),
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
			title: isExpiredAlert ? expiredTitle : expiringTitle,
			message: isExpiredAlert ? expiredMessage : expiringMessage,
			options: noticeOptions,
		} );
	}, [
		redBubbleAlerts,
		setNotice,
		recordEvent,
		alertToDisplay,
		onPrimaryCtaClick,
		onSecondaryCtaClick,
		expiredTitle,
		expiringTitle,
		expiredMessage,
		expiringMessage,
		isExpiredAlert,
	] );
};

export default useExpiringPlansNotice;
