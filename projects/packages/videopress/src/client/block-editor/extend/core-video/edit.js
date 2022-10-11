/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { Warning, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, ExternalLink } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const withJetpackVideoPressBlockEdit = createHigherOrderComponent( JetpackCoreVideoBlockEdit => {
	return props => {
		const { clientId } = props;
		const { attributes, setAttributes } = props;
		const { guid, keepUsingCoreVideoVideoPressBlock } = attributes;
		const { replaceBlock } = useDispatch( blockEditorStore );

		useEffect( () => {
			if ( keepUsingCoreVideoVideoPressBlock !== false ) {
				return;
			}

			replaceBlock(
				clientId,
				createBlock( 'videopress/video', {
					...attributes,
					guid,
				} )
			);
		}, [ keepUsingCoreVideoVideoPressBlock, guid ] );

		// Check if the block is a core/video block.
		if ( props.name !== 'core/video' ) {
			return <JetpackCoreVideoBlockEdit { ...props } />;
		}

		// ... and if it contains `guid` attribute...
		if ( ! guid ) {
			return <JetpackCoreVideoBlockEdit { ...props } />;
		}

		// ... and if the user has already decided to keep using the core/video variation.
		if ( keepUsingCoreVideoVideoPressBlock === true ) {
			return <JetpackCoreVideoBlockEdit { ...props } />;
		}

		const moreAboutVideoPress = createInterpolateElement(
			__(
				'There is <moreAboutVideoPressLink>a new VideoPress video block</moreAboutVideoPressLink> available',
				'jetpack-videopress-pkg'
			),
			{
				moreAboutVideoPressLink: (
					<ExternalLink href={ getRedirectUrl( 'jetpack-videopress-about-page' ) } />
				),
			}
		);

		return (
			<div>
				<Warning
					className="videopress-video-warning"
					actions={ [
						<Button
							key="convert"
							variant="primary"
							onClick={ () => setAttributes( { keepUsingCoreVideoVideoPressBlock: false } ) }
						>
							{ __( 'Use VideoPress Video block', 'jetpack-videopress-pkg' ) }
						</Button>,
						<Button
							key="convert"
							variant="tertiary"
							onClick={ () => setAttributes( { keepUsingCoreVideoVideoPressBlock: true } ) }
						>
							{ __( 'Keep using the current VideoPress block', 'jetpack-videopress-pkg' ) }
						</Button>,
					] }
				>
					{ moreAboutVideoPress }
				</Warning>

				<div className="wp-block-core-video-wrapper is-disabled">
					<div className="core-video-videopress-player__overlay" />
					<JetpackCoreVideoBlockEdit { ...props } />
				</div>
			</div>
		);
	};
}, 'withJetpackVideoPressBlockEdit' );

export default withJetpackVideoPressBlockEdit;
