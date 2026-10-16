jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataForm: ( {
		data,
		fields,
		onChange,
	}: {
		data: Record< string, string >;
		fields: Array< { id: string; label: string } >;
		onChange: ( updates: Record< string, string > ) => void;
	} ) => {
		const field = fields[ 0 ];
		const handleChange = ( event: React.ChangeEvent< HTMLInputElement > ) =>
			onChange( { [ field.id ]: event.target.value } );
		const handleKeyDown = ( event: React.KeyboardEvent< HTMLInputElement > ) => {
			if ( event.key === 'Enter' ) {
				event.currentTarget.form?.requestSubmit();
			}
		};
		return (
			<input
				aria-label={ field.label }
				value={ data[ field.id ] ?? '' }
				// Test-only mock; rebinding is irrelevant to this isolated render.
				// eslint-disable-next-line react/jsx-no-bind
				onChange={ handleChange }
				// eslint-disable-next-line react/jsx-no-bind
				onKeyDown={ handleKeyDown }
			/>
		);
	},
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: jest.fn( () => ( { title: 'Test site' } ) ),
	getSiteType: jest.fn( () => 'jetpack' ),
} ) );

import analytics from '@automattic/jetpack-analytics';
import { fireEvent, render, screen } from '@testing-library/react';
import { EmailSenderSettingsSection } from '../src/settings/sections/email-sender-settings-section';
import type { NewsletterSettings } from '../src/settings/types';

/**
 * Render Sender settings with saveable defaults and optional state overrides.
 *
 * @param props - Component prop overrides.
 * @return Render spies for change and save behavior.
 */
function renderSection(
	props: Partial< React.ComponentProps< typeof EmailSenderSettingsSection > > = {}
) {
	const onChange = jest.fn();
	const onSave = jest.fn();
	render(
		<EmailSenderSettingsSection
			data={ { jetpack_subscriptions_from_name: 'Test site' } as NewsletterSettings }
			onChange={ onChange }
			onSave={ onSave }
			isSaving={ false }
			hasChanges
			changedKeys={ [ 'jetpack_subscriptions_from_name' ] }
			isNewsletterEnabled
			{ ...props }
		/>
	);
	return { onChange, onSave };
}

describe( 'EmailSenderSettingsSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'saves a changed sender name when Enter is pressed in the input', () => {
		const { onChange, onSave } = renderSection();
		const input = screen.getByRole( 'textbox', { name: 'Sender name' } );

		// user-event is not a dependency of this package.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( input, { target: { value: 'Updated sender' } } );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown( input, { key: 'Enter', code: 'Enter' } );

		expect( onChange ).toHaveBeenCalledWith( {
			jetpack_subscriptions_from_name: 'Updated sender',
		} );
		expect( onSave ).toHaveBeenCalledTimes( 1 );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_section_save',
			{
				site_type: 'jetpack',
				section: 'sender_settings',
				changed_keys: 'jetpack_subscriptions_from_name',
				change_count: 1,
			}
		);
	} );

	it( 'uses the same save behavior when the Save button is clicked', () => {
		const { onSave } = renderSection();

		// user-event is not a dependency of this package.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( onSave ).toHaveBeenCalledTimes( 1 );
		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_section_save',
			{
				site_type: 'jetpack',
				section: 'sender_settings',
				changed_keys: 'jetpack_subscriptions_from_name',
				change_count: 1,
			}
		);
	} );

	it.each( [
		[ 'there are no pending changes', { hasChanges: false } ],
		[ 'a save is already in progress', { isSaving: true } ],
		[ 'the newsletter is disabled', { isNewsletterEnabled: false } ],
	] )( 'does not save when %s', ( _condition, props ) => {
		const { onSave } = renderSection( props );
		const input = screen.getByRole( 'textbox', { name: 'Sender name' } );
		const saveButton = screen.getByRole( 'button' );

		expect( saveButton ).toHaveAttribute( 'aria-disabled', 'true' );
		// user-event is not a dependency of this package.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown( input, { key: 'Enter', code: 'Enter' } );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( saveButton );

		expect( onSave ).not.toHaveBeenCalled();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
	} );
} );
