import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { getSiteRequestFailureMessage } from '../../helpers/get-site-request-failure.ts';
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
		case 'disconnected':
			return __(
				'Your site couldn’t be registered with WordPress.com again, so it is now disconnected. Try again to connect it, or connect it later in Settings › Connectors, under Jetpack Connection.',
				'jetpack-connection-js'
			);
		case 'resolved':
			return __(
				'This site is no longer in Safe Mode, for example because it was resolved in another tab. Reload the page.',
				'jetpack-connection-js'
			);
		default:
			return getSiteRequestFailureMessage( cause );
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
