# useVideoPosterData

React custom hook to handle video poster generation based on block attributes changes and post save events. It will request an update for the poster image when needed and refresh the video player to display the new poster image.

`posterError` contains a translated message when the update or completion polling fails. `retryPosterGeneration()` retries the currently selected frame and clears the error when the new attempt starts. `isGeneratingPoster` resets after both success and failure.

## Usage

```jsx
import { useVideoPosterData } from './use-video-poster-data';

export default function VideoItemComponent( { attributes } ) {
	const { isGeneratingPoster } = useVideoPosterData( attributes );

	return (
		<>
			{ isGeneratingPoster ? (
				<span>Generating poster...</span>
			) : (
				<span>Poster is up to date.</span>
			) }
		</>
	);
}
```
