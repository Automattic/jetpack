import { Container, Col, JetpackLogo } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { useFullScreen } from '../../hooks/use-fullscreen';
import ConnectionsSection from '../connections-section';
import exampleImage from './grow-your-audience.png';
import styles from './styles.module.scss';
import type { FC } from 'react';

const OnboardingScreen: FC = () => {
	useFullScreen();

	return (
		<Container
			horizontalSpacing={ 3 }
			horizontalGap={ 0 }
			className={ styles[ 'onboarding-screen' ] }
		>
			<JetpackLogo height={ 24 } showText={ false } className={ styles[ 'jetpack-logo' ] } />
			<Col
				sm={ 4 }
				md={ 4 }
				lg={ 6 }
				className={ clsx( styles.column, styles[ 'primary-column' ] ) }
			>
				<ConnectionsSection />
			</Col>
			<Col
				sm={ 4 }
				md={ 4 }
				lg={ 6 }
				className={ clsx( styles.column, styles[ 'seconday-column' ], styles.testimonials ) }
			>
				<img src={ exampleImage } alt="Onboarding Screen" />
			</Col>
		</Container>
	);
};

export default OnboardingScreen;
