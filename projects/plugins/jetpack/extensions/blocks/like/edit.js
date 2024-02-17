import { isSimpleSite, isAtomicSite } from '@automattic/jetpack-shared-extension-utils';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, ToggleControl, PanelBody } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import avatar1 from '../blogging-prompt/example-avatars/avatar1.jpg';
import avatar2 from '../blogging-prompt/example-avatars/avatar2.jpg';
import avatar3 from '../blogging-prompt/example-avatars/avatar3.jpg';
import './editor.scss';

function LikeEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const showReblogButton = attributes?.showReblogButton || false;

	const handleReblogSetting = newValue => {
		setAttributes( {
			showReblogButton: newValue,
		} );
	};

	const isJetpackSite = ! isAtomicSite() && ! isSimpleSite();

	const avatars = [ avatar1, avatar2, avatar3 ];

	const preventDefault = event => event.preventDefault();

	return (
		<div { ...blockProps }>
			<InspectorControls key="like-inspector">
				{ isJetpackSite && (
					<div className="wp-block-jetpack-like__learn-more">
						<ExternalLink href={ 'https://jetpack.com/support/likes/' }>
							{ __( 'Learn more', 'jetpack' ) }
						</ExternalLink>
					</div>
				) }
				{ isSimpleSite() && (
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<ToggleControl
							label={ __( 'Show reblog button', 'jetpack' ) }
							checked={ showReblogButton }
							onChange={ newValue => {
								handleReblogSetting( newValue );
							} }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			<div className="wpl-likebox wpl-new-layout">
				{ isSimpleSite() && showReblogButton && (
					<div className="wpl-button reblog">
						<a
							href="#"
							title={ __( 'Reblog this post on your main site.', 'jetpack' ) }
							className="reblog sd-button"
							rel="nofollow"
						>
							<span>{ __( 'Reblog', 'jetpack' ) }</span>
						</a>
					</div>
				) }
				<div className="wpl-button like">
					<a href="#" className="sd-button like" rel="nofollow" onClick={ preventDefault }>
						<span>{ __( 'Like', 'jetpack' ) }</span>
					</a>
				</div>
				<ul className="wpl-avatars">
					{ avatars.map( ( avatar, i ) => (
						<li key={ `liker-${ i }` } className="wp-liker-me">
							<a className="wpl-liker" href="#" rel="nofollow" onClick={ preventDefault }>
								<img
									src={ avatar }
									className="avatar avatar-30"
									width={ 30 }
									height={ 30 }
									alt=""
								/>
							</a>
						</li>
					) ) }
				</ul>
				<div className="wpl-count">
					<span className="wpl-count-text">
						<a href="#" onClick={ preventDefault }>
							{ createInterpolateElement(
								sprintf(
									// translators: %$1s: Number of likes
									__( '<span>%1$d</span> likes', 'jetpack' ),
									avatars.length
								),
								{
									span: <span className="wpl-count-number"></span>,
								}
							) }
						</a>
					</span>
				</div>
			</div>
		</div>
	);
}

export default LikeEdit;
