import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useState } from 'react';
import { Callout } from './callout.tsx';
import { upsell } from './icons.tsx';
import { backupsCalloutIllustration } from './illustration.ts';
import { TransferWarningsModal } from './transfer-warnings-modal.tsx';
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
				<Button variant="primary" size="compact" icon={ upsell } href={ state.upgradeUrl }>
					{ __( 'Upgrade plan', 'jetpack-mu-wpcom' ) }
				</Button>
			}
		/>
	);
}

/**
 * Shown when the site has a backup-capable plan and can be transferred.
 *
 * The button leaves wp-admin: activation opens a transfer flow only Calypso can
 * host, so this is a hand-off rather than a replacement. Warnings get a
 * confirmation step first, since one of them is that the address changes.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function ActivateScreen( { state }: { state: InitialState } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const hasWarnings = state.warnings.length > 0;

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
					hasWarnings ? (
						<Button variant="primary" size="compact" onClick={ () => setIsModalOpen( true ) }>
							{ __( 'Activate backups', 'jetpack-mu-wpcom' ) }
						</Button>
					) : (
						<Button variant="primary" size="compact" href={ state.activateUrl }>
							{ __( 'Activate backups', 'jetpack-mu-wpcom' ) }
						</Button>
					)
				}
			/>
			{ isModalOpen && (
				<TransferWarningsModal
					warnings={ state.warnings }
					activateUrl={ state.activateUrl }
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

/**
 * Shown when the plan includes backups but the site cannot be transferred yet.
 *
 * Without it the reader would get an "Activate" button opening a flow certain
 * to reject them, with no explanation.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function IneligibleScreen( { state }: { state: InitialState } ) {
	return (
		<Callout
			icon={ backup }
			title={ __( 'Backups are not available yet', 'jetpack-mu-wpcom' ) }
			image={ backupsCalloutIllustration }
			description={
				<>
					<Text>
						{ __(
							'Your plan includes backups, but this site cannot be moved to our hosting platform yet.',
							'jetpack-mu-wpcom'
						) }
					</Text>
					{ state.blockers.length > 0 && (
						<ul className="wpcom-simple-backup__blockers">
							{ state.blockers.map( blocker => (
								<Text key={ blocker } render={ <li /> }>
									{ blocker }
								</Text>
							) ) }
						</ul>
					) }
				</>
			}
			actions={
				<Button
					variant="secondary"
					size="compact"
					href={ state.supportUrl }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Learn more about backups', 'jetpack-mu-wpcom' ) }
				</Button>
			}
		/>
	);
}
