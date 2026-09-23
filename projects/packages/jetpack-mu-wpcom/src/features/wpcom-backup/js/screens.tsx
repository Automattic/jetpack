import { __, sprintf } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { Button, LinkButton, Text } from '@wordpress/ui';
import { useState } from 'react';
import { TransferActivationModal } from './activation-modal.tsx';
import { Callout } from './callout.tsx';
import { needsConfirmation } from './eligibility.ts';
import { upsell } from './icons.tsx';
import { backupsCalloutIllustration } from './illustration.ts';
import type { InitialState } from './types.ts';

/**
 * Shown when the site's plan does not include backups.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function UpgradeScreen( { state }: { state: InitialState } ) {
	return (
		<Callout
			icon={ backup }
			title={ __( 'Secure your content with Jetpack Backups', 'jetpack-mu-wpcom' ) }
			image={ backupsCalloutIllustration }
			description={
				<>
					<Text>
						{ __(
							'Protect your site with scheduled and real-time backups—giving you the ultimate “undo” button and peace of mind that your content is always safe.',
							'jetpack-mu-wpcom'
						) }
					</Text>
					<Text>
						{ sprintf(
							/* translators: %1$s and %2$s are WordPress.com plan names, e.g. "Business" and "Commerce". */
							__( 'Available on the WordPress.com %1$s and %2$s plans.', 'jetpack-mu-wpcom' ),
							'Business',
							'Commerce'
						) }
					</Text>
				</>
			}
			actions={
				<LinkButton variant="solid" size="compact" href={ state.upgradeUrl }>
					<LinkButton.Icon icon={ upsell } />
					{ __( 'Upgrade plan', 'jetpack-mu-wpcom' ) }
				</LinkButton>
			}
		/>
	);
}

/**
 * Shown when the site has a backup-capable plan and can be transferred.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function ActivateScreen( { state }: { state: InitialState } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	// A site with nothing to surface can start the transfer directly; the modal
	// exists to explain errors and confirm warnings, so it would be empty.
	const showModalFirst = needsConfirmation( state.isEligible, state.errors, state.warnings );

	return (
		<>
			<Callout
				icon={ backup }
				title={ __( 'Activate backups for this site', 'jetpack-mu-wpcom' ) }
				image={ backupsCalloutIllustration }
				description={
					<>
						<Text>
							{ __(
								'Your plan includes backups. To switch them on, your site needs to move to our hosting platform.',
								'jetpack-mu-wpcom'
							) }
						</Text>
						<Text>{ __( 'Your site stays online during the move.', 'jetpack-mu-wpcom' ) }</Text>
					</>
				}
				actions={
					showModalFirst ? (
						<Button variant="solid" size="compact" onClick={ () => setIsModalOpen( true ) }>
							{ __( 'Activate backups', 'jetpack-mu-wpcom' ) }
						</Button>
					) : (
						<LinkButton variant="solid" size="compact" href={ state.activateUrl }>
							{ __( 'Activate backups', 'jetpack-mu-wpcom' ) }
						</LinkButton>
					)
				}
			/>
			{ isModalOpen && (
				<TransferActivationModal
					isEligible={ state.isEligible }
					errors={ state.errors }
					warnings={ state.warnings }
					activateUrl={ state.activateUrl }
					supportUrl={ state.supportUrl }
					onClose={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}

/**
 * Shown while a transfer to our hosting platform is already running or queued.
 *
 * Deliberately offers no call to action: starting a second transfer on top of a
 * running one is the failure this state exists to prevent.
 *
 * @return The rendered prompt.
 */
export function InProgressScreen() {
	return (
		<Callout
			icon={ backup }
			title={ __( 'Setting up backups', 'jetpack-mu-wpcom' ) }
			image={ backupsCalloutIllustration }
			description={
				<>
					<Text>
						{ __(
							'Your site is being moved to our hosting platform so backups can be switched on.',
							'jetpack-mu-wpcom'
						) }
					</Text>
					<Text>
						{ __(
							'This usually takes a few minutes. You can keep using your site while it happens, and we will email you when it is done.',
							'jetpack-mu-wpcom'
						) }
					</Text>
				</>
			}
		/>
	);
}
