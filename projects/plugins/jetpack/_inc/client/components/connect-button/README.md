Module Toggle
=========

This component is used to implement module activatiion toggle switches

#### How to use:

```js
var ModuleToggle = require( 'components/module-toggle' );

render: function() {
	return (
		<div className="you-rock">
		  <ModuleToggle
			activated={ this.props.checked }
			toggling={ this.props.toggling }
			disabled={ this.props.disabled }
			toggleModule={ this.props.toggleModule }
			id={ 'you-rock-uniquely' }
		  />
		</div>
	);
}
```

#### Props

* `activated`: (bool) the current activation status of the module.
* `toggling`: (bool) whether the toggle is in the middle of being activated.
* `disabled`: (bool) whether the toggle should be in the disabled state.
* `toggleModule`: (callback) what should be executed once the user clicks the toggle.
* `id`: (string) the id of the checkbox and the for attribute of the label, should be unique.