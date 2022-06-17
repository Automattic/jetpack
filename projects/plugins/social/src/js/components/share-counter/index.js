import { Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import styles from './styles.module.scss';

const ShareCounter = ( { value, max } ) => {
	const classname = classnames( styles.meter, {
		[ styles[ 'meter--full' ] ]: value === max,
	} );

	const text = createInterpolateElement(
		sprintf(
			// translators: %1$d is the number of shares used, %2$d is the total number of shares available.
			__(
				'You’ve used <boldText>%1$d of %2$d</boldText> shares over the past 30 days.',
				'jetpack-social'
			),
			value,
			max
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
				style={ { '--width': `${ Math.round( ( value / max ) * 100 ) }%` } }
			></div>
		</div>
	);
};

export default ShareCounter;
