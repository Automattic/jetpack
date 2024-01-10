// Spinner.tsx
import React from 'react';
import styles from './spinner.module.scss';

interface SpinnerProps {
	size?: string;
	lineWidth?: string;
}

const Spinner: React.FC< SpinnerProps > = ( { size = '1.4rem', lineWidth = '2px' } ) => {
	const spinnerStyle = {
		'--spinnerSize': size,
		'--spinnerLineWidth': lineWidth,
	} as React.CSSProperties;

	return <div className={ styles.spinner } style={ spinnerStyle } />;
};

export default Spinner;
