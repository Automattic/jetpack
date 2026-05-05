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
} );
