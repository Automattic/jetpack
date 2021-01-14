Media Source State Tree
=======================

This subtree takes over registering media sources globally in the editor app context. Initially created with the purpose to put all components together of the anchor.fm integration provides a communication channel allowing controlling, for instance, the audio state from `play` to `stop`, and vice versa.

## Subtree Identifier

The identification name of the subtree is `jetpack/media-source`.

## 🌲 State tree structure

```json
"players": {
	"<id>": {
		"id": "<id>",
		"status": "<status>",
		"position": "<position>"
	}
}
```

## Actions

### registerMediaSource( <id> [, <mediaStatus> ] )

Register a new media source into the `jetpack/media-source` state tree.

```es6
import { dispatch } from '@wordpress/data';

dispatch( 'jetpack/media-source' ).registerMediaSource( 'myMediaSource' );
```

Setting initial media status

```es6
import { dispatch } from '@wordpress/data';

dispatch( 'jetpack/media-source' ).registerMediaSource( 'myMediaSource', {
	status: 'is-playing',
	position: 100, // 1 minute, 50 seconds.
} );
```

### unregisterMediaSource( <id> )

Removes the media source from the subtree, acording to the given id.

```es6
import { dispatch } from '@wordpress/data';

dispatch( 'jetpack/media-source' ).unregisterMediaSource( 'myMediaSource' );
```