# useVideoPlayer()

React custom hook to listen and control the video player through events provided by the client.

```jsx
function myVideoComponent( { id, guid } ) {
	const { playerIsReady } = useVideoPlayer( iframeRef, isRequestingPreview );

	if ( isRequestingVideoData ) {
		return null;
	}

	return <p>Video title: { videoData.title }</p>;
}
```
