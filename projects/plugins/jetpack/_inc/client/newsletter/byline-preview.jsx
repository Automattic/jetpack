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
		return <em className="byline-preview">{ __( 'Byline will be empty', 'jetpack' ) }</em>;
	}
	let byline = '';
	if ( isAuthorEnabled && isPostDateEnabled ) {
		byline = sprintf(
			/* translators: 1. placeholder is the user display name, 2. is example date */
			__( 'By %1$s on %2$s', 'jetpack' ),
			displayName,
			dateExample
		);
	} else if ( isAuthorEnabled && ! isPostDateEnabled ) {
		byline = sprintf(
			/* translators: Placeholder is the display name */
			__( 'By %1$s', 'jetpack' ),
			displayName
		);
	} else if ( ! isAuthorEnabled && isPostDateEnabled ) {
		byline = sprintf(
			/* translators: Placeholder is example date*/
			__( 'On %1$s', 'jetpack' ),
			dateExample
		);
	}

	return (
		<>
			<span className="byline-preview__label">{ __( 'Preview:', 'jetpack' ) }</span>
			<div className="byline-preview">
				{ isGravatarEnabled && (
					<img className="byline-preview__gravatar" src={ gravatar } alt="" />
				) }
				{ byline }
			</div>
		</>
	);
};

export default BylinePreview;
