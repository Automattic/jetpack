import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './status-dot.module.scss';
import type { FC } from 'react';

interface Props {
	status: 'ok' | 'warn' | 'err';
	label?: string;
}

const StatusDot: FC< Props > = ( { status, label } ) => (
	<Stack render={ <span /> } direction="row" align="center" gap="sm">
		<span className={ clsx( styles.root, styles[ status ] ) } aria-hidden="true" />
		{ label }
	</Stack>
);

export default StatusDot;
