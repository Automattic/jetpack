/**
 * External dependencies
 */
import { G, Path, SVG, Spinner, Rect } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { Defs } from '@wordpress/primitives';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import blank from './blankbase64.json';
import './carrousel.scss';

export type CarrouselImageData = {
	image?: string;
	libraryId?: number | string;
	libraryUrl?: string;
	generating?: boolean;
	error?: {
		message: string;
	};
};

export type CarrouselImages = CarrouselImageData[];

function AiIcon( { className }: { className?: string } ) {
	const AiSVG = (
		<SVG width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
			<G clipPath="url(#clip0_4479_1006)">
				<Path
					d="M7.87488 0L10.1022 5.64753L15.7498 7.87488L10.1022 10.1022L7.87488 15.7498L5.64753 10.1022L0 7.87488L5.64753 5.64753L7.87488 0Z"
					fill="#A7AAAD"
				/>
				<Path
					d="M31.4998 0L34.4696 7.53004L41.9997 10.4998L34.4696 13.4696L31.4998 20.9997L28.53 13.4696L21 10.4998L28.53 7.53004L31.4998 0Z"
					fill="#A7AAAD"
				/>
				<Path
					d="M18.3748 15.7496L22.0871 25.1621L31.4996 28.8744L22.0871 32.5866L18.3748 41.9992L14.6625 32.5866L5.25 28.8744L14.6625 25.1621L18.3748 15.7496Z"
					fill="#A7AAAD"
				/>
			</G>
			<Defs>
				<clipPath id="clip0_4479_1006">
					<Rect width="41.9997" height="41.9992" fill="white" />
				</clipPath>
			</Defs>
		</SVG>
	);
	return <Icon icon={ AiSVG } width={ 42 } height={ 42 } className={ className } />;
}

function BlankImage( { children, isDotted = false, contentClassName = '' } ) {
	const blankImage = (
		<img
			className="ai-assistant-image__carrousel-image"
			src={ `data:image/png;base64,${ blank.base64 }` }
			alt=""
		/>
	);

	return (
		<div className="ai-assistant-image__blank">
			{ blankImage }
			<div
				className={ clsx( 'ai-assistant-image__blank-content', contentClassName, {
					'is-dotted': isDotted,
				} ) }
			>
				{ children }
			</div>
		</div>
	);
}

export default function Carrousel( {
	images,
	current,
	handlePreviousImage,
	handleNextImage,
	actions = null,
}: {
	images: CarrouselImages;
	current: number;
	handlePreviousImage: () => void;
	handleNextImage: () => void;
	actions?: JSX.Element;
} ) {
	const prevButton = (
		<button className="ai-carrousel__prev" onClick={ handlePreviousImage }>
			<Icon
				icon={ chevronLeft }
				className={ clsx( 'ai-carrousel__prev-icon', {
					'is-disabled': current === 0,
				} ) }
			/>
		</button>
	);

	const nextButton = (
		<button className="ai-carrousel__next" onClick={ handleNextImage }>
			<Icon
				icon={ chevronRight }
				className={ clsx( 'ai-carrousel__next-icon', {
					'is-disabled': current + 1 === images.length,
				} ) }
			/>
		</button>
	);

	const total = images?.filter?.( item => item?.generating || item.hasOwnProperty( 'image' ) )
		?.length;

	const actual = current === 0 && total === 0 ? 0 : current + 1;

	return (
		<div className="ai-assistant-image__carrousel">
			<div className="ai-assistant-image__carrousel-images">
				{ images.length > 1 && prevButton }
				{ images.map( ( { image, generating, error }, index ) => (
					<div
						key={ `image:` + index }
						className={ clsx( 'ai-assistant-image__carrousel-image-container', {
							'is-current': current === index,
							'is-prev': current > index,
						} ) }
					>
						{ generating ? (
							<BlankImage contentClassName="ai-assistant-image__loading">
								{ __( 'Creating image…', 'jetpack' ) }
								<Spinner
									style={ {
										width: '50px',
										height: '50px',
									} }
								/>
							</BlankImage>
						) : (
							<>
								{ error ? (
									<BlankImage isDotted>
										<div className="ai-assistant-image__error">
											{ __(
												'An error occurred while generating the image. Please, try again!',
												'jetpack'
											) }
											{ error?.message && (
												<span className="ai-assistant-image__error-message">
													{ error?.message }
												</span>
											) }
										</div>
									</BlankImage>
								) : (
									<>
										{ ! generating && ! image ? (
											<BlankImage>
												<AiIcon />
											</BlankImage>
										) : (
											<img className="ai-assistant-image__carrousel-image" src={ image } alt="" />
										) }
									</>
								) }
							</>
						) }
					</div>
				) ) }
				{ images.length > 1 && nextButton }
			</div>
			<div className="ai-assistant-image__carrousel-footer">
				<div className="ai-assistant-image__carrousel-counter">
					{ prevButton }
					{ actual } / { total }
					{ nextButton }
				</div>
				<div className="ai-assistant-image__carrousel-actions">{ actions }</div>
			</div>
		</div>
	);
}
