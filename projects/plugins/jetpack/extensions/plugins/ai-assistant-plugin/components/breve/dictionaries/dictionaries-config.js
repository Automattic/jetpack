import phrases from '../features/complex-words/phrases';
import { escapeRegExp } from '../utils/escapeRegExp';
import adjectives from './adjectives';
import adverbs from './adverbs';
import weaselWords from './weaselWords';

const config = {
	dictionaries: {
		phrase: {
			dictionary: phrases,
			type: 'key-value',
			tooltip: "Consider replacing with '{value}'.",
			label: 'Complex words',
			apiRequest: {
				systemMessage:
					"Replace the word '{text}' in the sentence with '{value}'. FIX the grammar after replacing the word. REFINE grammar if needed. THEN insert the sentence back into the paragraph. ONLY respond with the updated paragraph, nothing else.",
			},
		},
		'long-sentence': {
			type: 'function',
			function: text => {
				const sentenceRegex = /[^.!?]+[.!?]+/g;
				const sentences = text.match( sentenceRegex ) || [];
				return sentences
					.filter( sentence => sentence.split( /\s+/ ).length > 20 )
					.map( sentence => ( {
						sentence,
						regex: new RegExp( escapeRegExp( sentence ), 'gi' ),
					} ) );
			},
			tooltip: 'Break this long sentence into shorter ones.',
			label: 'Long sentences',
			apiRequest: {
				systemMessage:
					"Break this exact sentence only, into shorter sentences: '{text}'. DO NOT touch any other sentence in the paragraph. Make sure the new, shorter sentences are grammatically correct. If any of the sentences are in the passive voice, change them to active voice. THEN insert the new sentences back into the paragraph in place of the original long sentence. ONLY respond with the updated paragraph, nothing else.",
			},
		},
		weasel: {
			dictionary: weaselWords,
			type: 'list',
			tooltip: "Remove 'Weasel' words to add confidence.",
			label: 'Weasel words',
			apiRequest: {
				systemMessage:
					"Take out the word '{text}' out from the sentence. FIX the grammar after taking the word out. REFINE grammar if needed. THEN insert the sentence back into the paragraph. ONLY respond with the updated paragraph, nothing else.",
			},
		},
		adverb: {
			dictionary: adverbs,
			type: 'list',
			tooltip: 'Adverbs make your writing less concise.',
			label: 'Adverbs',
			apiRequest: {
				systemMessage:
					"Take out the word '{text}' out from the sentence. FIX the grammar after taking the word out. REFINE grammar if needed. THEN insert the sentence back into the paragraph. ONLY respond with the updated paragraph, nothing else.",
			},
		},
		adjective: {
			dictionary: adjectives,
			type: 'list',
			tooltip: 'Replace adjectives with data or remove them.',
			label: 'Adjectives',
			apiRequest: {
				systemMessage:
					"Take out the word '{text}' out from the sentence. FIX the grammar after taking the word out. REFINE grammar if needed. THEN insert the sentence back into the paragraph. ONLY respond with the updated paragraph, nothing else.",
			},
		},
	},
};

export default config;
