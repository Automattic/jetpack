import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/**
 * Jetpack redirect slug for each reason's support doc.
 */
const LEARN_MORE_SLUGS = {
	host: 'jetpack-ai-hub-docs-wp-supports-ai',
	forced_off: 'jetpack-ai-hub-docs-module-forced-off',
};

/**
 * One message per reason, as separate `__()` calls in a lookup so the
 * minifier cannot fold them into one call with a non-literal message.
 *
 * @param {string} reason - 'host' or 'forced_off'.
 * @return {string} The message to show.
 */
const getMessage = reason => {
	const messages = {
		forced_off: __(
			'Jetpack AI is turned off by custom code running on this site, so it can’t be turned on here.',
			'jetpack'
		),
		host: __( 'Jetpack AI is not available for this site.', 'jetpack' ),
	};

	return messages[ reason === 'forced_off' ? 'forced_off' : 'host' ];
};

/**
 * Notice shown in place of the AI settings when nothing on this page can turn
 * Jetpack AI on: the host has switched AI off in WordPress, or a filter such
 * as a module allowlist keeps the `ai` module off.
 *
 * @param {object} props        - Component props.
 * @param {string} props.reason - 'host' or 'forced_off'.
 * @return {object} Component markup.
 */
export default function AiUnavailableNotice( { reason } ) {
	const slug = LEARN_MORE_SLUGS[ reason ] ?? LEARN_MORE_SLUGS.host;

	return (
		<Notice.Root intent="warning">
			<Notice.Description>
				{ getMessage( reason ) }{ ' ' }
				<ExternalLink href={ getRedirectUrl( slug ) }>
					{ __( 'Learn more', 'jetpack' ) }
				</ExternalLink>
			</Notice.Description>
		</Notice.Root>
	);
}
