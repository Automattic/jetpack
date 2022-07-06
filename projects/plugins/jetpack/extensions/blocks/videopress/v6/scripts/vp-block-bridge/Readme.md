# VideoPress Block bridge

This library escentially provides a way to connect events and methods defined by the videopress player from/to the VideoPress block.

## Background

### How the player is rendered

From the PoV of the edit component of the VPBlock, the first step to implement the player is getting the raw HTML code provided by the VideoPress serve via the `getEmbedPreview()` embed core-data selector.
It's HTML code that basically defines an Iframe with relevant data about the video to show.

```jsx
const preview = useSelect(
	select => select( coreStore ).getEmbedPreview( videoPressUrl ),
	[ videoPressUrl ]
);
```

Once the code gets, it's rendered creating a Sandbox instance where the code to proccess is defined via the HTML property:

```jsx
<Sandbox html={ videoPlayerHtml } />
```

### Connect the block with the player

The VideoPress API triggers events to its `window` and also to its `window parent` when they are different to communicate the video with the consumer, in our case, the VideoPress block.
However, it doesn't connect with the `top` object reference meaning that if the player is nested via iFrames in more than two levels, it won't be possible to get connected with the player form the higher level.

Funnily, it happens in the block edit component scenario: Render the raw HTML (which is an iFrame) via the Sandbox (which uses an iFrame too), producing the following elements structure:

```html
<div class="wp-block wp-block-jetpack-videopress">
	<iframe class="components-sandbox">
		#document
			// ...
			<iframe src"<videopress-embed-url>">
				#document
					//...
					<video src="<video-source>" />
			</iframe>
	</iframe>
</div>
```

### Solution

This is the goal of the wp-block-bridge. It's a javascript code that listen and re-post the events triggered by the videopress API to its parent (top) object, acting as a bridge.

This code is sent to the child iFrame though of the scripts property of the Sandbox component.

```jsx
import { SandBox } from '@wordpress/components';
import vpBlockBridge from './scripts/vp-block-bridge';

<Sandbox html={ videoPlayerHtml } scritps=[ vpBlockBridge ] />
```

## Bridge API

```jsx
import vpBlockBridge from './scripts/vp-block-bridge';

function VPBlockEdit() {
	useEffect( () => {
		window.addEventListener( 'onVideoPressPlaying', event => {
			console.log( 'video is playing...' );
		} );
	}, [] );

	return (
		<Sandbox html={ embedHtml } scritps={ [ vpBlockBridge ] } />
	);
}
```

### Events

The bridge triggers the following custom events:

#### onVideoPressProgress

#### onVideoPressLoadingState

#### onVideoPressPlaying

#### onVideoPressPause

#### onVideoPressPeeking

#### onVideoPressResize

#### onVideoPressVolumechange

#### onVideoPressEnded
