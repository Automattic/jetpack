import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import classNames from 'classnames';
import styles from './style.module.scss';

const Stats = ( {
	privacy,
	duration,
	plays,
	upload,
}: {
	privacy: React.ReactNode;
	duration: React.ReactNode;
	plays?: React.ReactNode;
	upload?: React.ReactNode;
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div className={ classNames( styles.stats, { [ styles.small ]: isSmall } ) }>
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
		</div>
	);
};

export default Stats;
