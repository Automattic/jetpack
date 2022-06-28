import { Icon, arrowRight } from '@wordpress/icons';
import Button from '../button';
import Text from '../text';
import styles from './style.module.scss';

const ContextualUpgradeTrigger = () => {
	return (
		<div className={ styles.cut }>
			<div>
				<Text>Your site is updated with new content several times a day</Text>
				<Button variant="link">Consider upgrading to real-time protection</Button>
			</div>
			<Icon icon={ arrowRight } className={ styles.icon } size={ 30 } />
		</div>
	);
};

export default ContextualUpgradeTrigger;
