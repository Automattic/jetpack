/**
 * Internal dependencies
 */
import { PROMPT_SUFFIX } from '../create-prompt';

export default function tellWhatToDoNext( userRequest: string, content: string ): string {
	// Start the prompt with the user's request.
	let prompt = `You are an AI assistant. A user comes to you with the following request: '${ userRequest }'\n\n`;

	// Next, add the content to be changed.
	prompt += `The current content is as follows:\n\n'${ content }'\n\n`;

	// Finally, ask the AI to perform the task.
	prompt += "Based on the user's request, how would you alter this content?";

	// Add general sufix.
	prompt += PROMPT_SUFFIX;

	return prompt;
}
