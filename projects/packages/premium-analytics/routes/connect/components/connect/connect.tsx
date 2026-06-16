/**
 * External dependencies
 */
import { Stack, Button } from '@wordpress/ui';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import useConnection from '@automattic/jetpack-connection/use-connection';

/**
 * Internal dependencies
 */
import { Connection, ConnectionError } from '../../images';
import './style.scss';

interface ConnectionData {
	apiNonce: string;
	apiRoot: string;
	registrationNonce: string;
}

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
		redirectUri: 'admin.php?page=wc-analytics&p=/',
		from: 'woocommerce-analytics',
		skipUserConnection: true,
	} );

	const isBusy = siteIsRegistering || userIsConnecting;
	const isError = !! registrationError;

	const title = isError
		? __( 'Connection failed', 'woocommerce-analytics' )
		: __( 'Welcome to WooCommerce Analytics!', 'woocommerce-analytics' );

	const description = isError
		? __(
				'We were unable to connect your store. Please check your connection and try again.',
				'woocommerce-analytics'
		  )
		: __(
				'To provide accurate reports and tailored insights, we need permission to access your store data.',
				'woocommerce-analytics'
		  );

	const buttonText = isError
		? __( 'Try again', 'woocommerce-analytics' )
		: __( 'Authorize and sync data', 'woocommerce-analytics' );

	return (
		<Stack
			direction="column"
			gap="xl"
			align="center"
			className="wc-analytics-connect"
		>
			{ isError ? <ConnectionError /> : <Connection /> }

			<Stack direction="column" gap="sm" align="center">
				<span className="wc-analytics-connect__title">{ title }</span>

				<span className="wc-analytics-connect__description">
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
						? __( 'Connecting…', 'woocommerce-analytics' )
						: buttonText }
				</Button>

				{ ! isError && (
					<span className="wc-analytics-connect__legal">
						{ createInterpolateElement(
							__(
								"By authorizing, you agree to our <tos>Terms of Service</tos> and to <sync>sync your site's data</sync> with us.",
								'woocommerce-analytics'
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
