/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import AiIcon from '../../ai-icon';
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
	actions?: React.JSX.Element;
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

	const total = images?.filter?.( item => item?.generating || Object.hasOwn( item, 'image' ) )
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
