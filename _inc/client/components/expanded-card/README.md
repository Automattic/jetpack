Expanded card
==============

This component is used to display a header with a summary followed by a card and its contents.

#### How to use:

```js
var ExpandedCard = require( 'components/expanded-card' );

render: function() {
	return (
		<div>
			 <ExpandedCard
				header={ 'title' }
				summary={ 'summary' }
			 >
			 	{ content }
			 </ExpandedCard>
		</div>
	);
}
```

#### Props

* `header`: a string, HTML or component to show in the default header view of the box

#### Children
* `content`: a string, HTML or component to show in the expandable section of the box

##### Optional props
* `summary`: string or component to show under the header
