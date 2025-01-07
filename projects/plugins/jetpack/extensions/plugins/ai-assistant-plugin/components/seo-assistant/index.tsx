import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai:seo-assistant' );

export default function SeoAssistant( { busy, disabled } ) {
	return (
		<div>
			<p>{ __( 'Improve post engagement.', 'jetpack' ) }</p>
			<Button
				onClick={ () => debug( 'click' ) }
				variant="secondary"
				disabled={ disabled }
				isBusy={ busy }
			>
				{ __( 'SEO Assistant', 'jetpack' ) }
			</Button>
		</div>
	);
}
