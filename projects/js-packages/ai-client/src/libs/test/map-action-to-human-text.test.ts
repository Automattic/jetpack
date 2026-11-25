import { LANGUAGE_MAP, PROMPT_TYPE_CHANGE_LANGUAGE } from '../../constants.ts';
import { mapActionToHumanText } from '../map-action-to-human-text.ts';

describe( 'LANGUAGE_MAP and mapActionToHumanText', () => {
	it( 'includes Greek (el) in LANGUAGE_MAP', () => {
		expect( LANGUAGE_MAP.el ).toEqual( { label: 'Greek' } );
	} );

	it( 'maps changeLanguage for Greek to human-readable text', () => {
		expect( mapActionToHumanText( PROMPT_TYPE_CHANGE_LANGUAGE, { language: 'el (Greek)' } ) ).toBe(
			'Translate: Greek'
		);
	} );
} );
