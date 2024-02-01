# useVideoData()

React custom hook that requests the media endpoint,
tweaking it's response to be adequately delivered to be consumed by the component.

```jsx
function myVideoComponent( { id, guid } ) {
	const [ videoData, isRequestingVideoData ] = useVideoData( { guid } );

	if ( isRequestingVideoData ) {
		return null;
	}

	return <p>Video title: { videoData.title }</p>;
}
```

## Requesting private data

It's possible to access private resources (videos) is private by adding a `playback` token to the endpoint URL.

Sometimes it isn't possible to know ahead of time whether it's private or not. The `maybeIsPrivate` field is a hint of it, but there is no guarantee that the resource privacy wasn't changed via an external agent, for instance, by changing the default privacy for all videos for the site.

When the request fails because of authorization issues, it will try a new attempt, but this time request first a playback token to add it to the resource-endpoint URL.

Thus, even though the resource would be private, the token should guarantee access to the data.

There is a maximum number of attempts.
