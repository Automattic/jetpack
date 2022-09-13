# useVideoHook()

Perform a request to the media endpoint to pull video data according to the given `guid`.

```jsx
function myVideoComponent( { guid } ) {
	const [ videoItem, isRequestingVideoItem ] = useVideoItem( guid );

	if ( isRequestingVideoItem ) {
		return null;
	}

	return <p>Video title: { videoItem.title }</p>;
}
```