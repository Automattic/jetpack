/**
 * External dependencies
 */
import head from 'lodash/head';
import React, { Fragment, PureComponent } from 'react';
import { withRouter } from 'react-router';
import debugModule from 'debug';
import apiFetch from '@wordpress/api-fetch';
import { Button, DropZoneProvider, DropZone, Icon, TextControl } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FileInput from './file-input';

const debug = debugModule( 'unfied-importer:input-screen' );

const validFileTypes = Object.freeze( [ 'text/xml' ] );
const isValidFileType = type => validFileTypes.includes( type );

const fetchWxrForSiteUrl = async site_url =>
	apiFetch( {
		method: 'POST',
		path: 'wordpress-importer/v1/fetch-wxr-for-url',
		data: { site_url },
	} );

const uploadImportAttachmentFile = async file => {
	const body = new FormData();
	body.append( 'import', file );
	body.append( 'status', 'private' );

	return apiFetch( {
		method: 'POST',
		path: '/wordpress-importer/v1/attachment',
		body,
	} );
};

function toggleElements() {
	document.querySelector( '.jetpack-unified-importer' ).style.display = 'none';
	document.querySelector( 'table.importers' ).parentElement.style.display = 'block';
}

class InputScreen extends PureComponent {
	state = {
		isFetching: false,
		file: null,
		url: '',
	};

	beginImport = async () => {
		const { setUploadResult } = this.props;
		const { file, url } = this.state;

		if ( ! ( url || file ) ) {
			return;
		}

		this.setState( {
			isFetching: true,
		} );

		try {
			const attachmentData = await ( url
				? fetchWxrForSiteUrl( url )
				: uploadImportAttachmentFile( file ) );

			this.setState( { isFetching: false } );
			debug( { attachmentData } );
			setUploadResult( attachmentData );
			window.location = '#/map';
		} catch ( error ) {
			debug( { error } );
			this.setState( { isFetching: false } );
		}
	};

	handleFileSelection = async ( files = [] ) => {
		const file = head( files );
		const { type, size } = file;

		if ( ! size ) {
			debug( 'Cannot upload an empty file' );
			return;
		}

		if ( ! isValidFileType( type ) ) {
			debug( `File type ${ type } is not supported` );
			return;
		}

		this.setState( { file } );
		debug( file );
	};

	render() {
		const { isFetching, file, url } = this.state;

		// Only accept files if one isn't already selected
		const DropZoneTarget = file ? Fragment : DropZoneProvider;

		const hasImportableResource = file || url.length; // We would want to bolster the URL validation eventually

		return (
			<Fragment>
				<div>
					<button className="jetpack-unified-importer__exit" onClick={ toggleElements }>
						{ __( 'Exit' ) }
					</button>
				</div>
				<h2>{ __( 'Import WordPress' ) }</h2>
				<div>
					{ __(
						`Howdy! Upload your WordPress eXtended RSS (WXT) file and we'll import the posts, pages, comments, custom fields, categories, and tags into this site.`
					) }
				</div>
				<div>
					{ __(
						'Choose a WXR (.xml) file to upload, or drop a file here, and your import will begin'
					) }
				</div>
				<div className="wordpress-importer__div-actions">
					{ file ? (
						<div className="wordpress-importer__file-select-action">
							<span>
								{ file.name }
								<Button onClick={ () => this.setState( { file: null } ) } isLink>
									<Icon icon="no" />
								</Button>
							</span>
						</div>
					) : (
						<DropZoneTarget>
							<div className="wordpress-importer__url-input-action">
								<TextControl
									label="Import from url:"
									onChange={ url => this.setState( { url } ) }
									value={ url }
								/>
							</div>
							<div className="wordpress-importer__file-select-action">
								<FileInput onFileSelected={ this.handleFileSelection }>
									{ __( 'You can also drag a file here, or click to browse.' ) }
								</FileInput>
							</div>
							<DropZone
								onFilesDrop={ this.handleFileSelection }
								onHTMLDrop={ this.handleFileSelection }
								onDrop={ this.handleFileSelection }
							/>
						</DropZoneTarget>
					) }
				</div>
				<div className="wordpress-importer__div-actions">
					<Button
						isBusy={ isFetching }
						disabled={ isFetching || ! hasImportableResource }
						onClick={ this.beginImport }
						isPrimary
					>
						{ __( 'Begin Import' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default withSelect( select => {
	return {
		// Prefetch siteAuthors so they're ready for the next step
		siteAuthors: select( 'core' ).getAuthors(),
	};
} )(
	withDispatch( dispatch => {
		debug( { dispatch } );
		return {
			setUploadResult: dispatch( 'wordpress-importer' ).setUploadResult,
		};
	} )( withRouter( InputScreen ) )
);
