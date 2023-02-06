ModuleToggle
=========

This component is used to in module cards presenting a toggle for activating/deactivating a toggle.

#### How to use:

```js
var ModuleToggle = require( 'components/module-toggle' );

render: function() {
	return (
		<div className="you-rock">
		  <ModuleToggle
			activated={ this.props.activated }
			toggleModule={ () => console.log( 'toggled' ) }
		  />
		</div>
	);
}
```

#### Props

* `activated`: (bool) - Defines wether the toggle is in the on or the off position
* `toggleModule`: (function) - A callback to be called when the toggle changes it state (`onChage`)
* `disabled`: (bool) - If true, the toggle is not actionable.
* `toggling`: (bool) - If true, the toggle is rendered in a transition state style.
* `className`: (string) - A CSS class to append
* `overrideCondition`: (string) - By default, the toggle will be disabled if the module is overriden. When this prop is `active`, the toggle will only be disabled when the module is forced on and when this prop is `inactive` the toggle will be disabled when the module is forced off.