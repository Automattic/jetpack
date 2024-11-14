import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const BylinePreview = props => {
	const {
		isGravatarEnabled,
		isAuthorEnabled,
		isPostDateEnabled,
		gravatar,
		displayName,
		dateExample,
	} = props;

	if ( ! isGravatarEnabled && ! isAuthorEnabled && ! isPostDateEnabled ) {
		return (
			<div className="byline-preview">
				<span>
					{ createInterpolateElement(
						/* translators: <Empty /> placeholder is set to "Byline will be empty" */
						__( '<Preview>Preview:</Preview> <Empty>Byline will be empty</Empty>', 'jetpack' ),
						{
							Preview: <span className="byline-preview__label" />,
							Empty: <em />,
						}
					) }
				</span>
			</div>
		);
	}
	let byline = '';
	if ( isAuthorEnabled && isPostDateEnabled ) {
		byline = createInterpolateElement(
			sprintf(
				/* translators: %1$s placeholder is the user display name, %2$s is example date */
				__( 'By <Author>%1$s</Author> on <Date>%2$s</Date>', 'jetpack' ),
				displayName,
				dateExample
			),
			{
				Author: <strong className="byline-preview__author">{ displayName }</strong>,
				Date: <time className="byline-preview__date">{ dateExample }</time>,
			}
		);
	} else if ( isAuthorEnabled && ! isPostDateEnabled ) {
		byline = createInterpolateElement(
			/* translators: %1$s placeholder is the user display name */
			sprintf( __( 'By <Author>%1$s</Author>', 'jetpack' ), displayName ),
			{
				Author: <strong className="byline-preview__author" />,
			}
		);
	} else if ( ! isAuthorEnabled && isPostDateEnabled ) {
		byline = <time className="byline-preview__date">{ dateExample }</time>;
	}

	return (
		<>
			<div className="byline-preview">
				<span className="byline-preview__label">{ __( 'Preview:', 'jetpack' ) }</span>
				{ isGravatarEnabled && (
					<img
						className="byline-preview__gravatar"
						src={ gravatar }
						alt={ __( "User's Avatar", 'jetpack' ) }
					/>
				) }
				<span>{ byline }</span>
			</div>
		</>
	);
};

export default BylinePreview;
