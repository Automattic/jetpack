# Jetpack AI Client

 JavaScript client for consuming Jetpack AI services. This client provides functionalities to fetch images and request completions from the Jetpack AI API as well as managing authentication tokens for the Jetpack AI streaming completion API.

## Installation

To install the Jetpack AI Client, clone the repository to your local machine and install the dependencies with npm:

```
npm install @automattic/jetpack-ai-client
```

## Usage

### Example

```
import { requestCompletion } from '@automattic/jetpack-ai-client';

const MyComp = ( props ) => {
  const [ completion, setCompletion ] = useState( '' );

  const newHaiku = async () => {
    const eventSource = await requestCompletion( 'Write a haiku about WordPress' );
      eventSource.addEventListener( 'suggestion',  answer => setCompletion( answer.detail ) );
      eventSource.addEventListener( 'done', event => {
        console.log( "Full completion", event.detail );
      } );

      eventSource.addEventListener( 'suggestion', event => {
        console.log( "Received so far", event.detail );
      } );

      eventSource.addEventListener( 'error_quota_exceeded', event => {
        console.log( "You reached the AI query quota for your current plan.", event.detail );
      } );
  };

  return (
    <div>
      <div> { completion } </div>
      <button onClick={ newHaiku }>Get new Haiku</button>
    </div>
  )
};
```

### Requesting a Completion from the Jetpack AI API

You can request a completion from the Jetpack AI API using the `requestCompletion` function. This function takes a prompt and optionally a post ID as parameters and returns an instance of `SuggestionsEventSource`.

```
import { requestCompletion } from '@automattic/jetpack-ai-client';

// postId is the post where the request is being triggered
// It's only used for loggin purposes and can be omitted.
const postId = 123;
const eventSource = requestCompletion( 'A haiku', postId ))

eventSource.addEventListener('done', event => {
  console.log( "Full completion", event.detail );
} );

eventSource.addEventListener('suggestion', event => {
  console.log( "Received so far", event.detail );
} );
```

### Requesting Images from the Jetpack AI API

You can fetch images from Jetpack AI using the `requestImages` function. This function takes a prompt and a post ID as parameters and returns a promise that resolves to an array of base64 encoded images.

```
import { requestImages } from '@automattic/jetpack-ai-client';

requestImages( 'a flower', postId )
  .then( images => {
    document.getElementById("imgid").src= image[0]
  } )
  .catch( error => {
    // Handle the error
  } );
```

### Using the SuggestionsEventSource Class

The `SuggestionsEventSource` class is a wrapper around `EventSource` that emits events for each chunk of data received, when the stream is closed, and when a full suggestion has been received.

You shouldn't need to instantiate this class. You get one of these by calling `requestCompletion()`.

```
import { requestCompletion } from '@automattic/jetpack-ai-client';

const eventSource = new SuggestionsEventSource( url );

eventSource.addEventListener( 'done', event => {
  console.log( "Full completion", event.detail );
} );

eventSource.addEventListener( 'suggestion', event => {
  console.log( "Received so far", event.detail );
} );
```

### Requesting a Token from the Jetpack Site

You can request a token from the Jetpack site using the `requestCompletionAuthToken` function. This function returns a promise that resolves to an object containing the token and the blogId.

This function behaves properly whether it's called from a Jetpack environment or a WordPress.com one.

```
import { requestCompletionAuthToken } from '@automattic/jetpack-ai-client';

requestCompletionAuthToken()
  .then(tokenData => {
    // Do something with the token data
  })
  .catch(error => {
    // Handle the error
  });
```

## Contribute

We welcome contributions from the community. Please submit your pull requests on the GitHub repository.

## Get Help

If you encounter any issues or have any questions, please open an issue on the GitHub repository.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack AI Client is licensed under the GNU General Public License v2 (or later).
