import { getNewsletterProducts, getProducts } from '../resolvers';

describe( 'Membership Products Selectors', () => {
	test( 'getNewsletterProducts resolvers calls GetProducts with silent', () => {
		getProducts.mockReturnValue( Promise.resolve( null ) );

		getNewsletterProducts();
		expect( getProducts ).toHaveBeenCalledWith( {
			silentProductCreation: true,
		} );
	} );
} );
