import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Dialog, Stack } from '@wordpress/ui';
import { useCallback, useRef } from 'react';

type BlazeCampaignsWarningProps = {
	onKeep: () => void;
	onSwitchOff: () => void;
	onManageClick: () => void;
	manageUrl?: string;
};

/**
 * Where campaigns are managed: the page Features opens for Blaze, else WordPress.com.
 *
 * @param manageUrl - The page Features opens for Blaze, when it has one.
 * @return The link and whether it leaves wp-admin, or null when neither is available.
 */
function getCampaignsLink( manageUrl?: string ): { href: string; external: boolean } | null {
	if ( manageUrl ) {
		return { href: manageUrl, external: false };
	}

	const site = getScriptData()?.site?.suffix;

	return site ? { href: getRedirectUrl( 'jetpack-blaze', { site } ), external: true } : null;
}

/**
 * Asks before Blaze goes off while campaigns may still be running, since they keep billing.
 *
 * @param {BlazeCampaignsWarningProps} props               - Component props.
 * @param {Function}                   props.onKeep        - Closes the dialog, leaving Blaze on.
 * @param {Function}                   props.onSwitchOff   - Closes the dialog and switches Blaze off.
 * @param {Function}                   props.onManageClick - Closes the dialog as the visitor leaves to manage campaigns.
 * @param {string}                     props.manageUrl     - The page Features opens for Blaze, when it has one.
 * @return The dialog.
 */
export function BlazeCampaignsWarning( {
	onKeep,
	onSwitchOff,
	onManageClick,
	manageUrl,
}: BlazeCampaignsWarningProps ) {
	// Opens on the choice that changes nothing.
	const keepRef = useRef< HTMLButtonElement >( null );
	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onKeep();
			}
		},
		[ onKeep ]
	);
	const campaigns = getCampaignsLink( manageUrl );

	return (
		<Dialog.Root open onOpenChange={ onOpenChange }>
			<Dialog.Popup size="small" initialFocus={ keepRef }>
				<Dialog.Header>
					<Dialog.Title>
						{ __( 'Active Blaze campaigns are still running', 'jetpack-my-jetpack' ) }
					</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<Dialog.Description>
						{ __(
							'Disabling this setting only hides the Blaze interface. Your campaigns will continue to serve ads, and you will continue to be charged. To stop your campaigns, open campaign management.',
							'jetpack-my-jetpack'
						) }
					</Dialog.Description>
				</Dialog.Content>
				<Dialog.Footer>
					<Stack direction="row" gap="sm" justify="end" wrap="wrap">
						<Button variant="minimal" onClick={ onSwitchOff }>
							{ __( 'Disable anyway', 'jetpack-my-jetpack' ) }
						</Button>
						{ campaigns && (
							<ButtonLink
								variant="outline"
								href={ campaigns.href }
								openInNewTab={ campaigns.external }
								onClick={ onManageClick }
							>
								{ __( 'Manage campaigns', 'jetpack-my-jetpack' ) }
							</ButtonLink>
						) }
						<Dialog.Action ref={ keepRef }>
							{ __( 'Keep Blaze enabled', 'jetpack-my-jetpack' ) }
						</Dialog.Action>
					</Stack>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
