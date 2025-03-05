import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
	const searchLink = addQueryArgs( `https://wordpress.com/domains/add/${ siteDomain }`, {
		domainAndPlanPackage: true,
		domain: true,
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
			<p style={ { position: 'relative' } }>
				{ /* To do: convert to SVG.  */ }
				<span
					style={ {
						position: 'absolute',
						transform: 'translate(130px, 14px)',
						fontSize: '16px',
					} }
				>
					{ domain }
				</span>
				<img
					src="https://wordpress.com/calypso/images/illustration--feature-domain-upsell-3eff1284ca73c71a3c77.svg"
					alt={ domain }
					style={ { width: '100%' } }
				/>
			</p>
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
