Connect Button
=========

This component is used to Connect/Disconnect the site or a user to WordPress.com

#### How to use:

```js
var Connectbutton = require( 'components/connect-button' );

render: function() {
	return (
		<div className="you-rock">
		  <Connectbutton
			connectingUser={ this.props.checked }
		  />
		</div>
	);
}
```

#### Props

* `connectingUser`: (bool) If this is for linking/connecting the USER, rather than the site.  Will show different text and unlinking actions.
