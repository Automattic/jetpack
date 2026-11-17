import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AlertDialog, SwitchControl } from '@wordpress/ui';
import type { LoginProtectionState } from './types';
import type { ProtectSettingsData } from '../../data/use-protect-settings';

/**
 * Why WordPress.com login can't be turned on, if it can't.
 *
 * @param login - This section's state from PHP.
 * @return The reason, or null when it can be used.
 */
export function getSsoBlocker( login: LoginProtectionState | undefined ): string | null {
	if ( login && ! login.sso.available ) {
		return __( 'WordPress.com login isn’t available on this site.', 'jetpack-protect-pkg' );
	}
	if ( login?.isOffline ) {
		return __( 'WordPress.com login isn’t available in Offline Mode.', 'jetpack-protect-pkg' );
	}
	if ( ! login?.ssoUsable ) {
		return __(
			'Needs the site owner’s WordPress.com account to be connected.',
			'jetpack-protect-pkg'
		);
	}
	return null;
}

/**
 * The WordPress.com login toggle, which asks before turning it off.
 *
 * @param props       - Component props.
 * @param props.data  - The settings and their save function.
 * @param props.login - This section's state from PHP.
 * @param props.label - The toggle's label.
 * @param props.help  - What it does, shown unless it can't be used.
 * @return The toggle.
 */
export default function SsoToggle( {
	data,
	login,
	label,
	help,
}: {
	data: ProtectSettingsData;
	login: LoginProtectionState | undefined;
	label: string;
	help: string;
} ) {
	const { save } = data;
	const blocker = getSsoBlocker( login );
	const [ confirmingOff, setConfirmingOff ] = useState( false );
	const onChange = useCallback(
		( value: boolean ) => ( value ? save( { sso: true } ) : setConfirmingOff( true ) ),
		[ save ]
	);
	// `save()` resolves to whether it worked; the dialog only needs to know it's done, then closes.
	const turnOff = useCallback( async () => {
		await save( { sso: false } );
	}, [ save ] );

	return (
		<>
			<SwitchControl
				label={ label }
				description={ blocker ?? help }
				checked={ Boolean( data.settings?.sso ) }
				// Mirrors Jetpack Settings, which locks the toggle without a connected owner.
				disabled={ blocker !== null || data.isSaving( 'sso' ) }
				onCheckedChange={ onChange }
			/>
			<AlertDialog.Root
				open={ confirmingOff }
				onOpenChange={ setConfirmingOff }
				onConfirm={ turnOff }
			>
				<AlertDialog.Popup
					title={ __( 'Turn off WordPress.com login (SSO)?', 'jetpack-protect-pkg' ) }
					description={ __(
						'Users will have to log in with their username and password on this site instead.',
						'jetpack-protect-pkg'
					) }
					confirmButtonText={ __( 'Turn off', 'jetpack-protect-pkg' ) }
				/>
			</AlertDialog.Root>
		</>
	);
}
