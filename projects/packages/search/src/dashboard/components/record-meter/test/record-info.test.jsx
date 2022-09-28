/**
 * @jest-environment jsdom
 */

import {
	splitUsablePostTypes,
	combineOtherCount,
	createData,
} from 'components/record-meter/lib/record-info';

const testData = {
	last_indexed_date: '2021-07-06T19:35:18+00:00',
	post_count: 136,
	post_type_breakdown: {
		post: 104,
		page: 17,
		attachment: 15,
	},
};

const postTypeBreakdown = [
	{
		data: {
			count: 17,
			label: 'Page',
			backgroundColor: '#3895BA',
		},
	},
	{
		data: {
			count: 15,
			label: 'Attachment',
			backgroundColor: '#E68B28',
		},
	},
	{
		data: {
			count: 6,
			label: 'Andthenmore',
		},
	},
];

describe( 'API data is converted into record info', () => {
	test( 'the total post count equals the post_type_breakdown values summed', () => {
		const sumValues = obj => Object.values( obj ).reduce( ( a, b ) => a + b );
		expect( testData.post_count ).toEqual( sumValues( testData.post_type_breakdown ) );
	} );

	test( 'posts are correctly split into usable and other', () => {
		const maxRecordCount = 1;

		const splitPostTypes = splitUsablePostTypes(
			postTypeBreakdown,
			testData.post_count,
			maxRecordCount
		);
		expect( splitPostTypes.includedItems ).toHaveLength( maxRecordCount );
		expect( splitPostTypes.otherItems ).toHaveLength( 2 );
	} );

	test( 'creates a data object using createData', () => {
		const newObject = createData( 20, 'rgb(245,245,245)', 'Testing' );

		expect( newObject ).toEqual( {
			count: 20,
			label: 'Testing',
			backgroundColor: 'rgb(245,245,245)',
		} );
	} );

	test( 'combine count of remaining items sums', () => {
		const otherCategory = combineOtherCount( postTypeBreakdown );
		expect( otherCategory ).toBe( 38 );
	} );
} );
