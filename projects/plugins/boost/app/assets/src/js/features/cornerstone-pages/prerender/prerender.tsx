import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import Module from '$features/module/module';
import { recordBoostEvent } from '$lib/utils/analytics';

const unsafeSpeculationRulesLink = getRedirectUrl( 'jetpack-boost-unsafe-speculation-rules' );

const Prerender = () => {
	const handleBeforeToggle = ( newState: boolean ) => {
		recordBoostEvent( 'cornerstone_pages_prerender_toggle', { enabled: Number( newState ) } );
	};

	return (
		<Module
			slug="speculation_rules"
			inline
			title={ __( 'Pre-render cornerstone pages', 'jetpack-boost' ) }
			description={ createInterpolateElement(
				__(
					'Prerender these pages to improve their loading performance, but <link>be mindful</link> of potential drawbacks.',
					'jetpack-boost'
				),
				{
					link: (
						<Link
							openInNewTab
							href={ unsafeSpeculationRulesLink }
							onClick={ () => recordBoostEvent( 'prerender_warning_message_clicked', {} ) }
						/>
					),
				}
			) }
			onBeforeToggle={ handleBeforeToggle }
		/>
	);
};

export default Prerender;
