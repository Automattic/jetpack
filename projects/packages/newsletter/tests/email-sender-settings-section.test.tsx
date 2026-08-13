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
		return (
			<input
				aria-label={ field.label }
				value={ data[ field.id ] ?? '' }
				// Test-only mock; rebinding is irrelevant to this isolated render.
				// eslint-disable-next-line react/jsx-no-bind
				onChange={ handleChange }
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

import { fireEvent, render, screen } from '@testing-library/react';
import { EmailSenderSettingsSection } from '../src/settings/sections/email-sender-settings-section';
import type { NewsletterSettings } from '../src/settings/types';

describe( 'EmailSenderSettingsSection', () => {
	it( 'saves pending sender settings when its form is submitted', () => {
		const onSave = jest.fn();

		render(
			<EmailSenderSettingsSection
				data={ { jetpack_subscriptions_from_name: 'Test site' } as NewsletterSettings }
				onChange={ jest.fn() }
				onSave={ onSave }
				isSaving={ false }
				hasChanges
				changedKeys={ [ 'jetpack_subscriptions_from_name' ] }
				isNewsletterEnabled
			/>
		);

		fireEvent.submit( screen.getByRole( 'form', { name: 'Sender settings' } ) );

		expect( onSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not save on submit when there are no pending changes', () => {
		const onSave = jest.fn();

		render(
			<EmailSenderSettingsSection
				data={ { jetpack_subscriptions_from_name: 'Test site' } as NewsletterSettings }
				onChange={ jest.fn() }
				onSave={ onSave }
				isSaving={ false }
				hasChanges={ false }
				changedKeys={ [] }
				isNewsletterEnabled
			/>
		);

		fireEvent.submit( screen.getByRole( 'form', { name: 'Sender settings' } ) );

		expect( onSave ).not.toHaveBeenCalled();
	} );
} );
