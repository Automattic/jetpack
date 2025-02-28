/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store('jpDropZone', {
	state: {},
	actions: {
		openFilePicker: event => {
			const fileInput = event.target.querySelector('.jetpack-form-file-field');
			if (fileInput) {
				fileInput.click();
			}
		},
		fileAdded: event => {
			const context = getContext();
			// const target = event.target as HTMLInputElement;
			const files = Array.from(event.target.files);
			files.forEach(file => {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = () => {
					file.url = 'url(' + reader.result + ')';
					file.id = performance.now() + '-' + Math.random();
					context.files.push(file);
					context.hasFiles = true;
				};
			});

			console.log('File added!', Array.from(event.target.files));
		},

		fileDropped: event => {
			console.log('File dropped!', event.dataTransfer.files);
		},
		dragOver: () => {
			const context = getContext();
			context.isDropping = true;
		},
		dragLeave: () => {
			const context = getContext();
			context.isDropping = false;
		},
	},
});
