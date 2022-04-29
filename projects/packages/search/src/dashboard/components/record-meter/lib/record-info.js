/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
const PALETTE = require( '@automattic/color-studio' );

/**
 * converts provided information into a chart consumable data form
 *
 * @param {number} post_count - The total count of indexed post records
 * @param {object} post_type_breakdown - Post type breakdown (post type => number of posts)
 * @param {number} tier - Max number of records allowed in user's current tier
 * @param {string} last_indexed_date - The date on which the site was last indexed as a string
 * @returns {object} data in correct form to use in chart and notice-box
 */
export default function getRecordInfo( post_count, post_type_breakdown, tier, last_indexed_date ) {
	const maxPostTypeCount = 5; // this value determines when to cut off displaying post times & compound into an 'other'
	const recordInfo = [];
	const postTypeBreakdown = [];

	let currentCount = 0;
	let hasValidData = true;
	let hasBeenIndexed = true;
	let hasItems = true;

	//check for valid data coming in and catch it before it goes to far
	if (
		'object' !== typeof post_type_breakdown ||
		'number' !== typeof tier ||
		'string' !== typeof last_indexed_date
	) {
		hasValidData = false;
	}

	//check if site has likely been indexed.
	if ( 'undefined' === typeof last_indexed_date || 'undefined' === typeof post_count ) {
		hasBeenIndexed = false;
	}

	// make sure there are items there before going any further
	const numItems = hasValidData && hasBeenIndexed ? Object.keys( post_type_breakdown ).length : 0;

	if ( numItems === 0 ) {
		hasItems = false;
	}

	const colors = [
		PALETTE.colors[ 'Blue 30' ],
		PALETTE.colors[ 'Orange 30' ],
		PALETTE.colors[ 'WooCommerce Purple 30' ],
		PALETTE.colors[ 'Green 30' ],
		PALETTE.colors[ 'Yellow 30' ],
	];

	if ( numItems > 0 && hasValidData && hasBeenIndexed ) {
		for ( let i = 0; i < numItems; i++ ) {
			const postTypeDetails = Object.values( post_type_breakdown )[ i ];
			const { count, slug: name } = postTypeDetails;

			postTypeBreakdown.push( {
				data: createData( count, colors[ i ], name ),
			} );
			currentCount = currentCount + count;
		}

		// sort & split items into included and other
		const PostTypeItems = splitUsablePostTypes( postTypeBreakdown, numItems, maxPostTypeCount );

		// push includedItems into the recordInfo
		for ( const item in PostTypeItems.includedItems ) {
			recordInfo.push( {
				data: createData(
					PostTypeItems.includedItems[ item ].data.data[ 0 ],
					colors[ item ],
					PostTypeItems.includedItems[ item ].data.label
				),
			} );
		}

		// populate the 'other' category with combined remaining items and push to end of data array
		if ( PostTypeItems.otherItems.length > 0 ) {
			recordInfo.push( {
				data: createData(
					combineOtherCount( PostTypeItems.otherItems ),
					PALETTE.colors[ 'Gray 30' ],
					'Other'
				),
			} );
		}

		// if there is remaining unused space in tier, add filler spacing to chart
		if ( tier - currentCount > 0 ) {
			recordInfo.push( {
				data: createData(
					tier - currentCount,
					PALETTE.colors[ 'Gray 0' ],
					__( 'remaining', 'jetpack-search-pkg' )
				),
			} );
		}
	}

	// set a var to check all the data is valid (this helps determine whether to output a chart)
	const isValid = hasBeenIndexed && hasValidData && hasItems;

	return {
		data: recordInfo,
		tier: tier,
		recordCount: currentCount,
		hasBeenIndexed,
		hasValidData,
		hasItems,
		isValid,
	};
}

/**
 * split post types into those being displayed,
 * and those combined into the 'other' category
 *
 * @param {Array} postTypeBreakdown - an array of the different post types with their counts
 * @param {number} numItems - count of different post types
 * @param {number} maxPostTypeCount - the max number of records to display before combining the rest into the 'other' category
 * @returns {object} containing included items with post type and count, and other items, split.
 */
export function splitUsablePostTypes( postTypeBreakdown, numItems, maxPostTypeCount ) {
	postTypeBreakdown.sort( ( a, b ) => ( a.data.data[ 0 ] < b.data.data[ 0 ] ? 1 : -1 ) );

	const count = maxPostTypeCount <= numItems ? maxPostTypeCount : numItems;

	return {
		includedItems: postTypeBreakdown.slice( 0, count ),
		otherItems: postTypeBreakdown.slice( count, numItems ),
	};
}

/**
 * combine remaining item count for use in 'other' category
 *
 * @param {Array} otherItems - array of items, with their counts, to be combined into 'other'
 * @returns {number} sum of all 'other' item counts
 */
export function combineOtherCount( otherItems ) {
	let runningTotal = 0;

	for ( const item in otherItems ) {
		runningTotal = otherItems[ item ].data.data[ 0 ] + runningTotal;
	}

	return runningTotal;
}

/**
 * return chart-ready data
 *
 * @param {object} data - data object with the count for the post type item
 * @param {string} color - color code to be used for the chart item
 * @param {string} name - capitalized name of post type for the label
 * @returns {object} chart ready data with data, label and background color.
 */
export function createData( data, color, name ) {
	return {
		data: [ data ],
		label: name,
		backgroundColor: color,
	};
}
