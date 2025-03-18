import { Container, Col, JetpackLogo } from '@automattic/jetpack-components';
import { useFullScreen } from '../../hooks/use-fullscreen';
import styles from './styles.module.scss';
import type { FC } from 'react';
const OnboardingScreen: FC = () => {
	useFullScreen( [] );

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 0 }>
			<JetpackLogo height={ 24 } showText={ false } className={ styles[ 'jetpack-logo' ] } />
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				<h1>Column 1</h1>
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ 6 }>
				<h1>Column 2</h1>
			</Col>
		</Container>
	);
};

export default OnboardingScreen;
