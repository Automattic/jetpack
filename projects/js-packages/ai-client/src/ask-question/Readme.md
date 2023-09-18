# askQuestion

`askQuestion` is an asynchronous function that takes a question and optional configurations, sends a request to obtain a JWT token, and returns an instance of `SuggestionsEventSource`.

## Syntax

```typescript
function askQuestion(
	question: string | PromptItemProps[],
	{ postId = null, fromCache = false, feature }: AskQuestionOptionsArgProps = {}
): Promise< SuggestionsEventSource >
```

<h2 id="ask-question-parameters">Parameters</h2>

- `question` (**string** | **PromptItemProps[]**):
    - The question to ask. 
    - Can be a simple string or an array of `PromptItemProps` objects.

- `options` (**AskQuestionOptionsArgProps**):
    - An optional object for additional configuration.
    - **postId** (**number**, optional): ID of the post where the question is asked.
    - **fromCache** (**boolean**, optional): If set to true, the answer will be fetched from the cache. Default value is false.
    - **feature** (**string**, optional): Allows to use a specific AI assistant feature.
    - **model**( **AiModelTypeProp** optional): Allows to use a specific AI model.

## Returns

- A `Promise` that resolves to an instance of the `SuggestionsEventSource` class, containing the token, question, and options.

## Example

```typescript
const question = "What is the meaning of life?";
const options = {
    postId: 1,
    fromCache: true,
    feature: 'ai-assistant-experimental'
}
askQuestion( question, options ).then( suggestionsEventSource => {
    // handle suggestionsEventSource
} );
```