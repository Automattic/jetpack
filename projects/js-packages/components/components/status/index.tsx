import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Text from '../text';
import styles from './style.module.scss';

type StatusProps = Omit<
	React.ComponentProps< typeof Text > & {
		status?: 'active' | 'error' | 'inactive' | 'action' | 'initializing';
		label?: string;
		className?: string;
	},
	'children'
>;

const Status = ( {
	className,
	label,
	status = 'inactive',
	...props
}: StatusProps ): React.JSX.Element => {
	const defaultLabels: Record< string, string > = {
		active: __( 'Active', 'jetpack-components' ),
		error: __( 'Error', 'jetpack-components' ),
		action: __( 'Action needed', 'jetpack-components' ),
		inactive: __( 'Inactive', 'jetpack-components' ),
		initializing: __( 'Setting up', 'jetpack-components' ),
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
			{ ...props }
		>
			<span className={ styles.status__indicator } />
			<span className={ styles.status__label }>
				{ label || label === '' ? label : defaultLabels[ status ] }
			</span>
		</Text>
	);
};

export default Status;
