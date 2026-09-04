import {
	MAX_RATING_ICONS,
	renderRatingIconsHtml,
} from '../../../../src/blocks/field-rating/rating-icons';

const countIcons = markup => ( markup.match( /<svg/g ) || [] ).length;

const countFilled = markup => ( markup.match( /is-filled/g ) || [] ).length;

describe( 'renderRatingIconsHtml', () => {
	it( 'renders one icon per point on a normal scale', () => {
		expect( countIcons( renderRatingIconsHtml( 3, 5, 'stars' ) ) ).toBe( 5 );
	} );

	it( 'fills icons up to the rating', () => {
		expect( countFilled( renderRatingIconsHtml( 3, 5, 'stars' ) ) ).toBe( 3 );
	} );

	// The scale arrives from submitted data, so a forged one must not become a loop bound.
	it( 'caps a forged scale at MAX_RATING_ICONS', () => {
		expect( countIcons( renderRatingIconsHtml( 3, 5000, 'stars' ) ) ).toBe( MAX_RATING_ICONS );
	} );

	it( 'caps a scale large enough to hang the browser', () => {
		expect( countIcons( renderRatingIconsHtml( 1, 50000000, 'stars' ) ) ).toBe( MAX_RATING_ICONS );
	} );
} );
