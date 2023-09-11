import { getNewsletterProducts, getProducts } from '../selectors';

describe( 'Membership Products Selectors', () => {
	test( 'GetProducts and getNewsletterProducts works as expected', () => {
		const products = [
			{
				id: 1,
				subscribe_as_site_subscriber: false,
			},
			{
				id: 2,
			},
		];
		const newsletter_product = {
			id: 3,
			subscribe_as_site_subscriber: true,
		};

		const state = {
			products: [ ...products, newsletter_product ],
		};

		expect( getProducts( state ) ).toStrictEqual( state.products );
		expect( getNewsletterProducts( state ) ).toStrictEqual( [ newsletter_product ] );
	} );
} );
