import { formatPriceFallback } from '../../utils';

export default function Save( { attributes } ) {
	const {
		content,
		currency,
		featuredMediaUrl,
		featuredMediaTitle,
		postLinkUrl,
		postLinkText,
		price,
		productId,
		title,
	} = attributes;
	if ( ! productId ) {
		return null;
	}

	return (
		<div className={ `jetpack-simple-payments-wrapper jetpack-simple-payments-${ productId }` }>
			<div className="jetpack-simple-payments-product">
				{ featuredMediaUrl && (
					<div className="jetpack-simple-payments-product-image">
						<div className="jetpack-simple-payments-image">
							<figure>
								<img src={ featuredMediaUrl } alt={ featuredMediaTitle } />
							</figure>
						</div>
					</div>
				) }
				<div className="jetpack-simple-payments-details">
					<div className="jetpack-simple-payments-title">
						<p>{ title }</p>
					</div>
					<div className="jetpack-simple-payments-description">
						<p>{ content }</p>
					</div>
					<div className="jetpack-simple-payments-price">
						<p>{ formatPriceFallback( price, currency ) }</p>
					</div>
					<a
						className="jetpack-simple-payments-purchase"
						href={ postLinkUrl }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ postLinkText }
					</a>
				</div>
			</div>
		</div>
	);
}
