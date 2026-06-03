import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
import { assetUrl } from '../../utils';
import './style.scss';

/**
 * Disconnected-state gate for the modernization chassis. Replaces the legacy
 * `ConnectionScreen` with a native `@wordpress/ui` card; the illustration loads via the
 * runtime `assetUrl()` URL (no esbuild asset import). The "Get Started" CTA runs the
 * standard site-registration flow via `useConnection().handleRegisterSite`.
 *
 * @return The connection gate.
 */
export default function ConnectionGate(): JSX.Element {
	const { handleRegisterSite, siteIsRegistering, userIsConnecting, registrationError } =
		useConnection( {
			from: 'jetpack-social',
			// MUST stay relative — an absolute URL doubles server-side and 404s.
			redirectUri: 'admin.php?page=jetpack-social',
		} );

	const isLoading = siteIsRegistering || userIsConnecting;

	const onGetStarted = useCallback( () => {
		handleRegisterSite();
	}, [ handleRegisterSite ] );

	return (
		<div className="jetpack-social-gate">
			<Card.Root className="jetpack-social-gate__card">
				<Card.Content>
					<img
						className="jetpack-social-gate__illustration"
						src={ assetUrl( 'illustration.webp' ) }
						alt=""
					/>
					<h2 className="jetpack-social-gate__title">
						{ /* "Jetpack Social" is a product name, do not translate. */ }
						Jetpack Social
					</h2>
					<p className="jetpack-social-gate__subtitle">
						{ __(
							'Share your posts with your social media network and increase your site’s traffic.',
							'jetpack-publicize-pkg'
						) }
					</p>
					{ registrationError && (
						<p className="jetpack-social-gate__error" role="alert">
							{ __( 'An error occurred. Please try again.', 'jetpack-publicize-pkg' ) }
						</p>
					) }
					<Button
						variant="solid"
						onClick={ onGetStarted }
						loading={ isLoading }
						loadingAnnouncement={ __( 'Registering…', 'jetpack-publicize-pkg' ) }
						disabled={ isLoading }
					>
						{ __( 'Get Started', 'jetpack-publicize-pkg' ) }
					</Button>
					<p className="jetpack-social-gate__tos">
						{ createInterpolateElement(
							__(
								'By clicking “Get Started”, you agree to our <tosLink>Terms of Service</tosLink>.',
								'jetpack-publicize-pkg'
							),
							{
								tosLink: (
									<a
										href={ getRedirectUrl( 'wpcom-tos' ) }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
							}
						) }
					</p>
				</Card.Content>
			</Card.Root>
		</div>
	);
}
