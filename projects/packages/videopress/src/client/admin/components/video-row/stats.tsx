import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import classNames from 'classnames';
import Placeholder from '../placeholder';
import styles from './style.module.scss';

const Stats = ( {
	privacy,
	duration,
	plays,
	upload,
	loading = false,
}: {
	privacy: React.ReactNode;
	duration: React.ReactNode;
	plays?: React.ReactNode;
	upload?: React.ReactNode;
	loading?: boolean;
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div className={ classNames( styles.stats, { [ styles.small ]: isSmall } ) }>
			{ loading ? (
				<>
					<Placeholder height={ 24 } />
					<Placeholder height={ 24 } />
					<Placeholder height={ 24 } />
					<Placeholder height={ 24 } className={ styles.upload } />
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
