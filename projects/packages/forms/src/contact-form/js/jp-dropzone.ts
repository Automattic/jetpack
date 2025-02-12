/**
 * Dropzone class to handle file drag-and-drop and file input interactions.
 */
export default class JP_Dropzone {
	/**
	 * @param {HTMLElement} element The dropzone element.
	 * @param {object}      options Configuration options for the dropzone.
	 */
	constructor( element: HTMLElement, options: object ) {
		// Option. Single or multiple files.
		this.element = element;
		this.options = options;
		this.fileField = element.querySelector( '.jetpack-form-file-field' ) as HTMLInputElement;
		this.previewContainer = this.element.querySelector(
			'.jetpack-form-file-field__preview-wrap'
		) as HTMLElement;
		this.uploadButton = this.element.querySelector( '.wp-block-button__link' ) as HTMLElement;
		this.files = [];
		this.init();
	}

	/**
	 * Initialize the dropzone by adding event listeners.
	 */
	init() {
		this.uploadButton.addEventListener( 'click', this.handleClick.bind( this ) );
		this.uploadButton.addEventListener( 'keypress', this.handleClick.bind( this ) );

		this.previewContainer.addEventListener( 'click', this.preventDefaults, false );

		[ 'dragenter', 'dragover', 'dragleave', 'drop' ].forEach( eventName => {
			this.element.addEventListener( eventName, this.preventDefaults, false );
		} );

		this.element.addEventListener( 'drop', this.handleDrop.bind( this ), false );

		[ 'dragenter', 'dragover' ].forEach( eventName => {
			this.element.addEventListener( eventName, this.highlight.bind( this ), false );
		} );
		[ 'dragleave', 'drop', 'mouseleave' ].forEach( eventName => {
			this.element.addEventListener( eventName, this.unhighlight.bind( this ), false );
		} );
	}

	/**
	 * Prevent default behavior for the given event.
	 * @param {Event} event The event to prevent defaults for.
	 */
	preventDefaults( event: Event ) {
		event.preventDefault();
		event.stopPropagation();
	}

	/**
	 * Highlight the dropzone when a file is dragged over it.
	 */
	highlight() {
		this.element.classList.add( 'is_dropping' );
	}

	/**
	 * Remove the highlight from the dropzone when a file is dragged away.
	 */
	unhighlight() {
		this.element.classList.remove( 'is_dropping' );
	}

	/**
	 * Handle the drop event and process the dropped files.
	 * @param {DragEvent} event The drop event.
	 */
	handleDrop( event: DragEvent ) {
		const dataTransfer = event.dataTransfer;
		if ( dataTransfer ) {
			this.handleNewFiles( dataTransfer.files );
		}
	}

	/**
	 * Handle the click event on the upload button.
	 * @param {Event} event The click event.
	 */
	handleClick( event: Event ) {
		this.preventDefaults( event );
		this.fileField.click();
		this.fileField.addEventListener( 'change', this.handleFiles.bind( this ) );
	}

	/**
	 * Handle new files added to the dropzone.
	 * @param {FileList} files The list of files to handle.
	 */
	handleNewFiles( files: FileList ) {
		this.files = this.files.concat( Array.from( files ) );
		this.renderPreviews( files );
	}

	/**
	 * Handle the change event on the file input field.
	 * @param {Event} event The change event.
	 */
	handleFiles( event: Event ) {
		this.fileField.removeEventListener( 'change', this.handleFiles.bind( this ) );
		const target = event.target as HTMLInputElement;
		if ( target && target.files ) {
			this.handleNewFiles( target.files );
		}
	}

	/**
	 * Render the previews of the selected files.
	 * @param {FileList} files The list of files to handle.
	 */
	renderPreviews( files: FileList ) {
		this.previewContainer.classList.add( 'is-active' );
		Array.from( files ).forEach( file => {
			this.showImage( file );
		} );
	}

	/**
	 * Display an image preview for the given file.
	 * @param {File} file The file to display.
	 */
	showImage( file: File ) {
		if ( ! ( file instanceof Blob ) ) {
			console.error( 'Invalid file type:', file ); // eslint-disable-line no-console
			return;
		}

		const reader = new FileReader();
		reader.readAsDataURL( file );
		reader.addEventListener( 'load', event => {
			const div = document.createElement( 'div' );
			div.classList.add( 'jetpack-form-file-field__preview' );
			div.innerHTML = `
				<div class="jetpack-form-file-field__image" style="background-image:url(${
					( event.target as FileReader ).result
				});"></div>
				<div class="jetpack-form-file-field__file-wrap">
					<span class="jetpack-form-file-field__file-name">${ file.name }</span>
					<span class="jetpack-form-file-field__file-size">${ this.formatBytes( file.size ) }</span>
				</div>
				<a href="#" class="jetpack-form-file-field__remove" aria-label="Remove file">Remove</a>
			`;
			this.previewContainer.appendChild( div );
			const removeButton = div.querySelector( '.jetpack-form-file-field__remove' ) as HTMLElement;
			removeButton.addEventListener( 'click', this.removeFile.bind( this, file, div ) );
		} );
	}

	/**
	 * Remove a file from the list of selected files.
	 * @param {File}        file The file to remove.
	 * @param {HTMLElement} div  The preview element to remove.
	 */
	removeFile( file: File, div: HTMLElement ) {
		this.files = this.files.filter( f => f !== file );
		div.classList.add( 'fade-out' );
		div.addEventListener( 'animationend', () => {
			div.remove();
			if ( this.files.length === 0 ) {
				this.previewContainer.classList.remove( 'is-active' );
			}
		} );
	}

	/**
	 * Format the file size to a human-readable string.
	 * @param {number} size         The size of the file in bytes.
	 * @param {number} [decimals=2] The number of decimals to include.
	 * @returns {string} The formatted file size.
	 */
	formatBytes( size: number, decimals = 2 ): string {
		if ( size === 0 ) return '0 bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
		const i = Math.floor( Math.log( size ) / Math.log( k ) );
		return parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ];
	}
}
