import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { getProductGroup } from '../../activation-screen/utils';

import './style.scss';

const ProductLink = props => {
	const { productId, siteRawUrl } = props;

	const productLinkMap = {
		jetpack_backup: {
			text: __( 'View latest backup', 'jetpack-licensing' ),
			redirectSource: 'jetpack-license-activation-success-backup',
		},
		jetpack_complete: {
			text: __( 'View latest backup', 'jetpack-licensing' ),
			redirectSource: 'jetpack-license-activation-success-backup',
		},
		jetpack_scan: {
			text: __( 'View my plans', 'jetpack-licensing' ),
			redirectSource: 'license-activation-view-my-plans',
		},
		jetpack_search: {
			text: __( 'Configure search', 'jetpack-licensing' ),
			redirectSource: 'jetpack-license-activation-success-search',
		},
		jetpack_security: {
			text: __( 'View latest backup', 'jetpack-licensing' ),
			redirectSource: 'jetpack-license-activation-success-backup',
		},
		default: null,
	};

	const productGroup = getProductGroup( productId );

	const productLink = productLinkMap[ productGroup ];
	return (
		<>
			{ productLink && (
				<Link
					openInNewTab
					rel="noopener noreferrer"
					className="jp-license-activation-screen-success-info--external-link"
					href={ getRedirectUrl( productLink.redirectSource, { site: siteRawUrl } ) }
				>
					{ productLink.text }
				</Link>
			) }
		</>
	);
};

ProductLink.propTypes = {
	siteRawUrl: PropTypes.string,
	productId: PropTypes.number,
};

export { ProductLink };
