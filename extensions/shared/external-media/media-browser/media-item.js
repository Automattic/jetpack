/**
 * External dependencies
 */

import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

class MediaItem extends Component {
	onClick = () => {
		if ( this.props.onClick ) {
			this.props.onClick( this.props.item );
		}
	};

	render() {
		const { item, isSelected, isCopying = false } = this.props;
		const { thumbnails, caption, name, title, type, children = 0 } = item;
		const { medium = null, fmt_hd = null } = thumbnails;
		const alt = title || caption || name;
		const classes = classnames( {
			'media-browser__media__item': true,
			'media-browser__media__item__selected': isSelected,
			'media-browser__media__folder': type === 'folder',
			'is-transient': isSelected && isCopying,
		} );

		/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
		return (
			<button className={ classes } onClick={ this.onClick }>
				<img src={ medium || fmt_hd } alt={ alt } title={ alt } />

				{ type === 'folder' && (
					<div className="media-browser__media__info">
						<div className="media-browser__media__name">{ name }</div>
						<div className="media-browser__media__count">{ children }</div>
					</div>
				) }

				{ isSelected && isCopying && <Spinner /> }
			</button>
		);
	}
}

export default MediaItem;
