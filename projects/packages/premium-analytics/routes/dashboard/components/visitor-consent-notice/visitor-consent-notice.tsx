/**
 * External dependencies
 */
import {
	requestConsentCardFocus,
	useConsentStatus,
	useStatsAppNoticeMutation,
	useStatsAppNotices,
} from '@jetpack-premium-analytics/data';
import { Notice } from '@jetpack-premium-analytics/externals';
import {
	useReportNavigationSearch,
	useTrackEvent,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import styles from './visitor-consent-notice.module.scss';
import type { JSX } from 'react';

const NOTICE_ID = 'visitor_consent_setup';

const LEARN_MORE_URL = 'https://jetpack.com/support/jetpack-stats/';

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
		!! status &&
		! status.api_active &&
		! status.banner_blocks_stats &&
		( status.consent_type_declared || status.banner_plugin !== null );
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
 * @return The notice.
 */
export function VisitorConsentNotice(): JSX.Element {
	const bannerPlugin = useConsentStatus()?.banner_plugin;
	const navigate = useNavigate();
	const settingsSearch = useReportNavigationSearch();
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
		// Route types cannot resolve here.
		void navigate( { to: '/settings', search: settingsSearch } as unknown as never );
	}, [ trackEvent, navigate, settingsSearch ] );

	const recordLearnMoreClick = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_visitor_consent_notice_learn_more_click' );
	}, [ trackEvent ] );

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
								'Stats uses the free WP Consent API plugin to follow what visitors choose in %s. Until it’s active, Stats may count visitors who decline.',
								'jetpack-premium-analytics-pkg'
							),
							bannerPlugin
						)
					: __(
							'Stats uses the free WP Consent API plugin to follow what visitors choose in your cookie banner. Until it’s active, Stats may count visitors who decline.',
							'jetpack-premium-analytics-pkg'
						) }
			</Notice.Description>

			<Notice.Actions>
				<Notice.ActionButton variant="outline" onClick={ openSettings }>
					{ __( 'Set up', 'jetpack-premium-analytics-pkg' ) }
				</Notice.ActionButton>
				<Notice.ActionLink href={ LEARN_MORE_URL } openInNewTab onClick={ recordLearnMoreClick }>
					{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
				</Notice.ActionLink>
			</Notice.Actions>

			<Notice.CloseIconButton
				label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
				onClick={ dismiss }
			/>
		</Notice.Root>
	);
}
