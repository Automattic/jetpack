/**
 * Internal dependencies
 */
import { PROMPT_SUFFIX } from '../create-prompt';

export default function tellWhatToDoNext( userRequest: string, content: string ): string {
	// Create the prompt.
	const prompt = `You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic.

Your job is to modify the content shared below, under "Content block", based on the request, also shared below under "Request block"

Content:
${ content }

Request:
${ userRequest }

${ PROMPT_SUFFIX }`;

	return prompt;
}
