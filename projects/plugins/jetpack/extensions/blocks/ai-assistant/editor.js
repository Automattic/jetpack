import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

/**
 * Supports and extensions
 */
import './supports';
import './extensions/ai-assistant';
import './extensions/jetpack-contact-form';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	// The `description` property in `block.json` doesn't support formatting or markup.
	description: (
		<Fragment>
			<p style={ { whiteSpace: 'pre-wrap' } }>{ metadata.description }</p>
			<p>
				<ExternalLink href="https://automattic.com/ai-guidelines">
					{ __( 'AI guidelines.', 'jetpack' ) }
				</ExternalLink>
			</p>
			<p>
				<ExternalLink href={ getRedirectUrl( 'jetpack_ai_feedback' ) }>
					{ __( 'Share your feedback.', 'jetpack' ) }
				</ExternalLink>
			</p>
		</Fragment>
	),
	transforms,
} );
