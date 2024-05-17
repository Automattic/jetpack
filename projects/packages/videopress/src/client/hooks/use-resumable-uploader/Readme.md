# useResumableUploader

React custom hook to deal with uploading files with resumable support.

## API

### uploadHandler

Helper function upload the file.

```jsx
import useResumableUploader from './';

function UploadFormComponent() {
	const { uploadHandler } = useResumableUploader();

	function onUploadHandler( event ) {
		const file = event.target.files[ 0 ];
		uploadHandler( file );
	}

	return (
		<form>
			<input type="file" accept="video/*" onChange={ onUploadHandler } />
		</form>
	);
}
```

### onUploadHandler

Helper function to bind straight with the, usually onChange, input event.

```jsx
import useResumableUploader from './';

function UploadFormComponent() {
	const { onUploadHandler } = useResumableUploader();

	return (
		<form>
			<input type="file" accept="video/*" onChange={ onUploadHandler } />
		</form>
	);
}
```

### resumeHandler

### data

### media

### error


