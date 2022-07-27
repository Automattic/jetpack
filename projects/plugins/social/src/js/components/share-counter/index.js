import { Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import styles from './styles.module.scss';

const ShareCounter = ( { value, max } ) => {
	const classname = classnames( styles.meter, {
		[ styles[ 'meter--close' ] ]: value < max && value / max >= 0.9,
		[ styles[ 'meter--full' ] ]: value >= max,
	} );

	const remaining = Math.max( max - value, 0 );

	const text = createInterpolateElement(
		sprintf(
			// translators: %1$d is the number of shares used, %2$d is the total number of shares available.
			__( '<boldText>%1$d</boldText> shares remaining this month.', 'jetpack-social' ),
			remaining
		),
		{
			boldText: <strong />,
		}
	);

	return (
		<div>
			<Text className={ styles.text }>{ text }</Text>
			<div
				className={ classname }
				style={ { '--width': `${ Math.min( Math.round( ( value / max ) * 100 ), 100 ) }%` } }
			></div>
		</div>
	);
};

export default ShareCounter;
