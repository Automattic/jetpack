import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { GATED_VIEWS } from '../../constants';

// Highest precedence first. FORCED_OFF has no content yet, so nothing resolves
// it: https://github.com/Automattic/jetpack/pull/52062 adds both.
const PAGE_NOTICE_STATES = {
	CONNECTION_ERROR: 'connection-error',
	HOST_OFF: 'host-off',
	OFFLINE_MODE: 'offline-mode',
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
 * @param {boolean}     [options.isOfflineMode]      - Whether the site is in offline mode.
 * @param {object|null} [options.settings]           - Feature settings, null until fetched.
 * @param {boolean}     [options.hasConnectionError] - Whether the connection store reports a
 *                                                   connection the site cannot use.
 * @return {string|null} The state to render, or null.
 */
export function getPageNoticeState( {
	view,
	blogId,
	isUserConnected,
	isOfflineMode,
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

	// Ahead of SITE_DISCONNECTED: offline mode is why the settings call reports
	// no connection, and connecting is the one thing it forbids.
	if ( isOfflineMode ) {
		return PAGE_NOTICE_STATES.OFFLINE_MODE;
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

const LEARN_MORE_SLUG = 'jetpack-ai-hub-docs-wp-supports-ai';

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
					href: getRedirectUrl( LEARN_MORE_SLUG ),
					label: __( 'Learn more', 'jetpack' ),
					openInNewTab: true,
				},
			};

		case PAGE_NOTICE_STATES.OFFLINE_MODE:
			return {
				title: __( 'Jetpack AI is not available in offline mode.', 'jetpack' ),
				action: {
					href: getRedirectUrl( 'jetpack-support-development-mode' ),
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
 * @param {string}      props.view                - The view being rendered.
 * @param {number}      [props.blogId]            - Site's blog ID; falsy when not connected.
 * @param {boolean}     [props.isUserConnected]   - Whether this user's account is linked.
 * @param {boolean}     [props.isOfflineMode]     - Whether the site is in offline mode.
 * @param {object|null} [props.settings]          - Feature settings, null until fetched.
 * @param {string}      [props.userConnectionUrl] - Where this host links an account.
 * @param {string}      [props.manageUrl]         - Where this host manages the AI module.
 * @param {boolean}     [props.hasMyJetpack]      - Whether My Jetpack is loaded on this host.
 * @return {object|null} Component markup.
 */
export default function PageNotice( props ) {
	const { view, blogId, isUserConnected, isOfflineMode, settings } = props;
	const { hasConnectionError } = useConnectionErrorNotice();
	const state = getPageNoticeState( {
		view,
		blogId,
		isUserConnected,
		isOfflineMode,
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

	const { title, description, action } = content;

	// Keyed per state: states render different children, and swapping them into a
	// live Notice throws "Cannot read properties of undefined (reading 'length')".
	return (
		<Notice.Root key={ state } intent="warning" className="jetpack-ai-admin__page-notice">
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
