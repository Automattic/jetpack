import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
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

const LEARN_MORE_SLUG = 'jetpack-ai-hub-docs-wp-supports-ai';

/**
 * Title, body and action for one state. Every field is plain data: the markup
 * lives in PageNotice, so a new state adds an entry rather than more JSX.
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
				// The switch itself, rather than a link away: which page holds the
				// master switch varies by host.
				hasMasterSwitch: true,
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
 * @param {object|null} [props.settings]          - Feature settings, null until fetched.
 * @param {string}      [props.userConnectionUrl] - Where this host links an account.
 * @param {Function}    props.onTurnOnAi          - Turns the master switch on; resolves with it on.
 * @return {object|null} Component markup.
 */
export default function PageNotice( props ) {
	const { view, blogId, isUserConnected, settings, onTurnOnAi } = props;
	const { hasConnectionError } = useConnectionErrorNotice();
	const [ turnOnError, setTurnOnError ] = useState( null );
	const [ isTurningOn, setIsTurningOn ] = useState( false );

	const handleTurnOn = useCallback( async () => {
		setTurnOnError( null );
		setIsTurningOn( true );

		try {
			await onTurnOnAi();
		} catch {
			setTurnOnError( __( 'Jetpack AI could not be turned on. Please try again.', 'jetpack' ) );
		} finally {
			setIsTurningOn( false );
		}
	}, [ onTurnOnAi ] );
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

	const { title, description, action, hasMasterSwitch } = content;

	// Keyed per state: swapping content into a live Notice breaks the hook that
	// announces it on mount.
	return (
		<Notice.Root
			key={ turnOnError ? `${ state }-error` : state }
			intent="warning"
			className="jetpack-ai-admin__page-notice"
		>
			{ title && <Notice.Title>{ title }</Notice.Title> }
			{ description && <Notice.Description>{ description }</Notice.Description> }
			{ turnOnError && <Notice.Description>{ turnOnError }</Notice.Description> }
			{ hasMasterSwitch && (
				<Notice.Actions>
					<Notice.ActionButton disabled={ isTurningOn } onClick={ handleTurnOn }>
						{ isTurningOn ? __( 'Turning on…', 'jetpack' ) : __( 'Turn on Jetpack AI', 'jetpack' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
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
