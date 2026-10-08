import { JetpackLogo, TermsOfService } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';
import { Button, Icon, Notice, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import useAnalytics from '../../../../hooks/use-analytics';
import {
	CONNECTION_FROM,
	CONNECTION_RETURN_URL,
	connectionErrorCode,
	connectionErrorDetail,
	startBenefits,
} from '../lib';
import styles from '../styles.module.scss';
import { markConnecting } from '../use-just-connected';

type StartStepProps = {
	// Owned by the wizard so the panel region can be labelled by the heading.
	titleId: string;
	title: string;
	description: string;
};

/**
 * The start screen: what Jetpack does for the site, and the way in.
 *
 * "Get started" registers the site and hands the browser to WordPress.com for an
 * account, which the features need an owner for. `skipPricingPage` is what makes
 * the return happen: the plans page does not carry `redirect_after_auth`, so
 * without it the user lands on My Jetpack and the wizard is over.
 *
 * @param props             - The component props.
 * @param props.titleId     - The id the panel region is labelled by.
 * @param props.title       - The screen's heading.
 * @param props.description - The line under the heading.
 * @return The rendered step.
 */
export function StartStep( { titleId, title, description }: StartStepProps ) {
	const { handleRegisterSite, siteIsRegistering, userIsConnecting, registrationError } =
		useConnection( {
			from: CONNECTION_FROM,
			redirectUri: CONNECTION_RETURN_URL,
			skipPricingPage: true,
		} );
	const { recordEvent } = useAnalytics();

	// Only registration failures reach the store. Fetching the authorization URL can
	// fail too, and that rejection is ours to hold or the screen says nothing.
	const [ handoffError, setHandoffError ] = useState< unknown >( null );

	// A hand-off rejection leaves `userIsConnecting` set in the store (CONNECT-499),
	// so on a real site the button stays busy and the retry below is unreachable.
	const isConnecting = siteIsRegistering || userIsConnecting;
	const error = registrationError || handoffError;

	// Named once: the terms sentence has to say the same words as the button it is about.
	const primaryLabel = __( 'Get started', 'jetpack-my-jetpack' );

	// The button is disabled while the request is in flight, which already swallows
	// a second click. This closes the gap before that state has rendered, so a
	// double click cannot register the site twice.
	const inFlight = useRef( false );

	const handleConnect = useCallback( () => {
		if ( inFlight.current ) {
			return;
		}
		inFlight.current = true;
		setHandoffError( null );

		// Set before we leave, read once on the way back: it is how the step we
		// return to knows to say the connection worked.
		markConnecting();

		// The name the single-screen flow already reports, so the two are one funnel.
		recordEvent( 'jetpack_my_jetpack_onboarding_click', { flow: 'wizard' } );

		// No success event: this resolves as the browser leaves for WordPress.com,
		// which is not the same thing as anyone having connected.
		handleRegisterSite().catch( ( caught: unknown ) => {
			inFlight.current = false;
			setHandoffError( caught );
			// The code only: the message interpolates the server's prose, which
			// can carry the site's own URL.
			recordEvent( 'jetpack_my_jetpack_onboarding_connect_error', {
				error_code: connectionErrorCode( caught ),
			} );
		} );
	}, [ handleRegisterSite, recordEvent ] );

	return (
		<div className={ styles.start }>
			<div className={ clsx( styles.wave, styles[ 'start-logo' ] ) }>
				<JetpackLogo />
			</div>

			<div className={ clsx( styles.wave, styles[ 'start-intro' ] ) }>
				<Text
					variant="heading-2xl"
					id={ titleId }
					render={ <h1 /> }
					className={ styles[ 'start-title' ] }
				>
					{ title }
				</Text>
				<Text variant="body-lg" render={ <p /> } className={ styles[ 'start-body' ] }>
					{ description }
				</Text>
			</div>

			<ul className={ clsx( styles.wave, styles[ 'start-benefits' ] ) }>
				{ startBenefits().map( benefit => (
					<li key={ benefit.id } className={ styles[ 'start-benefit' ] }>
						<span className={ styles[ 'start-benefit__glyph' ] } aria-hidden="true">
							<Icon icon={ benefit.icon } />
						</span>
						<Text variant="body-lg" className={ styles[ 'start-benefit__text' ] }>
							{ benefit.text }
						</Text>
					</li>
				) ) }
			</ul>

			<div className={ clsx( styles.wave, styles[ 'start-actions' ] ) }>
				{ /*
				 * Above the control it is about, so it is read before the retry.
				 * A sentence a person can act on, and the server's own words under
				 * it: mapping the causes to better copy is its own piece of work.
				 */ }
				{ error && (
					<Notice.Root intent="error" className={ styles[ 'start-error' ] }>
						<Notice.Title>
							{ __( 'We could not connect this site. Please try again.', 'jetpack-my-jetpack' ) }
						</Notice.Title>
						<Notice.Description className={ styles[ 'start-error__detail' ] }>
							{ connectionErrorDetail( error ) }
						</Notice.Description>
					</Notice.Root>
				) }

				{ /* Square corners from the theme's own radius scale, not a hardcoded zero. */ }
				<ThemeProvider cornerRadius="none">
					<Button
						variant="solid"
						className={ clsx( styles[ 'primary-green' ], styles[ 'start-primary' ] ) }
						onClick={ handleConnect }
						loading={ isConnecting }
						loadingAnnouncement={ __( 'Connecting your site…', 'jetpack-my-jetpack' ) }
					>
						{ primaryLabel }
					</Button>
				</ThemeProvider>

				<TermsOfService className={ styles[ 'start-terms' ] } agreeButtonLabel={ primaryLabel } />
			</div>
		</div>
	);
}
