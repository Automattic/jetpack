import { PROMPT_TYPE_CHANGE_LANGUAGE, PROMPT_TYPE_SUMMARIZE } from '../constants.ts';
import { PromptProp, PromptItemProps } from '../types.ts';
import { isChromeAIAvailable } from './get-availability.ts';
import ChromeAISuggestionsEventSource from './suggestions.ts';

interface PromptContext {
	type?: string;
	content?: string;
	language?: string;
	tone?: string;
	words?: number;
}

/**
 * This will return an instance of ChromeAISuggestionsEventSource or false.
 *
 * @param promptArg - The messages array of the prompt.
 * @return ChromeAISuggestionsEventSource | bool
 */
export default async function ChromeAIFactory( promptArg: PromptProp ) {
	if ( ! isChromeAIAvailable() ) {
		return false;
	}

	const context = {
		content: '',
		language: '',
	};

	let promptType = '';
	let tone = null;
	let wordCount = null;

	if ( Array.isArray( promptArg ) ) {
		for ( let i = 0; i < promptArg.length; i++ ) {
			const prompt: PromptItemProps = promptArg[ i ];
			if ( prompt.content ) {
				context.content = prompt.content;
			}

			if ( ! ( 'context' in prompt ) ) {
				continue;
			}

			const promptContext: PromptContext = prompt.context;

			if ( promptContext.type ) {
				promptType = promptContext.type;
			}

			if ( promptContext.language ) {
				context.language = promptContext.language;
			}

			if ( promptContext.content ) {
				context.content = promptContext.content;
			}

			if ( promptContext.tone ) {
				tone = promptContext.tone;
			}

			if ( promptContext.words ) {
				wordCount = promptContext.words;
			}
		}
	}

	// Early return if the prompt type is not supported.
	if (
		! promptType.startsWith( 'ai-assistant-change-language' ) &&
		! promptType.startsWith( 'ai-content-lens' )
	) {
		return false;
	}

	// If the languageDetector is not available, we can't use the translation or summary features—it's safer to fall back
	// to the default AI model than to risk an unexpected error.
	if (
		! ( 'LanguageDetector' in self ) ||
		! self.LanguageDetector.create ||
		! self.LanguageDetector.availability
	) {
		return false;
	}

	const languageDetectorAvailability = await self.LanguageDetector.availability();
	if ( languageDetectorAvailability === 'unavailable' ) {
		return false;
	}

	const detector = await self.LanguageDetector.create();
	if ( languageDetectorAvailability !== 'available' ) {
		await detector.ready;
	}

	if ( promptType.startsWith( 'ai-assistant-change-language' ) ) {
		const [ language ] = context.language.split( ' ' );

		if (
			! ( 'Translator' in self ) ||
			! self.Translator.create ||
			! self.Translator.availability
		) {
			return false;
		}

		const languageOpts = {
			sourceLanguage: 'en',
			targetLanguage: language,
		};

		const confidences = await detector.detect( context.content );

		for ( const confidence of confidences ) {
			// 75% confidence is just a value that was picked. Generally
			// 80% of higher is pretty safe, but the source language is
			// required for the translator to work at all, which is also
			// why en is the default language.
			if ( confidence.confidence > 0.75 ) {
				languageOpts.sourceLanguage = confidence.detectedLanguage;
				break;
			}
		}

		const translationAvailability = await self.Translator.availability( languageOpts );

		if ( translationAvailability === 'unavailable' ) {
			return false;
		}

		const chromeAI = new ChromeAISuggestionsEventSource( {
			content: context.content,
			promptType: PROMPT_TYPE_CHANGE_LANGUAGE,
			options: languageOpts,
		} );

		return chromeAI;
	}

	if ( promptType.startsWith( 'ai-content-lens' ) ) {
		if ( ! ( 'Summarizer' in self ) ) {
			return false;
		}

		if ( context.language && context.language !== 'en (English)' ) {
			return false;
		}

		const confidences = await detector.detect( context.content );

		// if it doesn't look like the content is in English, we can't use the summary feature
		for ( const confidence of confidences ) {
			// 75% confidence is just a value that was picked. Generally
			// 80% of higher is pretty safe, but the source language is
			// required for the translator to work at all, which is also
			// why en is the default language.
			if ( confidence.confidence > 0.75 && confidence.detectedLanguage !== 'en' ) {
				return false;
			}
		}

		const summaryOpts = {
			tone: tone,
			wordCount: wordCount,
		};

		return new ChromeAISuggestionsEventSource( {
			content: context.content,
			promptType: PROMPT_TYPE_SUMMARIZE,
			options: summaryOpts,
		} );
	}

	return false;
}
