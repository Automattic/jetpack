import { getRedirectUrl } from '@automattic/jetpack-components';
import { getAdminUrl, isJetpackSelfHostedSite } from '@automattic/jetpack-script-data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { ReactNode } from 'react';

/** What a page load carries in `Jetpack::state()`: an error code, its detail, or a message code. */
export type JetpackState = {
	error?: string | null;
	errorDescription?: string | null;
	message?: string | null;
};

type Options = {
	/** The Jetpack plugin's version, for the welcome after an update. */
	jetpackVersion?: string | null;
	/** Show a message code that has no copy as itself, as Settings always did. */
	showUnknownMessages?: boolean;
};

export type JetpackStateNotice = {
	content: ReactNode;
	level: 'error' | 'info' | 'success';
	action?: { label: string; href: string; external: boolean };
};

/**
 * Generic copy for error codes that have no message of their own.
 *
 * @param code - The error code.
 * @return The message.
 */
const getGenericErrorMessage = ( code: string ): ReactNode =>
	createInterpolateElement(
		sprintf(
			/* translators: %s: an error code. */
			__(
				'<s>Your Jetpack has a glitch.</s> We’re sorry for the inconvenience. Please try again later, if the issue continues please contact support with this message: %s',
				'jetpack-my-jetpack'
			),
			code
		),
		{
			s: <strong />,
		}
	);

/**
 * Copy for an error code.
 *
 * Some codes here also have (deliberately different) copy in the connection package's getConnectScreenErrorMessage; review both when changing one.
 *
 * @param code - The error code.
 * @return The message.
 */
function getErrorMessage( code: string ): ReactNode {
	switch ( code ) {
		case 'cheatin':
			return __( "Cheatin' uh?", 'jetpack-my-jetpack' );
		case 'access_denied':
			return createInterpolateElement(
				__(
					'<p>Would you mind telling us why you did not complete the Jetpack connection in this <a>2 question survey</a>?</p><p>A Jetpack connection is required for our free security and traffic features to work.</p>',
					'jetpack-my-jetpack'
				),
				{
					a: <Link href={ getRedirectUrl( 'jetpack-cancelled-connection' ) } openInNewTab />,
					p: <p />,
				}
			);
		case 'wrong_state':
			return __(
				'You need to stay logged in to your WordPress blog while you authorize Jetpack.',
				'jetpack-my-jetpack'
			);
		case 'invalid_client':
			return __(
				'We had an issue connecting Jetpack; deactivate then reactivate the Jetpack plugin, then connect again.',
				'jetpack-my-jetpack'
			);
		case 'invalid_grant':
			return __(
				'There was an issue connecting your Jetpack. Please click "Connect to WordPress.com" again.',
				'jetpack-my-jetpack'
			);
		case 'site_inaccessible':
		case 'site_requires_authorization':
			return sprintf(
				/* translators: %s: an error code and message. */
				__(
					'Your website needs to be publicly accessible to use Jetpack: %s',
					'jetpack-my-jetpack'
				),
				code
			);
		case 'connection_disabled':
			return createInterpolateElement(
				__(
					"This site can't be connected to WordPress.com because it violates our <a>Terms of Service</a>.",
					'jetpack-my-jetpack'
				),
				{
					a: <Link openInNewTab href={ getRedirectUrl( 'wpcom-tos' ) } />,
				}
			);
		case 'not_public':
			return createInterpolateElement(
				__(
					'<s>Your Jetpack has a glitch.</s> Connecting this site with WordPress.com is not possible. This usually means your site is not publicly accessible (localhost).',
					'jetpack-my-jetpack'
				),
				{
					s: <strong />,
				}
			);
		case 'wpcom_408':
		case 'wpcom_5??':
		case 'wpcom_bad_response':
		case 'wpcom_outage':
			return __(
				'WordPress.com is currently having problems and is unable to fuel up your Jetpack. Please try again later.',
				'jetpack-my-jetpack'
			);
		case 'register_http_request_failed':
		case 'token_http_request_failed':
			return sprintf(
				/* translators: %s: an error code and message. */
				__(
					'Jetpack could not contact WordPress.com: %s. This usually means something is incorrectly configured on your web host.',
					'jetpack-my-jetpack'
				),
				code
			);
		default:
			return getGenericErrorMessage( code );
	}
}

/**
 * The notice for a message code, or null when it has nothing to say on this site.
 *
 * @param code    - The message code.
 * @param options - See Options.
 * @return The notice.
 */
function getMessageNotice( code: string, options: Options ): JetpackStateNotice | null {
	const { jetpackVersion, showUnknownMessages } = options;

	switch ( code ) {
		// Shown on the first page load after a Jetpack plugin update.
		case 'modules_activated':
			if ( ! isJetpackSelfHostedSite() ) {
				return null;
			}
			return {
				content: createInterpolateElement(
					sprintf(
						/* translators: %s: a version number, like 8.8. */
						__( 'Welcome to <s>Jetpack %s</s>!', 'jetpack-my-jetpack' ),
						jetpackVersion
					),
					{
						s: <strong />,
					}
				),
				level: 'info',
			};
		case 'already_authorized':
			return {
				content: __( 'Your Jetpack is already connected.', 'jetpack-my-jetpack' ),
				level: 'success',
			};
		case 'authorized':
			return {
				content: __(
					"You're fueled up and ready to go, Jetpack is now active.",
					'jetpack-my-jetpack'
				),
				level: 'success',
			};
		case 'linked':
			return {
				content: __( "You're fueled up and ready to go.", 'jetpack-my-jetpack' ),
				level: 'success',
			};
		case 'protect_misconfigured_ip':
			return {
				content: __(
					'Your server is misconfigured, which means that login protection is unable to effectively protect your site.',
					'jetpack-my-jetpack'
				),
				level: 'info',
				action: {
					label: __( 'Learn More', 'jetpack-my-jetpack' ),
					href: getRedirectUrl( 'jetpack-support-security-troubleshooting-protect' ),
					external: true,
				},
			};
		case 'reconnection_completed':
			return {
				content: createInterpolateElement(
					__(
						'Jetpack successfully reconnected! You can check your Jetpack Connection health by visiting the <a>Site Health tool</a>.',
						'jetpack-my-jetpack'
					),
					{
						a: <Link href={ getAdminUrl( 'site-health.php' ) } />,
					}
				),
				level: 'success',
			};
		default:
			return showUnknownMessages ? { content: code, level: 'info' } : null;
	}
}

/**
 * The notice a page load's Jetpack state asks for, shared by Jetpack › Settings and My Jetpack.
 *
 * A message code wins over an error code, as Settings always showed.
 *
 * @param state   - The page load's Jetpack state.
 * @param options - See Options.
 * @return The notice, or null when there is nothing to show.
 */
export function getJetpackStateNotice(
	state: JetpackState,
	options: Options = {}
): JetpackStateNotice | null {
	if ( state.message ) {
		return getMessageNotice( state.message, options );
	}

	if ( ! state.error ) {
		return null;
	}

	const message = getErrorMessage( state.error );

	return {
		content: state.errorDescription ? (
			<div>
				{ message }
				<br />
				{ state.errorDescription }
			</div>
		) : (
			<div>{ message }</div>
		),
		level: state.error === 'access_denied' ? 'info' : 'error',
	};
}
