/**
 * External dependencies
 */
import { RichText, getFontSizeClass } from '@wordpress/editor';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
//import { __ } from '../../utils/i18n';

export default ( { attributes, className } ) => {
	const { align, content, name, title, mediaUrl, mediaId, fontSize, customFontSize } = attributes;
	const hasMedia = mediaUrl && mediaId;
	const fontSizeClass = getFontSizeClass( fontSize );
	const styles = {
		fontSize: fontSizeClass ? undefined : customFontSize,
	};
	const blockClassName = classnames( className, {
		'has-media': hasMedia,
		[ `is-aligned-${ align }` ]: !! align,
		[ fontSizeClass ]: fontSizeClass,
	} );

	return (
		<div className={ blockClassName } style={ styles }>
			<RichText.Content
				tagName="div"
				className="wp-block-jetpack-testimonial__content"
				value={ content }
			/>
			<div className="wp-block-jetpack-testimonial__author">
				{ hasMedia && (
					<img
						src={ mediaUrl }
						width={ 50 }
						height={ 50 }
						alt={ name || '' }
						className={ classnames(
							'wp-block-jetpack-testimonial__media',
							`wp-image-${ mediaId }`
						) }
					/>
				) }

				{ ( name || title ) && (
					<div className="wp-block-jetpack-testimonial__meta">
						{ name && (
							<RichText.Content
								tagName="div"
								className="wp-block-jetpack-testimonial__name"
								value={ name }
							/>
						) }
						{ title && (
							<RichText.Content
								tagName="div"
								className="wp-block-jetpack-testimonial__title"
								value={ title }
							/>
						) }
					</div>
				) }
			</div>
		</div>
	);
};
