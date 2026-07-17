import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Placeholder, Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import metadata from './block.json';

import {} from './utils';

const icon = getBlockIconComponent( metadata );

const EmbedForm = ( { className, noticeUI, editedUrl, onChange, onSubmit } ) => {
	const supportLink = isWpcomPlatformSite()
		? 'http://support.wordpress.com/wordpress-editor/blocks/eventbrite-block/'
		: 'https://jetpack.com/support/jetpack-blocks/eventbrite-block/';

	return (
		<div className={ className }>
			<Placeholder
				label={ __( 'Eventbrite Checkout', 'jetpack' ) }
				instructions={ __(
					'Paste a link to an Eventbrite event to embed ticket checkout.',
					'jetpack'
				) }
				icon={ icon }
				notices={ noticeUI }
			>
				<form onSubmit={ onSubmit }>
					<input
						type="url"
						value={ editedUrl }
						className="components-placeholder__input"
						aria-label={ __( 'Eventbrite URL', 'jetpack' ) }
						placeholder={ __( 'Enter an event URL to embed here…', 'jetpack' ) }
						onChange={ onChange }
					/>
					<Button variant="secondary" type="submit">
						{ _x( 'Embed', 'submit button label', 'jetpack' ) }
					</Button>
				</form>

				<div className="components-placeholder__learn-more">
					<Link openInNewTab href={ supportLink }>
						{ __( 'Learn more about Eventbrite embeds', 'jetpack' ) }
					</Link>
				</div>
			</Placeholder>
		</div>
	);
};

export default EmbedForm;
