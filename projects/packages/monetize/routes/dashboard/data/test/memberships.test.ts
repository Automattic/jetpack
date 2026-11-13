import { toMembershipProduct } from '../memberships';

describe( 'toMembershipProduct', () => {
	it( 'turns the string ids, tier and price some products arrive with into numbers', () => {
		expect(
			toMembershipProduct( {
				connected_account_product_id: '7',
				title: 'Gold',
				price: '5.50',
				currency: 'EUR',
				interval: '1 year',
				type: 'tier',
				tier: '3',
				description: 'Hi **you**',
				description_rendered: '<p>Hi <strong>you</strong></p>',
			} )
		).toEqual( {
			id: 7,
			title: 'Gold',
			description: 'Hi **you**',
			descriptionHtml: '<p>Hi <strong>you</strong></p>',
			price: 5.5,
			currency: 'EUR',
			interval: '1 year',
			type: 'tier',
			tier: 3,
			isReadOnly: false,
		} );
	} );
} );
