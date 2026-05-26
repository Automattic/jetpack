import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
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
 * The `__empty` wrapper centers the icon/title/description/CTA stack on
 * the card's centerline, mirroring the Overview tab's no-connections
 * state so the two tabs read consistently. The CTA navigates via
 * `onClick` rather than `render={ <a> }`: a `solid` button rendered as
 * an anchor inherits wp-admin's global link color over its own white
 * label, leaving the text near-invisible on the blue fill.
 *
 * @return The empty-state body.
 */
export default function PublicizeInactiveEmptyState(): JSX.Element {
	const onManageModules = useCallback( () => {
		window.location.href = getAdminUrl( 'admin.php?page=jetpack#/sharing' );
	}, [] );

	return (
		<div className="jetpack-social-settings__empty">
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
					<Button variant="solid" onClick={ onManageModules }>
						{ __( 'Manage modules', 'jetpack-publicize-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		</div>
	);
}
