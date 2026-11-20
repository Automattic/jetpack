import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import CheckboxCard from '../index.tsx';
import type { CheckboxCardProps } from '../types.ts';

const renderCard = ( props: Partial< CheckboxCardProps > = {} ) => {
	const onChange = jest.fn();
	const onPreviewClick = jest.fn();
	render(
		<CheckboxCard
			id="placement-after-content"
			name="after_content"
			title="After the post content"
			illustration={ <span>Wireframe</span> }
			checked={ false }
			onChange={ onChange }
			onPreviewClick={ onPreviewClick }
			{ ...props }
		/>
	);
	return { onChange, onPreviewClick };
};

describe( 'CheckboxCard', () => {
	// Catches the title id and `aria-labelledby` drifting apart, which leaves the checkbox unnamed.
	it( 'names the checkbox with the title', () => {
		renderCard( { checked: true } );

		expect( screen.getByRole( 'checkbox', { name: 'After the post content' } ) ).toBeChecked();
	} );

	// Catches the label's `htmlFor` no longer matching the checkbox, or `onChange` losing the name.
	it.each( [
		[ 'ticks', false, true ],
		[ 'unticks', true, false ],
	] )( '%s the card when the illustration is clicked', async ( _, checked, next ) => {
		const { onChange } = renderCard( { checked } );

		await userEvent.click( screen.getByText( 'Wireframe' ) );

		expect( onChange ).toHaveBeenCalledWith( 'after_content', next );
	} );

	// Catches the title moving inside the label, where a click meant for the link toggles the card.
	it( 'does not toggle when the title is clicked', async () => {
		const { onChange } = renderCard();

		await userEvent.click( screen.getByText( 'After the post content' ) );

		expect( onChange ).not.toHaveBeenCalled();
	} );

	// Catches the link rendering without a `previewUrl`, or going missing when one is passed.
	it.each( [
		[ 'shows', 'https://example.com/wp-admin/site-editor.php', 1 ],
		[ 'hides', undefined, 0 ],
	] )( '%s the preview link', ( _, previewUrl, count ) => {
		renderCard( { previewUrl } );

		// By text: without an `href` the anchor has no link role, so a role query would miss it.
		expect( screen.queryAllByText( 'Preview and edit' ) ).toHaveLength( count );
	} );

	// Catches the preview handler losing the name the parent uses to tell cards apart.
	it( 'passes its name to the preview handler', async () => {
		const { onPreviewClick } = renderCard( { previewUrl: '#preview' } );

		await userEvent.click( screen.getByRole( 'link', { name: 'Preview and edit' } ) );

		expect( onPreviewClick ).toHaveBeenCalledWith( 'after_content' );
	} );
} );
