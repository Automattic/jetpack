import { __ } from '@wordpress/i18n';
import type { VerificationKey } from './settings-types';
import type { SiteVerifyStatus } from './site-verify-types';

/** The verification services with a WordPress.com keyring flow. */
export type SiteVerifyKey = Extract< VerificationKey, 'google' | 'bing' >;

export interface SiteVerifyService {
	key: SiteVerifyKey;
	/** Bootstrap key under `window.JetpackScriptData.seo`. */
	scriptDataKey: 'google_verify' | 'bing_verify';
	/** Jetpack route, used unless the bootstrap supplies a host-local `api_path`. */
	endpoint: string;
	/** Snackbar id reused across a verify, so the progress toast is replaced in place by the result. */
	noticeId: string;
	/** Status field holding the link to the service's own dashboard. */
	toolsUrlField: Extract< keyof SiteVerifyStatus, `${ string }_url` >;
	strings: {
		verify: string;
		codeLabel: string;
		/** Accepts a whole pasted meta tag or a bare code, like the code-only services' hints. */
		manualHelp: string;
		toolsLink: string;
		verifying: string;
		verified: string;
		noToken: string;
		notVerified: string;
	};
}

export const SITE_VERIFY_SERVICES: Record< SiteVerifyKey, SiteVerifyService > = {
	google: {
		key: 'google',
		scriptDataKey: 'google_verify',
		endpoint: '/jetpack/v4/verify-site/google',
		noticeId: 'jetpack-seo-google-verify',
		toolsUrlField: 'google_search_console_url',
		strings: {
			verify: __( 'Verify with Google', 'jetpack-seo' ),
			codeLabel: __( 'Google verification code', 'jetpack-seo' ),
			manualHelp: __(
				'Paste the verification tag from Google Search Console, or just the code inside it.',
				'jetpack-seo'
			),
			toolsLink: __( 'View in Google Search Console', 'jetpack-seo' ),
			verifying: __( 'Verifying with Google…', 'jetpack-seo' ),
			verified: __( 'Your site is verified with Google.', 'jetpack-seo' ),
			noToken: __(
				'Google did not return a verification token for this account. Try another account, or enter a code manually.',
				'jetpack-seo'
			),
			notVerified: __(
				"Google couldn't verify this site. Make sure the Google account you used has access to it in Search Console.",
				'jetpack-seo'
			),
		},
	},
	bing: {
		key: 'bing',
		scriptDataKey: 'bing_verify',
		endpoint: '/jetpack/v4/verify-site/bing',
		noticeId: 'jetpack-seo-bing-verify',
		toolsUrlField: 'webmaster_tools_url',
		strings: {
			verify: __( 'Connect Bing', 'jetpack-seo' ),
			codeLabel: __( 'Bing verification code', 'jetpack-seo' ),
			manualHelp: __(
				'Paste the verification tag from Bing Webmaster Tools, or just the code inside it.',
				'jetpack-seo'
			),
			toolsLink: __( 'View in Bing Webmaster Tools', 'jetpack-seo' ),
			verifying: __( 'Connecting to Bing…', 'jetpack-seo' ),
			verified: __( 'Your site is verified with Bing.', 'jetpack-seo' ),
			noToken: __(
				'Bing did not return a verification code for this account. Try another account, or enter a code manually.',
				'jetpack-seo'
			),
			notVerified: __(
				"Bing couldn't verify this site. Try again, or enter a code manually.",
				'jetpack-seo'
			),
		},
	},
};
