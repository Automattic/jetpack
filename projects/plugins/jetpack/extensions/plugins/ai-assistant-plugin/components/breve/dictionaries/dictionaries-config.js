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
		},
		weasel: {
			dictionary: weaselWords,
			type: 'list',
			tooltip: "Remove 'Weasel' words to add confidence.",
			label: 'Weasel words',
		},
		adverb: {
			dictionary: adverbs,
			type: 'list',
			tooltip: 'Adverbs make your writing less concise.',
			label: 'Adverbs',
		},
		adjective: {
			dictionary: adjectives,
			type: 'list',
			tooltip: 'Replace adjectives with data or remove them.',
			label: 'Adjectives',
		},
	},
};

export default config;
