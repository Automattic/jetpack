import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { getSupportUrl } from './support-url';
import type {
	IdentityCrisisAction,
	IdentityCrisisError,
	IdentityCrisisErrorCause,
} from '../../hooks/use-identity-crisis-actions/types';
import type { ReactNode } from 'react';

/**
 * What to tell the user about a failed Safe Mode request.
 *
 * @param cause - Why it failed.
 * @return The message.
 */
function getIdentityCrisisErrorMessage( cause: IdentityCrisisErrorCause ): string {
	switch ( cause ) {
		case 'offline':
			return __(
				'Your site couldn’t be reached. Check your internet connection and try again.',
				'jetpack-connection-js'
			);
		case 'blocked':
			return __(
				'Your site’s REST API didn’t respond. A security plugin, firewall or server rule may be blocking it.',
				'jetpack-connection-js'
			);
		case 'session':
			return __(
				'Your login session has expired. Reload the page and try again.',
				'jetpack-connection-js'
			);
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

interface IdentityCrisisErrorNoticeProps {
	error: IdentityCrisisError | null;
	/** Show only a failure of this action, e.g. next to that action's button. Omit to show any. */
	action?: IdentityCrisisAction;
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
		<Notice.Root intent="error" politeness="assertive">
			<Notice.Description>
				{ getIdentityCrisisErrorMessage( error.cause ) }{ ' ' }
				{ createInterpolateElement(
					__( '<link>Get help with Safe Mode</link>', 'jetpack-connection-js' ),
					{ link: <Link href={ getSupportUrl() } openInNewTab /> }
				) }
			</Notice.Description>
		</Notice.Root>
	);
}
