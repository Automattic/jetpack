import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import styles from './style.module.scss';

interface StatusProps {
	status?: 'active' | 'error' | 'inactive' | 'action';
	label?: string;
	className?: string;
}

const Status = ( { className, label, status = 'inactive', ...rest }: StatusProps ): JSX.Element => {
	const defaultLabels: Record< string, string > = {
		active: __( 'Active', 'jetpack' ),
		error: __( 'Error', 'jetpack' ),
		action: __( 'Action needed', 'jetpack' ),
		inactive: __( 'Inactive', 'jetpack' ),
	};

	return (
		<span
			className={ classNames(
				styles.status,
				{
					[ styles[ `status--${ status }` ] ]: status,
				},
				className
			) }
			{ ...rest }
		>
			<span className={ styles.status__indicator } />
			{ label || label === '' ? (
				<span className={ styles.status__label }>{ label }</span>
			) : (
				<span className={ styles.status__label }>{ defaultLabels[ status ] }</span>
			) }
		</span>
	);
};

export default Status;
