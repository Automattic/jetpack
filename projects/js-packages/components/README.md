Components Package
=========

The package includes a set of individual components shared between RNA packages.

## HOC `withErrorMessage`

This higher-order component allows consumers add error messages to any suitable UI component,
such as a button, text input, or anything else.

### Properties
- *errorMessage* - string, the error message, default value: `An error occurred. Please try again.`
- *displayError* - boolean, whether to display the error

All other properties will be passed directly to the wrapped component.

### Usage
```jsx
import React from 'react';
import { __experimentalInputControl as InputControl } from '@wordpress/components';
import withErrorMessage from '@automattic/jetpack-components';

const InputWithErrorMessage = withErrorMessage( InputControl );

<InputWithErrorMessage
	label="Sample input"
	displayError={ true }
	errorMessage="Incorrect value"
/>;
```
