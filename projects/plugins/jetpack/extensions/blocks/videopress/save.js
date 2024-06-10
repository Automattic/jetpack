import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import clsx from 'clsx';
import { getVideoPressUrl } from './url';

const VideoPressSave = CoreVideoSave => props => {
	const {
		attributes: {
			autoplay,
			caption,
			controls,
			guid,
			loop,
			muted,
			playsinline,
			poster,
			preload,
			videoPressClassNames,
			className,
			align,
			seekbarColor,
			seekbarPlayedColor,
			seekbarLoadingColor,
			useAverageColor,
			maxWidth,
		} = {},
	} = props;

	const blockProps = useBlockProps.save( {
		className: clsx( 'wp-block-video', className, videoPressClassNames, {
			[ `align${ align }` ]: align,
		} ),
	} );

	if ( ! guid ) {
		/**
		 * We return the element produced by the render so Gutenberg can add the block class when cloning the element.
		 * This is due to the fact that `React.cloneElement` ignores the class name when we clone a component to be
		 * rendered (i.e. `React.cloneElement( <CoreVideoSave { ...props } />, { className: 'wp-block-video' } )`).
		 *
		 * @see https://github.com/WordPress/gutenberg/blob/3f1324b53cc8bb45d08d12d5321d6f88510bed09/packages/blocks/src/api/serializer.js#L78-L96
		 * @see https://github.com/WordPress/gutenberg/blob/c5f9bd88125282a0c35f887cc8d835f065893112/packages/editor/src/hooks/generated-class-name.js#L42
		 * @see https://github.com/Automattic/wp-calypso/pull/30546#issuecomment-463637946
		 */
		return CoreVideoSave( props );
	}

	const url = getVideoPressUrl( guid, {
		autoplay,
		controls,
		loop,
		muted,
		playsinline,
		poster,
		preload,
		seekbarColor,
		seekbarPlayedColor,
		seekbarLoadingColor,
		useAverageColor,
	} );

	let embedWrapperStyle = {};
	if ( maxWidth && maxWidth.length > 0 && '100%' !== maxWidth ) {
		embedWrapperStyle = {
			maxWidth,
			margin: 'auto',
		};
	}

	return (
		<figure { ...blockProps }>
			<div className="wp-block-embed__wrapper" style={ embedWrapperStyle }>
				{ `\n${ url }\n` /* URL needs to be on its own line. */ }
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
};

export default createHigherOrderComponent( VideoPressSave, 'withVideoPressSave' );
