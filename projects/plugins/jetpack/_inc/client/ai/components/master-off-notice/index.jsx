import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';

/**
 * Site-wide notice shown on every AI Hub view while the master switch is off.
 *
 * @param {object} props          - Component props.
 * @param {object} props.settings - Settings shape from the feature-settings endpoint; null while loading.
 * @return {object|null} Component markup, or null while the switch is on or another gate is the blocker.
 */
export default function MasterOffNotice( { settings } ) {
	// Jetpack is not connected.
	if ( settings?.is_connected === false ) {
		return null;
	}

	// The host doesn't allow AI. 
	if ( settings?.host_allows_ai === false ) {
		return null;
	}

	// The master switch is on.
	if ( settings?.master_enabled !== false ) {
		return null;
	}

	return (
		<Notice.Root intent="warning" className="jetpack-ai-admin__page-notice">
			<Notice.Title>{ __( 'Jetpack AI is turned off for this site.', 'jetpack' ) }</Notice.Title>
			<Notice.Description>
				{ __(
					'Your feature settings are saved and will apply again when AI is turned back on.',
					'jetpack'
				) }{ ' ' }
				<Link href="admin.php?page=my-jetpack#/products" className="jetpack-ai-admin__notice-link">
					{ __( 'Manage in My Jetpack', 'jetpack' ) }
				</Link>
			</Notice.Description>
		</Notice.Root>
	);
}
