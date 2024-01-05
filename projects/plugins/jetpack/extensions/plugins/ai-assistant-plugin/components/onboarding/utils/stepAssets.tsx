export const stepImage = ( src: string, alt: string ) => {
	return <img className="ai-onboarding-step-image" src={ src } alt={ alt } />;
};

export const stepVideo = ( src: string ) => (
	// These videos don't have sound so we can ignore the need for a <track> element
	// eslint-disable-next-line jsx-a11y/media-has-caption
	<video className="ai-onboarding-step-video" autoPlay key={ src }>
		<source src={ src } type="video/mp4" />
	</video>
);
