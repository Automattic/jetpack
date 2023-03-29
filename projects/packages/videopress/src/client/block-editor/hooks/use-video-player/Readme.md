# useVideoPlayer()

React custom hook to listen and control the video player through events provided by the client.

```jsx
function myVideoComponent( { id, guid } ) {
	const iframeRef = useRef();
	const { playerIsReady } = useVideoPlayer( iframeRef, isRequestingPreview );

	return (
		<div ref={ iframeRef }>
			<SandBox />
		</div>
	);
}
```

## API

### useVideoPlayer( iframeRef, isRequestingPreview, options )

