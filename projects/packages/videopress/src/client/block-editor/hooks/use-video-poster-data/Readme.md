# useVideoPosterData

React custom hook to handle video poster generation based on block attributes changes and post save events. It will request an update for the poster image when needed and refresh the video player to display the new poster image.

## Usage

```jsx
import { useVideoPosterData } from './use-video-poster-data';

export default function VideoItemComponent( { attributes } ) {
	const { isGeneratingPoster } = useVideoPosterGeneration( attributes );

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
