import { Icon, arrowRight } from '@wordpress/icons';
import Text from '../text';
import styles from './style.module.scss';

const ContextualUpgradeTrigger = () => {
	return (
		<div className={ styles.cut }>
			<div>
				<Text>Your site is updated with new content several times a day</Text>
				<Text className={ styles.cta }>Consider upgrading to real-time protection</Text>
			</div>
			<Icon icon={ arrowRight } className={ styles.icon } size={ 30 } />
		</div>
	);
};

export default ContextualUpgradeTrigger;
