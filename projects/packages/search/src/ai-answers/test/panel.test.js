import { createAiAnswersPanel } from '../panel';

describe( 'AI Answers panel', () => {
	it( 'renders streaming markdown answer text', () => {
		document.body.innerHTML = '<div class="jetpack-search-ai-answers"></div>';
		const container = document.querySelector( '.jetpack-search-ai-answers' );
		const panel = createAiAnswersPanel( container );

		panel.render( {
			status: 'streaming',
			text: '**Reset** your password',
			citations: [],
			error: null,
			loadingHint: null,
			canShowMore: false,
			showExtended: false,
		} );

		expect( container.hidden ).toBe( false );
		expect( container.querySelector( '.jp-search-answers-panel__heading' ) ).toHaveTextContent(
			'AI answer'
		);
		expect( container.querySelector( 'strong' ) ).toHaveTextContent( 'Reset' );
	} );

	it( 'routes Show more clicks to the callback', () => {
		document.body.innerHTML = '<div class="jetpack-search-ai-answers"></div>';
		const onShowMore = jest.fn();
		const container = document.querySelector( '.jetpack-search-ai-answers' );
		const panel = createAiAnswersPanel( container, { onShowMore } );

		panel.render( {
			status: 'done',
			text: 'Brief answer.',
			citations: [],
			error: null,
			loadingHint: null,
			canShowMore: true,
			showExtended: false,
		} );

		container.querySelector( 'button' ).click();
		expect( onShowMore ).toHaveBeenCalledTimes( 1 );
	} );
} );
