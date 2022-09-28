import { __ } from '@wordpress/i18n';
const PALETTE = require( '@automattic/color-studio' );

/**
 * Convert provided information into a chart-consumable data form
 *
 * @param {number} postCount - The total count of indexed post records
 * @param {object} postTypeBreakdown - Post type breakdown (post type => number of posts)
 * @param {string} lastIndexedDate - The date on which the site was last indexed as a string
 * @param {object} postTypes - Post types (post type label => post type slug)
 * @returns {object} data in correct form to use in chart and notice-box
 */
export default function getRecordInfo( postCount, postTypeBreakdown, lastIndexedDate, postTypes ) {
	const maxPostTypeCount = 5; // this value determines when to cut off displaying post times & compound into an 'other'
	const recordInfo = [];
	const chartPostTypeBreakdown = [];

	let currentCount = 0;
	let hasValidData = true;
	let hasBeenIndexed = true;
	let hasItems = true;

	// Check for a post type breakdown object
	if ( 'object' !== typeof postTypeBreakdown ) {
		hasValidData = false;
	}

	// Check if site has likely been indexed
	if ( 'number' !== typeof postCount ) {
		hasBeenIndexed = false;
	}

	// Make sure there are post types there before going any further
	const numItems = hasValidData && hasBeenIndexed ? Object.keys( postTypeBreakdown ).length : 0;

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
		// add labels to post type breakdown
		const postTypeBreakdownWithLabels = addLabelsToPostTypeBreakdown(
			postTypeBreakdown,
			postTypes
		);

		for ( let i = 0; i < numItems; i++ ) {
			const postTypeDetails = Object.values( postTypeBreakdownWithLabels )[ i ];
			const { count, label } = postTypeDetails;
			chartPostTypeBreakdown.push( {
				data: createData( count, colors[ i ], label ),
			} );
			currentCount = currentCount + count;
		}

		// sort & split items into included and other
		const postTypeItems = splitUsablePostTypes(
			chartPostTypeBreakdown,
			numItems,
			maxPostTypeCount
		);

		// push includedItems into the recordInfo
		for ( const item in postTypeItems.includedItems ) {
			recordInfo.push(
				createData(
					postTypeItems.includedItems[ item ].data.count,
					colors[ item ],
					postTypeItems.includedItems[ item ].data.label
				)
			);
		}

		// populate the 'other' category with combined remaining items and push to end of data array
		if ( postTypeItems.otherItems.length > 0 ) {
			recordInfo.push(
				createData(
					combineOtherCount( postTypeItems.otherItems ),
					PALETTE.colors[ 'Gray 30' ],
					__( 'other', 'jetpack-search-pkg' )
				)
			);
		}
	}

	// set a var to check all the data is valid (this helps determine whether to output a chart)
	const isValid = hasBeenIndexed && hasValidData && hasItems;

	return {
		data: recordInfo,
		recordCount: currentCount,
		hasBeenIndexed,
		hasValidData,
		hasItems,
		isValid,
	};
}

/**
 * adds the appropriate labels the post type breakdown
 *
 * @param {Array} postTypeBreakdown - an array of the different post types with their counts
 * @param {Array} postTypes - an array of the different post types labels matched with their slugs
 * @returns {object} updated postTypeBreakdown containing the post type slug, label, and count
 */
export function addLabelsToPostTypeBreakdown( postTypeBreakdown, postTypes ) {
	const postTypeBreakdownWithLabels = postTypeBreakdown.map( postType => {
		const postTypeLabelItem = postTypes[ postType.slug ];

		// Fallback to the slug if we can't find the label
		const label = postTypeLabelItem ? postTypeLabelItem.label : postType.slug;
		return { ...postType, label };
	} );

	return postTypeBreakdownWithLabels;
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
		runningTotal = otherItems[ item ].data.count + runningTotal;
	}
	return runningTotal;
}

/**
 * return chart-ready data
 *
 * @param {object} data - data object with the count for the post type item
 * @param {string} color - color code to be used for the chart item
 * @param {string} name - name of post type for the label
 * @returns {object} chart ready data with data, label and background color.
 */
export function createData( data, color, name ) {
	return {
		count: data,
		label: name,
		backgroundColor: color,
	};
}
