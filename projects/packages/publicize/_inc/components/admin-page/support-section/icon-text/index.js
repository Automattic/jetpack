import { Text, useBreakpointMatch } from '@automattic/jetpack-components';
import clsx from 'clsx';
import styles from './styles.module.scss';

const IconText = ( { icon, title, children } ) => {
	const [ isBiggerThanSmall, isBiggerThanMedium ] = useBreakpointMatch(
		[ 'sm', 'md' ],
		[ '>', '>' ]
	);

	const wrapperClassNames = clsx( styles.column, {
		[ styles[ 'viewport-gt-small' ] ]: isBiggerThanSmall,
		[ styles[ 'viewport-gt-medium' ] ]: isBiggerThanMedium,
	} );

	return (
		<div className={ wrapperClassNames }>
			<div className={ styles.icon }>{ icon }</div>
			<Text className={ styles.title } variant="title-medium">
				{ title }
			</Text>
			<div className={ styles.text }>{ children }</div>
		</div>
	);
};

export default IconText;
