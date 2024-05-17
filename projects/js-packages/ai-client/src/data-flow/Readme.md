
# AI Assistant Data Flow

Data Flow is a seamless and robust implementation designed to manage the state and functionality of an AI Assistant within a React application. By leveraging a React context, Higher Order Components (HOCs), and custom hooks, this implementation streamlines the interaction with the AI, handles suggestions, manages error states, and efficiently controls request functionality.

```jsx
import { withAiAssistantData, useAiContext } from '@automattic/jetpack-ai-client';

const MyComponent = () => {
  const { suggestion, requestingState, requestSuggestion } = useAiContext( {
    onDone: content => console.log( `Content is done: ${ content }.` );
  } );

  return (
    <>
      <div>{ suggestions }</div>
      <button
        onClick={ () => requestSuggestion( 'How to make a cake' ) }
        disabled={ requestingState === 'suggesting' }
      >
        Request
      </button>
    <>
  )
};

// Ensure to provide the data context to `MyComponent`.
export default withAiAssistantData( MyComponent );

```

## In-depth Analysis

* [AI Data Context](#ai-assistant-content)
* [withAiDataProvider HOC](#with-ai-data-provider)
* [useAiContext Hook](#use-ai-context)

<h2 id="ai-assistant-content">Ai Data Context</h2>

The Ai Data Context is a React context implementation for managing the state and functionality of an AI Assistant. It manages the suggestion values, error states, and request functionality.


### Usage

Import the Ai Data Context and Provider into your component:

```javascript
import { AiDataContext, AiDataContextProvider } from '@automattic/jetpack-ai-client';
```

Use the Provider in your component's render method to wrap the children components:

```es6
<AiDataContextProvider value={ value }>
  { children }
</AiDataContextProvider>
```

You can access the context values in your child components using the `useContext` hook:

```javascript
const aiContext = React.useContext( AiDataContext );
```

### Context Values

The Ai Data Context has the following values:

#### `suggestion`
The suggestion value from the AI.

#### `requestingError`
The error object returned from the AI suggestion request. It contains the following properties:
- `code`: A code referring to the type of error. The possible error codes are `ERROR_SERVICE_UNAVAILABLE`, `ERROR_QUOTA_EXCEEDED`, `ERROR_MODERATION`, `ERROR_NETWORK`, `ERROR_UNCLEAR_PROMPT`.
- `message`: A user-friendly error message.
- `severity`: The severity of the error. It can either be 'info' or 'error'.

#### `requestingState`
The current state of the suggestion request. It can be one of the following:
- `init`: The initial state before a request is made.
- `requesting`: The state when a request is being made.
- `suggesting`: The state when the AI is generating a suggestion.
- `done`: The state when a suggestion has been received.
- `error`: The state when an error has occurred during the request.

#### `requestSuggestion`
A function to request a suggestion from the AI. The function takes a prompt parameter which can be an object of `PromptMessagesProp` or a string.

<h2 id="with-ai-data-provider">withAiDataProvider HOC</h2>

Higher Order Component (HOC) that wraps a given component and provides it with the AI Assistant Data context. This HOC is instrumental in the data flow of the AI Assistant functionality and helps manage the interaction with the AI Assistant's communication layer.

<h2 id="use-ai-context">useAiContext Hook</h2>

The `useAiContext` hook provides a convenient way to access the 
Ai Data Context and subscribe to the `done` and `suggestion` events emitted by SuggestionsEventSource.

```es6
const { suggestion } = useAiContext( {
  onDone: content => console.log( content ),
  onSuggestion: suggestion => console.log( suggestion ),
} );

```

_Before using the hook, ensure the data is provided by the [Ai Data Context](#ai-assistant-content). [withAiDataProvider HOC](#with-ai-data-provider) is usually the best option_

Optional options object:

- `onDone`: A callback function to be called when a request completes. The callback receives the request result as a parameter.
- `onSuggestion`: A callback function to be called when a new suggestion is received. The callback receives the suggestion as a parameter.

These callbacks will be invoked with the detail of the corresponding event emitted by SuggestionsEventSource.

When called, the hook returns the Ai Data Context.


### Parameters

The function accepts an optional options object:

#### `options.blocks`
- Type: `string[]`
- Default: `['']`

An array of block names (e.g., `[ 'core/paragraph', 'core/image' ]`) to which the data provider should be applied. Only the blocks specified in this array can access the AI Assistant Data context.

### Returned Wrapped Component

When a block type matches one of the specified names in `options.blocks`, the returned component will be wrapped with the AI Assistant Data context, providing all the available data and functionalities. The original component will be returned without any modifications for other block types.

_Before using this function, ensure the AI Assistant Data is available in the higher component hierarchy. The [Ai Data Context](#ai-assistant-content) should typically wrap the top-level component or application._