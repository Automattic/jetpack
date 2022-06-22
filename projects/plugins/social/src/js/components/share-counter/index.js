import { Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import styles from './styles.module.scss';

const ShareCounter = shares => {
	const maxShares = 30;
	const { sharesCount } = shares;

	const classname = classnames( styles.meter, {
		[ styles[ 'meter--full' ] ]: sharesCount === maxShares,
	} );

	const text = createInterpolateElement(
		sprintf(
			// translators: %1$d is the number of shares used.
			__( 'You’ve made <boldText>%1$d</boldText> shares over the past 30 days.', 'jetpack-social' ),
			sharesCount
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
				style={ { '--width': `${ Math.round( ( sharesCount / maxShares ) * 100 ) }%` } }
			></div>
		</div>
	);
};

export default ShareCounter;
