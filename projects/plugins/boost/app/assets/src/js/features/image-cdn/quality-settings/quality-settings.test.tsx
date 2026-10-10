/* eslint-disable testing-library/prefer-user-event -- Range controls use synchronous changes in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- This Jest project does not load jest-dom. */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { useImageCdnQuality } from '../lib/stores';
import QualitySettings from './quality-settings';

jest.mock( './quality-settings.module.scss', () => ( { well: 'well' } ) );
jest.mock( '$features/ui/module-subsection/module-subsection.module.scss', () => ( {
	wrapper: 'module-subsection',
} ) );
jest.mock( '../lib/stores', () => ( { useImageCdnQuality: jest.fn() } ) );
jest.mock( '$features/ui/mutation-notice/mutation-notice', () => ( {
	useMutationNotice: jest.fn(),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const quality = {
	jpg: { quality: 75, lossless: false },
	png: { quality: 60, lossless: true },
	webp: { quality: 65, lossless: false },
};
const mutate = jest.fn();
const renderSettings = () =>
	render(
		<ModuleSurfaceProvider value="row">
			<QualitySettings isPremium />
		</ModuleSurfaceProvider>
	);

beforeEach( () => {
	mutate.mockClear();
	jest
		.mocked( useImageCdnQuality )
		.mockReturnValue( [ { data: quality }, { mutate } ] as unknown as ReturnType<
			typeof useImageCdnQuality
		> );
} );

afterEach( () => {
	resetLocaleData( undefined, 'jetpack-boost' );
	jest.useRealTimers();
} );

test( 'renders the modern quality heading from the translation catalog', () => {
	setLocaleData(
		{ 'Adjust image quality per format': [ 'Ajuster la qualité des images par format' ] },
		'jetpack-boost'
	);
	renderSettings();
	expect(
		screen.getByRole( 'heading', { name: 'Ajuster la qualité des images par format' } )
	).toBeTruthy();
} );

test( 'keeps the modern help button named and its tooltip dismissible', async () => {
	renderSettings();
	const help = screen.getByRole( 'button', { name: 'How image quality works' } );
	expect( help.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	fireEvent.click( help );
	expect( help.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
	await expect(
		screen.findByText( /^Select the quality for images served by the CDN/ )
	).resolves.toBeTruthy();
	fireEvent.keyDown( help, { key: 'Escape' } );
	expect( help.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	expect( screen.queryByText( /^Select the quality for images served by the CDN/ ) ).toBeNull();
} );

test( 'expands existing quality values and preserves other formats when saving quality or Lossless', () => {
	jest.useFakeTimers();
	renderSettings();
	fireEvent.click( screen.getByRole( 'button', { name: 'Adjust Quality' } ) );
	const sliders = screen.getAllByRole( 'slider' ) as HTMLInputElement[];
	expect( sliders.map( slider => slider.value ) ).toEqual( [ '75', '60', '65' ] );
	expect( sliders.map( slider => slider.disabled ) ).toEqual( [ false, true, false ] );
	expect( sliders.map( slider => [ slider.min, slider.max ] ) ).toEqual( [
		[ '20', '89' ],
		[ '20', '80' ],
		[ '20', '80' ],
	] );
	fireEvent.change( sliders[ 0 ], { target: { value: '70' } } );
	act( () => jest.advanceTimersByTime( 200 ) );
	expect( mutate ).toHaveBeenLastCalledWith( {
		...quality,
		jpg: { quality: 70, lossless: false },
	} );
	fireEvent.click( screen.getAllByRole( 'checkbox', { name: 'Lossless' } )[ 1 ] );
	expect( mutate ).toHaveBeenLastCalledWith( {
		...quality,
		png: { quality: 60, lossless: false },
	} );
} );

test( 'exposes the modern Adjust Quality toggle as a disclosure of the quality controls', () => {
	renderSettings();
	const toggle = screen.getByRole( 'button', { name: 'Adjust Quality' } );
	expect( toggle.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	expect( screen.queryAllByRole( 'slider' ) ).toHaveLength( 0 );
	fireEvent.click( toggle );
	expect( toggle.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
	// eslint-disable-next-line testing-library/no-node-access -- aria-controls names the panel by id.
	const panel = document.getElementById( toggle.getAttribute( 'aria-controls' )! );
	expect( panel?.contains( screen.getAllByRole( 'slider' )[ 0 ] ) ).toBe( true );
} );

test( 'keeps the Image Quality heading and summary on the default legacy surface', () => {
	const { container } = render( <QualitySettings isPremium /> );

	expect( container.firstElementChild?.className ).toBe( 'module-subsection' );
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- The well is a presentation container.
	expect( container.querySelector( '.well' ) ).toBeNull();
	expect( screen.getByRole( 'heading', { name: 'Image Quality', level: 4 } ) ).toBeTruthy();
	expect(
		screen.getByText( 'JPEG Quality: 75, PNG Quality: lossless, WEBP Quality: 65' )
	).toBeTruthy();
} );
