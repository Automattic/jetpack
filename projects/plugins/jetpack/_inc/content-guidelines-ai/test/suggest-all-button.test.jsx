import { render, screen, fireEvent } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import useGenerateAll from '../hooks/use-generate-all';
import { useAllSectionsEmpty } from '../hooks/use-drafts';
import SuggestAllButton from '../components/suggest-all-button';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, disabled, href, className, style, label, 'aria-hidden': ariaHidden } ) => (
		<button
			type="button"
			onClick={ onClick }
			disabled={ disabled }
			href={ href }
			className={ className }
			style={ style }
			aria-hidden={ ariaHidden }
			aria-label={ label }
		>
			{ children }
		</button>
	),
	Tooltip: ( { children } ) => children,
	Notice: ( { children, onRemove, isDismissible } ) => (
		<div>
			{ children }
			{ isDismissible !== false && (
				<button type="button" aria-label="Close" onClick={ onRemove }>
					Close
				</button>
			) }
		</div>
	),
	Spinner: () => <span className="components-spinner" />,
} ) );
jest.mock( '@automattic/jetpack-components', () => ( {
	JetpackLogo: () => <span data-testid="jetpack-logo" />,
} ) );
jest.mock( '../hooks/use-generate-all', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../hooks/use-drafts', () => ( { useAllSectionsEmpty: jest.fn() } ) );

const generate = jest.fn();

function setup( { allEmpty = true, bannerDismissed = true, hasFeature = true, loading = false } ) {
	useGenerateAll.mockReturnValue( { generate, loading, hasFeature } );
	useAllSectionsEmpty.mockReturnValue( allEmpty );
	useSelect.mockImplementation( map => map( () => ( { isBannerDismissed: () => bannerDismissed } ) ) );
}

describe( 'SuggestAllButton', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'reads Generate guidelines when every section is empty', () => {
		setup( { allEmpty: true } );
		render( <SuggestAllButton /> );
		expect( screen.getByRole( 'button', { name: 'Generate guidelines' } ) ).toBeInTheDocument();
	} );

	it( 'reads Improve guidelines when any section has text', () => {
		setup( { allEmpty: false } );
		render( <SuggestAllButton /> );
		expect( screen.getByRole( 'button', { name: 'Improve guidelines' } ) ).toBeInTheDocument();
	} );

	it( 'hides itself while the empty-state banner is still on screen', () => {
		// Banner present (not dismissed) and the site has the feature: the banner
		// owns the CTA, so this button is hidden rather than duplicated.
		setup( { bannerDismissed: false, hasFeature: true } );
		const { container } = render( <SuggestAllButton /> );

		const button = container.querySelector( 'button' );
		expect( button ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( button ).toHaveStyle( { display: 'none' } );
	} );

	it( 'generates when clicked', () => {
		setup( { bannerDismissed: true } );
		render( <SuggestAllButton /> );

		fireEvent.click( screen.getByRole( 'button', { name: /guidelines/i } ) );
		expect( generate ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'is disabled while generating', () => {
		setup( { bannerDismissed: true, loading: true } );
		render( <SuggestAllButton /> );
		expect( screen.getByRole( 'button', { name: /guidelines/i } ) ).toBeDisabled();
	} );
} );
