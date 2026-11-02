import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { speak } from '@wordpress/a11y';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { markViewed, useCompanionPlugin } from './use-companion-plugin';
import type { CompanionPluginAction, CompanionPluginSlug } from '../../types';

type CompanionPluginNoticeProps = {
	/** The connection's service, e.g. `bluesky`. */
	serviceName: string;
	/** Where the notice shows, for Tracks. */
	context: 'admin-page' | 'post-publish';
	className?: string;
};

const PLUGIN_NAMES: Record< CompanionPluginSlug, string > = {
	atmosphere: 'ATmosphere',
	activitypub: 'ActivityPub',
};

// Lookups rather than ternaries: Terser would merge two `__()` calls into one and break translation.
const PITCHES: Record< CompanionPluginSlug, () => string > = {
	atmosphere: () =>
		__(
			'With the ATmosphere plugin, the likes, reposts, and replies your posts get on Bluesky show up on your site, and you can reply to people without leaving WordPress.',
			'jetpack-publicize-pkg'
		),
	activitypub: () =>
		__(
			'With ActivityPub, the likes, boosts, and replies your posts get on Mastodon and the rest of the fediverse show up on your site, and you can reply to people without leaving WordPress.',
			'jetpack-publicize-pkg'
		),
};

const installLabel = ( name: string ) =>
	/* translators: %s: plugin name, e.g. ATmosphere. */
	sprintf( __( 'Install %s', 'jetpack-publicize-pkg' ), name );

// The button keeps its label while busy; its spinner and `loadingAnnouncement` say it is working.
const CTA_LABELS: Record< CompanionPluginAction, ( name: string ) => string > = {
	install: installLabel,
	marketplace: installLabel,
	activate: name =>
		/* translators: %s: plugin name, e.g. ATmosphere. */
		sprintf( __( 'Activate %s', 'jetpack-publicize-pkg' ), name ),
	enable: name =>
		/* translators: %s: feature name, e.g. ActivityPub. */
		sprintf( __( 'Turn on %s', 'jetpack-publicize-pkg' ), name ),
};

const errorText = ( name: string, message: string ) =>
	sprintf(
		/* translators: 1: plugin name, e.g. ATmosphere. 2: the error message. */
		__( '%1$s could not be set up: %2$s', 'jetpack-publicize-pkg' ),
		name,
		message
	);

// `@wordpress/ui` notices are not live regions, so the outcome is announced separately.
const ANNOUNCEMENTS: Record< 'active' | 'error', ( name: string, message: string ) => string > = {
	active: name =>
		/* translators: %s: plugin name, e.g. ATmosphere. */
		sprintf( __( '%s is active.', 'jetpack-publicize-pkg' ), name ),
	error: errorText,
};

/**
 * Invites people sharing to Bluesky or Mastodon to turn on the plugin that brings the replies back to their site.
 *
 * @param props             - Component props.
 * @param props.serviceName - The connection's service.
 * @param props.context     - Where the notice shows.
 * @param props.className   - Optional class name.
 * @return The notice, or null when there is nothing to offer.
 */
export function CompanionPluginNotice( {
	serviceName,
	context,
	className,
}: CompanionPluginNoticeProps ) {
	const { slug, action, state, install, dismiss } = useCompanionPlugin( serviceName );
	const { recordEvent } = useAnalytics();

	const isVisible = !! action && state.status !== 'dismissed';

	const eventProps = useMemo(
		() =>
			action && {
				plugin: slug,
				service: serviceName,
				context,
				action,
			},
		[ slug, action, serviceName, context ]
	);

	useEffect( () => {
		if ( isVisible && markViewed( `${ eventProps.plugin }:${ context }` ) ) {
			recordEvent( 'jetpack_social_companion_plugin_notice_view', eventProps );
		}
	}, [ isVisible, eventProps, context, recordEvent ] );

	// Only the notice whose button was pressed takes focus, since the button unmounts on success.
	const focusOnSuccess = useRef( false );
	const focusSettingsLink = useCallback( ( node: HTMLAnchorElement | null ) => {
		if ( node && focusOnSuccess.current ) {
			focusOnSuccess.current = false;
			node.focus();
		}
	}, [] );

	const onInstall = useCallback( async () => {
		recordEvent( 'jetpack_social_companion_plugin_notice_cta_click', eventProps );
		focusOnSuccess.current = true;
		const result = await install();
		focusOnSuccess.current = false;
		if ( result?.status !== 'active' && result?.status !== 'error' ) {
			return;
		}
		const activated = result.status === 'active';
		recordEvent(
			activated
				? 'jetpack_social_companion_plugin_notice_activated'
				: 'jetpack_social_companion_plugin_notice_error',
			eventProps
		);
		speak(
			ANNOUNCEMENTS[ result.status ](
				PLUGIN_NAMES[ eventProps.plugin ],
				'message' in result ? result.message : ''
			),
			activated ? 'polite' : 'assertive'
		);
	}, [ install, recordEvent, eventProps ] );

	const onMarketplaceClick = useCallback( () => {
		recordEvent( 'jetpack_social_companion_plugin_notice_cta_click', eventProps );
	}, [ recordEvent, eventProps ] );

	const onDismiss = useCallback( () => {
		recordEvent( 'jetpack_social_companion_plugin_notice_dismiss', eventProps );
		dismiss();
	}, [ dismiss, recordEvent, eventProps ] );

	if ( ! isVisible ) {
		return null;
	}

	const name = PLUGIN_NAMES[ slug ];

	if ( state.status === 'active' ) {
		return (
			<Notice.Root intent="success" className={ className }>
				<Notice.Description>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s: plugin name, e.g. ATmosphere. */
							__( '%s is active. <link>Finish setting it up</link>.', 'jetpack-publicize-pkg' ),
							name
						),
						{
							link: (
								<Link
									href={ getAdminUrl( `options-general.php?page=${ slug }` ) }
									ref={ focusSettingsLink }
								/>
							),
						}
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	const isBusy = state.status === 'busy';

	const ctaLabel = CTA_LABELS[ action ]( name );

	return (
		<Notice.Root intent={ state.status === 'error' ? 'error' : 'info' } className={ className }>
			<Notice.Title>
				{ __( 'Bring the conversation back to your site', 'jetpack-publicize-pkg' ) }
			</Notice.Title>
			<Notice.Description>
				{ state.status === 'error' ? errorText( name, state.message ) : PITCHES[ slug ]() }
				{ action === 'marketplace' && (
					<>
						{ ' ' }
						{ sprintf(
							/* translators: %s: plugin name, e.g. ATmosphere. */
							__(
								'To install %s, we’ll need to move your site over to WordPress.com’s advanced managed cloud hosting.',
								'jetpack-publicize-pkg'
							),
							name
						) }
					</>
				) }
			</Notice.Description>
			<Notice.Actions>
				{ action === 'marketplace' ? (
					<Notice.ActionLink
						href={ `https://wordpress.com/plugins/${ slug }/${ getScriptData()?.site?.suffix }` }
						onClick={ onMarketplaceClick }
					>
						{ ctaLabel }
					</Notice.ActionLink>
				) : (
					<Notice.ActionButton onClick={ onInstall } loading={ isBusy } disabled={ isBusy }>
						{ ctaLabel }
					</Notice.ActionButton>
				) }
			</Notice.Actions>
			{ ! isBusy && (
				<Notice.CloseIconButton
					label={ __( 'Dismiss', 'jetpack-publicize-pkg' ) }
					onClick={ onDismiss }
				/>
			) }
		</Notice.Root>
	);
}
