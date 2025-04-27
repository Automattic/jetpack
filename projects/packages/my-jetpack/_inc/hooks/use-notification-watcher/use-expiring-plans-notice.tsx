import { __ } from '@wordpress/i18n';
import { useContext, useEffect, useCallback, useMemo } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import createCookie from '../../utils/create-cookie';
import useAnalytics from '../use-analytics';
import { useGetExpiringNoticeContent } from './use-get-expiring-notice-content';
import type { NoticeHookType } from './types';
import type { NoticeOptions } from '../../context/notices/types';

const useExpiringPlansNotice: NoticeHookType = ( redBubbleAlerts, isLoading ) => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	const planExpiredAlerts = isLoading
		? []
		: ( Object.keys( redBubbleAlerts ).filter(
				key => key.endsWith( '--plan_expiring_soon' ) || key.endsWith( '--plan_expired' )
		  ) as Array< `${ string }--plan_expiring_soon` | `${ string }--plan_expired` > );

	const expiredAlerts =
		planExpiredAlerts.length &&
		planExpiredAlerts.filter( alert => alert.endsWith( '--plan_expired' ) );
	const expiringSoonAlerts =
		planExpiredAlerts.length &&
		planExpiredAlerts.filter( alert => alert.endsWith( '--plan_expiring_soon' ) );

	// Already expired alerts take precidence over expiring alerts.
	// i.e.- Display 'expired' alert if there is one, otherwise display 'expiring soon' alert.
	const alertToDisplay = expiredAlerts.length ? expiredAlerts[ 0 ] : expiringSoonAlerts[ 0 ];
	const isExpiredAlert = alertToDisplay && alertToDisplay.endsWith( '--plan_expired' );
	const expiredAlertType = isExpiredAlert ? 'expired' : 'expiring-soon';

	const {
		product_slug: productSlug,
		product_name: productName,
		expiry_date: expiryDate,
		manage_url: manageUrl,
		products_effected: productsEffected,
	} = redBubbleAlerts?.[ alertToDisplay ] || {};

	const { noticeTitle, noticeMessage, learnMoreUrl } =
		useGetExpiringNoticeContent( {
			productSlug,
			expiredAlertType,
			productName,
			expiryDate,
			productsEffected,
		} ) || {};

	const cookieKey = useMemo( () => {
		return isExpiredAlert
			? `${ productSlug }--plan_expired`
			: `${ productSlug }--plan_expiring_soon`;
	}, [ isExpiredAlert, productSlug ] );

	const onCloseClick = useCallback( () => {
		// Session cookie. Expires when session ends.
		createCookie( `${ cookieKey }_dismissed`, 7 );
		delete redBubbleAlerts[ alertToDisplay ];
		resetNotice();
	}, [ alertToDisplay, redBubbleAlerts, resetNotice, cookieKey ] );

	const onPrimaryCtaClick = useCallback( () => {
		window.location.href = manageUrl;
		recordEvent(
			isExpiredAlert
				? 'jetpack_my_jetpack_plan_expired_notice_primary_cta_click'
				: 'jetpack_my_jetpack_plan_expiring_soon_notice_primary_cta_click',
			{
				product_slug: productSlug,
			}
		);
	}, [ isExpiredAlert, manageUrl, productSlug, recordEvent ] );

	const onSecondaryCtaClick = useCallback( () => {
		window.open( learnMoreUrl );
		recordEvent(
			isExpiredAlert
				? 'jetpack_my_jetpack_plan_expired_notice_secondary_cta_click'
				: 'jetpack_my_jetpack_plan_expiring_soon_notice_secondary_cta_click',
			{
				product_slug: productSlug,
			}
		);
	}, [ learnMoreUrl, isExpiredAlert, productSlug, recordEvent ] );

	useEffect( () => {
		if ( ! alertToDisplay ) {
			return;
		}

		const resumePlanText = __( 'Resume my plan', 'jetpack-my-jetpack' );
		const renewPlanText = __( 'Renew my plan', 'jetpack-my-jetpack' );

		const noticeOptions: NoticeOptions = {
			id: isExpiredAlert ? 'plan-expired-notice' : 'plan-expiring-soon-notice',
			level: isExpiredAlert ? 'error' : 'warning',
			actions: [
				{
					label: isExpiredAlert ? resumePlanText : renewPlanText,
					onClick: onPrimaryCtaClick,
					noDefaultClasses: true,
				},
				{
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					onClick: onSecondaryCtaClick,
					isExternalLink: true,
				},
			],
			onClose: onCloseClick,
			hideCloseButton: false,
			priority: NOTICE_PRIORITY_MEDIUM,
		};

		if ( ! isLoading ) {
			setNotice( {
				title: noticeTitle,
				message: noticeMessage,
				options: noticeOptions,
			} );
		}
	}, [
		redBubbleAlerts,
		setNotice,
		recordEvent,
		alertToDisplay,
		onCloseClick,
		onPrimaryCtaClick,
		onSecondaryCtaClick,
		noticeTitle,
		noticeMessage,
		isExpiredAlert,
		productSlug,
		cookieKey,
		isLoading,
	] );
};

export default useExpiringPlansNotice;
