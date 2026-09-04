import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';

/**
 * Site-wide notice shown on every AI Hub view while the master switch is off.
 *
 * @return {object} Component markup.
 */
export default function MasterOffNotice() {
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
