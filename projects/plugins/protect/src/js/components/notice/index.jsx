import { check, Icon } from '@wordpress/icons';
import styles from './styles.module.scss';

const Notice = ( { message } ) => {
	return (
		<div className={ styles.notice }>
			<div className={ styles.notice__icon }>
				<Icon icon={ check } />
			</div>
			<div className={ styles.notice__message }>{ message }</div>
		</div>
	);
};

export default Notice;
