import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import SupportLink from './support-link';
import type { IdentityCrisisErrorNoticeProps } from './types';
import type { IdentityCrisisErrorCause } from '../../hooks/use-identity-crisis-actions/types';
import type { ReactNode } from 'react';

/**
 * What to tell the user about a failed Safe Mode request.
 *
 * @param cause - Why it failed.
 * @return The message.
 */
function getIdentityCrisisErrorMessage( cause: IdentityCrisisErrorCause ): string {
	switch ( cause ) {
		// The offline, blocked and session strings match `getConnectScreenErrorMessage()`, so they translate once.
		case 'offline':
			return __(
				'Your browser couldn’t complete the request to your site. A firewall, CDN or redirect may be interfering. Reload the page and try again.',
				'jetpack-connection-js'
			);
		case 'blocked':
			return __(
				'Your site’s REST API couldn’t be reached. A security plugin or server rule may be blocking it.',
				'jetpack-connection-js'
			);
		case 'output':
			return __(
				'Your site sent an unexpected response. Another plugin or a PHP error may be adding extra output; your site’s error log, or temporarily deactivating other plugins, can show which.',
				'jetpack-connection-js'
			);
		case 'session':
			return __( 'Your session expired. Reload the page and try again.', 'jetpack-connection-js' );
		case 'permission':
			return __(
				'You don’t have permission to do this. Ask a site administrator.',
				'jetpack-connection-js'
			);
		case 'server':
			return __(
				'Your site’s server ran into a problem. Try again in a few minutes.',
				'jetpack-connection-js'
			);
		default: {
			// Fails to compile when a cause is added without a message.
			const unhandled: never = cause;
			return unhandled;
		}
	}
}

/**
 * The failure of a Safe Mode request, with a link to support.
 *
 * @param {IdentityCrisisErrorNoticeProps} props - Component props.
 * @return {ReactNode} The notice, or null without a matching error.
 */
export default function IdentityCrisisErrorNotice( {
	error,
	action,
}: IdentityCrisisErrorNoticeProps ): ReactNode {
	if ( ! error || ( action && error.action !== action ) ) {
		return null;
	}

	return (
		// `politeness` only takes effect inside `Notice.List`; an alert is announced when it appears.
		<Notice.Root intent="error" role="alert">
			<Notice.Description>
				{ getIdentityCrisisErrorMessage( error.cause ) }{ ' ' }
				{ createInterpolateElement(
					__( '<link>Get help with Safe Mode</link>', 'jetpack-connection-js' ),
					{ link: <SupportLink /> }
				) }
			</Notice.Description>
		</Notice.Root>
	);
}
