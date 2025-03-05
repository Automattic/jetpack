/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import AiFeedbackThumbs from '../../ai-feedback/index.js';
import AiIcon from '../../ai-icon/index.js';
import './carrousel.scss';

export type CarrouselImageData = {
	image?: string;
	libraryId?: number | string;
	prompt?: string;
	revisedPrompt?: string;
	libraryUrl?: string;
	generating?: boolean;
	error?: {
		message: string;
	};
};

export type CarrouselImages = CarrouselImageData[];

type BlankImageProps = {
	children: React.ReactNode;
	isDotted?: boolean;
	contentClassName?: string;
};

/**
 * BlankImage component
 * @param {BlankImageProps} props - The component properties.
 * @return {React.ReactElement} - rendered component.
 */
function BlankImage( { children, isDotted = false, contentClassName = '' }: BlankImageProps ) {
	const blankImage = (
		<img
			className="ai-assistant-image__carrousel-image"
			src="data:image/svg+xml;utf8,<svg viewBox='0 0 1 1' width='1024' height='768' xmlns='http://www.w3.org/2000/svg'><path d='M0 0 L1 0 L1 1 L0 1 L0 0 Z' fill='none' /></svg>"
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

type CarrouselProps = {
	images: CarrouselImages;
	current: number;
	handlePreviousImage: () => void;
	handleNextImage: () => void;
	actions?: React.JSX.Element;
};

/**
 * Carrousel component
 * @param {CarrouselProps} props - The component properties.
 * @return {React.ReactElement} - rendered component.
 */
export default function Carrousel( {
	images,
	current,
	handlePreviousImage,
	handleNextImage,
	actions = null,
}: CarrouselProps ) {
	const [ imageFeedbackDisabled, setImageFeedbackDisabled ] = useState( false );
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

	const total = images?.filter?.(
		item => item?.generating || Object.hasOwn( item, 'image' ) || Object.hasOwn( item, 'libraryId' )
	)?.length;

	const actual = current === 0 && total === 0 ? 0 : current + 1;

	useEffect( () => {
		const imageData = images[ current ];
		if ( ! imageData ) {
			setImageFeedbackDisabled( true );
		}

		const { image, generating, error } = imageData || {};

		// disable if there's an empty modal
		if ( ! image && ! generating && ! error ) {
			return setImageFeedbackDisabled( true );
		}
		// also disable if we're generating or have an error
		if ( generating || error ) {
			return setImageFeedbackDisabled( true );
		}

		setImageFeedbackDisabled( false );
	}, [ current, images ] );

	return (
		<div className="ai-assistant-image__carrousel">
			<div className="ai-assistant-image__carrousel-images">
				{ images.length > 1 && prevButton }
				{ images.map( ( { image, generating, error, revisedPrompt, libraryUrl }, index ) => (
					<div
						key={ `image:` + index }
						className={ clsx( 'ai-assistant-image__carrousel-image-container', {
							'is-current': current === index,
							'is-prev': current > index,
						} ) }
					>
						{ generating ? (
							<BlankImage contentClassName="ai-assistant-image__loading">
								{ __( 'Creating image…', 'jetpack-ai-client' ) }
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
												'jetpack-ai-client'
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
										{ ! generating && ! image && ! libraryUrl ? (
											<BlankImage>
												<AiIcon />
											</BlankImage>
										) : (
											<img
												className="ai-assistant-image__carrousel-image"
												src={ image || libraryUrl }
												alt={ revisedPrompt }
											/>
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
				<div className="ai-assistant-image__carrousel-footer-left">
					<div className="ai-assistant-image__carrousel-counter">
						{ prevButton }
						{ actual } / { total }
						{ nextButton }
					</div>

					<AiFeedbackThumbs
						disabled={ imageFeedbackDisabled }
						ratedItem={ images[ current ]?.libraryUrl || '' }
						iconSize={ 20 }
						options={ {
							mediaLibraryId: Number( images[ current ].libraryId ),
							prompt: images[ current ].prompt,
							revisedPrompt: images[ current ].revisedPrompt,
						} }
						feature="image-generator"
					/>
				</div>

				<div className="ai-assistant-image__carrousel-actions">{ actions }</div>
			</div>
		</div>
	);
}
