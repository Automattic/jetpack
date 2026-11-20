import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Field, RadioGroup } from '@wordpress/ui';
import RadioCard from '../index.tsx';
import type { RadioCardProps } from '../types.ts';

const renderCard = ( props: Partial< RadioCardProps > = {}, value = 'none' ) => {
	const onValueChange = jest.fn();
	const onPreviewClick = jest.fn();
	render(
		<Field.Root>
			<RadioGroup value={ value } onValueChange={ onValueChange }>
				<RadioCard
					id="placement-after-content"
					value="after_content"
					title="After the post content"
					illustration={ <span>Wireframe</span> }
					onPreviewClick={ onPreviewClick }
					{ ...props }
				/>
			</RadioGroup>
		</Field.Root>
	);
	return { onValueChange, onPreviewClick };
};

describe( 'RadioCard', () => {
	// Catches the title id and `aria-labelledby` drifting apart, which leaves the radio unnamed.
	it( 'names the radio with the title', () => {
		renderCard( {}, 'after_content' );

		expect( screen.getByRole( 'radio', { name: 'After the post content' } ) ).toBeChecked();
	} );

	// Catches the illustration no longer labelling the radio, or the radio losing its value.
	it( 'picks the card when the illustration is clicked', async () => {
		const { onValueChange } = renderCard();

		await userEvent.click( screen.getByText( 'Wireframe' ) );

		expect( onValueChange ).toHaveBeenCalledWith( 'after_content', expect.anything() );
	} );

	// Catches the title moving inside the label, where a click meant for the link picks the card.
	it( 'does not pick the card when the title is clicked', async () => {
		const { onValueChange } = renderCard();

		await userEvent.click( screen.getByText( 'After the post content' ) );

		expect( onValueChange ).not.toHaveBeenCalled();
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

	// Catches the preview handler losing the value the parent uses to tell cards apart.
	it( 'passes its value to the preview handler', async () => {
		const { onPreviewClick } = renderCard( { previewUrl: '#preview' } );

		await userEvent.click( screen.getByRole( 'link', { name: 'Preview and edit' } ) );

		expect( onPreviewClick ).toHaveBeenCalledWith( 'after_content' );
	} );
} );
