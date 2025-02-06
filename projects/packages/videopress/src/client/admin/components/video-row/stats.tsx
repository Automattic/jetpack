import { Text, useBreakpointMatch, LoadingPlaceholder } from '@automattic/jetpack-components';
import clsx from 'clsx';
import styles from './style.module.scss';

const Stats = ( {
	privacy,
	duration,
	plays,
	upload,
	loading = false,
	className,
}: {
	privacy: React.ReactNode;
	duration: React.ReactNode;
	plays?: React.ReactNode;
	upload?: React.ReactNode;
	loading?: boolean;
	className?: string;
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div className={ clsx( className, styles.stats, { [ styles.small ]: isSmall } ) }>
			{ loading ? (
				<>
					<LoadingPlaceholder height={ 24 } />
					<LoadingPlaceholder height={ 24 } />
					<LoadingPlaceholder height={ 24 } />
					<LoadingPlaceholder height={ 24 } className={ styles.upload } />
				</>
			) : (
				<>
					{ Boolean( privacy ) && (
						<Text aria-disabled={ isSmall ? 'false' : 'true' } component="div">
							{ privacy }
						</Text>
					) }
					{ duration != null && <Text component="div">{ duration }</Text> }
					{ plays != null && <Text component="div">{ plays }</Text> }
					{ Boolean( upload ) && (
						<Text className={ styles.upload } component="div">
							{ upload }
						</Text>
					) }
				</>
			) }
		</div>
	);
};

export default Stats;
