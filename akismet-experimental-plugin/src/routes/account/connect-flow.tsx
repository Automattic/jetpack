import { Button, Card, CardBody, CardHeader, ExternalLink } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isJetpackActive } from '@/lib/is-jetpack-active';
import { ConnectJetpackStep } from './connect-jetpack-step';
import { EnterKeyStep } from './enter-key-step';
import '@/styles/account.scss';

type Step = 'choose' | 'existing' | 'jetpack';

type Props = {
	onSuccess: () => void;
};

/**
 * The initial Account-tab stepper shown when no API key is set.
 *
 * Three paths:
 * - "I already have a key" → `<EnterKeyStep>` (POST /key).
 * - "Get a new key" → opens akismet.com in a new tab; doesn't mutate.
 * - "Connect with Jetpack" → `<ConnectJetpackStep>` (GET /jetpack-key).
 *
 * The Jetpack option is hidden when `isJetpackActive()` returns false; the
 * defense-in-depth null return inside `<ConnectJetpackStep>` covers misroute.
 *
 * @param props           - The component props.
 * @param props.onSuccess
 * @return The current step's UI.
 */
export function ConnectFlow( { onSuccess }: Props ): JSX.Element {
	const [ step, setStep ] = useState< Step >( 'choose' );

	if ( step === 'existing' ) {
		return (
			<Card>
				<CardHeader>{ __( 'Enter your API key', 'akismet' ) }</CardHeader>
				<CardBody>
					<EnterKeyStep onSuccess={ onSuccess } />
					<div className="akismet-connect-back">
						<Button variant="link" onClick={ () => setStep( 'choose' ) }>
							{ __( 'Go back', 'akismet' ) }
						</Button>
					</div>
				</CardBody>
			</Card>
		);
	}

	if ( step === 'jetpack' ) {
		return (
			<Card>
				<CardHeader>{ __( 'Connect with Jetpack', 'akismet' ) }</CardHeader>
				<CardBody>
					<ConnectJetpackStep onSuccess={ onSuccess } />
					<div className="akismet-connect-back">
						<Button variant="link" onClick={ () => setStep( 'choose' ) }>
							{ __( 'Go back', 'akismet' ) }
						</Button>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>{ __( 'Set up Akismet', 'akismet' ) }</CardHeader>
			<CardBody>
				<p>
					{ __(
						'Akismet protects your site from spam. Choose how to set up your API key.',
						'akismet'
					) }
				</p>
				<div className="akismet-connect-choices">
					<Button variant="primary" onClick={ () => setStep( 'existing' ) } __next40pxDefaultSize>
						{ __( 'I already have a key', 'akismet' ) }
					</Button>
					<ExternalLink href="https://akismet.com/wordpress/">
						{ __( 'Get a new key', 'akismet' ) }
					</ExternalLink>
					{ isJetpackActive() && (
						<Button
							variant="secondary"
							onClick={ () => setStep( 'jetpack' ) }
							__next40pxDefaultSize
						>
							{ __( 'Connect with Jetpack', 'akismet' ) }
						</Button>
					) }
				</div>
			</CardBody>
		</Card>
	);
}
