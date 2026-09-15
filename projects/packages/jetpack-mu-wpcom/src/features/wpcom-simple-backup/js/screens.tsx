import { Button, Card, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import type { InitialState } from './types.ts';

/**
 * Shared card shell for every prompt.
 *
 * Mirrors the Jetpack plugin's own gate screens in
 * `packages/backup/src/dashboard/components/gates/`.
 *
 * @param props          - Component props.
 * @param props.title    - Heading for the prompt.
 * @param props.children - Prompt body.
 * @return The rendered card.
 */
function PromptCard( { title, children }: { title: string; children: React.ReactNode } ) {
	return (
		<Card className="wpcom-simple-backup__card">
			<Stack direction="column" gap="md" align="center">
				<Text variant="heading-md" render={ <h2 /> }>
					{ title }
				</Text>
				{ children }
			</Stack>
		</Card>
	);
}

/**
 * Shown when the site's plan does not include backups.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function UpgradeScreen( { state }: { state: InitialState } ) {
	return (
		<PromptCard title={ __( 'Back up your site automatically', 'jetpack-mu-wpcom' ) }>
			<Text>
				{ __(
					'Save every change and restore your site to any point in the past with a single click.',
					'jetpack-mu-wpcom'
				) }
			</Text>
			<Notice status="info" isDismissible={ false }>
				{ __( 'Backups are not included in your current plan.', 'jetpack-mu-wpcom' ) }
			</Notice>
			<Button variant="primary" href={ state.upgradeUrl }>
				{ __( 'Upgrade your plan', 'jetpack-mu-wpcom' ) }
			</Button>
		</PromptCard>
	);
}

/**
 * Shown when the site has a backup-capable plan and can be transferred.
 *
 * The button leaves wp-admin: activation opens a transfer flow only Calypso can
 * host, so this is a hand-off rather than a replacement.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function ActivateScreen( { state }: { state: InitialState } ) {
	return (
		<PromptCard title={ __( 'Activate backups for this site', 'jetpack-mu-wpcom' ) }>
			<Text>
				{ __(
					'Your plan includes backups. To switch them on, your site needs to move to our hosting platform.',
					'jetpack-mu-wpcom'
				) }
			</Text>
			<Text>
				{ __(
					'Your site stays online during the move, and its address does not change.',
					'jetpack-mu-wpcom'
				) }
			</Text>
			<Button variant="primary" href={ state.activateUrl }>
				{ __( 'Activate backups', 'jetpack-mu-wpcom' ) }
			</Button>
		</PromptCard>
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
		<PromptCard title={ __( 'Setting up backups', 'jetpack-mu-wpcom' ) }>
			<Text>
				{ __(
					'Your site is being moved to our hosting platform so backups can be switched on.',
					'jetpack-mu-wpcom'
				) }
			</Text>
			<Notice status="info" isDismissible={ false }>
				{ __(
					'This usually takes a few minutes. You can keep using your site while it happens, and we will email you when it is done.',
					'jetpack-mu-wpcom'
				) }
			</Notice>
		</PromptCard>
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
		<PromptCard title={ __( 'Backups are not available yet', 'jetpack-mu-wpcom' ) }>
			<Text>
				{ __(
					'Your plan includes backups, but this site cannot be moved to our hosting platform yet.',
					'jetpack-mu-wpcom'
				) }
			</Text>
			{ state.blockers.length > 0 && (
				<Stack
					render={ <ul className="wpcom-simple-backup__blockers" /> }
					direction="column"
					gap="sm"
				>
					{ state.blockers.map( blocker => (
						<li key={ blocker }>
							<Text>{ blocker }</Text>
						</li>
					) ) }
				</Stack>
			) }
			<Button
				variant="secondary"
				href={ state.supportUrl }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about backups', 'jetpack-mu-wpcom' ) }
			</Button>
		</PromptCard>
	);
}
