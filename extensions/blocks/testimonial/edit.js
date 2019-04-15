/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import {
	RichText,
	BlockControls,
	AlignmentToolbar,
	MediaUpload,
	getFontSizeClass,
	withFontSizes,
	InspectorControls,
	FontSizePicker,
} from '@wordpress/editor';
import { Tooltip, Toolbar, PanelBody } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import classnames from 'classnames';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { __ } from '../../utils/i18n';
import './editor.scss';

const getKeyDownHandler = callback => event => {
	// Accept only Enter and Space keys
	if ( event.key === 'Enter' || event.key === ' ' ) {
		callback( event );
	}
};

class TestimonialBlock extends Component {
	onChangeName = value => void this.props.setAttributes( { name: value } );
	onChangeTitle = value => void this.props.setAttributes( { title: value } );
	onChangeContent = value => void this.props.setAttributes( { content: value } );
	onChangeAlign = value => void this.props.setAttributes( { align: value } );
	onChangeMedia = media =>
		void this.props.setAttributes( { mediaUrl: media.url, mediaId: media.id } );

	render() {
		const { attributes, isSelected, fontSize, setFontSize } = this.props;
		const hasMedia = attributes.mediaUrl && attributes.mediaId;
		const avatarTooltip = hasMedia ? __( 'Change avatar' ) : __( 'Add avatar' );
		const fontSizeClass = getFontSizeClass( attributes.fontSize );
		const styles = {
			fontSize: fontSizeClass ? undefined : attributes.customFontSize,
		};
		const className = classnames( this.props.className, {
			'has-media': hasMedia || isSelected,
			[ `is-aligned-${ attributes.align }` ]: !! attributes.align,
			[ fontSizeClass ]: fontSizeClass,
		} );

		return (
			<Fragment>
				<BlockControls>
					<AlignmentToolbar value={ attributes.align } onChange={ this.onChangeAlign } />
					<MediaUpload
						allowedTypes={ [ 'image' ] }
						onSelect={ this.onChangeMedia }
						value={ attributes.mediaId }
						render={ ( { open } ) => (
							<Toolbar
								controls={ filter( [
									{
										icon: 'edit',
										title: avatarTooltip,
										onClick: open,
									},
									hasMedia && {
										icon: 'no-alt',
										title: __( 'Remove avatar' ),
										onClick: () => this.props.setAttributes( { mediaId: null, mediaUrl: null } ),
									},
								] ) }
							/>
						) }
					/>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Size Settings' ) } className="blocks-font-size">
						<FontSizePicker value={ fontSize.size } onChange={ setFontSize } />
					</PanelBody>
				</InspectorControls>
				<div style={ styles } className={ className }>
					<RichText
						tagName="div"
						value={ attributes.content }
						onChange={ this.onChangeContent }
						placeholder={
							// translators: placeholder text used for the quote
							__( 'Write testimonial…' )
						}
						wrapperClassName="wp-block-jetpack-testimonial__content"
					/>
					<div className="wp-block-jetpack-testimonial__author">
						{ ( isSelected || hasMedia ) && (
							<MediaUpload
								allowedTypes={ [ 'image' ] }
								onSelect={ this.onChangeMedia }
								value={ attributes.mediaId }
								render={ ( { open } ) => (
									<Tooltip text={ avatarTooltip }>
										<div
											className={ classnames( 'wp-block-jetpack-testimonial__media', {
												'is-placeholder': ! hasMedia,
											} ) }
											onClick={ open }
											onKeyDown={ getKeyDownHandler( open ) }
											role="button"
											tabIndex="0"
										>
											{ hasMedia && (
												<img
													src={ attributes.mediaUrl }
													width={ 50 }
													height={ 50 }
													alt={ attributes.name || '' }
												/>
											) }
										</div>
									</Tooltip>
								) }
							/>
						) }

						{ ( isSelected || attributes.name || attributes.title ) && (
							<div className="wp-block-jetpack-testimonial__meta">
								{ ( isSelected || attributes.name ) && (
									<RichText
										tagName="div"
										value={ attributes.name }
										onChange={ this.onChangeName }
										placeholder={ 'Write name…' }
										wrapperClassName="wp-block-jetpack-testimonial__name"
									/>
								) }
								{ ( isSelected || attributes.title ) && (
									<RichText
										tagName="div"
										value={ attributes.title }
										onChange={ this.onChangeTitle }
										placeholder={ 'Write title…' }
										wrapperClassName="wp-block-jetpack-testimonial__title"
									/>
								) }
							</div>
						) }
					</div>
				</div>
			</Fragment>
		);
	}
}

const TestimonialEdit = compose( [ withFontSizes( 'fontSize' ) ] )( TestimonialBlock );

export default TestimonialEdit;
