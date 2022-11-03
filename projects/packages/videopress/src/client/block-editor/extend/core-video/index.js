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

const handleJetpackCoreVideoDeprecation = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { block, isValid } = props;
		const { name, attributes, clientId } = block;
		const { guid, videoPressTracks, poster } = attributes;

		const { replaceBlock } = useDispatch( blockEditorStore );

		const [ ignoreBlockRecovery, setIgnoreBlockRecovery ] = useState();

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

		useEffect( () => {
			if ( ignoreBlockRecovery !== false ) {
				return;
			}

			if ( ! shouldHandleConvertion ) {
				return;
			}

			replaceBlock( clientId, createBlock( 'videopress/video', attributes ) );
		}, [ clientId, shouldHandleConvertion, ignoreBlockRecovery, attributes ] );

		if ( ! shouldHandleConvertion ) {
			return <BlockListBlock { ...props } />;
		}

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
	};
}, 'handleJetpackCoreVideoDeprecation' );

addFilter(
	'editor.BlockListBlock',
	'videopress/jetpack-videopress-deprecation',
	handleJetpackCoreVideoDeprecation
);
