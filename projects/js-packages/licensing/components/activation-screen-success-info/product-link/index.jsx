import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { getProductGroup } from '../../activation-screen/utils';

import './style.scss';

const ProductLink = props => {
	const { productId, siteRawUrl } = props;

	const productLinkMap = {
		jetpack_backup: {
			text: __( 'View latest backup', 'jetpack' ),
			redirectSource: 'jetpack-license-activation-success-backup',
		},
		jetpack_complete: {
			text: __( 'View latest backup', 'jetpack' ),
			redirectSource: 'jetpack-license-activation-success-backup',
		},
		jetpack_scan: {
			text: __( 'View scan results', 'jetpack' ),
			redirectSource: 'jetpack-license-activation-success-scan',
		},
		jetpack_search: {
			text: __( 'Configure search', 'jetpack' ),
			redirectSource: 'jetpack-license-activation-success-search',
		},
		jetpack_security: {
			text: __( 'View latest backup', 'jetpack' ),
			redirectSource: 'jetpack-license-activation-success-backup',
		},
		default: null,
	};

	const productGroup = getProductGroup( productId );

	const productLink = productLinkMap[ productGroup ];
	return (
		<>
			{ productLink && (
				<ExternalLink
					className="jp-license-activation-screen-success-info--external-link"
					href={ getRedirectUrl( productLink.redirectSource, { site: siteRawUrl } ) }
				>
					{ productLink.text }
				</ExternalLink>
			) }
		</>
	);
};

ProductLink.propTypes = {
	siteRawUrl: PropTypes.string,
	productId: PropTypes.number,
};

export { ProductLink };
