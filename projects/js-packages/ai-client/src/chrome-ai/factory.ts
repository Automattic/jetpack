import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import {
	PROMPT_TYPE_CHANGE_LANGUAGE,
	//PROMPT_TYPE_SUMMARIZE,
} from '../constants.js';
import { PromptProp } from '../types.js';
import ChromeAISuggestionsEventSource from './suggestions.js';

/**
 * Check for the feature flag.
 *
 * @return boolean
 */
function shouldUseChromeAI() {
	return getJetpackExtensionAvailability( 'ai-use-chrome-ai-sometimes' ).available === true;
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

	let context;
	let promptType = '';
	if ( Array.isArray( promptArg ) ) {
		context = promptArg[ promptArg.length - 1 ].context;
		promptType = context.type;
	}

	if ( promptType.startsWith( 'ai-assistant-change-language' ) ) {
		const [ language ] = context.language.split( ' ' );

		if (
			! ( 'translation' in self ) ||
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			! ( self.translation as any ).createTranslator ||
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			! ( self.translation as any ).canTranslate
		) {
			return false;
		}

		const languageOpts = {
			sourceLanguage: 'en',
			targetLanguage: language,
		};

		// see if we can detect the source language
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ( 'ai' in self && ( self.ai as any ).languageDetector ) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const detector = await ( self.ai as any ).languageDetector.create();
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

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const canTranslate = await ( self.translation as any ).canTranslate( languageOpts );

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
