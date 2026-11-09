import { speak } from '@wordpress/a11y';
import { resolveSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { useAnnounceRecordChanges } from '../../../components/onboarding/steps/checklist';
import { useDnsPolling } from '../../../components/onboarding/use-dns-polling';
import { saveOnboarding } from '../../../data/api';
import { DEFAULT_STATS_PERIOD, periodKey } from '../../../data/period';
import { sendStore } from '../../../data/store';
import { fromAddress } from '../setup-step';
import ConnectTask from './connect-task';
import InboxPreview from './inbox-preview';
import {
	TASK_IDS,
	completedCount,
	headingDomain,
	isTemporaryDomain,
	nextIncompleteId,
	taskStates,
} from './model';
import { withPendingMerge } from './records';
import SenderTask, { inferSender } from './sender-task';
import { focusTaskCard, taskCardId } from './task-card';
import TestTask from './test-task';
import { useTestEmail } from './use-test-email';
import type { LocalTest, TaskId, TaskStates } from './model';
import type { SenderDraft } from './sender-task';
import type { SendStatus } from '../../../data/types';
import './style.scss';

/** How long task 2 stays open with both records found before the test opens, so the change shows. */
export const CONNECTED_HOLD_MS = 1200;

type Props = {
	status: SendStatus;
	/** Setup is finished: swap to the Overview for a site that's sending. */
	onFinish: () => void;
};

/**
 * Which card opens first: the first one left to do, else the test, which holds the result.
 *
 * @param states - States by task.
 * @return The task to open.
 */
function firstOpen( states: TaskStates ): TaskId {
	return nextIncompleteId( states ) ?? 'test';
}

/**
 * Send › Overview while setup isn't finished: three tasks beside a preview of the inbox.
 *
 * @param props          - Component props.
 * @param props.status   - Send status.
 * @param props.onFinish - Called once Finish setup has saved.
 * @return The page.
 */
const SetupPage = ( { status, onFinish }: Props ) => {
	const { receiveStatus } = useDispatch( sendStore );
	const account = status.account;
	const domain = account?.domain ?? status.suggested_domain;

	const rawPolling = useDnsPolling( { enabled: !! account && ! status.can_enable, mode: 'setup' } );
	const existingLockdown = account?.dns_host?.existing?.lockdown;
	const lookup = useMemo(
		() => withPendingMerge( rawPolling.lookup, existingLockdown ),
		[ rawPolling.lookup, existingLockdown ]
	);
	const polling = { ...rawPolling, lookup };
	useAnnounceRecordChanges( polling.lookup );
	const test = useTestEmail( domain, status.provisioner === 'local' );
	let localTest: LocalTest = null;
	if ( test.state.phase === 'sent' ) {
		localTest = 'sent';
	} else if ( test.state.phase === 'failed' ) {
		localTest = 'failed';
	}
	const states = taskStates( status, polling.lookup, localTest );
	const completed = completedCount( states );
	const allDone = completed === TASK_IDS.length;

	// The dashboard mounts right after Finish setup, so have its first period ready.
	useEffect( () => {
		if ( allDone ) {
			resolveSelect( sendStore )
				.getStats( periodKey( DEFAULT_STATS_PERIOD ) )
				.catch( () => undefined );
		}
	}, [ allDone ] );

	const [ openId, setOpenId ] = useState< TaskId | null >( () => firstOpen( states ) );
	const pendingFocus = useRef< TaskId | null >( null );
	const [ skipping, setSkipping ] = useState( false );
	const [ draft, setDraft ] = useState< SenderDraft | null >( null );
	const [ finishing, setFinishing ] = useState( false );

	const openChange = useCallback(
		( id: TaskId ) => ( isOpen: boolean ) => setOpenId( isOpen ? id : null ),
		[]
	);

	// Server-caused changes open the next card but don't move focus, unless focus sat inside the
	// card that closes: then it goes to that card's header, so it isn't lost to the page.
	const openNow = useRef( openId );
	openNow.current = openId;
	const openFromServer = useCallback( ( next: TaskId ) => {
		const closing = openNow.current;
		if ( closing && closing !== next ) {
			const card = document.getElementById( taskCardId( closing ) );
			const active = card?.ownerDocument.activeElement;
			const header = card?.querySelector( '[aria-expanded]' );
			if ( card && active && card.contains( active ) && ! header?.contains( active ) ) {
				window.requestAnimationFrame( () => focusTaskCard( closing ) );
			}
		}
		setOpenId( next );
	}, [] );
	const previous = useRef( states );
	const holdTimer = useRef< number | null >( null );
	useEffect(
		() => () => {
			if ( holdTimer.current ) {
				window.clearTimeout( holdTimer.current );
			}
		},
		[]
	);
	useEffect( () => {
		const before = previous.current;
		previous.current = states;
		if ( before.connect !== 'done' && states.connect === 'done' ) {
			speak(
				status.settings.enabled
					? sprintf(
							/* translators: %s: the sending domain. */
							__( '%s is connected. Sending is on.', 'jetpack-send-pkg' ),
							domain
						)
					: sprintf(
							/* translators: %s: the sending domain. */
							__( '%s is connected.', 'jetpack-send-pkg' ),
							domain
						)
			);
			const next = states.test === 'locked' ? 'connect' : 'test';
			if ( holdTimer.current ) {
				window.clearTimeout( holdTimer.current );
			}
			holdTimer.current = window.setTimeout( () => {
				holdTimer.current = null;
				openFromServer( next );
			}, CONNECTED_HOLD_MS );
		} else if ( before.test === 'locked' && states.test !== 'locked' ) {
			speak( __( 'Sending is on.', 'jetpack-send-pkg' ) );
			openFromServer( 'test' );
		}
	}, [ states, domain, status.settings.enabled, openFromServer ] );

	useEffect( () => {
		if ( pendingFocus.current && openId === pendingFocus.current ) {
			const id = pendingFocus.current;
			pendingFocus.current = null;
			window.requestAnimationFrame( () => focusTaskCard( id ) );
		}
	}, [ openId ] );

	const onSetUp = useCallback( () => {
		pendingFocus.current = 'connect';
		setOpenId( 'connect' );
	}, [] );

	const onSkip = useCallback( () => {
		setSkipping( true );
		saveOnboarding( { closed: true } )
			.then( next => {
				receiveStatus( next );
				speak( __( 'Test skipped. Setup is done.', 'jetpack-send-pkg' ) );
			} )
			.catch( () => undefined )
			.finally( () => setSkipping( false ) );
	}, [ receiveStatus ] );

	const onFinishSetup = useCallback( () => {
		setFinishing( true );
		saveOnboarding( { closed: true, verified_seen: true } )
			.then( receiveStatus )
			// The page still swaps; a failed save only means setup shows again next time.
			.catch( () => undefined )
			.finally( onFinish );
	}, [ receiveStatus, onFinish ] );

	const shownDomain = headingDomain( status );
	let heading: string;
	if ( allDone ) {
		heading = sprintf(
			/* translators: %s: the sending domain. */
			__( '%s is sending', 'jetpack-send-pkg' ),
			domain
		);
	} else if ( shownDomain ) {
		heading = sprintf(
			/* translators: %s: the sending domain. */
			__( 'Send your site’s emails from %s', 'jetpack-send-pkg' ),
			shownDomain
		);
	} else {
		heading = __( 'Send your site’s emails from your own domain', 'jetpack-send-pkg' );
	}

	const inferred = inferSender( status );
	const savedAddress = account
		? fromAddress( status )
		: ! isTemporaryDomain( inferred.domain ) && `${ inferred.localPart }@${ inferred.domain }`;
	// While Change is open the preview follows what's typed.
	const previewAddress = draft ? draft.address : savedAddress;
	const previewName = draft ? draft.name : status.settings.from_name || status.site_title;

	return (
		<div className="jetpack-send-setup">
			<Stack
				direction="column"
				gap="sm"
				render={ <header /> }
				className="jetpack-send-setup__heading"
			>
				<Text variant="heading-2xl" render={ <h2 /> }>
					{ heading }
				</Text>
				<Text variant="body-lg" render={ <p role="status" /> } className="jetpack-send-setup__weak">
					{ sprintf(
						/* translators: 1: tasks completed, 2: total tasks. */
						__( '%1$d of %2$d completed', 'jetpack-send-pkg' ),
						completed,
						TASK_IDS.length
					) }
				</Text>
			</Stack>
			{ /* A grid, not a Stack: it turns into one column at a breakpoint, which Stack's inline styles can't. */ }
			<div className="jetpack-send-setup__columns">
				<Stack direction="column" gap="lg" className="jetpack-send-setup__main">
					<Stack direction="column" gap="sm" className="jetpack-send-setup__tray">
						<SenderTask
							status={ status }
							state={ states.sender }
							open={ openId === 'sender' }
							onOpenChange={ openChange( 'sender' ) }
							onSetUp={ onSetUp }
							onDraftChange={ setDraft }
						/>
						<ConnectTask
							status={ status }
							state={ states.connect }
							polling={ polling }
							open={ openId === 'connect' }
							onOpenChange={ openChange( 'connect' ) }
						/>
						<TestTask
							status={ status }
							state={ states.test }
							test={ test }
							open={ openId === 'test' }
							onOpenChange={ openChange( 'test' ) }
							onSkip={ onSkip }
							skipping={ skipping }
						/>
					</Stack>
					{ /* One way forward: the dashboard already shows the test as its first recent email. The div keeps the button as wide as its label. */ }
					{ allDone && (
						<div>
							<Button
								variant="solid"
								onClick={ onFinishSetup }
								loading={ finishing }
								loadingAnnouncement={ __( 'Opening your dashboard…', 'jetpack-send-pkg' ) }
							>
								{ __( 'Go to your dashboard', 'jetpack-send-pkg' ) }
							</Button>
						</div>
					) }
				</Stack>
				<InboxPreview
					fromName={ previewName }
					fromAddress={ previewAddress || '' }
					avatarUrl={
						previewAddress && status.sender_avatar?.email === previewAddress
							? status.sender_avatar.url
							: null
					}
					siteIconUrl={ status.site_icon_url }
					siteTitle={ status.site_title }
					sending={ !! account && status.settings.enabled }
					fallback={ status.settings.fallback }
					done={ allDone }
				/>
			</div>
		</div>
	);
};

export default SetupPage;
