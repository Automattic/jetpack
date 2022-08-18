# VideoPress Block bridge

This library essentially provides a way to connect events and methods defined by the Video Press player API from/to the VideoPress block.

## Background

### How the player is rendered

From the PoV of the edit component of the VPBlock, the first step to implement the player is getting the raw HTML code provided by the VideoPress server via the `getEmbedPreview()` embed core-data selector.
It's HTML code that basically defines an iFrame element with relevant attributes about the video.

```jsx
const preview = useSelect(
	select => select( coreStore ).getEmbedPreview( videoPressUrl ),
	[ videoPressUrl ]
);

const { html } = preview;
```

Once the code gets, it's rendered via creating a Sandbox instance where the code to process is defined via the `html` property mentioned above:

```jsx
<Sandbox html={ html } />
```

The most relevant thing to raise up here is the fact the video player is rendered into two nested iFrames levels. The <Sandbox /> component does one, and the other is provided by the VideoPress player API.

### Connect the block with the player

The VideoPress player API triggers events to its `window` object and its `window parent` object when they are different to communicate the video with the consumer, in our case, the VideoPress block.

However, it doesn't connect with the `top` object reference meaning that if the player is nested via iFrames in more than two levels, it won't be possible to connect with the player from the higher level.

Funnily, it happens in the our scenario of the block editor: It renders the raw HTML provided by VideoPress (which is an iFrame) via the Sandbox (which uses an iFrame too), producing the structure of the following elements:

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

### The Bridge

This bridge script listens and re-emits the events, communicating the VideoPress player with the VideoPress Block. It's sent to the child iFrame through the `scripts` property of the Sandbox component, which takes over to run it in that context.

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

#### onVideoPressPlaying

#### onVideoPressPause

#### onVideoPressSeeking

#### onVideoPressResize

#### onVideoPressVolumeChange

#### onVideoPressEnded

#### onVideoPressTimeUpdate

#### onVideoPressDurationChange

#### onVideoPressProgress

#### onVideoPressLoadingState

### Actions

#### vpBlockActionPlay

#### vpBlockActionPause

#### vpBlockActionPause

### Actions

```es6
// Pause the video after ten seconds.
setTimeout( () => {
	iFrameDom?.contentWindow?.postMessage( {
		event: 'vpBlockActionPause',
	} );
}, 10000 );
```

#### vpBlockActionPlay

#### vpBlockActionPause

#### vpBlockActionSetCurrentTim

## Debug

To debug the bridge actions you'd like to create a debug instance stored in the `debugBridgeInstance` window property:

```es6
import debugFactory from 'debug';

window.debugBridgeInstance = debugFactory( 'jetpack:vp-block:bridge' );
```