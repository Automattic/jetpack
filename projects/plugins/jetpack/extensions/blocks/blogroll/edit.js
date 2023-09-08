import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { FlexBlock, Spinner } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import BlogrollAppender from './components/blogroll-appender';
import useRecommendations from './use-recommendations';
import useSubscriptions from './use-subscriptions';
import { createBlockFromRecommendation } from './utils';
import './editor.scss';

export function BlogRollEdit( { className, attributes, setAttributes, clientId } ) {
	const { ignore_user_blogs, load_placeholders } = attributes;

	const { isLoading, recommendations } = useRecommendations();
	const { subscriptions } = useSubscriptions( { ignore_user_blogs } );

	const { replaceInnerBlocks } = dispatch( 'core/block-editor' );

	useEffect( () => {
		if ( load_placeholders && recommendations.length ) {
			setAttributes( { load_placeholders: false } );

			const blocks = [
				createBlock( 'core/heading', { content: __( 'Blogroll', 'jetpack' ), level: 3 } ),
				...recommendations.map( createBlockFromRecommendation ),
			];
			replaceInnerBlocks( clientId, blocks );
		}
	}, [ recommendations, load_placeholders, setAttributes, clientId, replaceInnerBlocks ] );

	return (
		<div { ...useBlockProps() } className={ className }>
			<InnerBlocks
				template={ [ [ 'core/heading', { content: __( 'Blogroll', 'jetpack' ), level: 3 } ] ] }
				allowedBlocks={ [ 'jetpack/blogroll-item' ] }
				renderAppender={ () => (
					<BlogrollAppender clientId={ clientId } subscriptions={ subscriptions } />
				) }
			/>

			{ load_placeholders && isLoading && (
				<FlexBlock style={ { padding: '30px', textAlign: 'center' } }>
					<Spinner />
				</FlexBlock>
			) }
		</div>
	);
}

export default BlogRollEdit;
