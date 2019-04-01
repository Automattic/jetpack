/**
 * External dependencies
 */
import { RichText } from '@wordpress/editor';

/**
 * Internal dependencies
 */
//import { __ } from '../../utils/i18n';

export default ( { attributes: { name, title, content, mediaUrl, mediaId }, className } ) => (
	<div className={ className }>
		<RichText.Content
			tagName="DIV"
			className="wp-block-jetpack-testimonial__content"
			value={ content }
		/>
		{ mediaId && mediaUrl && <img src={ mediaUrl } alt="" /> }
		{ name && (
			<RichText.Content
				tagName="DIV"
				className="wp-block-jetpack-testimonial__name"
				value={ name }
			/>
		) }
		{ title && (
			<RichText.Content
				tagName="DIV"
				className="wp-block-jetpack-testimonial__title"
				value={ title }
			/>
		) }
	</div>
);
