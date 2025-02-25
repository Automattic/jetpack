/**
 * Dropzone class to handle file drag-and-drop and file input interactions.
 */

interface DropzoneOptions {
	endpoint: string;
	nonce: string;
	i18n?: {
		language?: string;
		fileSizeUnits?: string[];
		removeFile?: string;
		uploadError?: string;
		unsupportedFiletype?: string;
		folderNotSupported?: string;
	};
}

type EventCallback = ( ...args: unknown[] ) => void;

class EventEmitter {
	private events: { [ key: string ]: EventCallback[] } = {};

	on( event: string, callback: EventCallback ): void {
		if ( ! this.events[ event ] ) {
			this.events[ event ] = [];
		}
		this.events[ event ].push( callback );
	}

	off( event: string, callback: EventCallback ): void {
		if ( ! this.events[ event ] ) return;
		this.events[ event ] = this.events[ event ].filter( cb => cb !== callback );
	}

	emit( event: string, ...args: unknown[] ): void {
		if ( ! this.events[ event ] ) return;
		this.events[ event ].forEach( callback => callback( ...args ) );
	}
}

export default class JP_Dropzone {
	element: HTMLElement;
	previewContainer: HTMLElement;
	uploadButton: HTMLElement;
	form: HTMLFormElement;
	fileField: HTMLInputElement;
	isProcessing: boolean;

	options: DropzoneOptions;
	files: File[];
	xhr: XMLHttpRequest[];
	events: EventEmitter;
	tokens: string[];

	/**
	 * @param {HTMLElement} element The dropzone element.
	 * @param {object}      options Configuration options for the dropzone.
	 */
	constructor( element: HTMLElement, options: DropzoneOptions ) {
		// Option. Single or multiple files.
		this.element = element;
		this.form = element.closest( 'form' ) as HTMLFormElement;
		this.fileField = element.querySelector( '.jetpack-form-file-field' ) as HTMLInputElement;
		this.options = options;

		this.previewContainer = this.element.querySelector(
			'.jetpack-form-file-field__preview-wrap'
		) as HTMLElement;
		this.uploadButton = this.element.querySelector( '.wp-block-button__link' ) as HTMLElement;
		this.files = [];
		this.xhr = [];
		this.tokens = [];
		this.isProcessing = false;
		this.events = new EventEmitter();

		this.init();
	}

	/**
	 * Initialize the dropzone by adding event listeners.
	 */
	init() {
		this.uploadButton.addEventListener( 'click', this.handleClick.bind( this ) );
		this.uploadButton.addEventListener( 'keypress', this.handleClick.bind( this ) );
		this.fileField.addEventListener( 'change', this.handleFiles.bind( this ) );

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
	 * Check if the file type is allowed based on the file input's accept attribute.
	 * @param {File} file The file to check.
	 * @returns {boolean} Whether the file type is allowed.
	 */
	isFileTypeAllowed( file: File ): boolean {
		const acceptAttribute = this.fileField.accept;

		// If no accept attribute is set, allow all files
		if ( ! acceptAttribute ) {
			return true;
		}

		// Split the accept attribute into an array of allowed types
		const allowedTypes = acceptAttribute.split( ',' ).map( type => type.trim().toLowerCase() );

		// Get the file's type and extension
		const fileType = file.type.toLowerCase();
		const fileExtension = `.${ file.name.split( '.' ).pop()?.toLowerCase() }`;

		return allowedTypes.some( type => {
			// Check for exact mime type match
			if ( type === fileType ) {
				return true;
			}
			// Check for wildcard mime type (e.g., "image/*")
			if ( type.endsWith( '/*' ) && fileType.startsWith( type.slice( 0, -1 ) ) ) {
				return true;
			}
			// Check for file extension match (e.g., ".jpg")
			if ( type.startsWith( '.' ) && type === fileExtension ) {
				return true;
			}
			return false;
		} );
	}

	/**
	 * Handle the drop event and process the dropped files.
	 * @param {DragEvent} event The drop event.
	 */
	handleDrop( event: DragEvent ) {
		this.preventDefaults( event );
		this.clearError();

		if ( this.isProcessing ) {
			return;
		}

		const dataTransfer = event.dataTransfer;
		if ( dataTransfer ) {
			// Check if any of the dragged items are folders
			for ( const item of Array.from( dataTransfer.items ) ) {
				if ( item.webkitGetAsEntry()?.isDirectory ) {
					const errorMessage =
						this.options?.i18n?.folderNotSupported ||
						'Folders cannot be uploaded. Please drop a single file.';
					this.triggerError( errorMessage );
					return;
				}
			}

			this.handleNewFiles( dataTransfer.files );
		}
	}

	/**
	 * Handle the click event on the upload button.
	 * @param {Event} event The click event.
	 */
	handleClick( event: Event ) {
		if ( this.isProcessing ) {
			this.preventDefaults( event );
			return;
		}

		this.clearError();

		this.preventDefaults( event );
		this.fileField.click();
	}

	/**
	 * Handle new files added to the dropzone.
	 * @param {FileList} files The list of files to handle.
	 */
	handleNewFiles( files: FileList ) {
		if ( this.isProcessing ) {
			return;
		}

		// Only take the first file
		if ( files.length > 0 ) {
			const file = files[ 0 ];

			// Check if file type is allowed
			if ( ! this.isFileTypeAllowed( file ) ) {
				const errorMessage =
					this.options?.i18n?.unsupportedFiletype ||
					'Invalid file type. Please check the list of allowed file types.';
				this.triggerError( errorMessage );
				return;
			}

			this.isProcessing = true;
			this.files = [ file ];
			this.renderPreviews( [ file ] );
			this.uploadFiles( [ file ] );
		}
	}

	/**
	 * Handle the change event on the file input field.
	 * @param {Event} event The change event.
	 */
	handleFiles( event: Event ) {
		const target = event.target as HTMLInputElement;
		if ( target && target.files ) {
			this.handleNewFiles( target.files );
		}
	}

	/**
	 * Render the previews of the selected files.
	 * @param {FileList} files The list of files to handle.
	 */
	renderPreviews( files: FileList | File[] ) {
		this.previewContainer.classList.add( 'is-active' );
		// Only show the first file
		if ( files.length > 0 ) {
			this.showImage( files[ 0 ], 0 );
		}
	}

	/**
	 * Display an image preview for the given file.
	 * @param {File} file The file to display.
	 */
	showImage( file: File, index: number ) {
		if ( ! ( file instanceof Blob ) ) {
			console.error( 'Invalid file type:', file ); // eslint-disable-line no-console
			return;
		}

		const removeButtonText = this.options?.i18n?.removeFile || 'Remove';

		const reader = new FileReader();
		reader.readAsDataURL( file );
		reader.addEventListener( 'load', event => {
			const div = document.createElement( 'div' );
			div.classList.add( 'jetpack-form-file-field__preview' );
			div.innerHTML = `
				<div class="jetpack-form-file-field__progress" style="--progress: 10%;" role="progressbar" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
				<div class="jetpack-form-file-field__image" style="background-image:url(${
					( event.target as FileReader ).result
				});"></div>
				<div class="jetpack-form-file-field__file-wrap">
					<span class="jetpack-form-file-field__file-name">${ this.esc_html( file.name ) }</span>
					<span class="jetpack-form-file-field__file-size">${ this.esc_html(
						this.formatBytes( file.size )
					) }</span>
				</div>
				<a href="#" class="jetpack-form-file-field__remove" aria-label="Remove file">${ this.esc_html(
					removeButtonText
				) }</a>
			`;
			this.previewContainer.appendChild( div );
			this.events.on( 'upload:progress', this.updateProgress.bind( this, file, div ) );
			this.events.on( 'upload:done', this.markProgressComplete.bind( this, file, div ) );

			const removeButton = div.querySelector( '.jetpack-form-file-field__remove' ) as HTMLElement;
			removeButton.addEventListener( 'click', this.removeFile.bind( this, file, div, index ) );
		} );
	}

	updateProgress( file, div, event ) {
		if ( event.file === file ) {
			const progress = Math.min( event.progress, 97 );
			div
				.querySelector( '.jetpack-form-file-field__progress' )
				.style.setProperty( '--progress', `${ progress }%` );
		}
	}

	/**
	 * Upload files to the server.
	 * @param {FileList} files The list of files to upload.
	 */
	uploadFiles( files: FileList | File[] ) {
		// Only upload the first file
		if ( files.length > 0 ) {
			this.uploadFile( files[ 0 ], 0 );
		}
	}

	setHeader( dateAttribute: string, header: string, index: number ) {
		const nonce = this.element.getAttribute( dateAttribute );
		if ( nonce ) {
			this.xhr[ index ].setRequestHeader( header, nonce );
		}
	}

	uploadFile( file, index ) {
		var url = this.options.endpoint;
		this.xhr[ index ] = new XMLHttpRequest();
		var formData = new FormData();

		this.xhr[ index ].open( 'POST', url, true );
		this.xhr[ index ].withCredentials = true;
		this.xhr[ index ].setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		// Add REST API nonce if available
		this.setHeader( 'data-rest-nonce', 'X-WP-Nonce', index );
		this.setHeader( 'data-jp-file-upload', 'X-Jetpack-Upload-Nonce', index );

		// Update progress (can be used to show progress indicator)
		this.xhr[ index ].upload.addEventListener(
			'progress',
			this.onProgress.bind( this, file, index )
		);

		const onReadyStateChangeHandler = this.onReadyStateChange.bind(
			this,
			file,
			index,
			this.xhr[ index ]
		);
		this.xhr[ index ].addEventListener( 'readystatechange', onReadyStateChangeHandler );

		formData.append( 'context', 'jetpack-form' );
		formData.append( 'file', file );
		this.xhr[ index ].send( formData );
	}

	onProgress( file, index, event ) {
		const progress = ( event.loaded / event.total ) * 100;
		this.events.emit( 'upload:progress', { file, index, progress } );
	}

	updateHiddenFields( selector, value ) {
		const hiddenField = this.element.querySelector( selector ) as HTMLInputElement;
		if ( hiddenField ) {
			hiddenField.value = value;
		}
	}
	/**
	 * Mark the progress as complete after receiving a successful response.
	 * @param {HTMLElement} div   The preview element.
	 * @param {Event}       event The success event.
	 */
	markProgressComplete( file, div, event ) {
		if ( event.file === file ) {
			div
				.querySelector( '.jetpack-form-file-field__progress' )
				.style.setProperty( '--progress', '100%' );
			div.querySelector( '.jetpack-form-file-field__progress' ).classList.add( 'is-complete' );
		}
	}

	onReadyStateChange( file, index, xhr, event ) {
		if ( event.target.readyState === 4 ) {
			if ( event.target.status === 200 ) {
				const response = JSON.parse( event.target.responseText );

				if ( response.success ) {
					this.tokens[ index ] = response.data.token;
					this.events.emit( 'upload:done', { file, index, token: response.data.token } );
					this.fileField.setCustomValidity( '' );
					this.fileField.reportValidity();
					// update the hidden field with the token
					this.updateHiddenFields( '.jetpack-form-file-field__token', response.data.token );

					// Clear the file input after successful upload and token retrieval
					// This prevents the browser from re-uploading the file when the form is submitted
					this.fileField.value = '';
					return;
				}
			}

			if ( event.target.responseText ) {
				const response = JSON.parse( event.target.responseText );
				this.triggerError( response.message );
			}

			// Reset processing state after upload completes (success or error)
			this.isProcessing = false;
		}
	}

	/**
	 * Sanitize a string to prevent XSS attacks.
	 * @param {string} str The string to sanitize.
	 * @returns {string} The sanitized string.
	 */
	esc_html( str: string ): string {
		const tempDiv = document.createElement( 'div' );
		tempDiv.textContent = str;
		return tempDiv.innerHTML;
	}

	/**
	 * Remove a file from the list of selected files.
	 * @param {File}        file The file to remove.
	 * @param {HTMLElement} div  The preview element to remove.
	 */
	removeFile( file: File, div: HTMLElement, index: number ) {
		this.files = this.files.filter( f => f !== file );
		div.classList.add( 'fade-out' );
		div.addEventListener( 'animationend', () => {
			div.remove();
			if ( this.files.length === 0 ) {
				this.previewContainer.classList.remove( 'is-active' );
				this.isProcessing = false;
			}
		} );

		const request = new Request( this.options.endpoint + '/remove', {
			method: 'POST',
			headers: {
				'X-WP-Nonce': this.element.getAttribute( 'data-rest-nonce' ) || '',
				'X-Jetpack-Upload-Nonce': this.element.getAttribute( 'data-jp-file-upload' ) || '',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( { token: this.tokens[ index ] || '', context: 'jetpack-form' } ),
		} );

		fetch( request );
	}

	/**
	 * Register an event handler.
	 * @param {string}        event    The event name.
	 * @param {EventCallback} callback The event callback.
	 * @returns {JP_Dropzone} The JP_Dropzone instance.
	 */
	on( event: string, callback: EventCallback ): JP_Dropzone {
		this.events.on( event, callback );
		return this;
	}

	/**
	 * Trigger an event.
	 * @param {string}       event The event name.
	 * @param {...unknown[]} args  The arguments to pass to the event callback.
	 */
	trigger( event: string, ...args: unknown[] ) {
		this.events.emit( event, ...args );
	}
	/**
	 *
	 * @param string message - Error message that we want to show the user.
	 */
	triggerError( message: string ) {
		this.fileField.setCustomValidity( message );
		this.trigger( 'error', {
			input: this.fileField,
			form: this.form,
			message,
		} );
	}

	/**
	 * Use to clear the errors on the file.
	 */
	clearError() {
		this.fileField.setCustomValidity( '' );
		this.trigger( 'error:clear', {
			input: this.fileField,
			form: this.form,
			message: '',
		} );
	}

	/**
	 * Format the file size to a human-readable string.
	 * @param {number} size             The size of the file in bytes.
	 * @param {number} [decimals=2]     The number of decimals to include.
	 * @param {string} [locale='en-US'] The locale to use for formatting.
	 * @returns {string} The formatted file size.
	 */
	formatBytes( size: number, decimals = 2, locale = 'en-US' ): string {
		if ( size === 0 ) return '0 bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = this.options?.i18n?.fileSizeUnits || [
			'Bytes',
			'KB',
			'MB',
			'GB',
			'TB',
			'PB',
			'EB',
			'ZB',
			'YB',
		];
		const i = Math.floor( Math.log( size ) / Math.log( k ) );
		const formattedSize = parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) );
		const numberFormat = new Intl.NumberFormat( locale, {
			minimumFractionDigits: dm,
			maximumFractionDigits: dm,
		} );
		return `${ numberFormat.format( formattedSize ) } ${ sizes[ i ] }`;
	}
}
