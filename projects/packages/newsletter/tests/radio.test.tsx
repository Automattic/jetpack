/**
 * Tests for the `Radio` DataForm `Edit` control (JETPACK-2277).
 *
 * Renders the real, public `@wordpress/components` `RadioControl` — not
 * DataViews' bundled `Edit: 'radio'` shorthand, which resolves the same
 * private `ValidatedToggleControl` API as `Edit: 'toggle'` and breaks once
 * Gutenberg stops exposing it there.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { Radio } from '../src/settings/components/radio';
import type { NewsletterSettings } from '../src/settings/types';
import type { NormalizedField } from '@wordpress/dataviews';

/**
 * Build a minimal `NormalizedField` stand-in for `jetpack_subscriptions_reply_to`.
 *
 * @param overrides - Field properties to override.
 * @return A field object cast to `NormalizedField<NewsletterSettings>`.
 */
function createField(
	overrides: Partial< NormalizedField< NewsletterSettings > > = {}
): NormalizedField< NewsletterSettings > {
	return {
		id: 'jetpack_subscriptions_reply_to',
		label: 'Reply-to settings',
		getValue: ( { item }: { item: NewsletterSettings } ) => item.jetpack_subscriptions_reply_to,
		setValue: ( { value }: { item: NewsletterSettings; value: unknown } ) => ( {
			jetpack_subscriptions_reply_to: value,
		} ),
		elements: [
			{ value: 'comment', label: 'Replies will be a public comment on the post' },
			{ value: 'author', label: "Replies will be sent to the post author's email" },
			{ value: 'no-reply', label: 'Replies are not allowed' },
		],
		...overrides,
	} as NormalizedField< NewsletterSettings >;
}

describe( 'Radio', () => {
	it( 'renders one option per field.elements entry', () => {
		render(
			<Radio
				data={ { jetpack_subscriptions_reply_to: 'comment' } as NewsletterSettings }
				field={ createField() }
				onChange={ jest.fn() }
			/>
		);

		expect(
			screen.getByRole( 'radio', { name: 'Replies will be a public comment on the post' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'radio', { name: "Replies will be sent to the post author's email" } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: 'Replies are not allowed' } ) ).toBeInTheDocument();
	} );

	it( 'checks the option matching field.getValue', () => {
		render(
			<Radio
				data={ { jetpack_subscriptions_reply_to: 'author' } as NewsletterSettings }
				field={ createField() }
				onChange={ jest.fn() }
			/>
		);

		expect(
			screen.getByRole( 'radio', { name: "Replies will be sent to the post author's email" } )
		).toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'Replies will be a public comment on the post' } )
		).not.toBeChecked();
	} );

	it( 'calls onChange with field.setValue applied to the newly selected option', () => {
		const onChange = jest.fn();

		render(
			<Radio
				data={ { jetpack_subscriptions_reply_to: 'comment' } as NewsletterSettings }
				field={ createField() }
				onChange={ onChange }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'radio', { name: 'Replies are not allowed' } ) );

		expect( onChange ).toHaveBeenCalledWith( { jetpack_subscriptions_reply_to: 'no-reply' } );
	} );

	it( 'renders no options when field.elements is empty', () => {
		render(
			<Radio
				data={ { jetpack_subscriptions_reply_to: 'comment' } as NewsletterSettings }
				field={ createField( { elements: [] } ) }
				onChange={ jest.fn() }
			/>
		);

		expect( screen.queryAllByRole( 'radio' ) ).toHaveLength( 0 );
	} );

	it( 'renders the field label and description', () => {
		render(
			<Radio
				data={ { jetpack_subscriptions_reply_to: 'comment' } as NewsletterSettings }
				field={ createField( { description: 'Choose who receives replies.' } ) }
				onChange={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Reply-to settings' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Choose who receives replies.' ) ).toBeInTheDocument();
	} );
} );
