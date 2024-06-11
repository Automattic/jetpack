import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Text from '../text';
import styles from './style.module.scss';

interface StatusProps {
	status?: 'active' | 'error' | 'inactive' | 'action' | 'initializing';
	label?: string;
	className?: string;
}

const Status = ( { className, label, status = 'inactive' }: StatusProps ): JSX.Element => {
	const defaultLabels: Record< string, string > = {
		active: __( 'Active', 'jetpack' ),
		error: __( 'Error', 'jetpack' ),
		action: __( 'Action needed', 'jetpack' ),
		inactive: __( 'Inactive', 'jetpack' ),
		initializing: __( 'Setting up', 'jetpack' ),
	};

	return (
		<Text
			variant="body-extra-small"
			className={ clsx(
				styles.status,
				{
					[ styles[ `is-${ status }` ] ]: status,
				},
				className
			) }
		>
			<span className={ styles.status__indicator } />
			<span className={ styles.status__label }>
				{ label || label === '' ? label : defaultLabels[ status ] }
			</span>
		</Text>
	);
};

export default Status;
