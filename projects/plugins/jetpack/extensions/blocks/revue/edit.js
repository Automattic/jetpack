import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import icon from './icon';
import './editor.scss';
import './view.scss';

// eslint-disable-next-line jsdoc/require-jsdoc
export default function RevueEdit( { className } ) {
	const migrationMoreInfoLink =
		'https://wordpress.com/go/digital-marketing/migrate-from-revue-newsletter/';
	const siteUrl = `https://wordpress.com/people/email-followers/${ getSiteFragment() }`;

	return (
		<div className={ className }>
			{
				<Placeholder
					icon={ icon }
					instructions={ __(
						'Revue is shutting down. The Revue signup form will no longer be displayed to your visitors and as such this block should be removed.',
						'jetpack'
					) }
					label={ __( 'Revue', 'jetpack' ) }
				>
					<div className={ `components-placeholder__learn-more` }>
						<ExternalLink href={ migrationMoreInfoLink }>
							{ __(
								'You can migrate from Revue to the WordPress.com Newsletter - find out more here.',
								'jetpack'
							) }
						</ExternalLink>
						<br />
						<br />
						<ExternalLink href={ siteUrl }>
							{ __( 'Import your subscribers to WordPress.com here.', 'jetpack' ) }
						</ExternalLink>
					</div>
				</Placeholder>
			}
		</div>
	);
}
