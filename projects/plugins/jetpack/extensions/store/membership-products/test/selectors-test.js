import {
	getNewsletterCategories,
	getNewsletterCategoriesEnabled,
	getNewsletterTierProducts,
	getNewsletterCategoriesSubscriptionsCount,
	getProducts,
} from '../selectors';

describe( 'Membership Products Selectors', () => {
	test( 'GetProducts and getNewsletterTierProducts works as expected', () => {
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
			type: 'tier',
		};

		const state = {
			products: [ ...products, newsletter_product ],
		};

		expect( getProducts( state ) ).toStrictEqual( state.products );
		expect( getNewsletterTierProducts( state ) ).toStrictEqual( [ newsletter_product ] );
	} );

	test( 'getNewsletterCategories and getNewsletterCategoriesEnabled works as expected', () => {
		const state = {
			newsletterCategories: {
				categories: [ 'category1', 'category2' ],
				enabled: true,
			},
		};

		expect( getNewsletterCategories( state ) ).toStrictEqual(
			state.newsletterCategories.categories
		);
		expect( getNewsletterCategoriesEnabled( state ) ).toStrictEqual(
			state.newsletterCategories.enabled
		);
	} );

	test( 'getNewsletterCategoriesSubscriptionsCount works as expected', () => {
		const state = {
			newsletterCategoriesSubscriptionsCount: 1,
		};

		expect( getNewsletterCategoriesSubscriptionsCount( state ) ).toStrictEqual(
			state.newsletterCategoriesSubscriptionsCount
		);
	} );
} );
