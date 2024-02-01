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

### useVideoPlayer

_Parameters_

( iframeRef, isRequestingPreview, options )

-   _iframeRef_ `upload` | `playback` | `upload-jwt`: Token scope.
-   _isRequestingPreview_ `boolean`: True if the app is requesting the player preview
-   _options_ `object`:
-   _options.autoplay `?boolean`: It will be controlled when the previewOnHover is enabled.
-   _options.initialTimePosition_ `?number`: The time to initially set the player to.
-   _options.wrapperElement_ `?HTMLDivElement`: DOM player wrapper element.
-   _options.PreviewOnHover_ `?object`
-   _options.PreviewOnHover.atTime_ The timestamp to playback the video when hovering over it
-   _options.PreviewOnHover.durantion_ PreviewOnHover time duration

