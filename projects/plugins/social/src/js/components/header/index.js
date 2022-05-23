/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Container, Col, H3 } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import illustation from './illustration.svg';

const Header = () => (
	<Container horizontalSpacing={ 2 } horizontalGap={ 7 }>
		<Col sm={ 4 } md={ 4 } lg={ 5 }>
			<H3 mt={ 8 }>{ __( 'Share & Grow', 'jetpack-social' ) }</H3>
			<p className={ styles.title }>
				{ __(
					'Jetpack Social allows you to share your WordPress posts with your social networks.',
					'jetpack-social'
				) }
			</p>
		</Col>
		<Col sm={ 4 } md={ 3 } lg={ 6 }>
			<img src={ illustation } alt="" />
		</Col>
	</Container>
);

export default Header;
