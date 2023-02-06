Media Source Store
==================

This store registers a media-sources tree globally in the editor app context, providing a communication channel that allows controlling the media registered. A simple usage case is controlling the play state of a media through an external component.

## Store Name

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