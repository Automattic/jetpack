import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';
import { Button, EmptyState } from '@wordpress/ui';

/**
 * Shown on the Settings tab when the Publicize module is inactive AND
 * the current user has the capability to flip it on. The chassis no
 * longer ships an in-product master toggle (umbrella decision #48824) —
 * product visibility lives on the wp-admin module-toggles surface — so
 * the empty state's job is to point admins at the place where they can
 * turn Publicize back on without leaving any breadcrumbs about a toggle
 * that's intentionally not present.
 *
 * @return The empty-state body.
 */
export default function PublicizeInactiveEmptyState(): JSX.Element {
	return (
		<EmptyState.Root>
			<EmptyState.Icon icon={ share } />
			<EmptyState.Title>
				{ __( 'Auto-sharing is turned off', 'jetpack-publicize-pkg' ) }
			</EmptyState.Title>
			<EmptyState.Description>
				{ __(
					"Turn the Publicize module on from Jetpack's module settings to customize how your posts are shared.",
					'jetpack-publicize-pkg'
				) }
			</EmptyState.Description>
			<EmptyState.Actions>
				<Button render={ <a href={ getAdminUrl( 'admin.php?page=jetpack#/settings' ) } /> }>
					{ __( 'Manage modules', 'jetpack-publicize-pkg' ) }
				</Button>
			</EmptyState.Actions>
		</EmptyState.Root>
	);
}
