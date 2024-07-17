import { numberFormat } from '@automattic/jetpack-components';
import { Card } from '@wordpress/components';
import { arrowDown, arrowUp, Icon } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './style.module.scss';

const formatNumber = ( number, config = {} ) => {
	if ( number === null || ! Number.isFinite( number ) ) {
		return '-';
	}

	return numberFormat( number, config );
};

const subtract = ( a, b ) => {
	if ( typeof a !== 'number' || typeof b !== 'number' ) {
		return null;
	}

	return a - b;
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
 * @param {number} props.previousCount     - Previous count.
 * @param {React.ReactNode} props.icon     - Icon to display.
 * @param {React.ReactNode} props.heading  - Card heading.
 * @returns {object} CountComparisonCard React component.
 */
const CountComparisonCard = ( { count = 0, previousCount = 0, icon, heading } ) => {
	const difference = subtract( count, previousCount );
	const differenceMagnitude = Math.abs( difference );
	const percentage = Number.isFinite( difference )
		? percentCalculator( differenceMagnitude, previousCount )
		: null;
	const shortenedNumberConfig = { maximumFractionDigits: 1, notation: 'compact' };

	return (
		<Card className={ styles[ 'stats-card' ] }>
			{ icon && <div className={ styles[ 'stats-card-icon' ] }>{ icon }</div> }
			{ heading && <div className={ styles[ 'stats-card-heading' ] }>{ heading }</div> }
			<div className={ styles[ 'stats-card-count' ] }>
				<span
					className={ styles[ 'stats-card-count-value' ] }
					title={ Number.isFinite( count ) ? String( count ) : undefined }
				>
					{ formatNumber( count, shortenedNumberConfig ) }
				</span>
				{ difference !== null ? (
					<span
						className={ clsx( styles[ 'stats-card-difference' ], {
							[ styles[ 'stats-card-difference--positive' ] ]: difference < 0,
							[ styles[ 'stats-card-difference--negative' ] ]: difference > 0,
						} ) }
					>
						<span
							className={ styles[ 'stats-card-difference-icon' ] }
							title={ String( difference ) }
						>
							{ difference < 0 && <Icon size={ 18 } icon={ arrowDown } /> }
							{ difference > 0 && <Icon size={ 18 } icon={ arrowUp } /> }
						</span>
						<span className={ styles[ 'stats-card-difference-absolute-value' ] }>
							{ formatNumber(
								differenceMagnitude,
								differenceMagnitude > 9999 ? shortenedNumberConfig : {}
							) }
						</span>
						{ percentage !== null && (
							<span className={ styles[ 'stats-card-difference-absolute-percentage' ] }>
								({ percentage }%)
							</span>
						) }
					</span>
				) : null }
			</div>
		</Card>
	);
};

CountComparisonCard.propTypes = {
	count: PropTypes.number,
	heading: PropTypes.node,
	icon: PropTypes.node,
	previousCount: PropTypes.number,
};

export default CountComparisonCard;
