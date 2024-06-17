import { InspectorControls, useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { PanelBody, ToggleControl, FlexBlock, Spinner, Notice } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import BlogrollAppender from './components/blogroll-appender';
import useRecommendations from './use-recommendations';
import { useSiteRecommendationSync } from './use-site-recommendations';
import useSubscriptions from './use-subscriptions';
import { createBlockFromRecommendation } from './utils';
import './editor.scss';

export function BlogRollEdit( { className, attributes, setAttributes, clientId } ) {
	const {
		show_avatar,
		show_description,
		open_links_new_window,
		ignore_user_blogs,
		load_placeholders,
	} = attributes;

	const {
		isLoading: isLoadingRecommendations,
		recommendations,
		errorMessage: recommendationsErrorMessage,
	} = useRecommendations( load_placeholders );
	const {
		isLoading: isLoadingSubscriptions,
		subscriptions,
		errorMessage: subscriptionsErrorMessage,
	} = useSubscriptions( {
		ignore_user_blogs,
	} );
	useSiteRecommendationSync( { clientId } );
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

	const blockProps = useBlockProps( {
		className: clsx( className, {
			'hide-avatar': ! show_avatar,
			'hide-description': ! show_description,
		} ),
	} );

	const errorMessage = recommendationsErrorMessage || subscriptionsErrorMessage;

	return (
		<div { ...blockProps }>
			<InnerBlocks
				template={ [ [ 'core/heading', { content: __( 'Blogroll', 'jetpack' ), level: 3 } ] ] }
				allowedBlocks={ [ 'jetpack/blogroll-item' ] }
				renderAppender={ () =>
					! isLoadingRecommendations && (
						<BlogrollAppender
							isLoading={ isLoadingSubscriptions }
							subscriptions={ subscriptions }
							clientId={ clientId }
						/>
					)
				}
			/>

			{ errorMessage && (
				<Notice status="error" isDismissible={ false }>
					<p>{ errorMessage }</p>
				</Notice>
			) }

			{ load_placeholders && isLoadingRecommendations && (
				<FlexBlock style={ { padding: '30px', textAlign: 'center' } }>
					<Spinner />
				</FlexBlock>
			) }

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Show avatar', 'jetpack' ) }
						checked={ !! show_avatar }
						onChange={ () => setAttributes( { show_avatar: ! show_avatar } ) }
					/>
					<ToggleControl
						label={ __( 'Show description', 'jetpack' ) }
						checked={ !! show_description }
						onChange={ () => setAttributes( { show_description: ! show_description } ) }
					/>
					<ToggleControl
						label={ __( 'Open links in a new window', 'jetpack' ) }
						checked={ !! open_links_new_window }
						onChange={ () => setAttributes( { open_links_new_window: ! open_links_new_window } ) }
					/>
					<ToggleControl
						label={ __( 'Hide my own sites', 'jetpack' ) }
						checked={ !! ignore_user_blogs }
						onChange={ () => setAttributes( { ignore_user_blogs: ! ignore_user_blogs } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

export default BlogRollEdit;
