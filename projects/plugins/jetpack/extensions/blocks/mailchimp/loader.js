import { Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { BLOCK_CLASS } from './constants';

const Loader = ( { icon, notices } ) => (
	<Placeholder
		icon={ icon }
		notices={ notices }
		className={ BLOCK_CLASS }
		label={ __( 'Mailchimp', 'jetpack' ) }
	>
		<div className="align-center">
			<Spinner />
		</div>
	</Placeholder>
);

export default Loader;
