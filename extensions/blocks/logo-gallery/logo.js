/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { IconButton, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { withSelect } from '@wordpress/data';
import { isBlobURL } from '@wordpress/blob';

class Logo extends Component {
	constructor() {
		super( ...arguments );

		this.onImageClick = this.onImageClick.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	onImageClick() {
		if ( ! this.props.isSelected ) {
			this.props.onSelect();
		}
	}

	onKeyDown( event ) {
		if (
			this.container === document.activeElement &&
			this.props.isSelected &&
			[ BACKSPACE, DELETE ].indexOf( event.keyCode ) !== -1
		) {
			event.stopPropagation();
			event.preventDefault();
			this.props.onRemove();
		}
	}

	componentDidUpdate() {
		const { image, url } = this.props;
		if ( image && ! url ) {
			this.props.setAttributes( {
				url: image.source_url,
				alt: image.alt_text,
			} );
		}
	}

	render() {
		const { url, alt, id, isSelected, onRemove, 'aria-label': ariaLabel } = this.props;

		const img = (
			// Disable reason: Image itself is not meant to be interactive, but should
			// direct image selection and unfocus link fields.
			/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
			<Fragment>
				<img
					src={ url }
					alt={ alt }
					data-id={ id }
					onClick={ this.onImageClick }
					tabIndex="0"
					onKeyDown={ this.onImageClick }
					aria-label={ ariaLabel }
				/>
				{ isBlobURL( url ) && <Spinner /> }
			</Fragment>
			/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
		);

		const className = classnames( {
			'is-selected': isSelected,
			'is-transient': isBlobURL( url ),
		} );

		// Disable reason: Each block can be selected by clicking on it and we should keep the same saved markup
		/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<figure
				className={ className }
				tabIndex="-1"
				onKeyDown={ this.onKeyDown }
				ref={ this.bindContainer }
			>
				{ isSelected && (
					<div className="logo-gallery-item__inline-menu">
						<IconButton
							icon="no-alt"
							onClick={ onRemove }
							className="logo-gallery-item__remove"
							label={ __( 'Remove Image' ) }
						/>
					</div>
				) }
				{ img }
			</figure>
		);
		/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default withSelect( ( select, ownProps ) => {
	const { getMedia } = select( 'core' );
	const { id } = ownProps;

	return {
		image: id ? getMedia( id ) : null,
	};
} )( Logo );
