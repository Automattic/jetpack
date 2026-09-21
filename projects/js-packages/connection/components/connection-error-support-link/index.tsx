import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { ReactElement } from 'react';

/**
 * The "Contact Jetpack Support" line a connection error can ask for, via
 * `showSupportLink` (set server-side from `Error_Handler`'s `support_link`
 * display config) when reconnecting may not be the fix.
 *
 * Inline content only, with no block wrapper of its own: every notice places it
 * in whatever text element its own design system uses, and only the copy and the
 * destination have to be the same everywhere. Kept here rather than in each
 * notice so the two cannot drift, and so translators see one string.
 *
 * @return {ReactElement} The support line.
 */
export default function ConnectionErrorSupportLink(): ReactElement {
	return createInterpolateElement(
		__( 'Still having trouble? <link>Contact Jetpack Support</link>.', 'jetpack-connection-js' ),
		{
			link: <Link openInNewTab href={ getRedirectUrl( 'jetpack-support' ) } children={ null } />,
		}
	);
}
