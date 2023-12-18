import styles from './progress-bar.module.scss';

type Props = {
	progress: number;
};

const ProgressBar = ( { progress }: Props ) => {
	return (
		<div
			role="progressbar"
			aria-valuemax={ 100 }
			aria-valuemin={ 0 }
			aria-valuenow={ progress }
			className={ styles.bar }
		>
			<div className={ styles.filler } aria-hidden="true" style={ { width: `${ progress }%` } } />
		</div>
	);
};

export default ProgressBar;
