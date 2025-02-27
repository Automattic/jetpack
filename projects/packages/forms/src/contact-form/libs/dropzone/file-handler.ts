import { EventEmitter } from './event-emitter';
import { DropzoneOptions } from './options';

export class FileHandler {
	private files: File[] = [];
	private tokens: string[] = [];
	private xhr: XMLHttpRequest[] = [];
	private isProcessing: boolean = false;
	private events: EventEmitter;
	private maxFiles: number;

	constructor( events: EventEmitter, maxFiles: number ) {
		this.events = events;
		this.maxFiles = maxFiles;
	}

	addFiles(
		files: FileList,
		fileField: HTMLInputElement,
		options: DropzoneOptions,
		triggerError: ( message: string ) => void
	) {
		if ( ! this.isAcceptingFiles() ) {
			return;
		}

		const filesRemaining = this.maxFiles - this.files.length;
		const filesAllowed = Array.from( files ).slice( 0, filesRemaining );
		if ( filesAllowed.length > 0 ) {
			const file = files[ 0 ];

			// Check if file type is allowed
			if ( ! this.isFileTypeAllowed( file, fileField ) ) {
				const errorMessage =
					options?.i18n?.unsupportedFiletype ||
					'Invalid file type. Please check the list of allowed file types.';
				triggerError( errorMessage );
				return;
			}

			// Check if file size is within the allowed limit
			if ( options.maxUploadSize && file.size > options.maxUploadSize ) {
				triggerError( options?.i18n?.fileTooLarge );
				return;
			}

			this.isProcessing = true;
			this.files = [ file ];
			this.events.emit( 'file:added', file );
			this.uploadFiles( [ file ], options );
		}
	}

	isAcceptingFiles() {
		if ( this.files.length >= this.maxFiles ) {
			return false;
		}
		return ! this.isProcessing;
	}

	isFileTypeAllowed( file: File, fileField: HTMLInputElement ): boolean {
		const acceptAttribute = fileField.accept;
		if ( ! acceptAttribute ) {
			return true;
		}

		const allowedTypes = acceptAttribute.split( ',' ).map( type => type.trim().toLowerCase() );
		const fileType = file.type.toLowerCase();
		const fileExtension = `.${ file.name.split( '.' ).pop()?.toLowerCase() }`;

		return allowedTypes.some( type => {
			if ( type === fileType ) {
				return true;
			}
			if ( type.endsWith( '/*' ) && fileType.startsWith( type.slice( 0, -1 ) ) ) {
				return true;
			}
			if ( type.startsWith( '.' ) && type === fileExtension ) {
				return true;
			}
			return false;
		} );
	}

	uploadFiles( files: File[], options: DropzoneOptions ) {
		if ( files.length > 0 ) {
			this.uploadFile( files[ 0 ], 0, options );
		}
	}

	uploadFile( file: File, index: number, options: DropzoneOptions ) {
		const url = options.endpoint;
		this.xhr[ index ] = new XMLHttpRequest();
		const formData = new FormData();

		this.xhr[ index ].open( 'POST', url, true );
		this.xhr[ index ].withCredentials = true;
		this.xhr[ index ].setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		this.xhr[ index ].setRequestHeader( 'X-WP-Nonce', options.wp_nonce );
		this.xhr[ index ].setRequestHeader( 'X-Jetpack-Upload-Nonce', options.jp_nonce );

		this.xhr[ index ].upload.addEventListener(
			'progress',
			this.onProgress.bind( this, file, index )
		);
		this.xhr[ index ].addEventListener(
			'readystatechange',
			this.onReadyStateChange.bind( this, file, index )
		);

		formData.append( 'context', 'jetpack-form' );
		formData.append( 'file', file );
		this.xhr[ index ].send( formData );
	}

	onProgress( file: File, index: number, event: ProgressEvent ) {
		const progress = ( event.loaded / event.total ) * 100;
		this.events.emit( 'upload:progress', { file, index, progress } );
	}

	onReadyStateChange( file: File, index: number, event: Event ) {
		const xhr = event.target as XMLHttpRequest;
		if ( xhr.readyState === 4 ) {
			if ( xhr.status === 200 ) {
				const response = JSON.parse( xhr.responseText );
				if ( response.success ) {
					this.tokens[ index ] = response.data.token;
					this.events.emit( 'upload:done', { file, index, token: response.data.token } );
					this.isProcessing = false;
					return;
				}
			}

			if ( xhr.responseText ) {
				const response = JSON.parse( xhr.responseText );
				this.events.emit( 'upload:fail', { file, index, message: response.message } );
			}

			this.isProcessing = false;
		}
	}

	triggerError( message: string, fileField: HTMLInputElement ) {
		fileField.setCustomValidity( message );
		this.events.emit( 'error', message, fileField );
	}

	removeFile( file: File, index: number, options: DropzoneOptions ) {
		this.files = this.files.filter( f => f !== file );

		const request = new Request( options.endpoint + '/remove', {
			method: 'POST',
			headers: {
				'X-WP-Nonce': options.wp_nonce,
				'X-Jetpack-Upload-Nonce': options.jp_nonce,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify( { token: this.tokens[ index ] || '', context: 'jetpack-form' } ),
		} );

		delete this.tokens[ index ];

		fetch( request );
	}

	hasFiles() {
		return !! this.files.length;
	}
}
