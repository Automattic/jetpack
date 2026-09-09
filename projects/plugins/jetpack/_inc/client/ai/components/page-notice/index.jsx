import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	ConnectButton,
	ConnectionError,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { GATED_VIEWS } from '../../constants';

// Highest precedence first. FORCED_OFF has no content yet, so nothing resolves
// it: https://github.com/Automattic/jetpack/pull/52062 adds both.
const PAGE_NOTICE_STATES = {
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
 * Page data and the settings request each carry connection state, and either
 * counts, so a disconnected site is named on first paint, not after the fetch.
 *
 * @param {object}      options                      - Options.
 * @param {string}      options.view                 - The view being rendered.
 * @param {number}      [options.blogId]             - Site's blog ID; falsy when not connected.
 * @param {boolean}     [options.isUserConnected]    - Whether this user's account is linked.
 * @param {object|null} [options.settings]           - Feature settings, null until fetched.
 * @param {boolean}     [options.hasConnectionError] - Whether the connection store reports a
 *                                                   connection the site cannot use.
 * @return {string|null} The state to render, or null.
 */
export function getPageNoticeState( {
	view,
	blogId,
	isUserConnected,
	settings,
	hasConnectionError,
} ) {
	if ( ! GATED_VIEWS.includes( view ) ) {
		return null;
	}

	if ( hasConnectionError ) {
		return PAGE_NOTICE_STATES.CONNECTION_ERROR;
	}

	if ( settings?.host_allows_ai === false ) {
		return PAGE_NOTICE_STATES.HOST_OFF;
	}

	if ( ! blogId || settings?.is_connected === false ) {
		return PAGE_NOTICE_STATES.SITE_DISCONNECTED;
	}

	if ( isUserConnected === false || settings?.is_user_connected === false ) {
		return PAGE_NOTICE_STATES.USER_UNLINKED;
	}

	if ( settings?.master_enabled === false ) {
		return PAGE_NOTICE_STATES.MASTER_OFF;
	}

	return null;
}

// Support doc per state, so a new state adds a slug here, not in the markup.
const LEARN_MORE_SLUGS = {
	[ PAGE_NOTICE_STATES.HOST_OFF ]: 'jetpack-ai-hub-docs-wp-supports-ai',
};

/**
 * The action for a site that is not connected.
 *
 * @param {object} pageData - Page data; see PageNotice's props.
 * @return {object} Component markup.
 */
function getConnectAction( pageData ) {
	const { blogId, userConnectionUrl, siteAdminUrl, apiRoot, apiNonce } = pageData;

	// ConnectButton registers a site; with a blog ID there is nothing left to
	// register, so a link to the connection screen fits better.
	if ( blogId ) {
		return (
			<Notice.ActionLink href={ userConnectionUrl }>
				{ __( 'Connect Jetpack', 'jetpack' ) }
			</Notice.ActionLink>
		);
	}

	return (
		<ConnectButton
			connectLabel={ __( 'Connect Jetpack', 'jetpack' ) }
			redirectUri={ `${ siteAdminUrl }admin.php?page=jetpack-ai` }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
		/>
	);
}

/**
 * Title, body and link for one state. Every field is plain data: the markup
 * lives in PageNotice, so a new state adds an entry rather than more JSX.
 *
 * Each message is its own literal `__()` call; a lookup built from a variable
 * would leave nothing to extract.
 *
 * @param {string} state    - The state to render.
 * @param {object} pageData - Page data the states link to; see PageNotice's props.
 * @return {object|null} `{ title, description, link, actions }`, or null for a state with none.
 */
function getNoticeContent( state, pageData ) {
	switch ( state ) {
		case PAGE_NOTICE_STATES.HOST_OFF:
			return {
				description: __( 'Jetpack AI is not available for this site.', 'jetpack' ),
				link: {
					href: getRedirectUrl( LEARN_MORE_SLUGS[ state ] ),
					label: __( 'Learn more', 'jetpack' ),
					isExternal: true,
				},
			};

		case PAGE_NOTICE_STATES.SITE_DISCONNECTED:
			return {
				title: __( 'This site is not connected to WordPress.com.', 'jetpack' ),
				description: __( 'Connect your site to use Jetpack AI.', 'jetpack' ),
				actions: getConnectAction( pageData ),
			};

		case PAGE_NOTICE_STATES.USER_UNLINKED:
			return {
				title: __( 'Your WordPress.com account isn’t connected.', 'jetpack' ),
				link: {
					href: pageData.userConnectionUrl,
					label: __( 'Connect your user account to use Jetpack AI.', 'jetpack' ),
				},
			};

		case PAGE_NOTICE_STATES.MASTER_OFF:
			return {
				title: __( 'Jetpack AI is turned off for this site.', 'jetpack' ),
				description: __(
					'Your feature settings are saved and will apply again when AI is turned back on.',
					'jetpack'
				),
				link: {
					href: pageData.manageUrl,
					label: pageData.hasMyJetpack
						? __( 'Manage in My Jetpack', 'jetpack' )
						: __( 'Manage all Jetpack modules', 'jetpack' ),
					// A short label reads badly broken across two lines.
					noWrap: true,
				},
			};

		default:
			return null;
	}
}

/**
 * A notice's link, whether it ends a sentence or is the whole message.
 *
 * @param {object}  props              - Component props.
 * @param {string}  props.href         - Where the link goes.
 * @param {string}  props.label        - The link text.
 * @param {boolean} [props.isExternal] - Whether it leaves wp-admin.
 * @param {boolean} [props.noWrap]     - Whether to keep a short label on one line.
 * @return {object} Component markup.
 */
function NoticeLink( { href, label, isExternal, noWrap } ) {
	if ( isExternal ) {
		return <ExternalLink href={ href }>{ label }</ExternalLink>;
	}

	return (
		<Link href={ href } className={ noWrap ? 'jetpack-ai-admin__notice-link' : undefined }>
			{ label }
		</Link>
	);
}

/**
 * The one site-state notice the Jetpack AI Hub shows, above whichever view is
 * active. Nothing else on the page renders these states.
 *
 * @param {object}      props                     - Component props.
 * @param {string}      props.view                - The view being rendered.
 * @param {number}      [props.blogId]            - Site's blog ID; falsy when not connected.
 * @param {boolean}     [props.isUserConnected]   - Whether this user's account is linked.
 * @param {object|null} [props.settings]          - Feature settings, null until fetched.
 * @param {string}      [props.userConnectionUrl] - Where this host links an account.
 * @param {string}      [props.manageUrl]         - Where this host manages the AI module.
 * @param {string}      [props.siteAdminUrl]      - wp-admin root, to return here after connecting.
 * @param {string}      [props.apiRoot]           - REST root, for the connect request.
 * @param {string}      [props.apiNonce]          - REST nonce, for the connect request.
 * @param {boolean}     [props.hasMyJetpack]      - Whether My Jetpack is loaded on this host.
 * @return {object|null} Component markup.
 */
export default function PageNotice( props ) {
	const { view, blogId, isUserConnected, settings } = props;
	const { hasConnectionError } = useConnectionErrorNotice();
	const state = getPageNoticeState( {
		view,
		blogId,
		isUserConnected,
		settings,
		hasConnectionError,
	} );

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

	const { title, description, link, actions } = content;

	// Keyed per state: swapping content into a live Notice breaks the hook that
	// announces it on mount.
	return (
		<Notice.Root key={ state } intent="warning" className="jetpack-ai-admin__page-notice">
			{ title && <Notice.Title>{ title }</Notice.Title> }
			<Notice.Description>
				{ description }
				{ description && link && ' ' }
				{ link && <NoticeLink { ...link } /> }
			</Notice.Description>
			{ actions && <Notice.Actions>{ actions }</Notice.Actions> }
		</Notice.Root>
	);
}
