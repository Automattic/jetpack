import { EventSourceMessage } from '@microsoft/fetch-event-source';
import { PROMPT_TYPE_CHANGE_LANGUAGE, PROMPT_TYPE_SUMMARIZE } from '../constants.ts';
import { getErrorData } from '../hooks/use-ai-suggestions/index.ts';
import { renderHTMLFromMarkdown, renderMarkdownFromHTML } from '../libs/markdown/index.ts';
import { AiModelTypeProp, ERROR_RESPONSE, ERROR_NETWORK } from '../types.ts';

type ChromeAISuggestionsEventSourceConstructorArgs = {
	content: string;
	promptType: string;
	options?: {
		postId?: number | string;
		feature?: 'ai-assistant-experimental' | string | undefined;

		// translation
		sourceLanguage?: string;
		targetLanguage?: string;

		// summarization
		tone?: string;
		wordCount?: number;

		// not sure if we need these
		functions?: Array< object >;
		model?: AiModelTypeProp;
	};
};

type ChromeAIEvent = {
	type: string;
	message: string;
	complete?: boolean;
};

type FunctionCallProps = {
	name?: string;
	arguments?: string;
};

export default class ChromeAISuggestionsEventSource extends EventTarget {
	fullMessage: string;
	fullFunctionCall: FunctionCallProps;
	isPromptClear: boolean;
	controller: AbortController;

	errorUnclearPromptTriggered: boolean;

	constructor( data: ChromeAISuggestionsEventSourceConstructorArgs ) {
		super();
		this.fullMessage = '';
		this.fullFunctionCall = {
			name: '',
			arguments: '',
		};
		this.isPromptClear = false;

		this.controller = new AbortController();

		this.initSource( data );
	}

	initSource( {
		content,
		promptType,
		options = {},
	}: ChromeAISuggestionsEventSourceConstructorArgs ) {
		if ( promptType === PROMPT_TYPE_CHANGE_LANGUAGE ) {
			this.translate( content, options.targetLanguage, options.sourceLanguage );
		}

		if ( promptType === PROMPT_TYPE_SUMMARIZE ) {
			this.summarize( content, options.tone, options.wordCount );
		}
	}

	async initEventSource() {}

	close() {}

	checkForUnclearPrompt() {}

	processEvent( e: EventSourceMessage ) {
		let data: ChromeAIEvent;
		try {
			data = JSON.parse( e.data );
		} catch ( err ) {
			this.processErrorEvent( err );
			return;
		}

		if ( e.event === 'translation' || e.event === 'summary' ) {
			this.dispatchEvent( new CustomEvent( 'suggestion', { detail: data.message } ) );
		}

		if ( data.complete ) {
			this.dispatchEvent(
				new CustomEvent( 'done', { detail: { message: data.message, source: 'chromeAI' } } )
			);
		}
	}

	processErrorEvent( e ) {
		// Dispatch a generic network error event
		this.dispatchEvent( new CustomEvent( ERROR_NETWORK, { detail: e } ) );
		this.dispatchEvent(
			new CustomEvent( ERROR_RESPONSE, {
				detail: getErrorData( ERROR_NETWORK ),
			} )
		);
	}

	// use the Chrome AI translator
	async translate( text: string, target: string, source: string = '' ) {
		if ( ! ( 'Translator' in self ) ) {
			return;
		}

		const translator = await self.Translator.create( {
			sourceLanguage: source,
			targetLanguage: target,
		} );

		if ( ! translator ) {
			return;
		}

		try {
			const translation = await translator.translate( renderHTMLFromMarkdown( { content: text } ) );

			this.processEvent( {
				id: '',
				event: 'translation',
				data: JSON.stringify( {
					message: renderMarkdownFromHTML( { content: translation } ),
					complete: true,
				} ),
			} );
		} catch ( error ) {
			this.processErrorEvent( error );
		}
	}

	// Helper function to format summarizer options
	private getSummarizerOptions( tone?: string, wordCount?: number ) {
		let sharedContext = `The summary you write should contain strictly less than ${
			wordCount ?? 50
		} words. Strive for precision in word count without compromising clarity and significance`;

		if ( tone ) {
			sharedContext += `\n - Write with a ${ tone } tone.\n`;
		}

		const options = {
			sharedContext: sharedContext,
			type: 'teaser',
			format: 'plain-text',
			length: 'medium',
		};

		return options;
	}

	// use the Chrome AI summarizer
	async summarize( text: string, tone?: string, wordCount?: number ) {
		if ( ! ( 'Summarizer' in self ) ) {
			return;
		}

		const availability = await self.Summarizer.availability();

		if ( availability === 'unavailable' ) {
			return;
		}

		const summarizerOptions = this.getSummarizerOptions( tone, wordCount );

		const summarizer = await self.Summarizer.create( summarizerOptions );

		if ( availability !== 'available' ) {
			await summarizer.ready;
		}

		try {
			const context = `Write with a ${ tone } tone.`;
			let summary = await summarizer.summarize( text, { context: context } );

			wordCount = wordCount ?? 50;

			// gemini-nano has a tendency to exceed the word count, so we need to check and summarize again if necessary
			if ( summary.split( ' ' ).length > wordCount ) {
				summary = await summarizer.summarize( summary, { context: context } );
			}

			this.processEvent( {
				id: '',
				event: 'summary',
				data: JSON.stringify( {
					message: summary,
					complete: true,
				} ),
			} );
		} catch ( error ) {
			this.processErrorEvent( error );
		}
	}
}
