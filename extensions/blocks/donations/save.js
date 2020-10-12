/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

const Save = ( { attributes } ) => {
	const {
		fallbackLinkUrl,
		fallbackLinkText,
		oneTimeDonation,
		monthlyDonation,
		annualDonation,
	} = attributes;

	if ( ! oneTimeDonation || ! oneTimeDonation.show || oneTimeDonation.planId === -1 ) {
		return null;
	}

	const isOneTimeOnly = ! monthlyDonation.show && ! annualDonation.show;

	return (
		<div>
			<div className="donations__container">
				{ isOneTimeOnly && (
					<>
						<RichText.Content tagName="h4" value={ oneTimeDonation.heading } />
						<RichText.Content tagName="p" value={ oneTimeDonation.extraText } />
					</>
				) }
				<a
					className="jetpack-donations-fallback-link"
					href={ fallbackLinkUrl }
					target="_blank"
					rel="noopener noreferrer noamphtml"
				>
					{ fallbackLinkText }
				</a>
			</div>
		</div>
	);
};

export default Save;
