import { describe, expect, test, jest } from '@jest/globals';

const buildGoogleDriveCard = jest.fn( () => ( { id: 'google-drive', cardData: {} } ) );

await jest.unstable_mockModule(
	'../../../src/blocks/contact-form/components/jetpack-integrations-modal/helpers/google-drive.tsx',
	() => ( { buildGoogleDriveCard } )
);

const { renderHook } = await import( '@testing-library/react' );

const useIntegrationCardsData = (
	await import(
		'../../../src/blocks/contact-form/components/jetpack-integrations-modal/hooks/use-integration-cards-data.tsx'
	)
).default;

describe( 'useIntegrationCardsData', () => {
	/**
	 * The Google Drive card configures Google Sheets syncing per form, so it needs
	 * the form's attributes and a way to write them back. Without setAttributes the
	 * card silently discards a completed setup: the spreadsheet gets created and
	 * nothing is stored, so the UI looks like the button did nothing at all.
	 */
	test( 'passes form attributes and setAttributes to the Google Drive card', () => {
		const setAttributes = jest.fn();
		const attributes = { googleSheetsData: { spreadsheetId: 'sheet-1' } };

		renderHook( () =>
			useIntegrationCardsData( {
				integrations: [ { id: 'google-drive', title: 'Google Sheets' } ],
				refreshIntegrations: jest.fn(),
				context: 'block-editor',
				handlers: {},
				attributes,
				setAttributes,
			} )
		);

		expect( buildGoogleDriveCard ).toHaveBeenCalledWith(
			expect.objectContaining( { attributes, setAttributes } )
		);
	} );
} );
