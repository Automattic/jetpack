import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Button, Notice, Spinner, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import TextAction from '../../../components/text-action';
import { postDomainConnect, postWpcomDns } from '../../../data/api';
import type { SendStatus } from '../../../data/types';

export type AutoKind = 'oneclick' | 'wpcom';

const startDomainConnect = postDomainConnect;
const addWithWpcomDns = postWpcomDns;

/** Nothing found this long after the approval window closed means it closed without approving. */
export const APPROVAL_GRACE = 2 * 60 * 1000;

type AutoAddPanelProps = {
	kind: AutoKind;
	providerName: string;
	verified: boolean;
	/** The server returned a new status. */
	onStatus: ( status: SendStatus ) => void;
	/** Something changed at the provider; check again soon. */
	onNudge: () => void;
	/** Switch to adding them by hand, with an optional notice explaining why. */
	onManual: ( notice?: string ) => void;
};

type AutoPhase = 'idle' | 'working' | 'waiting' | 'blocked' | 'closed' | 'added';

/**
 * Add both records without copying them: Domain Connect, or WordPress.com DNS.
 *
 * @param props              - Component props.
 * @param props.kind         - Which route.
 * @param props.providerName - Where the domain is managed.
 * @param props.verified     - The records passed.
 * @param props.onStatus     - The server returned a new status.
 * @param props.onNudge      - Check again soon.
 * @param props.onManual     - Switch to adding them by hand.
 * @return The panel.
 */
const AutoAddPanel = ( {
	kind,
	providerName,
	verified,
	onStatus,
	onNudge,
	onManual,
}: AutoAddPanelProps ) => {
	const [ phase, setPhase ] = useState< AutoPhase >( 'idle' );
	const [ url, setUrl ] = useState( '' );
	const watch = useRef< {
		poll?: ReturnType< typeof setInterval >;
		grace?: ReturnType< typeof setTimeout >;
	} >( {} );
	const verifiedRef = useRef( verified );
	verifiedRef.current = verified;

	const stopWatching = useCallback( () => {
		clearInterval( watch.current.poll );
		clearTimeout( watch.current.grace );
		watch.current = {};
	}, [] );
	useEffect( () => stopWatching, [ stopWatching ] );

	const failed = __(
		'We couldn’t add them automatically. You can add them yourself in a couple of minutes.',
		'jetpack-send-pkg'
	);

	const connect = useCallback( async () => {
		stopWatching();
		setPhase( 'working' );
		let link: string;
		try {
			link = ( await startDomainConnect() ).url;
		} catch {
			onManual( failed );
			return;
		}
		setUrl( link );
		const popup = window.open( link, 'jetpack-send-dc', 'popup' );
		if ( ! popup ) {
			setPhase( 'blocked' );
			return;
		}
		setPhase( 'waiting' );
		watch.current.poll = setInterval( () => {
			if ( ! popup.closed ) {
				return;
			}
			clearInterval( watch.current.poll );
			onNudge();
			watch.current.grace = setTimeout( () => {
				if ( ! verifiedRef.current ) {
					setPhase( 'closed' );
				}
			}, APPROVAL_GRACE );
		}, 1000 );
	}, [ failed, onManual, onNudge, stopWatching ] );

	const addForMe = useCallback( async () => {
		setPhase( 'working' );
		try {
			onStatus( await addWithWpcomDns() );
			onNudge();
			setPhase( 'added' );
		} catch ( e ) {
			const forbidden =
				!! e &&
				typeof e === 'object' &&
				( ( 'code' in e && e.code === 'jetpack_send_wpcom_dns_forbidden' ) ||
					( 'data' in e &&
						!! e.data &&
						typeof e.data === 'object' &&
						'status' in e.data &&
						e.data.status === 403 ) );
			onManual(
				forbidden
					? __(
							'This domain belongs to a different WordPress.com account. Add the records there, or ask its owner.',
							'jetpack-send-pkg'
						)
					: failed
			);
		}
	}, [ failed, onManual, onNudge, onStatus ] );

	const addMyself = useCallback( () => onManual(), [ onManual ] );

	if ( kind === 'wpcom' ) {
		return (
			<Stack direction="column" gap="md">
				<Text variant="body-lg">
					{ phase === 'added'
						? __( 'Adding them now. We’ll spot them in a moment.', 'jetpack-send-pkg' )
						: __( 'We can add both records for you. Nothing else changes.', 'jetpack-send-pkg' ) }
				</Text>
				{ phase !== 'added' && (
					<div>
						<Button
							variant="solid"
							onClick={ addForMe }
							loading={ phase === 'working' }
							loadingAnnouncement={ __( 'Adding the records…', 'jetpack-send-pkg' ) }
						>
							{ __( 'Add them for me', 'jetpack-send-pkg' ) }
						</Button>
					</div>
				) }
				<Text variant="body-lg" render={ <div /> }>
					<TextAction onClick={ addMyself }>
						{ __( 'Add them myself instead', 'jetpack-send-pkg' ) }
					</TextAction>
				</Text>
			</Stack>
		);
	}

	const connectLabel = sprintf(
		/* translators: %s: provider name, e.g. Cloudflare. */
		__( 'Connect %s', 'jetpack-send-pkg' ),
		providerName
	);

	return (
		<Stack direction="column" gap="md">
			<Stack direction="column" gap="sm">
				{ phase === 'waiting' ? (
					<Stack direction="row" gap="sm" align="center">
						<Spinner />
						<Text variant="body-lg" role="status">
							{ sprintf(
								/* translators: %s: provider name, e.g. Cloudflare. */
								__(
									'Finish in the %s window. We’ll see the records as soon as you approve.',
									'jetpack-send-pkg'
								),
								providerName
							) }
						</Text>
					</Stack>
				) : (
					<>
						<Text variant="body-lg">
							{ sprintf(
								/* translators: %s: provider name, e.g. Cloudflare. */
								__(
									'Sign in to %s and approve. Your existing email settings stay as they are.',
									'jetpack-send-pkg'
								),
								providerName
							) }
						</Text>
						<div>
							<Button
								variant="solid"
								onClick={ connect }
								loading={ phase === 'working' }
								loadingAnnouncement={ __( 'Opening…', 'jetpack-send-pkg' ) }
							>
								{ connectLabel }
								<Button.Icon icon={ external } />
								<VisuallyHidden>
									{ __( '(opens in a new window)', 'jetpack-send-pkg' ) }
								</VisuallyHidden>
							</Button>
						</div>
						<Text variant="body-md" className="jetpack-send-setup__weak">
							{ sprintf(
								/* translators: %s: provider name, e.g. Cloudflare. */
								__(
									'You’ll sign in to %s in a new window. Jetpack never sees your password.',
									'jetpack-send-pkg'
								),
								providerName
							) }
						</Text>
					</>
				) }
			</Stack>
			{ phase === 'blocked' && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ sprintf(
							/* translators: %s: provider name, e.g. Cloudflare. */
							__( 'Your browser blocked the %s window.', 'jetpack-send-pkg' ),
							providerName
						) }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionLink href={ url } target="_blank" rel="noopener noreferrer">
							{ sprintf(
								/* translators: %s: provider name, e.g. Cloudflare. */
								__( 'Open %s', 'jetpack-send-pkg' ),
								providerName
							) }
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			) }
			{ phase === 'closed' && (
				<Notice.Root intent="info">
					<Notice.Description>
						{ sprintf(
							/* translators: %s: provider name, e.g. Cloudflare. */
							__( 'Looks like the %s window closed before you approved.', 'jetpack-send-pkg' ),
							providerName
						) }
					</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton variant="outline" onClick={ connect }>
							{ __( 'Try again', 'jetpack-send-pkg' ) }
						</Notice.ActionButton>
						<Notice.ActionButton variant="minimal" onClick={ addMyself }>
							{ __( 'Add them myself instead', 'jetpack-send-pkg' ) }
						</Notice.ActionButton>
					</Notice.Actions>
				</Notice.Root>
			) }
			{ phase !== 'closed' && (
				<Text variant="body-lg" render={ <div /> }>
					<TextAction onClick={ addMyself }>
						{ __( 'Add them myself instead', 'jetpack-send-pkg' ) }
					</TextAction>
				</Text>
			) }
		</Stack>
	);
};

export default AutoAddPanel;
