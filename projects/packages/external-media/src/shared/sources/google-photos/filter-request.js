import moment from 'moment';
import {
	DATE_RANGE_LAST_7_DAYS,
	DATE_RANGE_CUSTOM,
	DATE_RANGE_LAST_30_DAYS,
	DATE_RANGE_LAST_6_MONTHS,
	DATE_RANGE_LAST_12_MONTHS,
} from '../../constants';

const TODAY = moment();

/**
 * Get filter request
 *
 * @param {Array} filters - The filters
 * @return {Array|null}   - The query
 */
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
		let endDate = null;
		switch ( date.range ) {
			case DATE_RANGE_LAST_7_DAYS:
				startDate = moment( TODAY ).subtract( 7, 'days' );
				endDate = TODAY;
				break;
			case DATE_RANGE_LAST_30_DAYS:
				startDate = moment( TODAY ).subtract( 30, 'days' );
				endDate = TODAY;
				break;
			case DATE_RANGE_LAST_6_MONTHS:
				startDate = moment( TODAY ).subtract( 6, 'months' );
				endDate = TODAY;
				break;
			case DATE_RANGE_LAST_12_MONTHS:
				startDate = moment( TODAY ).subtract( 1, 'year' );
				endDate = TODAY;
				break;
			case DATE_RANGE_CUSTOM:
				{
					const month = parseInt( date.month );
					const year = parseInt( date.year );
					if ( ! isNaN( month ) && ! isNaN( year ) ) {
						if ( month === -1 ) {
							// Whole year.
							startDate = moment( [ year, 0 ] );
							endDate = moment( startDate ).endOf( 'year' );
						} else {
							// Specific month.
							startDate = moment( [ year, month ] );
							endDate = moment( startDate ).endOf( 'month' );
						}
					}
				}
				break;
		}

		const start = startDate ? startDate.format( 'YYYY-MM-DD' ) : '0000-00-00';
		const end = endDate ? endDate.format( 'YYYY-MM-DD' ) : '0000-00-00';

		query.push( `dateRange=${ start }:${ end }` );
	}

	return query.length > 0 ? query : null;
}
