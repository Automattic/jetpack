import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import {
	PROMPT_TYPE_CHANGE_LANGUAGE,
	//PROMPT_TYPE_SUMMARIZE,
} from '../constants.js';
import { PromptProp, PromptItemProps } from '../types.js';
import ChromeAISuggestionsEventSource from './suggestions.js';

/**
 * Check for the feature flag.
 *
 * @return boolean
 */
function shouldUseChromeAI() {
	return getJetpackExtensionAvailability( 'ai-use-chrome-ai-sometimes' ).available === true;
}

interface PromptContext {
	type?: string;
	content?: string;
	language?: string;
}

/**
 * This will return an instance of ChromeAISuggestionsEventSource or false.
 *
 * @param promptArg - The messages array of the prompt.
 * @return ChromeAISuggestionsEventSource | bool
 */
export default async function ChromeAIFactory( promptArg: PromptProp ) {
	if ( ! shouldUseChromeAI() ) {
		return false;
	}

	const context = {
		content: '',
		language: '',
	};
	let promptType = '';
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
		}
	}

	if ( promptType.startsWith( 'ai-assistant-change-language' ) ) {
		const [ language ] = context.language.split( ' ' );

		if (
			! ( 'translation' in self ) ||
			! self.translation.createTranslator ||
			! self.translation.canTranslate
		) {
			return false;
		}

		const languageOpts = {
			sourceLanguage: 'en',
			targetLanguage: language,
		};

		// see if we can detect the source language
		if ( 'ai' in self && self.ai.languageDetector ) {
			const detector = await self.ai.languageDetector.create();
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
		}

		const canTranslate = await self.translation.canTranslate( languageOpts );

		if ( canTranslate === 'no' ) {
			return false;
		}

		const chromeAI = new ChromeAISuggestionsEventSource( {
			content: context.content,
			promptType: PROMPT_TYPE_CHANGE_LANGUAGE,
			options: languageOpts,
		} );

		return chromeAI;
	}

	// TODO
	if ( promptType.startsWith( 'ai-assistant-summarize' ) ) {
		/*
		return new ChromeAISuggestionsEventSource({
			content: "",
			promptType: PROMPT_TYPE_SUMMARIZE,
			options: {},
		} );
		*/

		return false;
	}

	return false;
}
