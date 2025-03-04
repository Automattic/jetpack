/**
 * WordPress dependencies
 */
import { store, getContext, withSyncEvent } from '@wordpress/interactivity';
const addFileToContext = ( context, file ) => {
	const reader = new FileReader();
	reader.readAsDataURL( file );
	reader.onload = () => {
		file.url = 'url(' + reader.result + ')';
		file.id = performance.now() + '-' + Math.random();
		file.formattedSize = formatBytes( file.size, 2, state.i18n.locale );
		file.hasToken = false;
		context.files.push( file );
		context.hasFiles = true;
		FileHandler.uploadFile( file, context );
	};
};

const formatBytes = ( size, decimals = 2, locale = 'en-US' ) => {
	if ( size === 0 ) return '0 bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = state.i18n.fileSizeUnits || [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ];
	const i = Math.floor( Math.log( size ) / Math.log( k ) );
	const formattedSize = parseFloat( ( size / Math.pow( k, i ) ).toFixed( dm ) );
	const numberFormat = new Intl.NumberFormat( locale, {
		minimumFractionDigits: dm,
		maximumFractionDigits: dm,
	} );
	return `${ numberFormat.format( formattedSize ) } ${ sizes[ i ] }`;
};
const { state } = store( 'jpDropZone', {
	state: {},
	actions: {
		openFilePicker: withSyncEvent( event => {
			const fileInput = event.target.parentNode.querySelector( '.jetpack-form-file-field' );
			if ( fileInput ) {
				fileInput.click();
			}
		} ),

		fileAdded: event => {
			const context = getContext();
			const files = Array.from( event.target.files );
			files.forEach( addFileToContext.bind( null, context ) );
		},

		fileDropped: event => {
			if ( event.dataTransfer ) {
				for ( const item of Array.from( event.dataTransfer.items ) ) {
					if ( item.webkitGetAsEntry()?.isDirectory ) {
						return;
					}
					addFileToContext( context, item.getAsFile() );
				}
			}
			const context = getContext();
			context.isDropping = false;
			event.preventDefault();
		},
		dragOver: () => {
			const context = getContext();
			context.isDropping = true;
		},
		dragLeave: () => {
			const context = getContext();
			context.isDropping = false;
		},
		removeFile: event => {
			const context = getContext();
			const fileId = event.target.dataset.id;
			context.files = context.files.filter( file => file.id !== fileId );
			context.hasFiles = context.files.length > 0;
		},
	},
	// callbacks: {
	// 	logCounter: () => {
	// 		const { files } = getContext();
	// 		console.log( 'howdy!!!!', files );
	// 	},
	// },
} );

const updateFile = file => {
	const context = getContext();
	const index = context.files.findIndex( f => f.id === file.id );
	context.files[ index ] = file;
};

const FileHandler = {
	context: null,
	uploadFile( file ) {
		const url = state.endpoint;
		const xhr = new XMLHttpRequest();
		const formData = new FormData();
		xhr.open( 'POST', url, true );
		xhr.withCredentials = true;
		xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		xhr.setRequestHeader( 'X-WP-Nonce', state.wp_nonce );
		xhr.setRequestHeader( 'X-Jetpack-Upload-Nonce', state.jp_nonce );
		xhr.upload.addEventListener( 'progress', this.onProgress.bind( this, file ) );
		xhr.addEventListener( 'readystatechange', this.onReadyStateChange.bind( this, file ) );
		formData.append( 'context', 'jetpack-form' );
		formData.append( 'file', file );
		xhr.send( formData );
	},

	onProgress( file, event ) {
		const progress = ( event.loaded / event.total ) * 100;
		// this.events.emit( 'upload:progress', { file, index, progress } );
		file.progress = progress;
		updateFile( file );
	},

	onReadyStateChange( file, event ) {
		const xhr = event.target;
		if ( xhr.readyState === 4 ) {
			if ( xhr.status === 200 ) {
				const response = JSON.parse( xhr.responseText );
				if ( response.success ) {
					file.token = response.data.token;
					file.hasToken = true;
					file.url = '';
					updateFile( file );
				}
			}
			// if ( xhr.responseText ) {
			// 	const response = JSON.parse( xhr.responseText );
			// 	// this.events.emit( 'upload:fail', { file, index, message: response.message } );
			// }
		}
	},

	removeFile() {
		// this.files = this.files.filter( f => f !== file );
		// const request = new Request( options.endpoint + '/remove', {
		// 	method: 'POST',
		// 	headers: {
		// 		'X-WP-Nonce': options.wp_nonce,
		// 		'X-Jetpack-Upload-Nonce': options.jp_nonce,
		// 		'Content-Type': 'application/json',
		// 	},
		// 	body: JSON.stringify( { token: this.tokens[ index ] || '', context: 'jetpack-form' } ),
		// } );
		// delete this.tokens[ index ];
		// fetch( request );
	},
};
