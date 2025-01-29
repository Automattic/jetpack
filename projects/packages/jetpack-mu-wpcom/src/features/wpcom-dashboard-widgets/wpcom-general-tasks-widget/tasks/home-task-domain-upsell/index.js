export default () => {
	// To do: actually fetch it from the API.
	const domain = new URL( window.location.href ).hostname.split( '.' )[ 0 ] + '.com';
	return (
		<>
			<h2>Own a domain. Build a site.</h2>
			<p>
				<strong>{ domain }</strong> is a perfect site address. It’s available, easy to find, share,
				and follow. Get it now and claim a corner of the web.
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
				<a href="https://wordpress.com/domains/register" className="button button-primary">
					Get this domain
				</a>
				{ ' ' }
				<a href="https://wordpress.com/domains/register" className="button button-secondary">
					Find other domains
				</a>
			</div>
		</>
	);
};
