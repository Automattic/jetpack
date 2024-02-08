/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Warning, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, ExternalLink } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useEffect, createInterpolateElement, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import React from 'react';
/**
 * Internal dependencies
 */
import '../editor.scss';

const extendCoreVideoBlock = ( settings, name ) => {
	if ( name !== 'core/video' ) {
		return settings;
	}

	/*
	 * Populate attributes with some Jetpack VideoPress core/video ones,
	 * needed when trying to convert the block to the new VideoPress Video block.
	 */
	return {
		...settings,
		attributes: {
			...settings.attributes,
			guid: {
				type: 'string',
			},
			poster: {
				type: 'string',
			},
			videoPressTracks: {
				type: 'array',
				items: {
					type: 'object',
				},
				default: [],
			},
			keepUsingCoreVideoVideoPressBlock: {
				type: 'boolean',
			},
		},
	};
};

addFilter(
	'blocks.registerBlockType',
	'videopress/core-video/handle-block-conversion',
	extendCoreVideoBlock
);

/**
 * Organize the block attributes for the new videopress/video block
 *
 * @param {object} attributes        - core/video block attributes
 * @param {object} defaultAttributes - default core/video block attributes
 * @returns {object}                   The new attributes
 */
function getVideoPressVideoBlockAttributes( attributes, defaultAttributes ) {
	const attrs = attributes || defaultAttributes;

	// Update attributes names to match the new VideoPress Video block.
	if ( attrs?.videoPressTracks ) {
		attrs.tracks = attrs.videoPressTracks || [];
		delete attrs.videoPressTracks;
	}

	if ( attrs?.isVideoPressExample ) {
		attrs.isExample = attrs.isVideoPressExample || [];
		delete attrs.isVideoPressExample;
	}

	return attrs;
}

/**
 * JetpackCoreVideoDeprecation component.
 *
 * @param {object} props                - component props
 * @param {object} props.BlockListBlock - BlockListBlock
 * @returns {React.ReactNode}             BlockListBlock if the block is valid, or the recovery warning.
 */
function JetpackCoreVideoDeprecation( { BlockListBlock, ...props } ) {
	const { block } = props;
	const { attributes, clientId, __unstableBlockSource } = block;
	const { poster } = attributes;
	const { replaceBlock } = useDispatch( blockEditorStore );
	const [ ignoreBlockRecovery, setIgnoreBlockRecovery ] = useState();

	useEffect( () => {
		if ( ignoreBlockRecovery !== false ) {
			return;
		}

		replaceBlock(
			clientId,
			createBlock(
				'videopress/video',
				getVideoPressVideoBlockAttributes( __unstableBlockSource?.attrs, attributes )
			)
		);
	}, [ clientId, ignoreBlockRecovery, attributes, __unstableBlockSource ] );

	const moreAboutVideoPress = createInterpolateElement(
		__(
			'This block contains unexpected or invalid content, and it seems to be a <moreAboutVideoPressLink>VideoPress video block</moreAboutVideoPressLink> instance.',
			'jetpack-videopress-pkg'
		),
		{
			moreAboutVideoPressLink: <ExternalLink href={ getRedirectUrl( 'jetpack-videopress' ) } />,
		}
	);

	if ( ! ignoreBlockRecovery ) {
		return (
			<div>
				<Warning
					className="extended-block-warning"
					actions={ [
						<Button
							key="convert"
							variant="primary"
							onClick={ () => setIgnoreBlockRecovery( false ) }
						>
							{ __( 'Attempt VideoPress Block Recovery', 'jetpack-videopress-pkg' ) }
						</Button>,
						<Button
							key="ignore"
							variant="tertiary"
							onClick={ () => setIgnoreBlockRecovery( true ) }
						>
							{ __( 'Skip', 'jetpack-videopress-pkg' ) }
						</Button>,
					] }
				>
					{ moreAboutVideoPress }
					{ poster && (
						<p className="wp-extended-block-wrapper is-disabled">
							<p className="extended-block-player__overlay" />
							<span class="videoplayer-play" aria-hidden="true" />
							<img
								src={ poster }
								alt={ __( 'VideoPress Video Block', 'jetpack-videopress-pkg' ) }
							/>
						</p>
					) }
				</Warning>
			</div>
		);
	}

	return <BlockListBlock { ...props } />;
}

const handleJetpackCoreVideoDeprecation = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { block, isValid } = props;
		const { name, attributes } = block;
		const { guid, videoPressTracks } = attributes;

		/*
		 * We try to recognize core/video Jetpack VideoPress block,
		 * based on some of its attributes.
		 */
		const isCoreVideoVideoPressBlock = guid && videoPressTracks;

		const shouldHandleConvertion = !! (
			name === 'core/video' &&
			! isValid &&
			isCoreVideoVideoPressBlock
		);

		// CAUTION: code added before this line will be executed for all blocks
		// (also on typing), not just video blocks.
		if ( ! shouldHandleConvertion ) {
			return <BlockListBlock { ...props } />;
		}

		return <JetpackCoreVideoDeprecation { ...props } BlockListBlock={ BlockListBlock } />;
	};
}, 'handleJetpackCoreVideoDeprecation' );

addFilter(
	'editor.BlockListBlock',
	'videopress/jetpack-videopress-deprecation',
	handleJetpackCoreVideoDeprecation
);
