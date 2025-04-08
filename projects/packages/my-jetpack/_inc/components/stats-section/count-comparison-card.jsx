import { Card } from '@wordpress/components';
import { arrowDown, arrowUp, Icon } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import formatNumber from '../../utils/format-number';
import styles from './style.module.scss';

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
 * @param {object}          props               - Component props.
 * @param {number}          props.count         - Current count.
 * @param {number}          props.previousCount - Previous count.
 * @param {React.ReactNode} props.icon          - Icon to display.
 * @param {React.ReactNode} props.heading       - Card heading.
 * @param {string}          props.as            - Card root element type.
 * @param {string}          props.srText        - Text for screen readers.
 * @return {object} CountComparisonCard React component.
 */
const CountComparisonCard = ( {
	count = 0,
	previousCount = 0,
	as = 'div',
	icon,
	heading,
	srText,
} ) => {
	const difference = subtract( count, previousCount );
	const differenceMagnitude = Math.abs( difference );
	const percentage = Number.isFinite( difference )
		? percentCalculator( differenceMagnitude, previousCount )
		: null;

	return (
		<Card className={ styles[ 'stats-card' ] } as={ as }>
			<span className="screen-reader-text">{ srText }</span>
			<div aria-hidden="true">
				{ icon && <div className={ styles[ 'stats-card-icon' ] }>{ icon }</div> }
				{ heading && <div className={ styles[ 'stats-card-heading' ] }>{ heading }</div> }
				<div className={ styles[ 'stats-card-count' ] }>
					<span
						className={ styles[ 'stats-card-count-value' ] }
						title={ Number.isFinite( count ) ? String( count ) : undefined }
					>
						{ formatNumber( count ) }
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
								{
									differenceMagnitude > 9999
										? formatNumber( differenceMagnitude ) // i.e.- 10.1K
										: formatNumber( differenceMagnitude, {} ) // passing empty object removes the compact number formatting options, i.e.- 10,100
								}
							</span>
							{ percentage !== null && (
								<span className={ styles[ 'stats-card-difference-absolute-percentage' ] }>
									({ percentage }%)
								</span>
							) }
						</span>
					) : null }
				</div>
			</div>
		</Card>
	);
};

CountComparisonCard.propTypes = {
	count: PropTypes.number,
	heading: PropTypes.node,
	icon: PropTypes.node,
	previousCount: PropTypes.number,
	srText: PropTypes.string,
};

export default CountComparisonCard;
