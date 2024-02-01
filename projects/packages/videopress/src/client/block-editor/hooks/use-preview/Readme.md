# usePreview()

React custom hook to fetch the video preview data.
Returns a `VideoPreview` object and the boolean `isRequestingEmbedPreview`


```jsx

function VideoComponent( { videoPressUrl } ) {
  const [ preview, isRequestingEmbedPreview ] = usePreview( videoPressUrl );

  if ( isRequestingEmbedPreview ) {
    return null;
  }

  return (
    <Sandbox html={preview.html} />
  )
}
```