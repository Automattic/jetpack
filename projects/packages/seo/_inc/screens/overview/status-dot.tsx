import clsx from 'clsx';
import styles from './status-dot.module.scss';
import type { FC } from 'react';

interface Props {
	status: 'ok' | 'warn' | 'err';
	label?: string;
}

const StatusDot: FC< Props > = ( { status, label } ) => (
	<span>
		<span
			className={ clsx( styles.dot, {
				[ styles.ok ]: status === 'ok',
				[ styles.warn ]: status === 'warn',
				[ styles.err ]: status === 'err',
			} ) }
			aria-hidden="true"
		/>
		{ label }
	</span>
);

export default StatusDot;
