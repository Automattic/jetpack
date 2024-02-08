# useAiSuggestions

This is a custom React hook that obtains suggestions from an AI by hitting a specific query endpoint.

## Usage

```jsx
import { useAiSuggestions } from '@automattic/jetpack-ai-client';

// Inside your component...

const { suggestion, ...other } = useAiSuggestions( { options } );
```

## API

### `useAiSuggestions( { options } )`

Invokes the custom hook with the provided options.

#### Options

- `prompt: PromptItemProps[]` (optional): An array of request prompts.
- `autoRequest: boolean` (optional, defaults to `false`): Determines whether to request suggestions automatically.
- `askQuestionOptions: AskQuestionOptionsArgProps` (optional): [Options for the askQuestion](../../ask-question/Readme.md#ask-question-parameters) function.
- `onSuggestion: ( suggestion: string ) => void` (optional): A callback function that gets triggered when a suggestion is received.
- `onDone: ( content: string ) => void` (optional): A callback function that gets triggered when the process is complete.
- `onError: ( error: RequestingErrorProps ) => void` (optional): A callback function that gets triggered when an error occurs.

#### Returns

An object with the following properties:

- `suggestion: string`: The obtained suggestion.
- `error: RequestingErrorProps | undefined`: An error object if an error occurs.
- `requestingState: RequestingStateProp`: The state of the request.
- `eventSource: SuggestionsEventSource | undefined`: The event source of the request.
- `request: ( prompt: Array< PromptItemProps >, options: AskQuestionOptionsArgProps ) => Promise< void >`: The request handler.
- `reset`: `() => void`: Reset the request state.

### `PromptItemProps`

An object containing the following properties:

- `role: 'system' | 'user' | 'assistant'`: The role of the item in the prompt.
- `content: string`: The content of the prompt.

### `RequestingErrorProps`

An object containing the following properties:

- `code: SuggestionErrorCode`: A string code to refer to the error.
- `message: string`: The user-friendly error message.
- `severity: 'info' | 'error'`: The severity of the error.

## Examples

### Rendering `suggestion` or `error`, based on `requestingState`.

In this example, the state of the request and any returned `suggestion` or `error` are displayed in the rendered output based on the `requestingState`. It sets `autoRequest` to true to trigger the request automatically.

```jsx
import { useAiSuggestions } from '@automattic/jetpack-ai-client';

function ExampleComponent() {
	const { suggestion, error, requestingState } = useAiSuggestions( {
		prompt: [ { role: 'user', content: 'Hello AI!' } ],
		autoRequest: true,
	} );

	return (
		<div>
			{ requestingState === 'requesting' && <p>Requesting...</p> }
			{ requestingState === 'error' && <p>Error: { error?.message }</p> }
			{ requestingState === 'done' && <p>Suggestion: { suggestion }</p> }
		</div>
	);
}
```
### Listening events by using callback functions

The following example invokes `useAiSuggestions` with a single prompt and two callback functions for when a suggestion is received or when an error occurs.

```jsx
import { useAiSuggestions } from '@automattic/jetpack-ai-client';

function ExampleComponent() {
	useAiSuggestions( {
		autoRequest: true,
		prompt: [ { role: 'user', content: 'Hello AI!' } ],
		onSuggestion: suggestion => console.log( 'Suggestion: ', suggestion ),
		onError: error => console.log( 'Error: ', error ),
	} );

	// Your component logic...
}
```

### Handle requests programmatically

In example below the request is manually triggered by a button click (`autoRequest` is false by default).
The handleClick function calls the `request` function, which in turn invokes the AI with a new prompt.

```jsx
import { useAiSuggestions } from '@automattic/jetpack-ai-client';

function ExampleComponent() {
	const { request } = useAiSuggestions( {
		prompt: [ { role: 'user', content: 'Hello AI!' } ],
		onSuggestion: suggestion => console.log( 'Suggestion: ', suggestion ),
		onError: error => console.log( 'Error: ', error ),
	} );

	// Trigger the request manually.
	const handleClick = async () => {
		await request( [ { role: 'user', content: 'What is the weather like?' } ] );
	}

	// Your component logic...

	return (
		<div>
			{ /* Your component UI... */ }
			<button onClick={ handleClick }>Get AI Suggestions</button>
		</div>
	);
}
```