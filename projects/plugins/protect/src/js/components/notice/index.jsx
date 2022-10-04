import { check, info, warning, Icon } from '@wordpress/icons';
import styles from './styles.module.scss';

const Notice = ( { type = 'success', message } ) => {
	let icon;
	switch ( type ) {
		case 'success':
			icon = check;
			break;
		case 'error':
			icon = warning;
			break;
		case 'info':
		default:
			icon = info;
	}

	return (
		<div className={ `${ styles.notice } ${ styles[ `notice--${ type }` ] }` }>
			<div className={ styles.notice__icon }>
				<Icon icon={ icon } />
			</div>
			<div className={ styles.notice__message }>{ message }</div>
		</div>
	);
};

export default Notice;
