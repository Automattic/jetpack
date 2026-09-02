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

	describe( 'isAiAnswersSaved', () => {
		it( 'returns the stored choice even while the effective value is off', () => {
			const state = {
				jetpackSettings: { ai_answers_saved: true, ai_answers_enabled: false },
			};
			expect( jetpackSettingSelectors.isAiAnswersSaved( state ) ).toBe( true );
		} );

		it( 'returns false when the stored choice is off', () => {
			const state = { jetpackSettings: { ai_answers_saved: false } };
			expect( jetpackSettingSelectors.isAiAnswersSaved( state ) ).toBe( false );
		} );

		it( 'returns false when the field is missing', () => {
			expect( jetpackSettingSelectors.isAiAnswersSaved( { jetpackSettings: {} } ) ).toBe( false );
		} );
	} );

	describe( 'isAiMasterEnabled', () => {
		it( 'returns false only when the field is explicitly false', () => {
			const state = { jetpackSettings: { ai_master_enabled: false } };
			expect( jetpackSettingSelectors.isAiMasterEnabled( state ) ).toBe( false );
		} );

		it( 'returns true when the switch is on', () => {
			const state = { jetpackSettings: { ai_master_enabled: true } };
			expect( jetpackSettingSelectors.isAiMasterEnabled( state ) ).toBe( true );
		} );

		it( 'treats a missing field as on, for back ends that predate it', () => {
			expect( jetpackSettingSelectors.isAiMasterEnabled( { jetpackSettings: {} } ) ).toBe( true );
		} );
	} );
} );
