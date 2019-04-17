TextArea
=========

This component is used to implement some long-winded textareas.

#### How to use:

```js
var Textarea = require( 'components/checkbox' );

render: function() {
	return (
		<Textarea disabled={ this.props.disabled } />
	);
}
```

#### Props

* `disabled`: (bool) whether the input should be in the disabled state.
