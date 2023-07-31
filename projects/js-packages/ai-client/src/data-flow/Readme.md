
# AI Assistant Data Flow

## In-depth Analysis

* [AI Assistant Context](#ai-assistant-content)
* [withAiDataProvider HOC](#with-ai-data-provider)

<h2 id="ai-assistant-content">AI Assistant Context</h2>

The AI Assistant Context is a React context implementation for managing the state and functionality of an AI Assistant. It manages the suggestion values, error states, and request functionality for the AI Assistant.


### Usage

Import the AI Assistant Context and Provider into your component:

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

The AI Assistant Context has the following values:

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
