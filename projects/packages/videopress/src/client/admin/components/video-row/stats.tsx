import { Text, LoadingPlaceholder } from '@automattic/jetpack-components';
import { useViewportMatch } from '@wordpress/compose';
import clsx from 'clsx';
import styles from './style.module.scss';
import type { ReactNode } from 'react';

const Stats = ( {
	privacy,
	duration,
	plays,
	upload,
	loading = false,
	className,
}: {
	privacy: ReactNode;
	duration: ReactNode;
	plays?: ReactNode;
	upload?: ReactNode;
	loading?: boolean;
	className?: string;
} ) => {
	const isSmall = useViewportMatch( 'small', '<' );

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
