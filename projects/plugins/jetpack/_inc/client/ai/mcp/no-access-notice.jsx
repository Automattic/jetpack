import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/**
 * Shown when WordPress.com refuses this user on an otherwise working site.
 * Not an upsell: the plan may be fine, and a non-owner cannot buy one.
 *
 * @return {object} Component markup.
 */
export default function McpNoAccessNotice() {
	return (
		<Notice.Root intent="warning" className="jetpack-ai-admin__page-notice">
			<Notice.Title>
				{ __(
					'Your WordPress.com account does not have access to Jetpack AI on this site.',
					'jetpack'
				) }
			</Notice.Title>
			<Notice.Description>
				{ __(
					'Ask the site owner who connected Jetpack to give your account access, then reload this page.',
					'jetpack'
				) }
			</Notice.Description>
		</Notice.Root>
	);
}
