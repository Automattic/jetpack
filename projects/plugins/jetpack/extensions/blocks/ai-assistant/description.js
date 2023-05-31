import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default (
	<Fragment>
		<p>{ __( 'Automatically generate and modify content, powered by AI magic.', 'jetpack' ) }</p>
		<p>
			{ __(
				'The AI Assistant can be imprecise with information about people, places, or facts.',
				'jetpack'
			) }
		</p>
		<p>
			{ __(
				'We are experimenting with this feature and can tweak or remove it at any point.',
				'jetpack'
			) }
		</p>
		<p>
			<ExternalLink href="https://automattic.com/ai-guidelines">
				{ __( 'AI guidelines.', 'jetpack' ) }
			</ExternalLink>
		</p>
		<ExternalLink href={ getRedirectUrl( 'jetpack_ai_feedback' ) }>
			{ __( 'Share your feedback.', 'jetpack' ) }
		</ExternalLink>
	</Fragment>
);
