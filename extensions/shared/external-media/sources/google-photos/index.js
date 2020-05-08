/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { SelectControl, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SOURCE_GOOGLE_PHOTOS, PATH_RECENT, PATH_ROOT } from '../../constants';
import withMedia from '../with-media';
import MediaBrowser from '../../media-browser';
import requestExternalAccess from '../request-external-access';
import { getApiUrl } from '../api';
import GoogleFilterOption from './filter-option';
import GoogleFilterView from './filter-view';
import getFilterRequest from './filter-request';
import { GooglePhotosLogo } from '../../../icons';

const isImageOnly = allowed => allowed && allowed.length === 1 && allowed[ 0 ] === 'image';

class GooglePhotosMedia extends Component {
	constructor( props ) {
		super( props );

		// Set default mediaType filter if we are only allowed images
		this.state = {
			isAuthing: false,
			filters: isImageOnly( props.allowedTypes ) ? { mediaType: 'photo' } : {},
		};
	}

	getListUrl() {
		return getApiUrl( 'list', SOURCE_GOOGLE_PHOTOS, this.getQueryParams( this.state.filters ) );
	}

	getCopyUrl() {
		return getApiUrl( 'copy', SOURCE_GOOGLE_PHOTOS );
	}

	componentDidMount() {
		this.props.getMedia( this.getListUrl() );
	}

	getNextPage = ( reset = false ) => {
		this.props.getMedia( this.getListUrl(), reset );
	};

	onCopy = items => {
		this.props.copyMedia( items, this.getCopyUrl() );
	};

	getQuery( filters ) {
		return JSON.stringify( this.getQueryParams( filters ) );
	}

	getQueryParams( filters ) {
		const { path } = this.props;
		const filterQuery = path.ID === PATH_RECENT ? getFilterRequest( filters ) : null;
		const params = {
			number: 20,
			path: path.ID,
		};

		if ( filterQuery ) {
			params.filter = filterQuery;
		}

		return params;
	}

	setPath = path => {
		const album = this.props.media.find( item => item.ID === path );

		this.props.onChangePath( album ? album : { ID: path }, () => {
			this.getNextPage( true );
		} );
	};

	getPathOptions() {
		return [
			{
				value: PATH_RECENT,
				label: __( 'Recent Photos', 'jetpack' ),
			},
			{
				value: PATH_ROOT,
				label: __( 'Albums', 'jetpack' ),
			},
		];
	}

	onAuthorize = () => {
		this.setState( { isAuthing: true } );

		// Get connection details
		apiFetch( {
			path: getApiUrl( 'connection', SOURCE_GOOGLE_PHOTOS ),
		} )
			.then( service => {
				if ( service.error ) {
					throw service.message;
				}

				// Open authorize URL in a window and let it play out
				requestExternalAccess( service.connect_URL, () => {
					this.setState( { isAuthing: false } );
					this.getNextPage( true );
				} );
			} )
			.catch( () => {
				// Not much we can tell the user at this point so let them try and auth again
				this.setState( { isAuthing: false } );
			} );
	};

	getAuthInstructions( isAuthing ) {
		if ( isAuthing ) {
			return __( 'Awaiting authorization', 'jetpack' );
		}

		return (
			<Fragment>
				<GooglePhotosLogo />
				<p>
					{ __(
						'To show your Google Photos library you need to connect your Google account.',
						'jetpack'
					) }
				</p>
				<p>{ __( 'You can remove the connection in either of these places:', 'jetpack' ) }</p>
				<ul>
					<li>
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://myaccount.google.com/security"
						>
							{ __( 'Google Security page', 'jetpack' ) }
						</a>
					</li>
					<li>
						<a
							target="_blank"
							rel="noopener noreferrer"
							href="https://wordpress.com/marketing/connections/"
						>
							{ __( 'WordPress.com Connections', 'jetpack' ) }
						</a>
					</li>
				</ul>
			</Fragment>
		);
	}

	setFilters = filters => {
		const currentQuery = this.getQuery( this.state.filters );

		this.setState( { filters }, () => {
			if ( currentQuery !== this.getQuery( filters ) ) {
				this.getNextPage( true );
			}
		} );
	};

	renderBreadcrumbs() {
		const { path } = this.props;

		return (
			<Fragment>
				<Button isTertiary onClick={ () => this.setPath( PATH_ROOT ) }>
					{ __( 'Albums', 'jetpack' ) }
				</Button>
				→ &nbsp; { path.name }
			</Fragment>
		);
	}

	render() {
		const { media, isLoading, pageHandle, requiresAuth, multiple, path } = this.props;
		const { isAuthing, filters } = this.state;
		const canChange = ! isImageOnly( this.props.allowedTypes );

		if ( requiresAuth ) {
			return (
				<div className="jetpack-external-media-auth">
					<p>{ this.getAuthInstructions( isAuthing ) }</p>
					<Button isPrimary disabled={ isAuthing } onClick={ this.onAuthorize }>
						{ __( 'Authorize', 'jetpack' ) }
					</Button>
				</div>
			);
		}

		return (
			<div className="jetpack-external-media-wrapper__google">
				<div className="jetpack-external-media-header__view">
					<SelectControl
						className="jetpack-external-media-header__select"
						label={ __( 'View', 'jetpack' ) }
						value={ path.ID !== PATH_RECENT ? PATH_ROOT : PATH_RECENT }
						disabled={ isLoading }
						options={ this.getPathOptions() }
						onChange={ this.setPath }
					/>

					{ path.ID === PATH_RECENT && (
						<GoogleFilterView
							filters={ filters }
							isLoading={ isLoading }
							setFilters={ this.setFilters }
							canChangeMedia={ canChange }
						/>
					) }
				</div>

				<div className="jetpack-external-media-header__filter">
					{ path.ID === PATH_RECENT && (
						<GoogleFilterOption
							filters={ filters }
							isLoading={ isLoading }
							setFilters={ this.setFilters }
							canChangeMedia={ canChange }
						/>
					) }
					{ path.ID !== PATH_RECENT && path.ID !== PATH_ROOT && this.renderBreadcrumbs() }
				</div>

				<MediaBrowser
					className="jetpack-external-media-browser__google"
					key={ this.getQuery( filters ) }
					media={ media }
					isLoading={ isLoading }
					nextPage={ this.getNextPage }
					onCopy={ this.onCopy }
					pageHandle={ pageHandle }
					multiple={ multiple }
					setPath={ this.setPath }
				/>
			</div>
		);
	}
}

export default withMedia()( GooglePhotosMedia );
