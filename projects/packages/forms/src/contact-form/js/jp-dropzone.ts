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
	};
}

export default class JP_Dropzone {
	element: HTMLElement;
	previewContainer: HTMLElement;
	uploadButton: HTMLElement;
	fileField: HTMLInputElement;
	isProcessing: boolean;

	options: DropzoneOptions;
	files: File[];
	xhr: XMLHttpRequest[];

	/**
	 * @param {HTMLElement} element The dropzone element.
	 * @param {object}      options Configuration options for the dropzone.
	 */
	constructor( element: HTMLElement, options: DropzoneOptions ) {
		// Option. Single or multiple files.
		this.element = element;
		this.fileField = element.querySelector( '.jetpack-form-file-field' ) as HTMLInputElement;

		this.fileField.addEventListener( 'invalid', ( event: Event ) => {
			const target = event.target as HTMLInputElement;
			if ( ! target ) return;

			const alert = document.createElement( 'div' );
			alert.textContent = target.validationMessage;
			alert.classList.add( 'contact-form__error' );
			this.element.appendChild( alert );
		} );

		this.options = options;

		this.previewContainer = this.element.querySelector(
			'.jetpack-form-file-field__preview-wrap'
		) as HTMLElement;
		this.uploadButton = this.element.querySelector( '.wp-block-button__link' ) as HTMLElement;
		this.files = [];
		this.xhr = [];
		this.isProcessing = false;

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
		if ( this.isProcessing ) {
			this.preventDefaults( event );
			return;
		}

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
		if ( this.isProcessing ) {
			this.preventDefaults( event );
			return;
		}

		this.preventDefaults( event );
		this.fileField.click();
		this.fileField.addEventListener( 'change', this.handleFiles.bind( this ) );
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
			this.isProcessing = true;
			const file = files[ 0 ];
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
	renderPreviews( files: FileList | File[] ) {
		this.previewContainer.classList.add( 'is-active' );
		// Only show the first file
		if ( files.length > 0 ) {
			this.showImage( files[ 0 ] );
		}
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
			this.element.addEventListener(
				'jp-dropzone-progress',
				this.updateProgress.bind( this, file, div ),
				false
			);
			const removeButton = div.querySelector( '.jetpack-form-file-field__remove' ) as HTMLElement;
			removeButton.addEventListener( 'click', this.removeFile.bind( this, file, div ) );
		} );
	}

	updateProgress( file, div, event ) {
		if ( event.detail.file === file ) {
			div
				.querySelector( '.jetpack-form-file-field__progress' )
				.style.setProperty( '--progress', `${ event.detail.progress }%` );
			if ( event.detail.progress === 100 ) {
				div.querySelector( '.jetpack-form-file-field__progress' ).classList.add( 'is-complete' );
			}
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
		this.setHeader( 'data-jp-rest-nonce', 'X-Jetpack-Upload-Nonce', index );

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
		const progressEvent = new CustomEvent( 'jp-dropzone-progress', {
			detail: { file, index, event, progress: ( event.loaded / event.total ) * 100 },
			bubbles: true,
			cancelable: true,
		} );
		this.element.dispatchEvent( progressEvent );
	}

	updateHiddenFields( selector, value ) {
		const hiddenField = this.element.querySelector( selector ) as HTMLInputElement;
		if ( hiddenField ) {
			hiddenField.value = value;
		}
	}

	onReadyStateChange( file, index, xhr, event ) {
		if ( event.target.readyState === 4 ) {
			if ( event.target.status === 200 ) {
				const response = JSON.parse( event.target.responseText );

				if ( response.success ) {
					const successEvent = new CustomEvent( 'jp-dropzone-success', {
						detail: { file, index, response },
						bubbles: true,
						cancelable: true,
					} );
					this.element.dispatchEvent( successEvent );
					this.fileField.setCustomValidity( '' );
					this.fileField.reportValidity();
					// update the hidden field with the token
					this.updateHiddenFields( '.jetpack-form-file-field__token', response.data.token );
					return;
				}
			}

			if ( event.target.responseText ) {
				const response = JSON.parse( event.target.responseText );

				const errorEvent = new CustomEvent( 'jp-dropzone-error', {
					detail: { file, index, response },
					bubbles: true,
					cancelable: true,
				} );
				this.element.dispatchEvent( errorEvent );

				if ( response.message ) {
					this.fileField.setCustomValidity( response.message );
					this.fileField.reportValidity();
				}
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
	removeFile( file: File, div: HTMLElement ) {
		this.files = this.files.filter( f => f !== file );
		div.classList.add( 'fade-out' );
		div.addEventListener( 'animationend', () => {
			div.remove();
			if ( this.files.length === 0 ) {
				this.previewContainer.classList.remove( 'is-active' );
				this.isProcessing = false;
			}
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
