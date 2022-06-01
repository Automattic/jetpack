import { RichText } from '@wordpress/block-editor';

const Save = ( { attributes } ) => {
	const { fallbackLinkUrl, oneTimeDonation, monthlyDonation, annualDonation } = attributes;

	if (
		! oneTimeDonation ||
		! oneTimeDonation.show ||
		! oneTimeDonation.planId ||
		oneTimeDonation.planId === -1
	) {
		return null;
	}

	return (
		<div>
			<RichText.Content tagName="h4" value={ oneTimeDonation.heading } />
			<RichText.Content tagName="p" value={ oneTimeDonation.extraText } />
			<RichText.Content
				tagName="a"
				className="jetpack-donations-fallback-link"
				href={ fallbackLinkUrl }
				rel="noopener noreferrer noamphtml"
				target="_blank"
				value={ oneTimeDonation.buttonText }
			/>
			{ monthlyDonation.show && (
				<>
					<hr className="donations__separator" />
					<RichText.Content tagName="h4" value={ monthlyDonation.heading } />
					<RichText.Content tagName="p" value={ monthlyDonation.extraText } />
					<RichText.Content
						tagName="a"
						className="jetpack-donations-fallback-link"
						href={ fallbackLinkUrl }
						rel="noopener noreferrer noamphtml"
						target="_blank"
						value={ monthlyDonation.buttonText }
					/>
				</>
			) }
			{ annualDonation.show && (
				<>
					<hr className="donations__separator" />
					<RichText.Content tagName="h4" value={ annualDonation.heading } />
					<RichText.Content tagName="p" value={ annualDonation.extraText } />
					<RichText.Content
						tagName="a"
						className="jetpack-donations-fallback-link"
						href={ fallbackLinkUrl }
						rel="noopener noreferrer noamphtml"
						target="_blank"
						value={ annualDonation.buttonText }
					/>
				</>
			) }
		</div>
	);
};

export default Save;
