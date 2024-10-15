import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import PropTypes from 'prop-types';

const DeprecationNotice = ( { show, dismissNotice, message, link, linkText, title } ) => {
	if ( ! show ) {
		return;
	}
	return (
		<SimpleNotice
			status="is-warning"
			dismissText={ __( 'Dismiss', 'jetpack' ) }
			onDismissClick={ dismissNotice }
		>
			<div style={ { fontWeight: 600 } }>{ title }</div>
			<div>{ message }</div>
			{ link && <ExternalLink href={ link }>{ linkText }</ExternalLink> }
		</SimpleNotice>
	);
};

// PropTypes for type checking
DeprecationNotice.propTypes = {
	show: PropTypes.bool.isRequired,
	dismissNotice: PropTypes.func.isRequired,
	message: PropTypes.string.isRequired,
	link: PropTypes.string,
	linkText: PropTypes.string,
	title: PropTypes.string,
};

export default DeprecationNotice;
