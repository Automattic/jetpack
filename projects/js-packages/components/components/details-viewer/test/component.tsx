import { render, screen } from '@testing-library/react';
import DetailsViewer from '../index.tsx';

describe( 'DetailsViewer', () => {
	describe( 'Render the DetailsViewer component', () => {
		it( 'renders simple key-value pairs with snake-cased keys', () => {
			const testProps = {
				details: {
					firstName: 'John',
					lastName: 'Doe',
					age: 30,
				},
			};

			render( <DetailsViewer { ...testProps } /> );

			expect( screen.getByText( 'first_name:' ) ).toBeInTheDocument();
			expect( screen.getByText( 'last_name:' ) ).toBeInTheDocument();
			expect( screen.getByText( 'age:' ) ).toBeInTheDocument();
			expect( screen.getByText( 'John' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Doe' ) ).toBeInTheDocument();
			expect( screen.getByText( '30' ) ).toBeInTheDocument();
		} );

		it( 'renders nested objects with snake-cased keys', () => {
			const testProps = {
				details: {
					userInfo: {
						fullName: 'John Doe',
						contactDetails: {
							emailAddress: 'john@example.com',
							phoneNumber: '123-456-7890',
						},
					},
				},
			};

			render( <DetailsViewer { ...testProps } /> );

			expect( screen.getByText( 'user_info:' ) ).toBeInTheDocument();
			expect( screen.getByText( /full_name/i ) ).toBeInTheDocument();
			expect( screen.getByText( /contact_details/i ) ).toBeInTheDocument();
			expect( screen.getByText( /email_address/i ) ).toBeInTheDocument();
			expect( screen.getByText( /phone_number/i ) ).toBeInTheDocument();
			expect( screen.getByText( /john@example.com/i ) ).toBeInTheDocument();
		} );

		it( 'renders arrays with snake-cased keys in objects', () => {
			const testProps = {
				details: {
					items: [
						{ itemName: 'Item 1', itemPrice: 10 },
						{ itemName: 'Item 2', itemPrice: 20 },
					],
				},
			};

			render( <DetailsViewer { ...testProps } /> );

			expect( screen.getByText( 'items:' ) ).toBeInTheDocument();
			expect( screen.getByText( /item_name/i ) ).toBeInTheDocument();
			expect( screen.getByText( /item_price/i ) ).toBeInTheDocument();
			expect( screen.getByText( /Item 1/i ) ).toBeInTheDocument();
			expect( screen.getByText( /Item 2/i ) ).toBeInTheDocument();
		} );

		it( 'returns null when details prop is not provided', () => {
			const { container } = render( <DetailsViewer details={ null } /> );
			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
