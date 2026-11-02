import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Notice, Text } from '@wordpress/ui';
import { useState } from 'react';
import { TransferActivationModal } from './activation-modal.tsx';
import { Callout } from './callout.tsx';
import { needsConfirmation } from './eligibility.ts';
import { useFeature } from './feature-context.ts';
import { upsell } from './icons.tsx';
import { ViewTracker, useTracks } from './tracks.ts';
import type { InitialState } from './types.ts';

/**
 * Shown when the site's plan does not include the feature.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function UpgradeScreen( { state }: { state: InitialState } ) {
	const { icon, illustration, upgrade, UpgradeExtra } = useFeature();
	const { tracksFeatureId, recordTracksEvent } = useTracks();
	const upsellProps = { upsell_id: tracksFeatureId, upsell_feature_id: tracksFeatureId };

	return (
		<>
			<Callout
				icon={ icon }
				title={ upgrade.title }
				image={ illustration }
				description={ <Text>{ upgrade.description }</Text> }
				actions={
					<>
						<ViewTracker
							eventName="calypso_dashboard_upsell_impression"
							properties={ upsellProps }
						/>
						<ButtonLink
							variant="solid"
							size="compact"
							href={ state.upgradeUrl }
							onClick={ () => {
								recordTracksEvent( 'calypso_dashboard_upsell_click', upsellProps );
								// Checkout treats any tab with an opener as its popup and won't navigate back.
								window.opener = null;
							} }
						>
							<ButtonLink.Icon icon={ upsell } />
							{ __( 'Upgrade plan', 'jetpack-mu-wpcom' ) }
						</ButtonLink>
					</>
				}
			/>
			{ UpgradeExtra && <UpgradeExtra state={ state } /> }
		</>
	);
}

/**
 * Shown when the site has a plan that includes the feature and can be transferred.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function ActivateScreen( { state }: { state: InitialState } ) {
	const { icon, illustration, activate } = useFeature();
	const { tracksFeatureId, recordTracksEvent, recordActivationConfirm } = useTracks();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	// A site with nothing to surface can start the transfer directly; the modal
	// exists to explain errors and confirm warnings, so it would be empty.
	const showModalFirst = needsConfirmation( state.isEligible, state.errors, state.warnings );

	const handleClick = () => {
		recordTracksEvent( 'calypso_dashboard_hosting_feature_activation_click', {
			feature_id: tracksFeatureId,
			show_modal: showModalFirst,
		} );

		if ( showModalFirst ) {
			setIsModalOpen( true );
		} else {
			recordActivationConfirm();
		}
	};

	return (
		<>
			<ViewTracker
				eventName="calypso_dashboard_hosting_feature_activation_impression"
				properties={ { feature_id: tracksFeatureId } }
			/>
			{ state.transferFailed && (
				<Notice.Root intent="error">
					<Notice.Description>{ activate.failed }</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink href={ state.supportUrl } openInNewTab>
							{ __( 'Contact support', 'jetpack-mu-wpcom' ) }
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			) }
			<Callout
				icon={ icon }
				title={ activate.title }
				image={ illustration }
				description={
					<>
						<Text>{ activate.description }</Text>
						<Text>{ __( 'Your site stays online during the move.', 'jetpack-mu-wpcom' ) }</Text>
					</>
				}
				actions={
					showModalFirst || state.transferFailed ? (
						<Button
							variant="solid"
							size="compact"
							disabled={ state.transferFailed }
							onClick={ handleClick }
						>
							{ activate.action }
						</Button>
					) : (
						<ButtonLink
							variant="solid"
							size="compact"
							href={ state.activateUrl }
							onClick={ handleClick }
						>
							{ activate.action }
						</ButtonLink>
					)
				}
			/>
			{ isModalOpen && (
				<TransferActivationModal
					isEligible={ state.isEligible }
					errors={ state.errors }
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
	const { icon, illustration, inProgress } = useFeature();
	const { tracksFeatureId } = useTracks();

	return (
		<>
			<ViewTracker
				eventName="calypso_dashboard_hosting_transfer_in_progress_impression"
				properties={ { feature_id: tracksFeatureId } }
			/>
			<Callout
				icon={ icon }
				title={ inProgress.title }
				image={ illustration }
				description={
					<>
						<Text>{ inProgress.description }</Text>
						<Text>
							{ __(
								'This usually takes a few minutes. You can keep using your site while it happens, and we will email you when it is done.',
								'jetpack-mu-wpcom'
							) }
						</Text>
					</>
				}
			/>
		</>
	);
}
