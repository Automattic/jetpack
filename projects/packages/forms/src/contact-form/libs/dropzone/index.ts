import { EventEmitter } from './event-emmiter';
import { FileHandler } from './file-handler';
import { DropzoneOptions } from './options';
/**
 * Dropzone class to handle file drag-and-drop and file input interactions.
 */

export default class Dropzone {
	element: HTMLElement;
	previewContainer: HTMLElement;
	uploadButton: HTMLElement;
	form: HTMLFormElement;
	fileField: HTMLInputElement;
	options: DropzoneOptions;
	events: EventEmitter;
	fileHandler: FileHandler;

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

		this.events = new EventEmitter();
		this.fileHandler = new FileHandler( this.events, 1 );

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

		this.events.on( 'file:added', this.renderPreview.bind( this ) );
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
		if ( ! this.fileHandler.isAcceptingFiles() ) {
			this.emitError( "You can't upload any more files" );
			this.preventDefaults( event );
		}
		this.preventDefaults( event );
		this.clearError();

		const dataTransfer = event.dataTransfer;
		if ( dataTransfer ) {
			// Check if any of the dragged items are folders
			for ( const item of Array.from( dataTransfer.items ) ) {
				if ( item.webkitGetAsEntry()?.isDirectory ) {
					const errorMessage =
						this.options?.i18n?.folderNotSupported ||
						'Folders cannot be uploaded. Please drop a single file.';
					this.emitError( errorMessage );
					return;
				}
			}

			this.fileHandler.addFiles(
				dataTransfer.files,
				this.fileField,
				this.options,
				this.emitError.bind( this )
			);
		}
	}

	/**
	 * Handle the click event on the upload button.
	 * @param {Event} event The click event.
	 */
	handleClick( event: Event ) {
		if ( ! this.fileHandler.isAcceptingFiles() ) {
			this.emitError( "You can't upload any more filed" );
			this.preventDefaults( event );
			return;
		}

		this.clearError();
		this.preventDefaults( event );
		this.fileField.click();
	}

	/**
	 * Handle the change event on the file input field.
	 * @param {Event} event The change event.
	 */
	handleFiles( event: Event ) {
		const target = event.target as HTMLInputElement;
		if ( target && target.files ) {
			this.fileHandler.addFiles(
				target.files,
				this.fileField,
				this.options,
				this.emitError.bind( this )
			);
		}
	}

	/**
	 * Render the previews of the selected files.
	 * @param {file} File to handle
	 */
	renderPreview( file ) {
		this.previewContainer.classList.add( 'is-active' );
		// Only show the first file
		this.showImage( file, 0 );
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
			this.events.on( 'upload:done', this.fileUploaded.bind( this, file, div ) );
			this.events.on( 'upload:fail', this.uploadFailed.bind( this ) );

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
	fileUploaded( file, div, event ) {
		if ( event.file === file ) {
			div
				.querySelector( '.jetpack-form-file-field__progress' )
				.style.setProperty( '--progress', '100%' );
			div.querySelector( '.jetpack-form-file-field__progress' ).classList.add( 'is-complete' );
		}

		this.fileField.setCustomValidity( '' );
		this.fileField.reportValidity();
		// update the hidden field with the token
		this.updateHiddenFields( '.jetpack-form-file-field__token', event.token );

		// Clear the file input after successful upload and token retrieval
		// This prevents the browser from re-uploading the file when the form is submitted
		this.fileField.value = '';
	}

	uploadFailed( event ) {
		this.emitError( event.message );
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
		div.classList.add( 'fade-out' );
		this.clearError();

		this.fileHandler.removeFile( file, index, this.options );

		div.addEventListener( 'animationend', () => {
			div.remove();
			if ( ! this.fileHandler.hasFiles() ) {
				this.previewContainer.classList.remove( 'is-active' );
			}
		} );
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
	 *
	 * @param string message - Error message that we want to show the user.
	 */
	emitError( message: string ) {
		this.fileField.setCustomValidity( message );
		this.events.emit( 'error', {
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
		this.events.emit( 'error:clear', {
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
