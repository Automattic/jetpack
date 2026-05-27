import clsx from 'clsx';
import styles from './style.module.scss';
import type { FC } from 'react';

interface Props {
	status: 'ok' | 'warn' | 'err';
	label?: string;
}

const StatusDot: FC< Props > = ( { status, label } ) => (
	<span>
		<span
			className={ clsx( styles.statusDot, {
				[ styles.statusOk ]: status === 'ok',
				[ styles.statusWarn ]: status === 'warn',
				[ styles.statusErr ]: status === 'err',
			} ) }
			aria-hidden="true"
		/>
		{ label }
	</span>
);

export default StatusDot;
