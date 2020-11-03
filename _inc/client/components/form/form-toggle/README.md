Toggle
=========

This component is used to implement toggle switches

#### How to use:

```js
var FormToggle = require( 'components/forms/form-toggle' );

render: function() {
	return (
		<div className="you-rock">
		  <FormToggle
			checked={ this.props.checked }
			toggling={ this.props.toggling }
			disabled={ this.props.disabled }
			onChange={ this.props.onChange }
		  />
		</div>
	);
}
```

#### Props

* `checked`: (bool) the current status of the toggle.
* `toggling`: (bool) whether the toggle is in the middle of being performed.
* `disabled`: (bool) whether the toggle should be in the disabled state.
* `onChange`: (callback) what should be executed once the user clicks the toggle.
