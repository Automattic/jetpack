import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import PropTypes from 'prop-types';

const DeprecationNotice = ( { show, dismissNotice, message, link } ) => {
	if ( ! show ) {
		return;
	}
	return (
		<SimpleNotice
			status="is-warning"
			dismissText={ __( 'Dismiss', 'jetpack' ) }
			onDismissClick={ dismissNotice }
		>
			<div>{ message }</div>
			{ link && (
				<ExternalLink href={ link }>
					{ __(
						'To find out more about what this means for you, please refer to this document.',
						'jetpack'
					) }
				</ExternalLink>
			) }
		</SimpleNotice>
	);
};

// PropTypes for type checking
DeprecationNotice.propTypes = {
	show: PropTypes.bool.isRequired,
	dismissNotice: PropTypes.func.isRequired,
	message: PropTypes.string.isRequired,
	link: PropTypes.string,
};

export default DeprecationNotice;
