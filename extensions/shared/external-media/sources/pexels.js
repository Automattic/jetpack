/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { TextControl, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */

import { SOURCE_PEXELS } from '../constants';
import withMedia from './with-media';
import MediaBrowser from '../media-browser';
import { getApiUrl } from './api';

class PexelsMedia extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			search: this.getInitialSearch(),
			searched: '',
		};
	}

	componentDidMount() {
		this.getNextPage();
	}

	getInitialSearch() {
		const defaultSearch = [
			'mountain',
			'ocean',
			'river',
			'clouds',
			'pattern',
			'shapes',
			'abstract',
			'sky',
		];

		// eslint-disable-next-line no-restricted-syntax
		return defaultSearch[ Math.floor( Math.random() * defaultSearch.length ) ];
	}

	getNextPage = reset => {
		if ( this.state.search ) {
			this.props.getMedia(
				getApiUrl( 'list', SOURCE_PEXELS, {
					number: 20,
					path: 'recent',
					search: this.state.search,
				} ),
				reset ? true : false
			);
		}
	};

	onCopy = items => {
		this.props.copyMedia( items, getApiUrl( 'copy', SOURCE_PEXELS ) );
	};

	onChange = search => {
		this.setState( { search } );
	};

	onSearch = ev => {
		ev.preventDefault();

		this.setState( { searched: this.state.search }, () => {
			this.getNextPage( true );
		} );
	};

	render() {
		const { media, isLoading, pageHandle, multiple } = this.props;

		return (
			<div className="jetpack-external-media-wrapper__pexels">
				<form className="jetpack-external-media-header__pexels" onSubmit={ this.onSearch }>
					<TextControl value={ this.state.search } onChange={ this.onChange } />
					<Button isPrimary onClick={ this.onSearch } type="submit">
						{ __( 'Search', 'jetpack' ) }
					</Button>
				</form>

				<MediaBrowser
					key={ this.state.searched }
					className="jetpack-external-media-browser__pexels"
					media={ media }
					isLoading={ isLoading }
					nextPage={ this.getNextPage }
					onCopy={ this.onCopy }
					pageHandle={ pageHandle }
					multiple={ multiple }
				/>
			</div>
		);
	}
}

export default withMedia()( PexelsMedia );
