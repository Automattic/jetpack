/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const initialWaitTexts = [
	__( 'Let me see what I can find, back soon', 'jetpack' ),
	__( 'Let me think about that for a moment', 'jetpack' ),
	__( 'Great question, give me a few moments to think about that', 'jetpack' ),
	__( 'Hmm, let me see what I can find about that', 'jetpack' ),
	__( 'That rings a bell, give me a moment', 'jetpack' ),
];

export const referenceTexts = [
	__(
		'I found the following documents. Bear with me while I try and summarise them for you',
		'jetpack'
	),
	__(
		'The following documents look useful, but stick around while I summarise them for you',
		'jetpack'
	),
	__(
		'The following documents might have the answers, give me a moment to read and summarize them for you',
		'jetpack'
	),
	__(
		'I have a good feeling about these documents, but let me have a quick read and give you a summary',
		'jetpack'
	),
	__(
		"These documents look useful, but don't waste your time reading them, let me do that for you",
		'jetpack'
	),
];
