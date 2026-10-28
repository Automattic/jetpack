/**
 * External dependencies
 */
import { useStatsAppNoticeMutation, useStatsAppNotices } from '@jetpack-premium-analytics/data';
import { Notice } from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { requestConsentCardFocus, useConsentStatus } from '../stats-settings/consent-status';
import styles from './visitor-consent-notice.module.scss';
import type { JSX } from 'react';

const NOTICE_ID = 'visitor_consent_setup';

// Once per page load, not per mount: every section tab mounts its own copy.
let viewedThisLoad = false;

/**
 * Reset the once-per-load view latch. Test-only.
 */
export function resetVisitorConsentNoticeForTesting() {
	viewedThisLoad = false;
}

/**
 * Whether the notice shows: the site has a cookie banner Stats cannot hear yet, and the user has
 * not dismissed the notice.
 *
 * @return `undefined` while the dismissal state loads, otherwise whether it shows.
 */
export function useVisitorConsentNoticeVisibility(): boolean | undefined {
	const status = useConsentStatus();
	const eligible =
		!! status && ! status.api_active && ( status.has_banner || status.banner_plugin !== null );
	const { data: notices, isError } = useStatsAppNotices( undefined, { enabled: eligible } );

	if ( ! eligible ) {
		return false;
	}

	// WordPress.com reports the notice visible until it is dismissed, so a missing key hides it.
	if ( notices ) {
		return notices[ NOTICE_ID ] === true;
	}

	return isError ? false : undefined;
}

/**
 * Invites a site whose cookie banner Stats cannot hear yet to finish the setup in Settings.
 * Render it only where `useVisitorConsentNoticeVisibility()` is true.
 *
 * @param props                - Component props.
 * @param props.onOpenSettings - Opens the Settings tab.
 * @return The notice.
 */
export function VisitorConsentNotice( {
	onOpenSettings,
}: {
	onOpenSettings: () => void;
} ): JSX.Element {
	const bannerPlugin = useConsentStatus()?.banner_plugin;
	const { createErrorNotice } = useDispatch( 'core/notices' );
	const { mutate: updateNotice } = useStatsAppNoticeMutation( {
		onError: () =>
			createErrorNotice(
				__( 'Couldn’t dismiss the notice. Please try again.', 'jetpack-premium-analytics-pkg' ),
				{ type: 'snackbar' }
			),
	} );
	const trackEvent = useTrackEvent();

	useEffect( () => {
		if ( viewedThisLoad ) {
			return;
		}

		viewedThisLoad = true;
		trackEvent( 'jetpack_premium_analytics_visitor_consent_notice_view' );
	}, [ trackEvent ] );

	const dismiss = useCallback( () => {
		updateNotice( { id: NOTICE_ID, status: 'dismissed' } );
		trackEvent( 'jetpack_premium_analytics_visitor_consent_notice_dismiss' );
	}, [ updateNotice, trackEvent ] );

	const openSettings = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_visitor_consent_notice_set_up_click' );
		requestConsentCardFocus();
		onOpenSettings();
	}, [ trackEvent, onOpenSettings ] );

	return (
		<Notice.Root intent="info" className={ styles.notice }>
			<Notice.Title>
				{ __( 'Connect your cookie banner to Stats', 'jetpack-premium-analytics-pkg' ) }
			</Notice.Title>
			<Notice.Description>
				{ bannerPlugin
					? sprintf(
							/* translators: %s: the name of a cookie banner plugin, such as CookieYes. */
							__(
								'Stats doesn’t know what visitors choose in %s yet. Set it up so Stats only counts visitors who allow it.',
								'jetpack-premium-analytics-pkg'
							),
							bannerPlugin
						)
					: __(
							'Stats doesn’t know what visitors choose in your cookie banner yet. Set it up so Stats only counts visitors who allow it.',
							'jetpack-premium-analytics-pkg'
						) }
			</Notice.Description>

			<Notice.Actions>
				<Notice.ActionButton variant="outline" onClick={ openSettings }>
					{ __( 'Set up', 'jetpack-premium-analytics-pkg' ) }
				</Notice.ActionButton>
			</Notice.Actions>

			<Notice.CloseIconButton
				label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
				onClick={ dismiss }
			/>
		</Notice.Root>
	);
}
