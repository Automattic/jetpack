# useVideoHook()

Perform a request to the media endpoint.
Pull and tweak the response to be adequately delivered to the component.

```jsx
function myVideoComponent( { id, guid } ) {
	const [ videoData, isRequestingVideoItem ] = useVideoData( { guid } );

	if ( isRequestingVideoItem ) {
		return null;
	}

	return <p>Video title: { videoData.title }</p>;
}
```