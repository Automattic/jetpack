/**
 * External dependencies
 */
import classNames from 'classnames';

export default ( { attributes: { images, logoSize }, className } ) => (
	<ul className={ classNames( className, `is-${ logoSize }` ) }>
		{ images.map( image => {
			const img = (
				<img
					src={ image.url }
					alt={ image.alt }
					data-id={ image.id }
					data-link={ image.link }
					className={ image.id ? `wp-image-${ image.id }` : null }
				/>
			);

			return (
				<li key={ image.id || image.url } className="logo-gallery-item">
					<figure>{ img }</figure>
				</li>
			);
		} ) }
	</ul>
);
