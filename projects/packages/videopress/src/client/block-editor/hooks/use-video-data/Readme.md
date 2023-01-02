# useVideoHook()

React custom hook that requests the media endpoint,
tweaking its response to be adequately delivered to be consumed by the component.

```jsx
function myVideoComponent( { id, guid } ) {
	const [ videoData, isRequestingVideoData ] = useVideoData( { guid } );

	if ( isRequestingVideoData ) {
		return null;
	}

	return <p>Video title: { videoData.title }</p>;
}
```