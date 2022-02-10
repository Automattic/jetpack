## useAutosaveAndRedirect hook

Use this hook to implement autosave and redirect functionality that works in both the block and site editor.

### Usage

```es6
/**
 * Internal dependencies
 */
import useAutosaveAndRedirect from '../../shared/use-autosave-and-redirect/index';

const myComponent = ( myUrl ) => {
    const [ autosave, autosaveAndRedirect, isRedirecting ] = useAutosaveAndRedirect( myUrl );
	return (
		<Button href={ myUrl } onClick={ autosaveAndRedirect } isBusy={ isRedirecting }>
			Checkout
        </Button>
	);
};
```

### API

`const { autosave, autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( redirectUrl, onRedirect );`

#### Arguments

The hook accepts two arguments.

- `redirectUrl` (`string`) - URL to redirect to after saving.
- _(optional)_ `onRedirect` (`(string) => void`) - callback function that will
  be run when the redirect process triggers. The URL is passed.

### Return Values

The hook returns an array with three items.


- `autosave` (`(event) => void`): Callback to be used in an onClick event.

Checks whether the current post/page/etc has changes to save and saves them. If
in the site editor, entities are saved. This callback can be used when a redirect
is not required (for example if an action is performed in a modal).

- `autosaveAndRedirect` (`(event) => void`): Callback to be used in an onClick event.

Redirects the user to the redirectURL, checking before whether the current
post/page/etc has changes to save. If so, it saves them before redirecting. If
in the site editor, entities are saved.

- `isRedirecting` (`bool`): If the component is in the process of redirecting the
  user. It may be waiting for a save to complete before redirecting. Use
  this to set a button as busy or in a loading state.
