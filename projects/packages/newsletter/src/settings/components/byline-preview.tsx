/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './byline-preview.scss';

interface BylinePreviewProps {
	isGravatarEnabled: boolean;
	isAuthorEnabled: boolean;
	isPostDateEnabled: boolean;
	gravatar?: string;
	displayName: string;
	dateExample: string;
}

/**
 * Byline Preview Component
 *
 * Shows a preview of how the email byline will appear based on the enabled settings.
 *
 * @param {BylinePreviewProps} props - Component props
 * @return {JSX.Element} The byline preview
 */
export function BylinePreview( {
	isGravatarEnabled,
	isAuthorEnabled,
	isPostDateEnabled,
	gravatar,
	displayName,
	dateExample,
}: BylinePreviewProps ): JSX.Element {
	if ( ! isGravatarEnabled && ! isAuthorEnabled && ! isPostDateEnabled ) {
		return (
			<div className="byline-preview">
				<span>
					{ createInterpolateElement(
						/* translators: <Empty /> placeholder is set to "Byline will be empty" */
						__(
							'<Preview>Preview:</Preview> <Empty>Byline will be empty</Empty>',
							'jetpack-newsletter'
						),
						{
							Preview: <span className="byline-preview__label" />,
							Empty: <em />,
						}
					) }
				</span>
			</div>
		);
	}

	let byline: JSX.Element | string = '';

	if ( isAuthorEnabled && isPostDateEnabled ) {
		byline = createInterpolateElement(
			sprintf(
				/* translators: %1$s placeholder is the user display name, %2$s is example date */
				__( 'By <Author>%1$s</Author> on <Date>%2$s</Date>', 'jetpack-newsletter' ),
				displayName,
				dateExample
			),
			{
				Author: <strong className="byline-preview__author" />,
				Date: <span className="byline-preview__date" />,
			}
		);
	} else if ( isAuthorEnabled && ! isPostDateEnabled ) {
		byline = createInterpolateElement(
			/* translators: %1$s placeholder is the user display name */
			sprintf( __( 'By <Author>%1$s</Author>', 'jetpack-newsletter' ), displayName ),
			{
				Author: <strong className="byline-preview__author" />,
			}
		);
	} else if ( ! isAuthorEnabled && isPostDateEnabled ) {
		byline = <span className="byline-preview__date">{ dateExample }</span>;
	}

	return (
		<div className="byline-preview">
			<span className="byline-preview__label">{ __( 'Preview:', 'jetpack-newsletter' ) }</span>
			{ isGravatarEnabled && gravatar && (
				<img
					className="byline-preview__gravatar"
					src={ gravatar }
					alt={
						/* translators: %s is the display name of the author */
						sprintf( __( 'Avatar for %s', 'jetpack-newsletter' ), displayName )
					}
				/>
			) }
			<span>{ byline }</span>
		</div>
	);
}
