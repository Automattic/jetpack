import clsx from 'clsx';
import './status-dot.scss';
import type { FC } from 'react';

interface Props {
	status: 'ok' | 'warn' | 'err';
	label?: string;
}

const StatusDot: FC< Props > = ( { status, label } ) => (
	<span>
		<span
			className={ clsx( 'jetpack-seo-status-dot', {
				'is-ok': status === 'ok',
				'is-warn': status === 'warn',
				'is-err': status === 'err',
			} ) }
			aria-hidden="true"
		/>
		{ label }
	</span>
);

export default StatusDot;
