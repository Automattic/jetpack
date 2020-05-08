/**
 * External dependencies
 */

import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import { Component, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import MediaPlaceholder from './placeholder';
import MediaItem from './media-item';

const MAX_SELECTED = 10;

class MediaBrowser extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			selected: [],
		};
	}

	renderPlaceholders() {
		return (
			<Fragment>
				<MediaPlaceholder />
				<MediaPlaceholder />
				<MediaPlaceholder />
			</Fragment>
		);
	}

	onSelectImage = newlySelected => {
		const { selected } = this.state;
		let newSelected = [ newlySelected ];

		if ( newlySelected.type === 'folder' ) {
			this.props.setPath( newlySelected.ID );
		} else if ( this.props.multiple ) {
			newSelected = selected.slice( 0, MAX_SELECTED - 1 ).concat( newlySelected );

			if ( selected.find( item => newlySelected.ID === item.ID ) ) {
				newSelected = selected.filter( item => item.ID !== newlySelected.ID );
			}
		} else if ( selected.length === 1 && newlySelected.ID === selected[ 0 ].ID ) {
			newSelected = [];
		}

		this.setState( { selected: newSelected } );
	};

	onCopy = () => {
		this.props.onCopy( this.state.selected );
	};

	onNextPage = () => {
		this.props.nextPage();
	};

	renderEmpty() {
		return (
			<div className="media-browser__empty">
				<p>{ __( 'We found nothing.' ) }</p>
			</div>
		);
	}

	render() {
		const { media, isLoading, pageHandle } = this.props;
		const { selected } = this.state;
		const hasMediaItems = media.filter( item => item.type !== 'folder' ).length > 0;
		const classes = classnames( {
			'media-browser__media': true,
			'media-browser__media__loading': isLoading,
		} );
		const wrapper = classnames( {
			'media-browser': true,
			[ this.props.className ]: true,
		} );

		return (
			<div className={ wrapper }>
				<div className={ classes }>
					{ media.map( item => (
						<MediaItem
							item={ item }
							key={ item.ID }
							onClick={ this.onSelectImage }
							isSelected={ selected.find( toFind => toFind.ID === item.ID ) }
						/>
					) ) }

					{ media.length === 0 && ! isLoading && this.renderEmpty() }
					{ isLoading && this.renderPlaceholders() }

					{ pageHandle && ! isLoading && (
						<Button
							isLarge
							isSecondary
							className="media-browser__loadmore"
							disabled={ isLoading }
							onClick={ this.onNextPage }
						>
							{ __( 'Load More' ) }
						</Button>
					) }
				</div>

				{ hasMediaItems && (
					<div className="media-browser__media__toolbar">
						<Button isPrimary isLarge disabled={ selected.length === 0 } onClick={ this.onCopy }>
							{ __( 'Copy & Insert' ) }
						</Button>
					</div>
				) }
			</div>
		);
	}
}

export default MediaBrowser;
