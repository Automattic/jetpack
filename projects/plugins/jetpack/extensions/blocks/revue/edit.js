import { ExternalLink, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import icon from './icon';
import './editor.scss';
import './view.scss';

// eslint-disable-next-line jsdoc/require-jsdoc
export default function RevueEdit( { className } ) {
	const supportLink =
		'http://help.getrevue.co/en/articles/6819675-we-ve-made-the-difficult-decision-to-shut-down-revue';
	const migrationLink = 'https://wordpress.com/support/launch-a-newsletter/#add-subscribers';

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
						<ExternalLink href={ supportLink }>
							{ __( 'Find out more about Revue shutting down here.', 'jetpack' ) }
						</ExternalLink>
					</div>
					<div className={ `components-placeholder__learn-more` }>
						<ExternalLink href={ migrationLink }>
							{ __(
								'You can move your newsletter to WordPress.com - migrate your subscribers here.',
								'jetpack'
							) }
						</ExternalLink>
					</div>
				</Placeholder>
			}
		</div>
	);
}
