# SuggestionsEventSource

The `SuggestionsEventSource` is a class that wraps around `EventTarget`. It's specifically designed to handle a stream of suggestions retrieved from an AI model. When instantiated, it initializes a connection to an EventSource and listens for incoming data chunks. These chunks are concatenated into a full message which is processed and emitted through events.

### Dependencies

- `EventSourceMessage, fetchEventSource` from `@microsoft/fetch-event-source`
- `debugFactory` from `debug`

### Events

- `'suggestion'`: Emitted when the full suggestion has been received so far
- `'message'`: Emitted when a message has been received
- `'chunk'`: Emitted for each chunk of data received
- `'done'`: Emitted when the stream has been closed and no more data will be received

#### Error events
- `'error'`: Emitted when an error has occurred
- `'error_network'`: Emitted when the EventSource connection to the server returned some error
- `'error_service_unavailable'`: Emitted when the server returned a 503 error
- `'error_quota_exceeded'`: Emitted when the server returned a 429 error
- `'error_moderation'`: Emitted when the server returned a 422 error
- `'error_unclear_prompt'`: Emitted when the server returned a message starting with JETPACK_AI_ERROR

### Class Properties

- `fullMessage`: String that accumulates the incoming chunks of data into a complete message
- `isPromptClear`: Boolean that represents whether the prompt is clear or not
- `controller`: AbortController instance used to close the fetchEventSource connection

### Constructor

The constructor takes an object with the following properties:

- `url` (optional): URL of the EventSource. If not provided, the default will be used.
- `question`: The prompt/question to the AI model. It can be a string or an array of `PromptItemProps` objects.
- `token`: The token to authenticate the request.
- `options` (optional): An object that may include the following properties:
    - `postId` (optional): The post ID.
    - `feature` (optional): A string that specifies the AI model to use (default or 'ai-assistant-experimental').
    - `fromCache` (optional): A boolean to indicate whether to fetch the response from cache.
    - `model` (optional): Allows to use a specific AI model.

### Usage

To use this class, you would instantiate it with the necessary data, and then you can listen to its events to get and handle the suggestions. 

Here is a basic usage example:

```es6
const eventSource = new SuggestionsEventSource( {
  question: "Who won the world cup in 2022?",
  token: "your_token_here",
} );

eventSource.addEventListener( 'suggestion', event => {
  console.log( event.detail ); // Logs the suggestion
} );
```

It's possible to simulate a "conversation" when requesting a suggestion by providing an array of `PromptItemProps`. Each `PromptItemProps` is an object with a `role` (either 'system', 'user', or 'assistant') and `content`:

```es6
const eventSource = new SuggestionsEventSource( {
  question: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Who won the world cup in 2022?' },
  ],
  token: "your_token_here",
} );

eventSource.addEventListener( 'suggestion', event => {
  console.log( event.detail ); // Logs the suggestion
} );
```

In this example, we've passed an array of prompts to the `question` parameter. The 'system' role typically represents the context or environment in which the 'user' and 'assistant' are interacting.
The 'user' and 'assistant' roles denote the roles of user and assistant in a conversation, respectively.
The prompts are processed in the order they appear in the array, simulating a conversation that culminates with the final question: "Who won the world cup in 2022?".