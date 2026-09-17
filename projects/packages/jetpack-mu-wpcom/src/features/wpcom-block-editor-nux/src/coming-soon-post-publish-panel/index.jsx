import { Button } from '@wordpress/components';
import { PluginPostPublishPanel } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

// Printed inline right before this bundle, so it is set by the time this runs.
const {
	isComingSoon = false,
	canChangeVisibility = false,
	settingsUrl = '',
} = window?.siteVisibilityPanelOptions ?? {};

// Core offers no slot for this header, and "is now live." is untrue on a Coming Soon site.
if ( isComingSoon ) {
	addFilter(
		'i18n.gettext_default',
		'jetpack-mu-wpcom/coming-soon-post-publish-header',
		( translation, text ) =>
			text === 'is now live.'
				? __( 'is published. Your site is still Coming Soon.', 'jetpack-mu-wpcom' )
				: translation
	);
}

/**
 * Point site managers to the Site visibility setting after publishing on a Coming Soon site.
 *
 * @return {import('react').JSX.Element|null} The panel, or null when it doesn't apply.
 */
export default function ComingSoonPostPublishPanel() {
	if ( ! isComingSoon || ! canChangeVisibility ) {
		return null;
	}

	return (
		<PluginPostPublishPanel
			title={ __( 'Site visibility', 'jetpack-mu-wpcom' ) }
			icon={ unseen }
			initialOpen
		>
			<p>{ __( 'Make your site public when you’re ready for visitors.', 'jetpack-mu-wpcom' ) }</p>
			<Button variant="secondary" href={ settingsUrl } target="_top">
				{ __( 'Change site visibility', 'jetpack-mu-wpcom' ) }
			</Button>
		</PluginPostPublishPanel>
	);
}
