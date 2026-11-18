import { JetpackLogo, TermsOfService } from '@automattic/jetpack-components';
import {
	CONNECTION_FROM,
	useConnection,
	getConnectScreenErrorMessage,
	getRegistrationErrorCode,
	getRegistrationErrorSummary,
} from '@automattic/jetpack-connection';
import { __, _x } from '@wordpress/i18n';
import { ThemeProvider } from '@wordpress/theme';
import { Button, Icon, Notice, Text } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useRef } from 'react';
import {
	BRAND_COLOR,
	CONNECTION_RETURN_URL,
	connectionErrorCode,
	connectionErrorDetail,
	startBenefits,
} from '../lib';
import styles from '../styles.module.scss';
import { WIZARD_EVENTS, useWizardTracks } from '../telemetry';
import { markConnecting } from '../use-just-connected';
import { useRestoredConnection } from '../use-restored-connection';

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
	const { handleRegisterSite, siteIsRegistering, userIsConnecting, connectError, isOfflineMode } =
		useConnection( {
			from: CONNECTION_FROM.myJetpackOnboarding,
			redirectUri: CONNECTION_RETURN_URL,
			skipPricingPage: true,
		} );
	// The same bundle the rest of the flow carries, so the connection is part of
	// the funnel rather than two loose events beside it.
	const track = useWizardTracks( 'start' );

	const isConnecting = siteIsRegistering || userIsConnecting;

	// The summary falls back to the server's raw text, so only a mapped message says what to do.
	const errorSummary = connectError
		? getRegistrationErrorSummary( connectError, isOfflineMode )
		: null;
	const hasMappedMessage = Boolean(
		connectError &&
		getConnectScreenErrorMessage( getRegistrationErrorCode( connectError ), isOfflineMode )
	);

	// Named once: the terms sentence has to say the same words as the button it is about.
	const primaryLabel = __( 'Get started', 'jetpack-my-jetpack' );

	// The button is disabled while the request is in flight, which already swallows
	// a second click. This closes the gap before that state has rendered, so a
	// double click cannot register the site twice.
	const inFlight = useRef( false );

	// Back from WordPress.com can return this page with the click still in flight.
	useRestoredConnection(
		useCallback( () => {
			inFlight.current = false;
		}, [] )
	);

	const handleConnect = useCallback( () => {
		if ( inFlight.current ) {
			return;
		}
		inFlight.current = true;

		// Set before we leave, read once on the way back: it is how the step we
		// return to knows to say the connection worked.
		markConnecting();

		// `flow` is what tells this run from the single-screen flow, which reports
		// the click under the same name.
		track( WIZARD_EVENTS.connectClick, { flow: 'wizard' } );

		// No success event: this resolves as the browser leaves for WordPress.com,
		// which is not the same thing as anyone having connected.
		handleRegisterSite().catch( ( caught: unknown ) => {
			inFlight.current = false;
			// The code only: the message interpolates the server's prose, which
			// can carry the site's own URL.
			track( WIZARD_EVENTS.connectError, {
				error_code: connectionErrorCode( caught ),
			} );
		} );
	}, [ handleRegisterSite, track ] );

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
				{ /* Above the control it is about, so it is read before the retry. */ }
				{ connectError && (
					<Notice.Root intent="error" className={ styles[ 'start-error' ] }>
						<Notice.Title>
							{ hasMappedMessage
								? __( 'We could not connect this site.', 'jetpack-my-jetpack' )
								: _x(
										'We could not connect this site. Please try again.',
										'',
										'jetpack-my-jetpack'
									) }
						</Notice.Title>
						<Notice.Description className={ styles[ 'start-error__detail' ] }>
							{ errorSummary || connectionErrorDetail( connectError ) }
						</Notice.Description>
					</Notice.Root>
				) }

				{ /* Square corners from the theme's own radius scale, not a hardcoded zero. */ }
				<ThemeProvider color={ BRAND_COLOR } cornerRadius="none">
					<Button
						variant="solid"
						className={ styles[ 'start-primary' ] }
						onClick={ handleConnect }
						loading={ isConnecting }
						loadingAnnouncement={ __( 'Connecting your site…', 'jetpack-my-jetpack' ) }
					>
						{ primaryLabel }
					</Button>
				</ThemeProvider>

				<TermsOfService
					className={ styles[ 'start-terms' ] }
					variant="body-md"
					agreeButtonLabel={ primaryLabel }
				/>
			</div>
		</div>
	);
}
