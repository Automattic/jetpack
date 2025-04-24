import { Container, Col } from '@automattic/jetpack-components';
import clsx from 'clsx';
import { useFullScreen } from '../../hooks/use-fullscreen';
import Testimonials from '../testimonials';
import AtomicConnectionForm from './connection-form/atomic-connection-form';
import ConnectionForm from './connection-form/connection-form';
import styles from './styles.module.scss';
import type { FC } from 'react';

interface OnboardingScreenProps {
	isAtomic?: boolean;
}

const OnboardingScreen: FC< OnboardingScreenProps > = ( { isAtomic = false } ) => {
	useFullScreen();

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
				{ isAtomic ? <AtomicConnectionForm /> : <ConnectionForm /> }
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
