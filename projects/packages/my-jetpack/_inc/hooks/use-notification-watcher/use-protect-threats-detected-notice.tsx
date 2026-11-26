import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useProduct from '../../data/products/use-product';
import createCookie from '../../utils/create-cookie';
import preventWidows from '../../utils/prevent-widows';
import useAnalytics from '../use-analytics';
import type { NoticeHookType } from './types';
import type { NoticeOptions } from '../../context/notices/types';

const useProtectThreatsDetectedNotice: NoticeHookType = ( redBubbleAlerts, isLoading ) => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { detail } = useProduct( 'protect' );
	const {
		hasPaidPlanForProduct,
		standalonePluginInfo,
		manageUrl: protectDashboardUrl,
	} = detail || {};
	const { isStandaloneActive } = standalonePluginInfo || {};

	const {
		type,
		data: {
			threat_count: threatCount,
			critical_threat_count: criticalThreatCount,
			fixable_threat_ids: fixableThreatIds,
		},
	} = redBubbleAlerts?.protect_has_threats || { type: 'warning', data: {} };

	const fixThreatsLearnMoreUrl = getRedirectUrl( 'protect-footer-learn-more-scan', {
		anchor: 'how-do-i-fix-threats',
	} );

	const noticeTitle = sprintf(
		// translators: %s is the product name. Can be either "Scan" or "Protect".
		__( '%s found threats on your site', 'jetpack-my-jetpack' ),
		hasPaidPlanForProduct && isStandaloneActive ? 'Protect' : 'Scan'
	);

	const onCloseClick = useCallback( () => {
		createCookie( 'protect_threats_detected_dismissed', 7 );
		delete redBubbleAlerts?.protect_has_threats;
		resetNotice();
	}, [ redBubbleAlerts?.protect_has_threats, resetNotice ] );

	const onPrimaryCtaClick = useCallback( () => {
		window.open( protectDashboardUrl );
		recordEvent( 'jetpack_my_jetpack_protect_threats_detected_notice_primary_cta_click', {
			threat_count: threatCount,
			critical_threat_count: criticalThreatCount,
			fixable_threat_ids: fixableThreatIds,
		} );
	}, [ criticalThreatCount, fixableThreatIds, protectDashboardUrl, recordEvent, threatCount ] );

	const onSecondaryCtaClick = useCallback( () => {
		recordEvent( 'jetpack_my_jetpack_protect_threats_detected_notice_secondary_cta_click', {
			threat_count: threatCount,
			critical_threat_count: criticalThreatCount,
			fixable_threat_ids: fixableThreatIds,
		} );
	}, [ criticalThreatCount, fixableThreatIds, recordEvent, threatCount ] );

	useEffect( () => {
		if ( ! redBubbleAlerts?.protect_has_threats || getScriptData().site.is_multisite ) {
			return;
		}

		const noticeMessage = (
			<Stack direction="column" gap="sm">
				<Text render={ <p /> }>
					{ preventWidows(
						__(
							'We’ve detected some security threats that need your attention.',
							'jetpack-my-jetpack'
						)
					) }
				</Text>
				<Text render={ <p /> }>
					{ preventWidows(
						sprintf(
							// translators: %s is the product name. Can be either "Scan" or "Protect".
							__(
								'Visit the %s dashboard to view threat details, auto-fix threats, and keep your site safe.',
								'jetpack-my-jetpack'
							),
							hasPaidPlanForProduct && isStandaloneActive ? 'Protect' : 'Scan'
						)
					) }
				</Text>
			</Stack>
		);

		const noticeOptions: NoticeOptions = {
			id: 'protect-threats-detected-notice',
			level: type,
			actions: [
				{
					label: __( 'Fix threats', 'jetpack-my-jetpack' ),
					onClick: onPrimaryCtaClick,
					noDefaultClasses: true,
				},
				{
					label: __( 'Learn more', 'jetpack-my-jetpack' ),
					url: fixThreatsLearnMoreUrl,
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
		fixThreatsLearnMoreUrl,
		hasPaidPlanForProduct,
		isStandaloneActive,
		noticeTitle,
		onCloseClick,
		onPrimaryCtaClick,
		onSecondaryCtaClick,
		redBubbleAlerts?.protect_has_threats,
		setNotice,
		type,
		isLoading,
	] );
};

export default useProtectThreatsDetectedNotice;
