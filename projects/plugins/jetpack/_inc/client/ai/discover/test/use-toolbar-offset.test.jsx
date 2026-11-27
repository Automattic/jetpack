import { render, screen } from '@testing-library/react';
import { useRef } from '@wordpress/element';
import useToolbarOffset, {
	STUCK_ATTRIBUTE,
	TOOLBAR_HEIGHT_PROPERTY,
	TOOLBAR_OFFSET_PROPERTY,
} from '../use-toolbar-offset';

/**
 * Discover's root inside AdminPage's page, under a tab strip.
 *
 * @param {object}  props                 - Component props.
 * @param {boolean} props.sticky          - Whether the strip sticks.
 * @param {boolean} [props.inPage]        - Whether to render inside the page at all.
 * @param {boolean} [props.toolbarSticky] - Whether the toolbar sticks too.
 * @return {object} Component markup.
 */
function Harness( { sticky, inPage = true, toolbarSticky = false } ) {
	const ref = useRef( null );
	useToolbarOffset( ref );
	const root = (
		<div data-testid="root" ref={ ref }>
			<div
				data-testid="toolbar"
				className="jetpack-ai-discover__toolbar"
				ref={ node =>
					node && Object.defineProperty( node, 'offsetHeight', { value: 66, configurable: true } )
				}
				style={ toolbarSticky ? { position: 'sticky', top: '49px' } : undefined }
			/>
		</div>
	);
	if ( ! inPage ) {
		return root;
	}
	return (
		<div className="jp-admin-page__page">
			<div
				className="jp-admin-page-tabs"
				ref={ node =>
					node && Object.defineProperty( node, 'offsetHeight', { value: 49, configurable: true } )
				}
				style={ sticky ? { position: 'sticky', top: '0px' } : undefined }
			/>
			{ root }
		</div>
	);
}

describe( 'useToolbarOffset', () => {
	test( 'sticks the toolbar at the bottom of a sticky tab strip', () => {
		render( <Harness sticky /> );

		expect( screen.getByTestId( 'root' ).style.getPropertyValue( TOOLBAR_OFFSET_PROPERTY ) ).toBe(
			'49px'
		);
	} );

	test( 'a strip that scrolls away takes no room', () => {
		render( <Harness sticky={ false } /> );

		expect( screen.getByTestId( 'root' ).style.getPropertyValue( TOOLBAR_OFFSET_PROPERTY ) ).toBe(
			'0px'
		);
	} );

	test( 'publishes the toolbar’s height while it sticks, for focus scroll margins', () => {
		render( <Harness sticky toolbarSticky /> );

		const root = screen.getByTestId( 'root' );
		expect( root.style.getPropertyValue( TOOLBAR_HEIGHT_PROPERTY ) ).toBe( '66px' );
		// jsdom lays nothing out, so both edges sit at 0: the toolbar has
		// reached the strip, and reads as stuck.
		expect( screen.getByTestId( 'toolbar' ) ).toHaveAttribute( STUCK_ATTRIBUTE );
	} );

	test( 'a toolbar that scrolls with the page covers nothing and is never stuck', () => {
		render( <Harness sticky /> );

		expect( screen.getByTestId( 'root' ).style.getPropertyValue( TOOLBAR_HEIGHT_PROPERTY ) ).toBe(
			'0px'
		);
		expect( screen.getByTestId( 'toolbar' ) ).not.toHaveAttribute( STUCK_ATTRIBUTE );
	} );

	test( 'outside AdminPage, the stylesheet’s 0 stands', () => {
		render( <Harness sticky inPage={ false } /> );

		expect( screen.getByTestId( 'root' ).style.getPropertyValue( TOOLBAR_OFFSET_PROPERTY ) ).toBe(
			''
		);
	} );
} );
