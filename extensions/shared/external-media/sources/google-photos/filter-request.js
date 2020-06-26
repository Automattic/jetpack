/**
 * External dependencies
 */
import moment from 'moment';

/**
 * Internal dependencies
 */
import {
	DATE_RANGE_LAST_7_DAYS,
	DATE_RANGE_CUSTOM,
	DATE_RANGE_LAST_30_DAYS,
	DATE_RANGE_LAST_6_MONTHS,
	DATE_RANGE_LAST_12_MONTHS,
} from '../../constants';

const TODAY = moment();

export default function getFilterRequest( filters ) {
	const { mediaType, category, favorite, date } = filters;
	const query = [];

	if ( mediaType ) {
		query.push( 'mediaType=' + mediaType );
	}

	if ( category && mediaType !== 'video' ) {
		query.push( 'categoryInclude=' + category );
	}

	if ( favorite !== undefined ) {
		query.push( 'feature=favorite' );
	}

	if ( date ) {
		let startDate = null;
		let endDate = TODAY;
		switch ( date.range ) {
			case DATE_RANGE_LAST_7_DAYS:
				startDate = moment( TODAY ).subtract( 7, 'days' );
				break;
			case DATE_RANGE_LAST_30_DAYS:
				startDate = moment( TODAY ).subtract( 30, 'days' );
				break;
			case DATE_RANGE_LAST_6_MONTHS:
				startDate = moment( TODAY ).subtract( 6, 'months' );
				break;
			case DATE_RANGE_LAST_12_MONTHS:
				startDate = moment( TODAY ).subtract( 1, 'year' );
				break;
			case DATE_RANGE_CUSTOM:
				if ( date.year && date.month ) {
					startDate = moment( [ date.year, date.month - 1 ] );
					endDate = moment( startDate ).endOf( 'month' );
				}
				break;
		}

		const start = startDate ? startDate.format( 'YYYY-MM-DD' ) : '0000-00-00';
		const end = endDate ? endDate.format( 'YYYY-MM-DD' ) : '0000-00-00';

		query.push( `dateRange=${ start }:${ end }` );
	}

	return query.length > 0 ? query : null;
}
