import clsx from 'clsx';
import styles from './status-dot.module.scss';
import type { FC } from 'react';

interface Props {
	status: 'ok' | 'warn' | 'err';
	label?: string;
}

const StatusDot: FC< Props > = ( { status, label } ) => (
	<span>
		<span className={ clsx( styles.root, styles[ status ] ) } aria-hidden="true" />
		{ label }
	</span>
);

export default StatusDot;
