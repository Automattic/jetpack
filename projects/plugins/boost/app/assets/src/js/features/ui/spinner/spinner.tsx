// Spinner.tsx
import type { CSSProperties, FC } from 'react';
import styles from './spinner.module.scss';

interface SpinnerProps {
	size?: string;
	lineWidth?: string;
}

const Spinner: FC< SpinnerProps > = ( { size = '1.4rem', lineWidth = '2px' } ) => {
	const spinnerStyle = {
		'--spinnerSize': size,
		'--spinnerLineWidth': lineWidth,
	} as CSSProperties;

	return <div className={ styles.spinner } style={ spinnerStyle } />;
};

export default Spinner;
