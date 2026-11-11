import { Container, Col, JetpackLogo, Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { lazy, Suspense, useCallback, useState } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useFullScreen } from '../../hooks/use-fullscreen';
import { assignLocation } from '../../hooks/use-notification-watcher/assignLocation';
import Testimonials from '../testimonials';
import ConnectionForm from './connection-form/connection-form';
import { withLoadLimit } from './load-limit';
import styles from './styles.module.scss';
import type { ComponentType, FC, ReactNode } from 'react';

const OnboardingLayout: FC< { children: ReactNode } > = ( { children } ) => (
	<Container
		horizontalSpacing={ 3 }
		horizontalGap={ 0 }
		className={ styles[ 'onboarding-screen' ] }
	>
		<Col sm={ 4 } md={ 4 } lg={ 6 } className={ clsx( styles.column, styles[ 'primary-column' ] ) }>
			{ children }
		</Col>
		<Col
			sm={ 4 }
			md={ 4 }
			lg={ 6 }
			className={ clsx( styles.column, styles[ 'seconday-column' ], styles.testimonials ) }
		>
			<Testimonials />
		</Col>
	</Container>
);

const ConnectScreen: FC< { children?: ReactNode } > = ( { children } ) => (
	<OnboardingLayout>
		<ConnectionForm />
		{ children }
	</OnboardingLayout>
);

// The window the wizard opens into, saying it is busy rather than sitting blank.
const WizardLoading: FC = () => (
	<div className={ styles[ 'wizard-loading' ] } role="status">
		<Spinner />
		<span className="screen-reader-text">{ __( 'Loading setup…', 'jetpack-my-jetpack' ) }</span>
	</div>
);

// The two ways out; the wizard reads its storage scope off the page itself.
type WizardLinks = Pick< OnboardingWizardState, 'exitUrl' | 'dashboardUrl' >;

// Stands in for a wizard that failed to load, keeping its skip: with the flag on,
// My Jetpack keeps sending a site-only connection back here.
const WizardFallback: FC< WizardLinks > = ( { exitUrl, dashboardUrl } ) => {
	const { isRegistered, isUserConnected } = useConnection();
	const [ isSkipping, setIsSkipping ] = useState( false );

	// The wizard's own skip request; see settleOnboarding() in wizard/lib.ts.
	const handleSkip = useCallback( () => {
		setIsSkipping( true );
		apiFetch( {
			path: '/my-jetpack/v1/site/onboarding/settled',
			method: 'POST',
			data: { outcome: 'skipped' },
		} ).then(
			() => assignLocation( exitUrl ),
			// Unsettled, a site-only connection would be sent straight back here.
			() => assignLocation( isUserConnected ? exitUrl : dashboardUrl )
		);
	}, [ exitUrl, dashboardUrl, isUserConnected ] );

	const skip = (
		<div className={ styles.skip }>
			<Button variant="link" onClick={ handleSkip } disabled={ isSkipping }>
				{ __( 'Skip setup', 'jetpack-my-jetpack' ) }
			</Button>
		</div>
	);

	// Past the wizard's connect step: connecting again would only repeat the authorization.
	if ( isUserConnected ) {
		return (
			<OnboardingLayout>
				<JetpackLogo height={ 24 } />
				<Text variant="headline-small">
					{ __( 'Your site is connected to Jetpack', 'jetpack-my-jetpack' ) }
				</Text>
				<Text>
					{ __(
						'Setup could not load. You can skip it and go to My Jetpack.',
						'jetpack-my-jetpack'
					) }
				</Text>
				{ skip }
			</OnboardingLayout>
		);
	}

	return <ConnectScreen>{ isRegistered && skip }</ConnectScreen>;
};

/*
 * How long the wizard's chunk gets before the single screen stands in. Webpack
 * waits 120s on a hung request, which is two minutes of a blank dark window.
 */
const WIZARD_LOAD_LIMIT_MS = 15000;

// A chunk of its own, so the single screen every flag-off site loads leaves out the wizard's art.
const Wizard = lazy< ComponentType< WizardLinks > >( () =>
	withLoadLimit(
		import( /* webpackChunkName: "onboarding-wizard" */ './wizard' ),
		WIZARD_LOAD_LIMIT_MS
	).then(
		module => ( { default: module.Wizard } ),
		error => {
			// eslint-disable-next-line no-console
			console.error( 'My Jetpack: the setup wizard failed to load.', error );
			return { default: WizardFallback };
		}
	)
);

const OnboardingScreen: FC = () => {
	useFullScreen();

	// Only set when the wizard's feature flag is on; the page carries its configuration
	// rather than the flag itself.
	const wizard = getMyJetpackWindowInitialState( 'onboardingWizard' );

	if ( wizard?.exitUrl ) {
		return (
			<Suspense fallback={ <WizardLoading /> }>
				<Wizard exitUrl={ wizard.exitUrl } dashboardUrl={ wizard.dashboardUrl } />
			</Suspense>
		);
	}

	return <ConnectScreen />;
};

export default OnboardingScreen;
