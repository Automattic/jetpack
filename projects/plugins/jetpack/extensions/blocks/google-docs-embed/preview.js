import { __ } from '@wordpress/i18n';

const Preview = props => {
	const {
		allowFullScreen = true,
		isPrivateURL = false,
		interactive,
		toggleInteractive,
		title = __( 'Embed URL', 'jetpack' ),
		url,
	} = props;

	return (
		/* this extra wrapper div gets max-width set */
		<figure>
			{ isPrivateURL ? (
				<div className="wp-block-jetpack-google-docs-embed__wrapper wp-block-jetpack-google-docs-embed__wrapper--error">
					<p className="wp-block-jetpack-google-docs-embed__error-msg">
						{ __( 'This Google Document is private.', 'jetpack' ) }
						<br />
						<br />
						<a href={ url } target="_blank" rel="noreferrer">
							{ __( 'Click here to open this document.', 'jetpack' ) }
						</a>
					</p>
				</div>
			) : (
				<div className="wp-block-jetpack-google-docs-embed__wrapper">
					<iframe
						src={ url }
						allowFullScreen={ allowFullScreen }
						title={ title } /* TODO: figure out something more accessible */
						height="450"
					></iframe>
				</div>
			) }
			{ /*
			 * Disabled because the overlay div doesn't actually have a role or
			 * functionality as far as the user is concerned. We're just catching
			 * the first click so that the block can be selected without
			 * interacting with the embed preview that the overlay covers.
			 */ }
			{ /* eslint-disable jsx-a11y/no-static-element-interactions */ }
			{ ! interactive && (
				<div
					className="wp-block-jetpack-google-docs-embed__interactive-overlay"
					onMouseUp={ () => toggleInteractive( true ) }
				/>
			) }
			{ /* eslint-enable jsx-a11y/no-static-element-interactions */ }
		</figure>
	);
};

export default Preview;
