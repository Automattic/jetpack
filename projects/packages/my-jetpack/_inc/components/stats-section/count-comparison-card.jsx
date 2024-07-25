import { numberFormat } from '@automattic/jetpack-components';
import { Card } from '@wordpress/components';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './style.module.scss';

const formatNumber = ( number, config = {} ) => {
	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	return numberFormat( number, config );
};

export const percentCalculator = ( part, whole ) => {
	if ( typeof part !== 'number' || typeof whole !== 'number' ) {
		return null;
	}
	// Handle NaN case.
	if ( part === 0 && whole === 0 ) {
		return 0;
	}
	const answer = ( part / whole ) * 100;
	// Handle Infinities.
	return Math.abs( answer ) === Infinity ? 100 : Math.round( answer );
};

/**
 * CountComparisonCard component.
 *
 * @param {object} props                   - Component props.
 * @param {number} props.count             - Current count.
 * @param {React.ReactNode} props.heading  - Card heading.
 * @returns {object} CountComparisonCard React component.
 */
const CountComparisonCard = ( { count = 0, heading } ) => {
	const shortenedNumberConfig = { maximumFractionDigits: 1, notation: 'compact' };

	return (
		<Card className={ styles[ 'stats-card' ] }>
			{ heading && <div className={ styles[ 'stats-card-heading' ] }>{ heading }</div> }
			<div className={ styles[ 'stats-card-count' ] }>
				<span
					className={ styles[ 'stats-card-count-value' ] }
					title={ Number.isFinite( count ) ? String( count ) : undefined }
				>
					{ formatNumber( count, shortenedNumberConfig ) }
				</span>
			</div>
		</Card>
	);
};

CountComparisonCard.propTypes = {
	count: PropTypes.number,
	heading: PropTypes.node,
};

export default CountComparisonCard;
