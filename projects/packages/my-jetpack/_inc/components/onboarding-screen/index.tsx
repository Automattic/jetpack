import { Container, Col } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { lazy, Suspense } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useFullScreen } from '../../hooks/use-fullscreen';
import Testimonials from '../testimonials';
import ConnectionForm from './connection-form/connection-form';
import styles from './styles.module.scss';
import type { ComponentType, FC } from 'react';

const ConnectScreen: FC = () => (
	<Container
		horizontalSpacing={ 3 }
		horizontalGap={ 0 }
		className={ styles[ 'onboarding-screen' ] }
	>
		<Col sm={ 4 } md={ 4 } lg={ 6 } className={ clsx( styles.column, styles[ 'primary-column' ] ) }>
			<ConnectionForm />
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

// A chunk of its own, so the single screen every flag-off site loads leaves out the wizard's art.
const Wizard = lazy< ComponentType< OnboardingWizardState > >( () =>
	import( /* webpackChunkName: "onboarding-wizard" */ './wizard' ).then(
		module => ( { default: module.Wizard } ),
		// A blank page would leave no way to connect at all.
		() => ( { default: ConnectScreen } )
	)
);

const OnboardingScreen: FC = () => {
	useFullScreen();

	// Only set when the wizard's feature flag is on; the page carries its configuration
	// rather than the flag itself.
	const wizard = getMyJetpackWindowInitialState( 'onboardingWizard' );

	if ( wizard?.exitUrl ) {
		return (
			<Suspense fallback={ null }>
				<Wizard exitUrl={ wizard.exitUrl } dashboardUrl={ wizard.dashboardUrl } />
			</Suspense>
		);
	}

	return <ConnectScreen />;
};

export default OnboardingScreen;
