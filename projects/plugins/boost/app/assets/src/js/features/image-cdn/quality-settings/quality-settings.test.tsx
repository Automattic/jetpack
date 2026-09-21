/* eslint-disable testing-library/prefer-user-event -- Range controls use synchronous changes in this project. */
/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { useImageCdnQuality } from '../lib/stores';
import QualitySettings from './quality-settings';

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
	jest.mocked( useImageCdnQuality ).mockReturnValue( [
		{ data: quality },
		{ mutate },
	] as unknown as ReturnType< typeof useImageCdnQuality > );
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
