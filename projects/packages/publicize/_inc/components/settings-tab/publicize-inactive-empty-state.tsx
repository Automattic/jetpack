import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';
import { Button, EmptyState } from '@wordpress/ui';
import { useTurnOnSocial } from './turn-on-social-context';

/**
 * Shown on the Settings tab when the Social module is inactive AND the current
 * user can toggle it. Turns Social on in place: the chassis used to link out to
 * the wp-admin module-toggles surface (`admin.php?page=jetpack#/sharing`, per
 * umbrella decision #48824), but that page has no menu entry on WordPress.com
 * Atomic sites using the Calypso interface — a dead end. Enabling reloads the
 * page so the tabs, connection list and settings hydrate.
 *
 * The `__empty` wrapper centers the icon/title/description/CTA stack on the
 * card's centerline, mirroring the Overview tab's no-connections state so the
 * two tabs read consistently.
 *
 * @return The empty-state body.
 */
export default function PublicizeInactiveEmptyState(): JSX.Element {
	const { isEnabling, turnOn } = useTurnOnSocial();

	return (
		<div className="jetpack-social-settings__empty">
			<EmptyState.Root>
				<EmptyState.Icon icon={ share } />
				<EmptyState.Title>
					{ __( 'Auto-sharing is turned off', 'jetpack-publicize-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Turn on Social to connect your social accounts and automatically share your posts as you publish.',
						'jetpack-publicize-pkg'
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button variant="solid" disabled={ isEnabling } onClick={ turnOn }>
						{ isEnabling
							? __( 'Turning on Social…', 'jetpack-publicize-pkg' )
							: __( 'Turn on Social', 'jetpack-publicize-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		</div>
	);
}
