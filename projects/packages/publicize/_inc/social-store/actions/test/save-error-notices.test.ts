import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { updateSocialImageGeneratorConfig } from '../social-image-generator';
import { toggleSocialNotes, updateSocialNotesConfig } from '../social-notes';
import { setMessageTemplate } from '../social-settings';
import { updateUtmSettings } from '../utm-settings';

// Each save thunk surfaces a snackbar error notice when the most recent
// `saveSite` left a `getLastEntitySaveError( 'root', 'site' )`. These tests
// drive that branch through a stub registry so no network/core-data state is
// involved.

const saveSite = jest.fn();
const getLastEntitySaveError = jest.fn();
const createErrorNotice = jest.fn();

/**
 * Build the stub registry the thunks receive. `saveSite` resolves immediately;
 * `getLastEntitySaveError` returns whatever the test queued.
 *
 * @return The thunk argument object.
 */
function makeThunkArgs() {
	const registry = {
		dispatch: ( store: unknown ) => {
			if ( store === coreStore ) {
				return { saveSite };
			}
			if ( store === noticesStore ) {
				return { createErrorNotice };
			}
			return {};
		},
		select: ( store: unknown ) => {
			if ( store === coreStore ) {
				return { getLastEntitySaveError };
			}
			return {};
		},
	};

	// `updateSocialNotesConfig` also reads previous config off the store select.
	const select = {
		getSocialSettings: () => ( { socialNotes: { config: { append_link: true } } } ),
	};

	return { registry, select };
}

beforeEach( () => {
	jest.clearAllMocks();
	saveSite.mockResolvedValue( undefined );
} );

describe( 'site-save thunks surface an error notice on save failure', () => {
	const cases: Array< [ string, () => ( args: unknown ) => Promise< void > ] > = [
		[
			'updateSocialImageGeneratorConfig',
			() => updateSocialImageGeneratorConfig( { enabled: true } ),
		],
		[ 'updateUtmSettings', () => updateUtmSettings( { enabled: true } ) ],
		[ 'toggleSocialNotes', () => toggleSocialNotes( true ) ],
		[ 'updateSocialNotesConfig', () => updateSocialNotesConfig( { append_link: false } ) ],
		[ 'setMessageTemplate', () => setMessageTemplate( 'Hello {title}' ) ],
	];

	it.each( cases )( '%s shows a snackbar notice when the save errors', async ( _name, make ) => {
		getLastEntitySaveError.mockReturnValue( { message: 'Network down' } );

		await make()( makeThunkArgs() );

		expect( saveSite ).toHaveBeenCalledTimes( 1 );
		expect( getLastEntitySaveError ).toHaveBeenCalledWith( 'root', 'site' );
		expect( createErrorNotice ).toHaveBeenCalledTimes( 1 );

		const [ message, options ] = createErrorNotice.mock.calls[ 0 ];
		// The error detail is appended to the per-thunk message.
		expect( message ).toContain( 'Network down' );
		expect( options ).toEqual( { type: 'snackbar' } );
	} );

	it.each( cases )( '%s shows no notice when the save succeeds', async ( _name, make ) => {
		getLastEntitySaveError.mockReturnValue( undefined );

		await make()( makeThunkArgs() );

		expect( saveSite ).toHaveBeenCalledTimes( 1 );
		expect( createErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'falls back to the base message when the error carries no detail', async () => {
		getLastEntitySaveError.mockReturnValue( {} );

		await updateUtmSettings( { enabled: false } )( makeThunkArgs() );

		expect( createErrorNotice ).toHaveBeenCalledTimes( 1 );
		const [ message ] = createErrorNotice.mock.calls[ 0 ];
		expect( message ).toBe( 'There was an error saving the link tracking settings.' );
	} );
} );
