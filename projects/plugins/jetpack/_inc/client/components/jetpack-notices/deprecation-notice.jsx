import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';
import SimpleNotice from 'components/notice';

const DeprecationNotice = ( { dismissNotice, message, link, linkText, title } ) => {
	return (
		<SimpleNotice
			status="is-warning"
			dismissText={ __( 'Dismiss', 'jetpack' ) }
			onDismissClick={ dismissNotice }
		>
			{ title && <div style={ { fontWeight: 600 } }>{ title }</div> }
			<div>{ message }</div>
			{ link && (
				<Link openInNewTab href={ link }>
					{ linkText }
				</Link>
			) }
		</SimpleNotice>
	);
};

DeprecationNotice.propTypes = {
	dismissNotice: PropTypes.func.isRequired,
	message: PropTypes.string.isRequired,
	link: PropTypes.string,
	linkText: PropTypes.string,
	title: PropTypes.string,
};

export default DeprecationNotice;
