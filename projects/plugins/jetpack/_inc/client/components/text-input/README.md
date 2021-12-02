TextInput
=========

This component is used to implement some good ol' text inputs.

#### How to use:

```js
var TextInput = require( 'components/checkbox' );

render: function() {
	return (
		<TextInput disabled={ this.props.disabled } />
	);
}
```

#### Props

* `disabled`: (bool) whether the input should be in the disabled state.
* `is-error`: (bool) changes visual state to reflect an error.
* `is-valid`: (bool) changes visual state to reflect something being valid.
