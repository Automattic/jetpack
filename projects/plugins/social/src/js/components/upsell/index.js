import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const Upsell = () => {
	return (
		<div className={ styles.upsell }>
			<Text>
				{ __(
					'Get unlimited shares, schedule posts and first-in-class support',
					'jetpack-social'
				) }
			</Text>
			{ /* TODO: add proper link */ }
			<Text className={ styles.link }>
				<a href="#">{ __( 'Upgrade Jetpack Social', 'jetpack-social' ) }</a>
			</Text>
		</div>
	);
};

export default Upsell;
