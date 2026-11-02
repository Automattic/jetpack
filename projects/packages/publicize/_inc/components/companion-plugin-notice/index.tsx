import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement, useCallback, useEffect, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { markViewed, useCompanionPlugin } from './use-companion-plugin';
import type { CompanionPlugin } from '../../types';

type CompanionPluginNoticeProps = {
	/** The connection's service, e.g. `bluesky`. */
	serviceName: string;
	/** Where the notice shows, for Tracks. */
	context: 'admin-page' | 'post-publish';
	className?: string;
};

const PLUGIN_NAMES: Record< CompanionPlugin[ 'slug' ], string > = {
	atmosphere: 'ATmosphere',
	activitypub: 'ActivityPub',
};

// Lookups rather than ternaries: Terser would merge two `__()` calls into one and break translation.
const PITCHES: Record< CompanionPlugin[ 'slug' ], () => string > = {
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

const CTA_LABELS: Record<
	'install' | 'installing' | 'activate' | 'activating' | 'enable' | 'enabling',
	( name: string ) => string
> = {
	install: name =>
		/* translators: %s: plugin name, e.g. ATmosphere. */
		sprintf( __( 'Install %s', 'jetpack-publicize-pkg' ), name ),
	installing: name =>
		/* translators: %s: plugin name, e.g. ATmosphere. */
		sprintf( __( 'Installing %s…', 'jetpack-publicize-pkg' ), name ),
	activate: name =>
		/* translators: %s: plugin name, e.g. ATmosphere. */
		sprintf( __( 'Activate %s', 'jetpack-publicize-pkg' ), name ),
	activating: name =>
		/* translators: %s: plugin name, e.g. ATmosphere. */
		sprintf( __( 'Activating %s…', 'jetpack-publicize-pkg' ), name ),
	enable: name =>
		/* translators: %s: feature name, e.g. ActivityPub. */
		sprintf( __( 'Turn on %s', 'jetpack-publicize-pkg' ), name ),
	enabling: name =>
		/* translators: %s: feature name, e.g. ActivityPub. */
		sprintf( __( 'Turning on %s…', 'jetpack-publicize-pkg' ), name ),
};

const IDLE_LABELS: Record< CompanionPlugin[ 'action' ], keyof typeof CTA_LABELS > = {
	install: 'install',
	activate: 'activate',
	enable: 'enable',
	marketplace: 'install',
};

const BUSY_LABELS: Record< CompanionPlugin[ 'action' ], keyof typeof CTA_LABELS > = {
	install: 'installing',
	activate: 'activating',
	enable: 'enabling',
	marketplace: 'installing',
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
	const { plugin, state, install, dismiss } = useCompanionPlugin( serviceName );
	const { recordEvent } = useAnalytics();

	const isVisible = !! plugin && state.status !== 'dismissed';

	const eventProps = useMemo(
		() =>
			plugin && {
				plugin: plugin.slug,
				service: plugin.service,
				context,
				action: plugin.action,
			},
		[ plugin, context ]
	);

	useEffect( () => {
		// Counted once per page and place, so reopening a connection's panel is not a new view.
		if ( isVisible && markViewed( `${ eventProps.plugin }:${ context }` ) ) {
			recordEvent( 'jetpack_social_companion_plugin_notice_view', eventProps );
		}
	}, [ isVisible, eventProps, context, recordEvent ] );

	const onInstall = useCallback( async () => {
		recordEvent( 'jetpack_social_companion_plugin_notice_cta_click', eventProps );
		const activated = await install();
		recordEvent(
			activated
				? 'jetpack_social_companion_plugin_notice_activated'
				: 'jetpack_social_companion_plugin_notice_error',
			eventProps
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

	const name = PLUGIN_NAMES[ plugin.slug ];

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
						{ link: <Link href={ plugin.settings_url } /> }
					) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	const isBusy = state.status === 'busy';

	const ctaLabel = CTA_LABELS[ ( isBusy ? BUSY_LABELS : IDLE_LABELS )[ plugin.action ] ]( name );

	return (
		<Notice.Root intent={ state.status === 'error' ? 'error' : 'info' } className={ className }>
			<Notice.Title>
				{ __( 'Bring the conversation back to your site', 'jetpack-publicize-pkg' ) }
			</Notice.Title>
			<Notice.Description>
				{ state.status === 'error'
					? sprintf(
							/* translators: 1: plugin name, e.g. ATmosphere. 2: the error message. */
							__( '%1$s could not be set up: %2$s', 'jetpack-publicize-pkg' ),
							name,
							state.message
						)
					: PITCHES[ plugin.slug ]() }
			</Notice.Description>
			<Notice.Actions>
				{ plugin.action === 'marketplace' ? (
					<Notice.ActionLink href={ plugin.install_url } onClick={ onMarketplaceClick }>
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
