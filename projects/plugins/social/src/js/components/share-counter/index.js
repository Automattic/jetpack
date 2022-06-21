import { Text } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const ShareCounter = () => {
	const { sharesCountResponse } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			sharesCountResponse: store.getSharesCount(),
		};
	} );

	const sharesCountLoaded = sharesCountResponse && sharesCountResponse.results;
	const sharesCount = sharesCountLoaded ? sharesCountResponse.results.total : 0;
	const maxShares = 30;

	useDispatch( STORE_ID ).getSharesCount();
	const classname = classnames( styles.meter, {
		[ styles[ 'meter--full' ] ]: sharesCount === 30,
	} );

	const text = createInterpolateElement(
		sprintf(
			// translators: %1$d is the number of shares used, %2$d is the total number of shares available.
			__(
				'You’ve used <boldText>%1$d of %2$d</boldText> shares over the past 30 days.',
				'jetpack-social'
			),
			sharesCount,
			maxShares
		),
		{
			boldText: <strong />,
		}
	);
	return sharesCountLoaded ? (
		<div>
			<Text className={ styles.text }>{ text }</Text>
			<div
				className={ classname }
				style={ { '--width': `${ Math.round( ( sharesCount / maxShares ) * 100 ) }%` } }
			></div>
		</div>
	) : null;
};

export default ShareCounter;
