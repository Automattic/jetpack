/**
 * Tests for the contact form VariationPicker
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback } from 'react';

const mockCreateSyncedForm = jest.fn();
const mockSetAttributes = jest.fn();
const mockSelectBlock = jest.fn();
const mockReplaceInnerBlocks = jest.fn();
const mockCreateSuccessNotice = jest.fn();

const VARIATIONS = [
	{
		name: 'contact-form',
		title: 'Contact Form',
		attributes: { variationName: 'contact-form' },
		innerBlocks: [ [ 'jetpack/field-name', {} ] ],
	},
	{
		name: 'rsvp-form',
		title: 'RSVP Form',
		attributes: { variationName: 'rsvp-form' },
		innerBlocks: [ [ 'jetpack/field-name', {} ] ],
	},
];

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: flag => flag === 'central-form-management',
} ) );

/*
 * Mirrors Gutenberg's BlockVariationPicker: one always-enabled button per
 * variation, and no awareness that onSelect returns a promise.
 */
const VariationButton = ( { variation, onSelect } ) => {
	const handleClick = useCallback( () => onSelect( variation ), [ variation, onSelect ] );
	return <button onClick={ handleClick }>{ variation.title }</button>;
};

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	__experimentalBlockVariationPicker: ( { variations, onSelect } ) => (
		<ul>
			{ variations.map( variation => (
				<li key={ variation.name }>
					<VariationButton variation={ variation } onSelect={ onSelect } />
				</li>
			) ) }
		</ul>
	),
	__experimentalBlockPatternSetup: () => <div />,
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: ( name, attributes, innerBlocks ) => ( { name, attributes, innerBlocks } ),
	store: 'core/blocks',
} ) );

await jest.unstable_mockModule( '@wordpress/components', () => ( {
	Button: ( { children, ...props } ) => <button { ...props }>{ children }</button>,
	Modal: ( { children } ) => <div>{ children }</div>,
	SelectControl: () => <div />,
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( { store: 'core' } ) );
await jest.unstable_mockModule( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
await jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
await jest.unstable_mockModule( '@wordpress/i18n', () => ( { __: str => str } ) );
await jest.unstable_mockModule( '@wordpress/html-entities', () => ( {
	decodeEntities: str => str,
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useRegistry: () => ( { batch: fn => fn() } ),
	useSelect: selector =>
		selector( store => {
			if ( store === 'core/blocks' ) {
				return {
					getBlockType: () => ( { title: 'Form', icon: { src: 'form' } } ),
					getBlockVariations: () => VARIATIONS,
					getDefaultBlockVariation: () => VARIATIONS[ 0 ],
				};
			}
			if ( store === 'core/editor' ) {
				return {
					getCurrentPostType: () => 'page',
					getCurrentPostId: () => 42,
				};
			}
			if ( store === 'core' ) {
				return { getEntityRecords: () => [] };
			}
			return {};
		} ),
	useDispatch: store => {
		if ( store === 'core/notices' ) {
			return { createSuccessNotice: mockCreateSuccessNotice };
		}
		return { replaceInnerBlocks: mockReplaceInnerBlocks, selectBlock: mockSelectBlock };
	},
} ) );

await jest.unstable_mockModule(
	'../../../src/blocks/contact-form/util/create-synced-form.ts',
	() => ( { createSyncedForm: mockCreateSyncedForm } )
);

await jest.unstable_mockModule(
	'../../../src/blocks/contact-form/util/form-styles.js',
	() => ( {} )
);

await jest.unstable_mockModule(
	'../../../src/blocks/contact-form/components/jetpack-contact-form-skeleton-loader.jsx',
	() => ( { default: () => <div data-testid="skeleton-loader" /> } )
);

await jest.unstable_mockModule( '../../../src/blocks/shared/util/constants.js', () => ( {
	FORM_POST_TYPE: 'jetpack_form',
} ) );

const { default: VariationPicker } = await import(
	'../../../src/blocks/contact-form/variation-picker.jsx'
);

const renderPicker = () =>
	render(
		<VariationPicker
			blockName="jetpack/contact-form"
			setAttributes={ mockSetAttributes }
			clientId="test-client-id"
			classNames="wp-block-jetpack-contact-form"
		/>
	);

describe( 'VariationPicker', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'creates a synced form and sets the ref when a variation is selected', async () => {
		mockCreateSyncedForm.mockResolvedValue( 99 );

		renderPicker();
		await userEvent.click( screen.getByRole( 'button', { name: 'Contact Form' } ) );

		expect( mockCreateSyncedForm ).toHaveBeenCalledTimes( 1 );
		expect( mockSetAttributes ).toHaveBeenCalledWith( { ref: 99 } );
	} );

	it( 'hides the variations while the form is being created', async () => {
		mockCreateSyncedForm.mockReturnValue( new Promise( () => {} ) );

		renderPicker();
		await userEvent.click( screen.getByRole( 'button', { name: 'Contact Form' } ) );

		expect( screen.queryByRole( 'button', { name: 'Contact Form' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'RSVP Form' } ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'skeleton-loader' ) ).toBeInTheDocument();
	} );

	/*
	 * userEvent awaits a re-render between clicks, which is what now hides the
	 * buttons; batching the clicks in one act() is what reaches the guard itself.
	 */
	/* eslint-disable testing-library/no-unnecessary-act, testing-library/prefer-user-event */
	it( 'creates one form only, even when clicks land before the picker re-renders', async () => {
		mockCreateSyncedForm.mockReturnValue( new Promise( () => {} ) );

		renderPicker();
		const contactForm = screen.getByRole( 'button', { name: 'Contact Form' } );
		const rsvpForm = screen.getByRole( 'button', { name: 'RSVP Form' } );

		await act( async () => {
			fireEvent.click( contactForm );
			fireEvent.click( contactForm );
			fireEvent.click( rsvpForm );
		} );

		expect( mockCreateSyncedForm ).toHaveBeenCalledTimes( 1 );
	} );
	/* eslint-enable testing-library/no-unnecessary-act, testing-library/prefer-user-event */

	it( 'falls back to an inline form when creation fails, without leaving the picker locked', async () => {
		mockCreateSyncedForm.mockRejectedValue( new Error( 'nope' ) );

		renderPicker();
		await userEvent.click( screen.getByRole( 'button', { name: 'Contact Form' } ) );

		expect( console ).toHaveErrored();
		expect( mockSetAttributes ).toHaveBeenCalledWith( VARIATIONS[ 0 ].attributes );
		expect( mockReplaceInnerBlocks ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Contact Form' } ) ).toBeInTheDocument();
	} );
} );
