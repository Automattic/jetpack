import { RichText, useBlockProps } from '@wordpress/block-editor';
import { getDefaultTexts } from './utils';

const DEFAULT_TEXTS = getDefaultTexts();

const Save = ( { attributes } ) => {
	const blockProps = useBlockProps.save();
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
		<div { ...blockProps }>
			<RichText.Content tagName="h4" value={ DEFAULT_TEXTS.oneTimeDonation?.heading } />
			<RichText.Content
				tagName="p"
				value={ oneTimeDonation.extraText ?? DEFAULT_TEXTS.extraText }
			/>
			<RichText.Content
				tagName="a"
				className="jetpack-donations-fallback-link"
				href={ fallbackLinkUrl }
				rel="noopener noreferrer noamphtml"
				target="_blank"
				value={ DEFAULT_TEXTS.oneTimeDonation?.buttonText }
			/>
			{ monthlyDonation.show && (
				<>
					<hr className="donations__separator" />
					<RichText.Content tagName="h4" value={ DEFAULT_TEXTS.monthlyDonation?.heading } />
					<RichText.Content
						tagName="p"
						value={ monthlyDonation.extraText ?? DEFAULT_TEXTS.extraText }
					/>
					<RichText.Content
						tagName="a"
						className="jetpack-donations-fallback-link"
						href={ fallbackLinkUrl }
						rel="noopener noreferrer noamphtml"
						target="_blank"
						value={ DEFAULT_TEXTS.monthlyDonation?.buttonText }
					/>
				</>
			) }
			{ annualDonation.show && (
				<>
					<hr className="donations__separator" />
					<RichText.Content tagName="h4" value={ DEFAULT_TEXTS.annualDonation?.heading } />
					<RichText.Content
						tagName="p"
						value={ annualDonation.extraText ?? DEFAULT_TEXTS.extraText }
					/>
					<RichText.Content
						tagName="a"
						className="jetpack-donations-fallback-link"
						href={ fallbackLinkUrl }
						rel="noopener noreferrer noamphtml"
						target="_blank"
						value={ DEFAULT_TEXTS.annualDonation?.buttonText }
					/>
				</>
			) }
		</div>
	);
};

export default Save;
