import { Container, Col, H3 } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import illustration from './illustration.svg';
import styles from './styles.module.scss';

const Header = () => (
	<Container horizontalSpacing={ 3 } horizontalGap={ 7 } className={ styles.container }>
		<Col sm={ 4 } md={ 4 } lg={ 5 }>
			<H3 mt={ 2 }>{ __( 'Share & Grow', 'jetpack-social' ) }</H3>
			<p className={ styles.title }>
				{ __(
					'Jetpack Social allows you to share your WordPress posts with your social networks.',
					'jetpack-social'
				) }
			</p>
		</Col>
		<Col sm={ 4 } md={ 4 } lg={ 6 } className={ styles.illustration }>
			<img src={ illustration } alt="" />
		</Col>
	</Container>
);

export default Header;
