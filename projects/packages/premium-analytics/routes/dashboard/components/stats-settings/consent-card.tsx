import { getScriptData } from '@automattic/jetpack-script-data';
import {
	Badge,
	Button,
	Card,
	Link,
	Notice,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import styles from './stats-settings.module.scss';
import type { JetpackScriptData } from '@automattic/jetpack-script-data';
import type { JSX, ReactNode, Ref } from 'react';

type ConsentStatus = NonNullable<
	NonNullable<
		NonNullable< JetpackScriptData[ 'premium_analytics' ] >[ 'stats_settings' ]
	>[ 'consent' ]
>;

const WP_CONSENT_API_URL = 'https://wordpress.org/plugins/wp-consent-api/';
const WP_CONSENT_API_ROUTE = '/wp/v2/plugins/wp-consent-api/wp-consent-api';

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

const BANNER_PLUGIN_LINKS = {
	complianz: <Link href="https://wordpress.org/plugins/complianz-gdpr/" openInNewTab />,
	cookiebot: <Link href="https://wordpress.org/plugins/cookiebot/" openInNewTab />,
	cookieyes: <Link href="https://wordpress.org/plugins/cookie-law-info/" openInNewTab />,
};

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

/**
 * The Settings tab's "Visitor consent" card: both pieces Stats needs to honor a cookie banner, side by side.
 *
 * @return The card, or null when the site sent no consent status.
 */
export function ConsentCard(): JSX.Element | null {
	const status = getScriptData()?.premium_analytics?.stats_settings?.consent;
	return status ? <ConsentCardContent initialStatus={ status } /> : null;
}

/**
 * The card's content, which tracks the setup as the one-click install changes it.
 *
 * @param props               - Component props.
 * @param props.initialStatus - The setup the page loaded with.
 * @return The card.
 */
function ConsentCardContent( { initialStatus }: { initialStatus: ConsentStatus } ): JSX.Element {
	const [ status, setStatus ] = useState( initialStatus );
	const [ isConnecting, setIsConnecting ] = useState( false );
	const [ justConnected, setJustConnected ] = useState( false );
	const apiStepRef = useRef< HTMLLIElement >( null );
	const { createSuccessNotice, createErrorNotice } = useDispatch( 'core/notices' );
	const hasBanner = status.has_banner || status.banner_plugin !== null;
	const connected = status.api_active && hasBanner;
	const canConnect = status.api_installed ? status.can_activate : status.can_install;

	// The action button unmounts once the plugin is active, so focus falls to <body> unless the user moved it.
	useEffect( () => {
		const row = apiStepRef.current;
		if ( justConnected && row?.ownerDocument.activeElement === row?.ownerDocument.body ) {
			row?.focus( { preventScroll: true } );
		}
	}, [ justConnected ] );

	const connect = useCallback( async () => {
		setIsConnecting( true );
		try {
			await connectConsentApi( status.api_installed );
			setStatus( current => ( { ...current, api_installed: true, api_active: true } ) );
			setJustConnected( true );
			createSuccessNotice( __( 'WP Consent API is active.', 'jetpack-premium-analytics-pkg' ), {
				id: 'stats-consent-api-connected',
				type: 'snackbar',
			} );
		} catch ( error ) {
			const message = ( error as { message?: unknown } )?.message;
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
			// An install can succeed before its activation fails, so read back what the site now has.
			const plugin = await apiFetch< { status: string } >( { path: WP_CONSENT_API_ROUTE } ).catch(
				() => null
			);
			if ( plugin ) {
				setStatus( current => ( {
					...current,
					api_installed: true,
					api_active: plugin.status === 'active',
				} ) );
			}
		} finally {
			setIsConnecting( false );
		}
	}, [ status.api_installed, createSuccessNotice, createErrorNotice ] );

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

	let blockedReason: string | null = null;
	if ( ! status.api_active && ! canConnect ) {
		if ( status.api_installed ) {
			blockedReason = __(
				'You do not have permission to activate plugins here. Ask whoever manages plugins on this site to activate WP Consent API.',
				'jetpack-premium-analytics-pkg'
			);
		} else if ( ! status.file_mods_allowed ) {
			blockedReason = __(
				'Plugins cannot be installed here due to your site configuration. Install WP Consent API using your normal deployment workflow.',
				'jetpack-premium-analytics-pkg'
			);
		} else {
			blockedReason = __(
				'You do not have permission to install plugins here. Ask whoever manages plugins on this site to install WP Consent API.',
				'jetpack-premium-analytics-pkg'
			);
		}
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
			__(
				'Install one, such as <complianz>Complianz</complianz>, <cookiebot>Cookiebot</cookiebot> or <cookieyes>CookieYes</cookieyes>.',
				'jetpack-premium-analytics-pkg'
			),
			BANNER_PLUGIN_LINKS
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Card.Title>{ __( 'Visitor consent', 'jetpack-premium-analytics-pkg' ) }</Card.Title>
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
							pendingLabel={ __( 'None', 'jetpack-premium-analytics-pkg' ) }
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
							description={
								status.api_active
									? __( 'Tells Stats what each visitor chose.', 'jetpack-premium-analytics-pkg' )
									: __(
											'A free plugin that tells Stats what each visitor chose. Once it’s active, visitors who decline aren’t counted, so your views will likely drop.',
											'jetpack-premium-analytics-pkg'
										)
							}
							action={ apiAction }
							rowRef={ apiStepRef }
						/>
					</ol>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
