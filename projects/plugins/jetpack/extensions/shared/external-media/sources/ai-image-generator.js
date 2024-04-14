import apiFetch from '@wordpress/api-fetch';
import { Modal, TextareaControl, Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { uploadMedia } from '@wordpress/media-utils';
import './styles.scss';

export default function AIImageGenerator( { onClose, onSelect } ) {
	const [ promptText, setPrompt ] = useState( '' );
	const [ loading, setLoading ] = useState( false );
	const [ url, setUrl ] = useState( null );

	const fetchPrediction = async () => {
		apiFetch( {
			path: '/jetpack/v4/generate-image',
			method: 'POST',
			data: { prompt: promptText },
		} ).then( data => fetchImageURL( data.id, 2000 ) );
	};

	const generate = () => {
		if ( '' === promptText ) {
			return;
		}

		setUrl( null );
		setLoading( true );
		fetchPrediction();
	};

	const fetchImageURL = ( id, waitTime ) => {
		apiFetch( { path: '/jetpack/v4/generate-image/' + id } ).then( data =>
			extractImageURL( data, id, waitTime )
		);
	};

	const extractImageURL = ( data, id, waitTime ) => {
		if ( null === data.prediction_output ) {
			if ( waitTime > 20000 ) {
				setLoading( false );
				return;
			}
			setTimeout( () => fetchImageURL( id ), waitTime * 1.5 );
		} else {
			setLoading( false );
			setUrl( data.prediction_output );
		}
	};

	const saveImage = mediaURL => {
		setLoading( { loading: true } );
		fetch( mediaURL ).then( async response => {
			const contentType = response.headers.get( 'content-type' );
			const blob = await response.blob();
			const file = new File( [ blob ], mediaURL.substring( mediaURL.lastIndexOf( '/' ) + 1 ), {
				contentType,
			} );

			uploadMedia( {
				filesList: [ file ],
				onFileChange: ( [ fileObj ] ) => {
					if ( typeof fileObj?.id !== 'undefined' ) {
						onSelect( fileObj );
						setLoading( false );
						onClose();
					}
				},
			} );
		} );
	};

	return (
		<Modal
			className="jetpack-external-media-wrapper__aiimagegenerator"
			title={ __( 'Generate media', 'jetpack' ) }
			onRequestClose={ onClose }
		>
			{ url && (
				<div className="results">
					{ url.map( ( imageURL, i ) => (
						<div key={ i }>
							<Button isBusy={ loading } onClick={ () => saveImage( imageURL ) }>
								<img src={ imageURL } alt="Generated output from prompt" />
							</Button>
						</div>
					) ) }
				</div>
			) }
			<TextareaControl
				value={ promptText }
				onChange={ value => setPrompt( value ) }
				placeholder="A hyperrealistic photograph of a waterfall in the jungle."
			/>
			<Button
				variant="primary"
				isBusy={ loading }
				onClick={ () => generate() }
				disabled={ '' === promptText }
			>
				{ loading ? "It's working I assure you..." : 'Generate Images' }
			</Button>
		</Modal>
	);
}
