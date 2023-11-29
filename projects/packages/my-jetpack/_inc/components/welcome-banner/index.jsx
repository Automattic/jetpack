import { Container, Col, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { CardWrapper } from '../card';
import styles from './style.module.scss';

/**
 * WelcomeBanner component that renders the Stats cards, passing down the stats counts from the store.
 *
 * @returns {object} The WelcomeBanner component.
 */
const WelcomeBanner = () => {
	return (
		<Col lg={ 12 } className={ styles.banner }>
			<CardWrapper className={ styles[ 'banner-card' ] }>
				<Container
					horizontalSpacing={ 0 }
					horizontalGap={ 0 }
					className={ styles[ 'banner-container' ] }
				>
					<Col sm={ 8 } md={ 6 } lg={ 6 } className={ styles[ 'banner-description' ] }>
						<Text variant="headline-small" mb={ 4 }>
							{ __( 'Welcome to Jetpack!', 'jetpack-my-jetpack' ) }
						</Text>
						<Text variant="body" mb={ 3 }>
							{ __(
								'Jetpack is a suite of security, performance, and growth tools made for WordPress sites by the WordPress experts.',
								'jetpack-my-jetpack'
							) }
						</Text>
						<Text variant="body">
							{ __(
								'It’s the ultimate toolkit for best-in-class websites, with everything you need to grow your business. Choose a plan below to get started.',
								'jetpack-my-jetpack'
							) }
						</Text>
					</Col>
					<Col sm={ 4 } md={ 6 } lg={ 6 } className={ styles[ 'banner-image' ] }></Col>
				</Container>
			</CardWrapper>
		</Col>
	);
};

export default WelcomeBanner;
