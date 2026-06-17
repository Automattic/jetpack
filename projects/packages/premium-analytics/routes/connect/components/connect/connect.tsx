/**
 * External dependencies
 */
import useConnection from '@automattic/jetpack-connection/use-connection';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack, Button } from '@wordpress/ui';
import { Connection, ConnectionError } from '../../images';
import type { JetpackScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import './style.scss';

// Narrowed from `getScriptData().connection` so the shape tracks upstream.
type ConnectionData = Pick<
	NonNullable< JetpackScriptData[ 'connection' ] >,
	'apiNonce' | 'apiRoot' | 'registrationNonce'
>;

/**
 * Connect screen: authorize button + ToS, with connecting and error states.
 *
 * @param props      - Component props.
 * @param props.data - Jetpack connection data (nonces) for `useConnection`.
 * @return The connect screen.
 */
export function Connect( { data }: { data: ConnectionData } ) {
	const navigate = useNavigate();
	const { handleRegisterSite, siteIsRegistering, userIsConnecting, registrationError } =
		useConnection( {
			apiNonce: data.apiNonce,
			apiRoot: data.apiRoot,
			registrationNonce: data.registrationNonce,
			from: 'jetpack-premium-analytics',
			skipUserConnection: true,
		} );

	const isBusy = siteIsRegistering || userIsConnecting;
	const isError = !! registrationError;

	// Register the site, then hand off to /syncing via the router. We omit
	// `redirectUri` from `useConnection` so it performs no `window.location`
	// navigation of its own (with `skipUserConnection` and no `redirectUri`,
	// its user-connect step is a no-op) — the router owns the transition, so
	// connect → syncing is instant instead of a full-page reload.
	//
	// The two failure domains are handled separately so neither is swallowed:
	// a registration failure stays put and surfaces via `registrationError`
	// below (the retry UI), while a post-registration navigation failure is
	// logged rather than silently dropped.
	const handleAuthorize = useCallback( () => {
		handleRegisterSite()
			.then(
				() => navigate( { to: '/syncing' } ),
				() => {
					/* Registration failed; `registrationError` drives the retry UI. */
				}
			)
			.catch( navigationError => {
				// eslint-disable-next-line no-console
				console.error(
					'Premium Analytics: navigation to /syncing failed after registration:',
					navigationError
				);
			} );
	}, [ handleRegisterSite, navigate ] );

	// Log the underlying failure (incl. error code) for support; per-code user
	// messaging is tracked in WOOA7S-1327.
	useEffect( () => {
		if ( registrationError ) {
			// eslint-disable-next-line no-console
			console.error( 'Premium Analytics site registration failed:', registrationError );
		}
	}, [ registrationError ] );

	const title = isError
		? __( 'Connection failed', 'jetpack-premium-analytics' )
		: __( 'Welcome to Premium Analytics!', 'jetpack-premium-analytics' );

	const description = isError
		? __(
				'We were unable to connect your store. Please check your connection and try again.',
				'jetpack-premium-analytics'
		  )
		: __(
				'To provide accurate reports and tailored insights, we need permission to access your store data.',
				'jetpack-premium-analytics'
		  );

	const buttonText = isError
		? __( 'Try again', 'jetpack-premium-analytics' )
		: __( 'Authorize and sync data', 'jetpack-premium-analytics' );

	return (
		<Stack direction="column" gap="xl" align="center" className="jetpack-premium-analytics-connect">
			{ isError ? <ConnectionError /> : <Connection /> }

			<Stack direction="column" gap="sm" align="center">
				<span className="jetpack-premium-analytics-connect__title">{ title }</span>

				<span className="jetpack-premium-analytics-connect__description">{ description }</span>
			</Stack>

			<Stack direction="column" gap="md" align="center">
				<Button variant="solid" onClick={ handleAuthorize } disabled={ isBusy } loading={ isBusy }>
					{ isBusy ? __( 'Connecting…', 'jetpack-premium-analytics' ) : buttonText }
				</Button>

				{ ! isError && (
					<span className="jetpack-premium-analytics-connect__legal">
						{ createInterpolateElement(
							__(
								"By authorizing, you agree to our <tos>Terms of Service</tos> and to <sync>sync your site's data</sync> with us.",
								'jetpack-premium-analytics'
							),
							{
								tos: <ExternalLink href="https://wordpress.com/tos/">tos</ExternalLink>,
								sync: (
									<ExternalLink href="https://woocommerce.com/woocommerce-analytics-data-syncing/">
										sync
									</ExternalLink>
								),
							}
						) }
					</span>
				) }
			</Stack>
		</Stack>
	);
}
