#!/usr/bin/env node
import OpenAI from 'openai';

const openai = new OpenAI( {
	apiKey: process.env.OPENAI_API_KEY,
} );

let inputData = '';

process.stdin.on( 'readable', () => {
	let chunk;
	while ( ( chunk = process.stdin.read() ) !== null ) {
		inputData += chunk;
	}
} );

process.stdin.on( 'end', async () => {
	const systemPrompt =
		"Your job is to write a changelog entry. Respond in the format 'Feature: change description.'\n" +
		'"Feature:" should be the name of the project/ or tool/, which is usually identifiable by the root directory of the changed files.\n' +
		'Here is an example of a good changelog entry for a change in Sitemaps:\n' +
		'  Sitemaps: ensure that the Home URL is slashed on subdirectory websites.';

	const userContent = inputData.trim() || process.argv[ 2 ] || 'Say this is a test';

	const completion = await openai.chat.completions.create( {
		messages: [
			{
				role: 'system',
				content: systemPrompt,
			},
			{
				role: 'user',
				content: userContent,
			},
		],
		model: 'gpt-4',
	} );

	console.log( completion.choices );
} );
