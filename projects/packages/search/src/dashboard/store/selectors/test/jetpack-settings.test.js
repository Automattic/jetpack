import jetpackSettingSelectors from '../jetpack-settings';

describe( 'jetpackSettingSelectors', () => {
	test( 'detects whether Reader Chat is available', () => {
		expect(
			jetpackSettingSelectors.isReaderChatAvailable( {
				jetpackSettings: {
					reader_chat: false,
				},
			} )
		).toBe( true );

		expect(
			jetpackSettingSelectors.isReaderChatAvailable( {
				jetpackSettings: {},
			} )
		).toBe( false );
	} );

	test( 'returns whether Reader Chat is enabled', () => {
		expect(
			jetpackSettingSelectors.isReaderChatEnabled( {
				jetpackSettings: {
					reader_chat: true,
				},
			} )
		).toBe( true );
	} );

	describe( 'isAiAnswersEnabled', () => {
		it( 'returns false when ai_answers_enabled is false', () => {
			const state = { jetpackSettings: { ai_answers_enabled: false } };
			expect( jetpackSettingSelectors.isAiAnswersEnabled( state ) ).toBe( false );
		} );

		it( 'returns true when ai_answers_enabled is true', () => {
			const state = { jetpackSettings: { ai_answers_enabled: true } };
			expect( jetpackSettingSelectors.isAiAnswersEnabled( state ) ).toBe( true );
		} );

		it( 'returns false when ai_answers_enabled is undefined', () => {
			const state = { jetpackSettings: {} };
			expect( jetpackSettingSelectors.isAiAnswersEnabled( state ) ).toBe( false );
		} );
	} );
} );
