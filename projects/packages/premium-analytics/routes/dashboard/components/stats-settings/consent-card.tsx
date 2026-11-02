import {
	Badge,
	Button,
	Card,
	Link,
	Notice,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import { intlLocale } from '@jetpack-premium-analytics/formatters';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	takeConsentCardFocusRequest,
	updateConsentStatus,
	useConsentStatus,
} from './consent-status';
import styles from './stats-settings.module.scss';
import type { ConsentStatus } from './consent-status';
import type { JSX, ReactNode, Ref } from 'react';

const WP_CONSENT_API_URL = 'https://wordpress.org/plugins/wp-consent-api/';
const WP_CONSENT_API_ROUTE = '/wp/v2/plugins/wp-consent-api/wp-consent-api';

// Once per page load, not per mount: switching tabs remounts the card.
let viewedThisLoad = false;

/**
 * Reset the once-per-load view latch. Test-only.
 */
export function resetConsentCardForTesting() {
	viewedThisLoad = false;
}

/**
 * Install WP Consent API from WordPress.org and activate it, or activate the copy already installed.
 *
 * @param installed - Whether the plugin is already installed.
 * @return Resolves once the plugin is active.
 */
function connectConsentApi( installed: boolean ): Promise< unknown > {
	return installed
		? apiFetch( {
				path: WP_CONSENT_API_ROUTE,
				method: 'PUT',
				data: { status: 'active' },
			} )
		: apiFetch( {
				path: '/wp/v2/plugins',
				method: 'POST',
				data: { slug: 'wp-consent-api', status: 'active' },
			} );
}

/**
 * Each recommended banner plugin as a link, joined the way the site's language lists alternatives.
 *
 * @param props         - Component props.
 * @param props.plugins - The plugins, with their WordPress.org pages.
 * @return The linked list.
 */
function BannerPluginLinks( { plugins }: { plugins: ConsentStatus[ 'recommended_banners' ] } ) {
	const urls = new Map( plugins.map( ( { name, url } ) => [ name, url ] ) );
	const parts = new Intl.ListFormat( intlLocale(), { type: 'disjunction' } ).formatToParts(
		plugins.map( ( { name } ) => name )
	);

	return (
		<>
			{ parts.map( ( part, index ) =>
				part.type === 'element' ? (
					<Link key={ index } href={ urls.get( part.value ) } openInNewTab>
						{ part.value }
					</Link>
				) : (
					part.value
				)
			) }
		</>
	);
}

/**
 * One step of the setup: its state as a badge, and the action that completes it.
 *
 * @param props              - Component props.
 * @param props.step         - The step's number.
 * @param props.done         - Whether the step is complete.
 * @param props.pendingLabel - The badge while the step is not complete.
 * @param props.title        - What the step is.
 * @param props.description  - Its current state, or what to do.
 * @param props.action       - The control that completes it, when not done.
 * @param props.rowRef       - Makes the row focusable, to catch the focus its action drops on completing.
 * @return The step row.
 */
function ConsentStep( {
	step,
	done,
	pendingLabel,
	title,
	description,
	action,
	rowRef,
}: {
	step: number;
	done: boolean;
	pendingLabel: string;
	title: string;
	description: ReactNode;
	action?: ReactNode;
	rowRef?: Ref< HTMLLIElement >;
} ): JSX.Element {
	return (
		<li ref={ rowRef } tabIndex={ rowRef ? -1 : undefined } className={ styles.consentStep }>
			<Stack direction="column" gap="xs" className={ styles.consentStepBody }>
				<Text className={ styles.usageNote }>
					{ sprintf(
						/* translators: %d: the step's number, 1 or 2. */
						__( 'Step %d', 'jetpack-premium-analytics-pkg' ),
						step
					) }
				</Text>
				<Stack direction="row" gap="sm" align="center">
					<Text className={ styles.consentStepTitle }>{ title }</Text>
					{ done ? (
						<Badge intent="stable">{ __( 'Active', 'jetpack-premium-analytics-pkg' ) }</Badge>
					) : (
						<Badge intent="none">{ pendingLabel }</Badge>
					) }
				</Stack>
				<Text className={ styles.usageNote }>{ description }</Text>
			</Stack>
			{ ! done && action }
		</li>
	);
}

type BlockedBy = 'activate_permission' | 'file_mods' | 'install_permission';

/**
 * What stops this user setting up WP Consent API from the card, if anything.
 *
 * @param status     - The setup.
 * @param canConnect - Whether the user may install or activate it.
 * @return The obstacle, or null when there is none.
 */
function getBlockedBy( status: ConsentStatus, canConnect: boolean ): BlockedBy | null {
	if ( status.api_active || status.banner_blocks_stats || canConnect ) {
		return null;
	}
	if ( status.api_installed ) {
		return 'activate_permission';
	}
	return status.file_mods_allowed ? 'install_permission' : 'file_mods';
}

/**
 * Why the card offers no button, and what to do instead.
 *
 * @param blockedBy - The obstacle.
 * @return The explanation.
 */
function getBlockedReason( blockedBy: BlockedBy ): string {
	switch ( blockedBy ) {
		case 'activate_permission':
			return __(
				'You do not have permission to activate plugins here. Ask whoever manages plugins on this site to activate WP Consent API.',
				'jetpack-premium-analytics-pkg'
			);
		case 'file_mods':
			return __(
				'Plugins cannot be installed here due to your site configuration. Install WP Consent API using your normal deployment workflow.',
				'jetpack-premium-analytics-pkg'
			);
		case 'install_permission':
			return __(
				'You do not have permission to install plugins here. Ask whoever manages plugins on this site to install WP Consent API.',
				'jetpack-premium-analytics-pkg'
			);
	}
}

/**
 * The Settings tab's "Visitor consent" card: both pieces Stats needs to honor a cookie banner, side by side.
 *
 * @return The card, or null when the site sent no consent status.
 */
export function ConsentCard(): JSX.Element | null {
	const status = useConsentStatus();
	return status ? <ConsentCardContent status={ status } /> : null;
}

/**
 * The card's content, for the setup as it stands now.
 *
 * @param props        - Component props.
 * @param props.status - The setup.
 * @return The card.
 */
function ConsentCardContent( { status }: { status: ConsentStatus } ): JSX.Element {
	const [ isConnecting, setIsConnecting ] = useState( false );
	// A ref, not state: React 18 renders a store update apart from state updates, so state would move focus a commit late.
	const focusApiStepOnActive = useRef( false );
	const cardRef = useRef< HTMLDivElement >( null );
	const titleId = useId();
	const apiStepRef = useRef< HTMLLIElement >( null );
	const { createSuccessNotice, createErrorNotice } = useDispatch( 'core/notices' );
	const trackEvent = useTrackEvent();
	const hasBanner = status.consent_type_declared || status.banner_plugin !== null;
	const connected = hasBanner && ( status.api_active || status.banner_blocks_stats );
	const canConnect = status.api_installed ? status.can_activate : status.can_install;
	const blockedBy = getBlockedBy( status, canConnect );

	useEffect( () => {
		if ( takeConsentCardFocusRequest() ) {
			cardRef.current?.focus();
		}
	}, [] );

	useEffect( () => {
		if ( viewedThisLoad ) {
			return;
		}
		viewedThisLoad = true;
		trackEvent( 'jetpack_premium_analytics_visitor_consent_card_view', {
			set_up: connected,
			blocked_by: blockedBy ?? 'none',
		} );
		// Only the setup the card first showed.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ trackEvent ] );

	// The action button unmounts once the plugin is active, so focus falls to <body> unless the user moved it.
	useEffect( () => {
		if ( ! status.api_active || ! focusApiStepOnActive.current ) {
			return;
		}
		focusApiStepOnActive.current = false;
		const row = apiStepRef.current;
		if ( row?.ownerDocument.activeElement === row?.ownerDocument.body ) {
			row?.focus( { preventScroll: true } );
		}
	}, [ status.api_active ] );

	const connect = useCallback( async () => {
		const action = status.api_installed ? 'activate' : 'install';
		setIsConnecting( true );
		let active = false;
		let failure: unknown = null;
		try {
			await connectConsentApi( status.api_installed );
			active = true;
		} catch ( error ) {
			failure = error;
			// An install can succeed before its activation fails, or the request can fail after both, so read back what the site has.
			const plugin = await apiFetch< { status: string } >( { path: WP_CONSENT_API_ROUTE } ).catch(
				() => null
			);
			if ( plugin ) {
				active = plugin.status === 'active';
				updateConsentStatus( { api_installed: true } );
			}
		}
		setIsConnecting( false );
		trackEvent( 'jetpack_premium_analytics_visitor_consent_setup', {
			action,
			result: active ? 'success' : 'error',
		} );

		if ( active ) {
			focusApiStepOnActive.current = true;
			updateConsentStatus( { api_installed: true, api_active: true } );
			createSuccessNotice( __( 'WP Consent API is active.', 'jetpack-premium-analytics-pkg' ), {
				id: 'stats-consent-api-connected',
				type: 'snackbar',
			} );
			return;
		}

		const message = ( failure as { message?: unknown } )?.message;
		createErrorNotice(
			typeof message === 'string'
				? sprintf(
						/* translators: %s: the reason WordPress gave. */
						__( 'WP Consent API could not be set up: %s', 'jetpack-premium-analytics-pkg' ),
						message
					)
				: __( 'WP Consent API could not be set up.', 'jetpack-premium-analytics-pkg' ),
			{ id: 'stats-consent-api-failed', type: 'snackbar' }
		);
	}, [ status.api_installed, createSuccessNotice, createErrorNotice, trackEvent ] );

	let apiAction: ReactNode;
	if ( canConnect ) {
		apiAction = (
			<Button
				variant="outline"
				size="compact"
				loading={ isConnecting }
				loadingAnnouncement={
					status.api_installed
						? __( 'Activating WP Consent API…', 'jetpack-premium-analytics-pkg' )
						: __( 'Installing WP Consent API…', 'jetpack-premium-analytics-pkg' )
				}
				onClick={ connect }
			>
				{ status.api_installed
					? __( 'Activate', 'jetpack-premium-analytics-pkg' )
					: __( 'Install and activate', 'jetpack-premium-analytics-pkg' ) }
			</Button>
		);
	} else {
		apiAction = (
			<Link href={ WP_CONSENT_API_URL } openInNewTab>
				{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
			</Link>
		);
	}

	const blockedReason = blockedBy && getBlockedReason( blockedBy );

	let apiDescription: string;
	if ( status.api_active ) {
		apiDescription = __( 'Tells Stats what each visitor chose.', 'jetpack-premium-analytics-pkg' );
	} else if ( status.banner_blocks_stats ) {
		apiDescription = __(
			'Optional. Your cookie banner already asks visitors before Stats counts them.',
			'jetpack-premium-analytics-pkg'
		);
	} else {
		apiDescription = __(
			'A free plugin that tells Stats what each visitor chose. Once it’s active, visitors who decline aren’t counted, so your views will likely drop.',
			'jetpack-premium-analytics-pkg'
		);
	}

	let bannerDescription: ReactNode;
	if ( status.banner_plugin ) {
		bannerDescription = sprintf(
			/* translators: %s: the name of a cookie banner plugin, such as CookieYes. */
			__( '%s is active.', 'jetpack-premium-analytics-pkg' ),
			status.banner_plugin
		);
	} else if ( hasBanner ) {
		bannerDescription = __( 'A cookie banner plugin is active.', 'jetpack-premium-analytics-pkg' );
	} else {
		bannerDescription = createInterpolateElement(
			/* translators: <plugins /> is a list of cookie banner plugins, such as "Complianz, Cookiebot or CookieYes". */
			__(
				'Stats didn’t find one. If you use a cookie banner, make sure it supports the WP Consent API. If not, install one, such as <plugins />.',
				'jetpack-premium-analytics-pkg'
			),
			{ plugins: <BannerPluginLinks plugins={ status.recommended_banners } /> }
		);
	}

	return (
		<Card.Root
			ref={ cardRef }
			tabIndex={ -1 }
			role="region"
			aria-labelledby={ titleId }
			className={ styles.consentCard }
		>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title id={ titleId }>
						{ __( 'Visitor consent', 'jetpack-premium-analytics-pkg' ) }
					</Card.Title>
					{ connected ? (
						<Badge intent="stable">{ __( 'Set up', 'jetpack-premium-analytics-pkg' ) }</Badge>
					) : (
						<Badge intent="none">{ __( 'Not set up', 'jetpack-premium-analytics-pkg' ) }</Badge>
					) }
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" align="stretch" gap="lg">
					<Text>
						{ connected
							? __(
									'Stats only counts visitors who allow it in your cookie banner.',
									'jetpack-premium-analytics-pkg'
								)
							: __(
									'If you show visitors a cookie banner, Stats can only count visitors who allow it. It takes two steps:',
									'jetpack-premium-analytics-pkg'
								) }
					</Text>
					{ blockedReason && (
						<Notice.Root intent="info">
							<Notice.Description>{ blockedReason }</Notice.Description>
						</Notice.Root>
					) }
					<ol className={ styles.consentSteps }>
						<ConsentStep
							step={ 1 }
							done={ hasBanner }
							pendingLabel={ __( 'Not found', 'jetpack-premium-analytics-pkg' ) }
							title={ __( 'Cookie banner plugin', 'jetpack-premium-analytics-pkg' ) }
							description={ bannerDescription }
						/>
						<ConsentStep
							step={ 2 }
							done={ status.api_active }
							pendingLabel={
								status.api_installed
									? __( 'Inactive', 'jetpack-premium-analytics-pkg' )
									: __( 'Not installed', 'jetpack-premium-analytics-pkg' )
							}
							title={ __( 'WP Consent API', 'jetpack-premium-analytics-pkg' ) }
							description={ apiDescription }
							action={ apiAction }
							rowRef={ apiStepRef }
						/>
					</ol>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
