import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Button, ButtonLink, Notice, Text } from '@wordpress/ui';
import { removeQueryArgs } from '@wordpress/url';
import { useEffect, useState } from 'react';
import { TransferActivationModal } from './activation-modal.tsx';
import { Callout } from './callout.tsx';
import { needsConfirmation } from './eligibility.ts';
import { pollFeatureArrival } from './feature-arrival.ts';
import { useFeature } from './feature-context.ts';
import { upsell } from './icons.tsx';
import { ViewTracker, useTracks } from './tracks.ts';
import type { InitialState } from './types.ts';

/** Matches WPCOM_Hosting_Feature_Page::CHECKOUT_ARG. */
const CHECKOUT_ARG = 'checkout';

/**
 * Reload without the checkout flag, so the page shows whatever the plan now allows rather than waiting again.
 */
function reloadWithoutCheckoutArg() {
	window.location.replace( removeQueryArgs( window.location.href, CHECKOUT_ARG ) );
}

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

/**
 * Shown to a WoA buyer back from checkout until the purchase reaches the site, which then reloads into the feature.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function CheckoutPendingScreen( { state }: { state: InitialState } ) {
	const { icon, illustration, checkoutPending } = useFeature();
	const { tracksFeatureId, recordTracksEvent } = useTracks();
	const [ timedOut, setTimedOut ] = useState( false );
	const path = state.featureStatusPath;
	const timedOutMessage = __(
		'This is taking longer than usual. Try reloading the page in a minute, or contact our support team if it still hasn’t updated.',
		'jetpack-mu-wpcom'
	);

	useEffect( () => {
		const controller = new AbortController();
		const hasFeature = async () =>
			!! path && ( await apiFetch< { hasFeature: boolean } >( { path } ) ).hasFeature;

		pollFeatureArrival( hasFeature, { signal: controller.signal } ).then(
			( { arrived, elapsedMs, failures } ) => {
				if ( controller.signal.aborted ) {
					return;
				}

				recordTracksEvent( 'calypso_dashboard_hosting_feature_checkout_sync', {
					feature_id: tracksFeatureId,
					arrived,
					elapsed_ms: elapsedMs,
					error_count: failures,
				} );

				if ( arrived ) {
					reloadWithoutCheckoutArg();
				} else {
					setTimedOut( true );
				}
			}
		);

		return () => controller.abort();
	}, [ path, recordTracksEvent, tracksFeatureId ] );

	useEffect( () => {
		if ( timedOut ) {
			speak( timedOutMessage );
		}
	}, [ timedOut, timedOutMessage ] );

	return (
		<>
			<ViewTracker
				eventName="calypso_dashboard_hosting_feature_checkout_pending_impression"
				properties={ { feature_id: tracksFeatureId } }
			/>
			{ timedOut && (
				<Notice.Root intent="warning">
					<Notice.Description>{ timedOutMessage }</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink href={ state.supportUrl } openInNewTab>
							{ __( 'Contact support', 'jetpack-mu-wpcom' ) }
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			) }
			<Callout
				icon={ icon }
				title={ checkoutPending.title }
				image={ illustration }
				description={ <Text>{ checkoutPending.description }</Text> }
				actions={
					timedOut && (
						<Button variant="solid" size="compact" onClick={ reloadWithoutCheckoutArg }>
							{ __( 'Reload', 'jetpack-mu-wpcom' ) }
						</Button>
					)
				}
			/>
		</>
	);
}

/**
 * Shown on WoA when the site has the plan but turned the Jetpack plugin's dashboard off.
 *
 * @param props       - Component props.
 * @param props.state - Resolved initial state.
 * @return The rendered prompt.
 */
export function EnableScreen( { state }: { state: InitialState } ) {
	const { icon, illustration, enable } = useFeature();
	const { tracksFeatureId, recordTracksEvent } = useTracks();

	if ( ! enable || ! state.enableUrl ) {
		return null;
	}

	const tracksProps = { feature_id: tracksFeatureId, enable_error: state.enableError ?? null };

	return (
		<>
			<ViewTracker
				eventName="calypso_dashboard_hosting_feature_enable_impression"
				properties={ tracksProps }
			/>
			{ state.enableError && (
				<Notice.Root intent="error">
					<Notice.Description>
						{ 'connection' === state.enableError ? enable.connectionFailed : enable.failed }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink href={ state.supportUrl } openInNewTab>
							{ __( 'Contact support', 'jetpack-mu-wpcom' ) }
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			) }
			<Callout
				icon={ icon }
				title={ enable.title }
				image={ illustration }
				description={ <Text>{ enable.description }</Text> }
				actions={
					<ButtonLink
						variant="solid"
						size="compact"
						href={ state.enableUrl }
						onClick={ () =>
							recordTracksEvent( 'calypso_dashboard_hosting_feature_enable_click', tracksProps )
						}
					>
						{ enable.action }
					</ButtonLink>
				}
			/>
		</>
	);
}
