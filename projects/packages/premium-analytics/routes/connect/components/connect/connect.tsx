/**
 * External dependencies
 */
import { Stack, Button } from '@wordpress/ui';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import useConnection from '@automattic/jetpack-connection/use-connection';
import type { JetpackScriptData } from '@automattic/jetpack-script-data';

/**
 * Internal dependencies
 */
import { Connection, ConnectionError } from '../../images';
import './style.scss';

// Narrowed from `getScriptData().connection` so the shape tracks upstream.
type ConnectionData = Pick<
	NonNullable< JetpackScriptData[ 'connection' ] >,
	'apiNonce' | 'apiRoot' | 'registrationNonce'
>;

export function Connect( { data }: { data: ConnectionData } ) {
	const {
		handleRegisterSite,
		siteIsRegistering,
		userIsConnecting,
		registrationError,
	} = useConnection( {
		apiNonce: data.apiNonce,
		apiRoot: data.apiRoot,
		registrationNonce: data.registrationNonce,
		redirectUri: 'admin.php?page=jetpack-premium-analytics&p=/',
		from: 'jetpack-premium-analytics',
		skipUserConnection: true,
	} );

	const isBusy = siteIsRegistering || userIsConnecting;
	const isError = !! registrationError;

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
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="jetpack-premium-analytics-connect"
		>
			{ isError ? <ConnectionError /> : <Connection /> }

			<Stack direction="column" gap="sm" align="center">
				<span className="jetpack-premium-analytics-connect__title">{ title }</span>

				<span className="jetpack-premium-analytics-connect__description">
					{ description }
				</span>
			</Stack>

			<Stack direction="column" gap="md" align="center">
				<Button
					variant="solid"
					onClick={ handleRegisterSite }
					disabled={ isBusy }
					loading={ isBusy }
				>
					{ isBusy
						? __( 'Connecting…', 'jetpack-premium-analytics' )
						: buttonText }
				</Button>

				{ ! isError && (
					<span className="jetpack-premium-analytics-connect__legal">
						{ createInterpolateElement(
							__(
								"By authorizing, you agree to our <tos>Terms of Service</tos> and to <sync>sync your site's data</sync> with us.",
								'jetpack-premium-analytics'
							),
							{
								tos: (
									<ExternalLink href="https://wordpress.com/tos/">
										tos
									</ExternalLink>
								),
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
