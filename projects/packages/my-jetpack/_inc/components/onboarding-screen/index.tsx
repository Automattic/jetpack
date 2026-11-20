import { Container, Col } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import { useFullScreen } from '../../hooks/use-fullscreen';
import Testimonials from '../testimonials';
import ConnectionForm from './connection-form/connection-form';
import styles from './styles.module.scss';
import { Wizard } from './wizard';
import type { FC } from 'react';

const OnboardingScreen: FC = () => {
	useFullScreen();

	// Only set when the wizard's feature flag is on; the page carries its configuration
	// rather than the flag itself.
	const wizard = getMyJetpackWindowInitialState( 'onboardingWizard' );

	if ( wizard?.exitUrl ) {
		return <Wizard exitUrl={ wizard.exitUrl } dashboardUrl={ wizard.dashboardUrl } />;
	}

	return (
		<Container
			horizontalSpacing={ 3 }
			horizontalGap={ 0 }
			className={ styles[ 'onboarding-screen' ] }
		>
			<Col
				sm={ 4 }
				md={ 4 }
				lg={ 6 }
				className={ clsx( styles.column, styles[ 'primary-column' ] ) }
			>
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
};

export default OnboardingScreen;
