import apiFetch from '@wordpress/api-fetch';
import { dateI18n, getSettings } from '@wordpress/date';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link, Notice, Stack, SwitchControl, Text } from '@wordpress/ui';
import { getPreloaded, writePreloaded } from '../../data/get-preloaded';

const INDEXNOW_PATH = '/jetpack/v4/seo/indexnow';

interface Status {
	enabled: boolean;
	pause_reason: string;
	pending: number;
	cooldown_active?: boolean;
	scheduling_delayed?: boolean;
	latest: {
		state: string;
		time?: number;
		expired?: number;
		exhausted?: number;
		retrying?: number;
		dropped?: number;
		accepted?: { time: number; count: number; state: string };
	};
	enqueue_error: { state: string } | null;
}

/**
 * Explain why the saved preference cannot currently operate.
 * @param reason  - The backend pause condition.
 * @param enabled - Whether notifications have been enabled.
 * @return The explanation.
 */
function pauseMessage( reason: string, enabled: boolean ) {
	switch ( reason ) {
		case 'not_public':
			if ( ! enabled ) {
				return __(
					'Notifications are available only on public, production sites that allow search engine indexing.',
					'jetpack-seo'
				);
			}
			return __(
				'Notifications are paused while this site is private, staging, or discouraging search engines.',
				'jetpack-seo'
			);
		case 'module_inactive':
			if ( ! enabled ) {
				return __( 'Enable SEO tools to send notifications.', 'jetpack-seo' );
			}
			return __( 'Notifications are paused while SEO tools are inactive.', 'jetpack-seo' );
		case 'provider':
			if ( ! enabled ) {
				return __(
					'Another SEO plugin or your hosting provider prevents notifications.',
					'jetpack-seo'
				);
			}
			return __(
				'Notifications are paused by another SEO plugin or your hosting provider.',
				'jetpack-seo'
			);
		case 'address_changed':
			return __(
				'The site address changed. Turn notifications off and on again to enable them for the new address.',
				'jetpack-seo'
			);
		default:
			return '';
	}
}

/**
 * Explain delivery conditions that need attention.
 * @param status - Current delivery state.
 * @return The warning, if needed.
 */
function deliveryWarning( status: Status ) {
	if ( status.cooldown_active ) {
		return __(
			'The receiving service has limited requests. Notifications will resume automatically after the waiting period.',
			'jetpack-seo'
		);
	}
	if ( status.latest.state === 'http_403' ) {
		return __(
			'The receiving service could not verify site ownership. Check that the site is publicly accessible.',
			'jetpack-seo'
		);
	}
	if ( [ 'http_400', 'http_422' ].includes( status.latest.state ) ) {
		return __(
			'The receiving service rejected the notification. Check the site address and URL configuration.',
			'jetpack-seo'
		);
	}
	if ( status.latest.state.startsWith( 'http_' ) || status.latest.state === 'transport_failure' ) {
		if ( status.latest.retrying && status.pending > 0 ) {
			return __(
				'There was a delivery problem. Pending notifications will be retried within the delivery limits.',
				'jetpack-seo'
			);
		}
		return __(
			'There was a delivery problem. Check the receiving service and site configuration.',
			'jetpack-seo'
		);
	}
	if ( status.scheduling_delayed ) {
		return __(
			'Delivery is waiting for WordPress scheduled tasks. If this continues, check that scheduled tasks are running.',
			'jetpack-seo'
		);
	}
	return '';
}

interface Props {
	isSaving: boolean;
	onSavingChange?: ( saving: boolean ) => void;
}

/**
 * Show the opt-in control and current delivery status.
 * @param props                - Component props.
 * @param props.isSaving       - Whether the parent settings form is saving.
 * @param props.onSavingChange - Lock visibility controls during a notification save.
 * @return The settings content.
 */
export default function IndexnowSettings( { isSaving, onSavingChange }: Props ) {
	// Starts from the last known status (the page preload, or the last read before a tab
	// switch) so the toggle shows at once; the refresh below keeps it current.
	const [ status, setStatus ] = useState< Status | null >(
		() => getPreloaded< Status >( INDEXNOW_PATH ) ?? null
	);
	const [ error, setError ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const saving = useRef( false );
	const revision = useRef( 0 );
	const adopt = useCallback( ( value: Status ) => {
		writePreloaded( INDEXNOW_PATH, value );
		setStatus( value );
	}, [] );
	useEffect( () => {
		if ( isSaving ) {
			++revision.current;
			return;
		}
		let mounted = true;
		const refresh = async () => {
			if ( saving.current ) {
				return;
			}
			const version = ++revision.current;
			try {
				const value = await apiFetch< Status >( { path: INDEXNOW_PATH } );
				if ( mounted && version === revision.current ) {
					adopt( value );
					setError( '' );
				}
			} catch {
				if ( mounted && version === revision.current ) {
					setError(
						__(
							'Search engine notification status could not be loaded. Reload this page to try again.',
							'jetpack-seo'
						)
					);
				}
			}
		};
		void refresh();
		const focus = () => void refresh();
		window.addEventListener( 'focus', focus );
		return () => {
			mounted = false;
			window.removeEventListener( 'focus', focus );
		};
	}, [ isSaving, adopt ] );
	const change = useCallback(
		async ( enabled: boolean ) => {
			if ( isSaving || saving.current ) {
				return;
			}
			saving.current = true;
			++revision.current;
			setBusy( true );
			onSavingChange?.( true );
			setError( '' );
			try {
				adopt(
					await apiFetch< Status >( {
						path: INDEXNOW_PATH,
						method: 'POST',
						data: { enabled },
					} )
				);
			} catch {
				setError(
					__(
						'The search engine notification setting could not be saved. Please try again.',
						'jetpack-seo'
					)
				);
			} finally {
				saving.current = false;
				setBusy( false );
				onSavingChange?.( false );
			}
		},
		[ isSaving, onSavingChange, adopt ]
	);
	const paused = status ? pauseMessage( status.pause_reason, status.enabled ) : '';
	const warning = status?.enabled && ! paused ? deliveryWarning( status ) : '';
	const lost = Boolean(
		status &&
		( status.enqueue_error ||
			status.latest.expired ||
			status.latest.exhausted ||
			status.latest.dropped )
	);
	const received = status?.latest.accepted;
	return (
		<Stack direction="column" gap="md">
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
			{ ! status && ! error && (
				<Text render={ <p /> }>
					{ __( 'Loading search engine notification settings…', 'jetpack-seo' ) }
				</Text>
			) }
			{ status && (
				<>
					<SwitchControl
						label={ __( 'Notify search engines when content changes', 'jetpack-seo' ) }
						checked={ status.enabled }
						disabled={ isSaving || busy || ( ! status.enabled && Boolean( status.pause_reason ) ) }
						onCheckedChange={ change }
						description={ paused || undefined }
						details={ createInterpolateElement(
							__(
								"Automatically notify participating search engines when your public content changes. Uses <a>IndexNow</a>; notifications don't guarantee indexing.",
								'jetpack-seo'
							),
							{
								a: (
									<Link
										href="https://www.indexnow.org/faq"
										openInNewTab
										rel="noopener noreferrer"
									/>
								),
							}
						) }
					/>
					{ status.enabled && ! paused && status.pending > 0 && (
						<Text render={ <p /> }>
							{ sprintf(
								/* translators: %d: pending URL notifications. */
								_n(
									'%d notification waiting for delivery.',
									'%d notifications waiting for delivery.',
									status.pending,
									'jetpack-seo'
								),
								status.pending
							) }
						</Text>
					) }
					{ status.enabled && ! paused && received && (
						<Text render={ <p /> }>
							{ received.state === 'verification_pending'
								? sprintf(
										/* translators: %s: site-local date and time of the last received batch. */
										__(
											'Last received: %s. Site ownership verification is pending.',
											'jetpack-seo'
										),
										dateI18n( getSettings().formats.datetime, received.time * 1000 )
									)
								: sprintf(
										/* translators: %s: site-local date and time of the last accepted batch. */
										__( 'Last accepted: %s. Acceptance does not confirm indexing.', 'jetpack-seo' ),
										dateI18n( getSettings().formats.datetime, received.time * 1000 )
									) }
						</Text>
					) }
					{ status.enabled && ! paused && lost && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ __(
									'Some changes could not be queued or delivered within the delivery limits. Missed notifications are not automatically replayed.',
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
					) }
					{ warning && (
						<Notice.Root intent="warning">
							<Notice.Description>{ warning }</Notice.Description>
						</Notice.Root>
					) }
				</>
			) }
		</Stack>
	);
}
