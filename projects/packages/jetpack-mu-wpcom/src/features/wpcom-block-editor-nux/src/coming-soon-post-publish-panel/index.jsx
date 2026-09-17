import { isComingSoon } from '@automattic/jetpack-shared-extension-utils/site-type-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

// Core offers no slot for this header. Read the flag per call rather than once at import: the
// Jetpack script defining it isn't a dependency of this bundle, so it can run after this one.
addFilter(
	'i18n.gettext_default',
	'jetpack-mu-wpcom/coming-soon-post-publish-header',
	( translation, text ) =>
		text === 'is now live.' && isComingSoon()
			? __( 'is published. Your site is still Coming Soon.', 'jetpack-mu-wpcom' )
			: translation
);

/**
 * Point site managers to the Site visibility setting after publishing on a Coming Soon site.
 *
 * @return {import('react').JSX.Element|null} The panel, or null when it doesn't apply.
 */
export default function ComingSoonPostPublishPanel() {
	const canChangeVisibility = useSelect(
		select => isComingSoon() && select( 'core' ).canUser( 'update', 'settings' ),
		[]
	);

	if ( ! canChangeVisibility ) {
		return null;
	}

	return (
		<PluginPostPublishPanel
			title={ __( 'Site visibility', 'jetpack-mu-wpcom' ) }
			icon={ unseen }
			initialOpen
		>
			<p>{ __( 'Make your site public when you’re ready for visitors.', 'jetpack-mu-wpcom' ) }</p>
			<Button variant="secondary" href="./options-reading.php" target="_top">
				{ __( 'Change site visibility', 'jetpack-mu-wpcom' ) }
			</Button>
		</PluginPostPublishPanel>
	);
}
