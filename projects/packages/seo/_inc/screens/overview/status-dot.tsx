import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import styles from './status-dot.module.scss';
import type { FC } from 'react';

interface Props {
	status: 'ok' | 'warn' | 'err';
	label?: string;
}

const StatusDot: FC< Props > = ( { status, label } ) => (
	// `data-status` on the row (not the dot) so a test can read it straight off the
	// element `getByText` returns. The colour itself lives in a CSS module, and jest
	// stubs SCSS to a plain object, so `styles[ status ]` is undefined under test and
	// the class carries nothing — without this the dots could all be inverted and
	// every suite would stay green.
	<Stack render={ <span /> } direction="row" align="center" gap="sm" data-status={ status }>
		<span className={ clsx( styles.root, styles[ status ] ) } aria-hidden="true" />
		{ label }
	</Stack>
);

export default StatusDot;
