import { isBlobURL } from '@wordpress/blob';
import { Button, Spinner } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import clsx from 'clsx';
import { close, downChevron, leftChevron, rightChevron, upChevron } from '../icons';

class GalleryImageEdit extends Component {
	img = createRef();

	onImageClick = () => {
		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}
	};

	onImageKeyDown = event => {
		if (
			this.img.current === document.activeElement &&
			this.props.isSelected &&
			[ BACKSPACE, DELETE ].includes( event.keyCode )
		) {
			this.props.onRemove();
		}
	};

	componentDidUpdate() {
		const { alt, height, image, link, url, width } = this.props;

		if ( image ) {
			const nextAtts = {};

			if ( ! alt && image.alt_text ) {
				nextAtts.alt = image.alt_text;
			}
			if ( ! height && image.media_details && image.media_details.height ) {
				nextAtts.height = +image.media_details.height;
			}
			if ( ! link && image.link ) {
				nextAtts.link = image.link;
			}
			if ( ! url && image.source_url ) {
				nextAtts.url = image.source_url;
			}
			if ( ! width && image.media_details && image.media_details.width ) {
				nextAtts.width = +image.media_details.width;
			}

			if ( Object.keys( nextAtts ).length ) {
				this.props.setAttributes( nextAtts );
			}
		}
	}

	render() {
		const {
			'aria-label': ariaLabel,
			alt,
			columns,
			height,
			id,
			imageFilter,
			isFirstItem,
			isLastItem,
			isSelected,
			link,
			linkTo,
			onMoveBackward,
			onMoveForward,
			onRemove,
			origUrl,
			showMovers,
			srcSet,
			url,
			width,
		} = this.props;

		let href;

		switch ( linkTo ) {
			case 'media':
				href = origUrl;
				break;
			case 'attachment':
				href = link;
				break;
		}

		const isTransient = isBlobURL( origUrl );

		const img = (
			// Disable reason: Image itself is not meant to be interactive, but should
			// direct image selection and unfocus caption fields.
			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
			<Fragment>
				<img
					alt={ alt }
					aria-label={ ariaLabel }
					data-height={ height }
					data-id={ id }
					data-link={ link }
					data-url={ origUrl }
					data-width={ width }
					onClick={ this.onImageClick }
					onKeyDown={ this.onImageKeyDown }
					ref={ this.img }
					src={ isTransient ? undefined : url }
					srcSet={ isTransient ? undefined : srcSet }
					tabIndex="0"
					style={ isTransient ? { backgroundImage: `url(${ origUrl })` } : undefined }
				/>
				{ isTransient && <Spinner /> }
			</Fragment>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
		);

		// Disable reason: Each block can be selected by clicking on it and we should keep the same saved markup
		return (
			<figure
				className={ clsx( 'tiled-gallery__item', {
					'is-selected': isSelected,
					'is-transient': isTransient,
					[ `filter__${ imageFilter }` ]: !! imageFilter,
				} ) }
			>
				{ showMovers && (
					<div className="tiled-gallery__item__move-menu">
						<Button
							icon={ columns === 1 ? upChevron : leftChevron }
							onClick={ isFirstItem ? undefined : onMoveBackward }
							className="tiled-gallery__item__move-backward"
							label={ __( 'Move image backward', 'jetpack' ) }
							aria-disabled={ isFirstItem }
							disabled={ ! isSelected }
						/>
						<Button
							icon={ columns === 1 ? downChevron : rightChevron }
							onClick={ isLastItem ? undefined : onMoveForward }
							className="tiled-gallery__item__move-forward"
							label={ __( 'Move image forward', 'jetpack' ) }
							aria-disabled={ isLastItem }
							disabled={ ! isSelected }
						/>
					</div>
				) }
				<div className="tiled-gallery__item__inline-menu">
					<Button
						icon={ close }
						onClick={ onRemove }
						className="tiled-gallery__item__remove"
						label={ __( 'Remove image', 'jetpack' ) }
						disabled={ ! isSelected }
					/>
				</div>
				{ /* Keep the <a> HTML structure, but ensure there is no navigation from edit */
				/* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
				{ href ? <a>{ img }</a> : img }
			</figure>
		);
	}
}

export default withSelect( ( select, ownProps ) => {
	const { getMedia } = select( 'core' );
	const { id } = ownProps;

	return {
		image: id ? getMedia( id ) : null,
	};
} )( GalleryImageEdit );
