import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectionError } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { GATED_VIEWS } from '../../constants';

// Listed in the order getPageNoticeState resolves them.
const PAGE_NOTICE_STATES = {
	OFFLINE_MODE: 'offline-mode',
	CONNECTION_ERROR: 'connection-error',
	HOST_OFF: 'host-off',
	FORCED_OFF: 'forced-off',
	SITE_DISCONNECTED: 'site-disconnected',
	USER_UNLINKED: 'user-unlinked',
	MASTER_OFF: 'master-off',
};
/**
 * Decide which site-state notice the page owes the reader, if any.
 *
 * Every input is page data, so the page names its state on first paint. The
 * feature-settings request exists for the AI Features toggles, not for this.
 *
 * @param {object}  options                      - Options.
 * @param {string}  options.view                 - The view being rendered.
 * @param {number}  [options.blogId]             - Site's blog ID; falsy when not connected.
 * @param {boolean} [options.isUserConnected]    - Whether this user's account is linked.
 * @param {boolean} [options.isConnected]        - Whether the site has a connected owner.
 * @param {boolean} [options.isOfflineMode]      - Whether the site is in offline mode.
 * @param {boolean} [options.hostAllowsAi]       - Whether the host allows AI at all.
 * @param {boolean} [options.masterEnabled]      - Whether the AI module is on.
 * @param {string}  [options.masterForcedOff]    - Which hook custom code used to hold AI
 *                                               off; empty when none does.
 * @param {boolean} [options.hasConnectionError] - Whether the connection store reports a
 *                                               connection the site cannot use.
 * @return {string|null} The state to render, or null.
 */
export function getPageNoticeState( {
	view,
	blogId,
	isUserConnected,
	isConnected,
	isOfflineMode,
	hostAllowsAi,
	masterEnabled,
	masterForcedOff,
	hasConnectionError,
} ) {
	if ( ! GATED_VIEWS.includes( view ) ) {
		return null;
	}

	// First: offline mode is why the connection looks broken, and reconnecting is
	// the one thing it forbids.
	if ( isOfflineMode ) {
		return PAGE_NOTICE_STATES.OFFLINE_MODE;
	}

	if ( hasConnectionError ) {
		return PAGE_NOTICE_STATES.CONNECTION_ERROR;
	}

	if ( hostAllowsAi === false ) {
		return PAGE_NOTICE_STATES.HOST_OFF;
	}

	// Below HOST_OFF: a host that offers no AI at all is the fuller answer.
	if ( masterForcedOff ) {
		return PAGE_NOTICE_STATES.FORCED_OFF;
	}

	if ( ! blogId || isConnected === false ) {
		return PAGE_NOTICE_STATES.SITE_DISCONNECTED;
	}

	if ( isUserConnected === false ) {
		return PAGE_NOTICE_STATES.USER_UNLINKED;
	}

	if ( masterEnabled === false ) {
		return PAGE_NOTICE_STATES.MASTER_OFF;
	}

	return null;
}

const HOST_OFF_SLUG = 'jetpack-ai-hub-docs-wp-supports-ai';
const OFFLINE_SLUG = 'jetpack-support-development-mode';

// Custom code reaches the same state through two different hooks, and each has
// its own documentation page.
const FORCED_OFF_SLUGS = {
	filter: 'jetpack-ai-hub-docs-ai-enabled',
	modules: 'jetpack-ai-hub-docs-module-forced-off',
};

/**
 * Title, body and action for one state, as plain data.
 *
 * @param {string} state    - The state to render.
 * @param {object} pageData - Page data the states link to; see PageNotice's props.
 * @return {object|null} `{ title, description, action }`, or null for a state with none.
 */
function getNoticeContent( state, pageData ) {
	switch ( state ) {
		case PAGE_NOTICE_STATES.HOST_OFF:
			return {
				title: __( 'Jetpack AI is not available for this site.', 'jetpack' ),
				action: {
					href: getRedirectUrl( HOST_OFF_SLUG ),
					label: __( 'Learn more', 'jetpack' ),
					openInNewTab: true,
				},
			};

		case PAGE_NOTICE_STATES.FORCED_OFF:
			return {
				title: __(
					'Jetpack AI is turned off by custom code running on this site, so it can’t be turned on here.',
					'jetpack'
				),
				action: {
					href: getRedirectUrl(
						FORCED_OFF_SLUGS[ pageData.masterForcedOff ] ?? FORCED_OFF_SLUGS.modules
					),
					label: __( 'Learn more', 'jetpack' ),
					openInNewTab: true,
				},
			};

		case PAGE_NOTICE_STATES.OFFLINE_MODE:
			return {
				title: __( 'Jetpack AI is not available in offline mode.', 'jetpack' ),
				action: {
					href: getRedirectUrl( OFFLINE_SLUG ),
					label: __( 'Learn more', 'jetpack' ),
					openInNewTab: true,
				},
			};

		case PAGE_NOTICE_STATES.SITE_DISCONNECTED:
			return {
				title: __( 'This site is not connected to WordPress.com.', 'jetpack' ),
				action: {
					href: pageData.userConnectionUrl,
					label: __( 'Connect Jetpack', 'jetpack' ),
				},
			};

		case PAGE_NOTICE_STATES.USER_UNLINKED:
			return {
				title: __( 'Your WordPress.com account isn\u2019t connected.', 'jetpack' ),
				action: {
					href: pageData.userConnectionUrl,
					label: __( 'Connect account', 'jetpack' ),
				},
			};

		case PAGE_NOTICE_STATES.MASTER_OFF:
			return {
				title: __( 'Jetpack AI is turned off for this site.', 'jetpack' ),
				description: __(
					'Your feature settings are saved and will apply again when AI is turned back on.',
					'jetpack'
				),
				action: {
					href: pageData.manageUrl,
					label: pageData.hasMyJetpack
						? __( 'Manage in My Jetpack', 'jetpack' )
						: __( 'Manage in Jetpack modules', 'jetpack' ),
				},
			};

		default:
			return null;
	}
}

/**
 * The one site-state notice the Jetpack AI Hub shows, above whichever view is
 * active. Nothing else on the page renders these states.
 *
 * @param {object}      props                     - Component props.
 * @param {string|null} props.state               - The resolved state, from getPageNoticeState.
 * @param {string}      [props.masterForcedOff]   - Which hook custom code used to hold AI off.
 * @param {string}      [props.userConnectionUrl] - Where this host links an account.
 * @param {string}      [props.manageUrl]         - Where this host manages the AI module.
 * @param {boolean}     [props.hasMyJetpack]      - Whether My Jetpack is loaded on this host.
 * @return {object|null} Component markup.
 */
export default function PageNotice( props ) {
	const { state } = props;

	// The shared notice brings no page spacing of its own.
	if ( state === PAGE_NOTICE_STATES.CONNECTION_ERROR ) {
		return (
			<div className="jetpack-ai-admin__page-notice">
				<ConnectionError />
			</div>
		);
	}

	const content = getNoticeContent( state, props );

	if ( ! content ) {
		return null;
	}

	const { title, description, action } = content;

	// Announce a plain string: the default serializes children mid-render, which
	// corrupts the Notice's own hook order when the children change shape.
	return (
		<Notice.Root
			intent="warning"
			className="jetpack-ai-admin__page-notice"
			spokenMessage={ [ title, description ].filter( Boolean ).join( ' ' ) }
		>
			{ title && <Notice.Title>{ title }</Notice.Title> }
			{ description && <Notice.Description>{ description }</Notice.Description> }
			{ action && (
				<Notice.Actions>
					<Notice.ActionLink href={ action.href } openInNewTab={ action.openInNewTab }>
						{ action.label }
					</Notice.ActionLink>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
