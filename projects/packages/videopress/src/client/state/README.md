# State

VideoPress store implementation

## Selectors

### getVideos( query )

```jsx
export default function VideoList() {
	import { useSelect } from '@wordpress/data';

	const videos = useSelect( select => select( 'videopress/media' ).getVideos( {
		itemsPerPage: 10,
		orderBy: 'date',
		order: 'DESC',
	} ), [] );

	return (
		// ...
	);
}
```

`query` is an object that accepts the following fields:

* **orderBy**

The field name to use to sort the search.

type: `srting`
default: `date`

* **order**

The criteria that will be used to sort the search.

type: `string`
default: `DESC`
values: `ASC` | `DESC`

* **page**

Page number of the search result.

type: number
default: 1

* **itemsPerPage**

The number of items to show per page.

type: `number`
default: 6

* **type**

Post mime type to use to filter the items.

type: `string`
default: `video/videopress`


## Actions

### setIsFetchingVideos( isFetching, query )

### setFetchVideosError()

### setVideos( videos )