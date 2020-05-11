/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { SelectControl, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SOURCE_GOOGLE_PHOTOS, PATH_RECENT, PATH_ROOT } from '../../constants';
import MediaBrowser from '../../media-browser';
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
		const { media, isLoading, pageHandle, multiple, path } = this.props;
		const { filters } = this.state;
		const canChange = ! isImageOnly( this.props.allowedTypes );

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

export default GooglePhotosMedia;
