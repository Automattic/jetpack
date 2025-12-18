import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

export default ( { siteDomain, sitePlan } ) => {
	const [ domains, setDomains ] = useState( [] );
	useEffect( () => {
		const path = addQueryArgs( `/rest/v1.1/domains/suggestions`, {
			query: siteDomain.split( '.' )[ 0 ],
			quantity: 1,
			vendor: 'domain-upsell',
			only_wordpressdotcom: false,
			include_dotblogsubdomain: false,
			include_wordpressdotcom: false,
		} );
		apiFetch( { path, global: true } ).then( setDomains );
	}, [ siteDomain ] );

	if ( domains.length === 0 ) {
		return null;
	}

	const domain = domains[ 0 ].domain_name;
	const cart = [ `domain_reg:${ domain }` ];

	if ( ! sitePlan || sitePlan.product_slug.includes( 'monthly' ) ) {
		cart.push( 'personal' );
	}

	const getLink = `http://wordpress.com/checkout/${ siteDomain }/${ cart.join( ',' ) }`;
	const searchLink = addQueryArgs( 'https://wordpress.com/setup/domain-and-plan', {
		siteSlug: siteDomain,
	} );

	return (
		<>
			<h2>{ __( 'Own a domain. Build a site.', 'jetpack-mu-wpcom' ) }</h2>
			<p>
				{ createInterpolateElement(
					sprintf(
						// translators: %s is the domain name.
						__(
							'<strong>%s</strong> is a perfect site address. It’s available, easy to find, share, and follow. Get it now and claim a corner of the web.',
							'jetpack-mu-wpcom'
						),
						domain
					),
					{
						strong: <strong />,
					}
				) }
			</p>
			<div
				style={ {
					position: 'relative',
					margin: '1em 0',
					transform: isRTL() ? 'scale(-1, 1)' : 'none',
				} }
			>
				<svg
					viewBox="0 0 40 17"
					id="map"
					style={ { height: '43%', left: '24%', position: 'absolute', top: '17%', width: '70%' } }
				>
					<text
						x={ isRTL() ? '95' : '-95' }
						y="15"
						textAnchor={ isRTL() ? 'end' : 'start' }
						direction="ltr"
						style={ { transform: isRTL() ? 'scale(-1, 1)' : 'none' } }
					>
						{ domain }
					</text>
				</svg>
				<img
					src="https://wordpress.com/calypso/images/illustration--feature-domain-upsell-3eff1284ca73c71a3c77.svg"
					alt={ domain }
					style={ { width: '100%' } }
				/>
			</div>
			<div>
				<a href={ getLink } className="button button-primary">
					{ __( 'Get this domain', 'jetpack-mu-wpcom' ) }
				</a>
				{ ' ' }
				<a href={ searchLink } className="button button-secondary">
					{ __( 'Find other domains', 'jetpack-mu-wpcom' ) }
				</a>
			</div>
		</>
	);
};
