/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Component, Fragment, __experimentalCreateInterpolateElement } from '@wordpress/element';
import { SelectControl, Button, Path, SVG } from '@wordpress/components';

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
				<SVG
					xmlns="http://www.w3.org/2000/svg"
					width="128"
					height="128"
					viewBox="135.688 36.52 511.623 510.753"
				>
					<Path
						fill="#DD4B39"
						stroke="#DD4B39"
						d="M391.6 36.6c1.4.8 2.6 2 3.7 3.2 41.3 41.5 82.7 83 123.899 124.6-26 25.6-51.6 51.6-77.399 77.3-9.7 9.8-19.601 19.4-29.2 29.4-7.2-17.4-14.1-34.9-21-52.4 0-18.2.1-36.4 0-54.7-.1-42.4-.2-84.9 0-127.4z"
					/>
					<Path
						fill="#EF851C"
						stroke="#EF851C"
						d="M263.5 164h128.1c.1 18.3 0 36.5 0 54.7-7.1 17.2-14 34.5-20.8 51.9-2.2-1.2-3.8-3-5.5-4.8L263.9 164.4l-.4-.4z"
					/>
					<Path
						fill="#7E3794"
						stroke="#7E3794"
						d="M519.199 164.4l.4-.3c-.1 42.6-.1 85.3 0 127.9h-55.1c-17.2-7.2-34.601-13.8-51.9-20.9 9.6-10 19.5-19.6 29.2-29.4 25.801-25.7 51.4-51.7 77.4-77.3z"
					/>
					<Path
						fill="#FFBB1B"
						stroke="#FFBB1B"
						d="M242.6 185.5c7.2-6.9 13.9-14.3 21.3-21.1l101.4 101.4c1.7 1.8 3.3 3.6 5.5 4.8-2.3 1.7-5.2 2.3-7.8 3.5-14.801 6-29.801 11.6-44.5 18-18.301-.2-36.601-.1-54.9-.1-42.6-.1-85.2.2-127.8-.1 35.5-35.6 71.2-71 106.8-106.4z"
					/>
					<Path
						fill="#1A8763"
						stroke="#1A8763"
						d="M263.6 292c18.3 0 36.6-.1 54.9.1 17.3 7.1 34.6 13.8 51.899 20.8C342 341.7 313.3 370.1 284.8 398.8c-7.2 6.8-13.7 14.3-21.3 20.7 0-42.5-.1-85 .1-127.5z"
					/>
					<Path
						fill="#427FED"
						stroke="#427FED"
						d="M464.5 292h55.1c42.5.1 85.1-.1 127.6.1-27.3 27.7-55 55.1-82.399 82.6-15.2 15.1-30.2 30.399-45.4 45.3-34-34.4-68.5-68.4-102.6-102.8-1.4-1.5-2.9-2.8-4.601-3.8 2.9-1.801 6.101-2.7 9.2-4 14.4-5.8 28.799-11.4 43.1-17.4z"
					/>
					<Path
						fill="#65B045"
						stroke="#65B045"
						d="M370.4 312.9c7.3 17.399 13.9 35 21.2 52.399-.1 18.2 0 36.5-.1 54.7v88c-.2 13.1.3 26.2-.2 39.2-2.101-1-3.4-2.9-5.101-4.5C345.3 501.6 304.5 460.5 263.5 419.5c7.6-6.4 14.1-13.9 21.3-20.7 28.5-28.7 57.2-57.1 85.6-85.9z"
					/>
					<Path
						fill="#43459D"
						stroke="#43459D"
						d="M412.199 313.4c1.7 1 3.2 2.3 4.601 3.8 34.1 34.4 68.6 68.4 102.6 102.8-42.7-.1-85.3.1-127.899 0 .1-18.2 0-36.5.1-54.7 6.699-17.3 13.899-34.5 20.598-51.9z"
					/>
				</SVG>
				<p>
					{ __(
						'To show your Google Photos library you need to connect your Google account.',
						'jetpack'
					) }
				</p>
				<p>
					{ __experimentalCreateInterpolateElement(
						__(
							'You can remove the connection either on your <googleLink>Google Security page</googleLink> or in <connectionLink>WordPress.com Connections</connectionLink>.',
							'jetpack'
						),
						{
							googleLink: (
								<a
									target="_blank"
									rel="noopener noreferrer"
									href="https://myaccount.google.com/security"
								/>
							),
							connectionLink: (
								<a
									target="_blank"
									rel="noopener noreferrer"
									href="https://wordpress.com/marketing/connections/"
								/>
							),
						}
					) }
				</p>
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
				<div className="a8c-media-auth">
					<p>{ this.getAuthInstructions( isAuthing ) }</p>
					<Button isPrimary disabled={ isAuthing } onClick={ this.onAuthorize }>
						{ __( 'Authorize', 'jetpack' ) }
					</Button>
				</div>
			);
		}

		return (
			<div className="a8c-media-wrapper__google">
				<div className="a8c-media-header__view">
					<SelectControl
						className="a8c-media-header__select"
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

				<div className="a8c-media-header__filter">
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
					className="a8c-media-browser__google"
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
