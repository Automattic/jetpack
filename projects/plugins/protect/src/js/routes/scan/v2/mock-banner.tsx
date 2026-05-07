/**
 * Dev-only banner that lights up when the Protect Scan v2 surface is
 * running against fixture data via `?jpprotect-mock=1`. Mirrors
 * `packages/scan/src/js/mock-banner.tsx`. Renders nothing in normal
 * (non-mock) page loads.
 */
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isProtectMockMode } from './data/mock';

/**
 * Renders a non-dismissible warning notice when Protect's mock mode is
 * active, so engineers can't mistake fixture data for real scan results.
 *
 * @return The mock-mode banner, or `null` when mock mode is off.
 */
export default function MockBanner() {
	if ( ! isProtectMockMode() ) {
		return null;
	}
	return (
		<Notice status="warning" isDismissible={ false }>
			{ __(
				'Dev mode (?jpprotect-mock=1) — fixtures only, no server requests.',
				'jetpack-protect'
			) }
		</Notice>
	);
}
