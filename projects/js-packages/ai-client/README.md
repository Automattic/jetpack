# Jetpack AI Client

 JavaScript client for consuming Jetpack AI services. This client provides functionalities to fetch images and request completions from the Jetpack AI API as well as managing authentication tokens for the Jetpack AI streaming completion API.

## Installation

To install the Jetpack AI Client, clone the repository to your local machine and install the dependencies with npm:

```
npm install @automattic/jetpack-ai-client
```

## Libraries & Components

### Requesting

#### [askQuestion](./src/ask-question/Readme.md) helper
Async function that sends a question and optional configurations, retrieves a JWT token, and returns a [SuggestionsEventSource](./src/suggestions-event-source/Readme.md) instance.

#### [SuggestionsEventSouce](./src/suggestions-event-source/Readme.md) Class

Class that connects to an AI model to receive and emit suggestion streams, using EventTarget for handling data chunks.

#### [useAiSuggestions](./src/hooks/use-ai-suggestions/Readme.md) hook

A custom React hook that obtains suggestions from an AI by hitting a specific query endpoint.

#### [JWT](./src/jwt/Readme.md) helper

Library to manage JWT tokens for Jetpack AI across various site types, handling acquisition, caching in localStorage, expiration, and customization of request options.

#### [Data Flow](./src/data-flow/Readme.md) implementation

Data Flow offers a streamlined way to manage an AI Assistant's state and functionality within a React app, using React context, HOCs, and custom hooks to handle suggestions, errors, and requests.

### [Components](./src/components/)

#### [AIControl](./src/components/ai-control/Readme.md)

#### [AiStatusIndicator](./src/components/ai-status-indicator/)

### [Icons](./src/icons/Readme.md)
## Contribute

React components useful for when you need to create some UI implementations.

We welcome contributions from the community. Please submit your pull requests on the GitHub repository.

## Get Help

If you encounter any issues or have any questions, please open an issue on the GitHub repository.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack AI Client is licensed under the GNU General Public License v2 (or later).
