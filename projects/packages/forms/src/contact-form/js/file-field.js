document.addEventListener( 'DOMContentLoaded', () => {
	const forms = document.querySelectorAll( '.jetpack-form-file-field__dropzone' );
	forms.forEach( dropzone => {
		new Dropzone( dropzone, {} );
	} );
} );

class Dropzone {
	constructor( element, options ) {
		// Option. Single or multiple files.

		this.element = element;
		this.options = options;
		this.fileField = element.querySelector( '.jetpack-form-file-field' );
		this.previewContainer = this.element.querySelector( '.jetpack-form-file-field__preview-wrap' );
		this.uploadButton = this.element.querySelector( '.wp-block-button__link' );
		this.files = [];
		this.init();
	}

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
		[ 'dragleave', 'drop' ].forEach( eventName => {
			this.element.addEventListener( eventName, this.unhighlight.bind( this ), false );
		} );
	}

	preventDefaults( e ) {
		e.preventDefault();
		e.stopPropagation();
	}

	highlight() {
		this.element.classList.add( 'is_dropping' );
	}

	unhighlight() {
		this.element.classList.remove( 'is_dropping' );
	}

	handleDrop() {
		const dataTransfer = event.dataTransfer;
		this.handleNewFiles( dataTransfer.files );
	}

	handleClick( event ) {
		this.preventDefaults( event );
		this.fileField.click();

		this.fileField.addEventListener( 'change', this.handleFiles.bind( this ) );
	}

	handleNewFiles( files ) {
		this.files = this.files.concat( Array.from( files ) );
		this.renderPreviews();
	}

	handleFiles( event ) {
		this.fileField.removeEventListener( 'change', this.handleFiles.bind( this ) );
		this.handleNewFiles( event.target.files );
	}

	renderPreviews() {
		this.previewContainer.classList.add( 'is-active' );
		this.previewContainer.innerHTML = '';
		this.files.forEach( file => {
			this.showImage( file );
		} );
	}

	showImage( file ) {
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
					event.target.result
				});"></div>
				<div class="jetpack-form-file-field__file-wrap">
					<span class="jetpack-form-file-field__file-name">${ file.name }</span>
					<span class="jetpack-form-file-field__file-size">${ this.formatBytes( file.size ) }</span>
				</div>
			`;
			this.previewContainer.appendChild( div );
		} );
	}

	formatBytes( size, decimals = 2 ) {
		if ( size === 0 ) return '0 bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ];
		const i = Math.floor( Math.log( size ) / Math.log( k ) );
		return parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) ) + ' ' + sizes[ i ];
	}
}
