/**
 * External dependencies
 */
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Icon } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import AiFeedbackThumbs from '../../components/ai-feedback/index.tsx';
import CheckIcon from '../assets/icons/check.tsx';
import LogoIcon from '../assets/icons/logo.tsx';
import MediaIcon from '../assets/icons/media.tsx';
import { EVENT_SAVE, EVENT_USE } from '../constants.ts';
import useLogoGenerator from '../hooks/use-logo-generator.ts';
import useRequestErrors from '../hooks/use-request-errors.ts';
import { updateLogo } from '../lib/logo-storage.ts';
import { STORE_NAME } from '../store/index.ts';
import { ImageLoader } from './image-loader.tsx';
import './logo-presenter.scss';
/**
 * Types
 */
import type { Logo } from '../store/types.ts';
import type { LogoPresenterProps } from '../types.ts';
import type React from 'react';

const debug = debugFactory( 'jetpack-ai-calypso:logo-presenter' );

const SaveInLibraryButton: React.FC< { siteId: string } > = ( { siteId } ) => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const {
		saveLogo,
		selectedLogo,
		isSavingLogoToLibrary: saving,
		logos,
		selectedLogoIndex,
		context,
	} = useLogoGenerator();
	const saved = !! selectedLogo?.mediaId;

	const { loadLogoHistory } = useDispatch( STORE_NAME );

	const handleClick = async () => {
		if ( ! saved && ! saving ) {
			recordTracksEvent( EVENT_SAVE, {
				context,
				logos_count: logos.length,
				selected_logo: selectedLogoIndex ? selectedLogoIndex + 1 : 0,
			} );

			try {
				const savedLogo = await saveLogo( selectedLogo );

				// Update localStorage
				updateLogo( {
					siteId,
					url: selectedLogo.url,
					newUrl: savedLogo.mediaURL,
					mediaId: savedLogo.mediaId,
				} );

				// Update state
				loadLogoHistory( siteId );
			} catch ( error ) {
				debug( 'Error saving logo', error );
			}
		}
	};

	const savingLabel = __( 'Saving…', 'jetpack-ai-client' );
	const savedLabel = __( 'Saved', 'jetpack-ai-client' );

	return ! saving && ! saved ? (
		<Button className="jetpack-ai-logo-generator-modal-presenter__action" onClick={ handleClick }>
			<Icon icon={ <MediaIcon /> } />
			<span className="action-text">{ __( 'Save in Library', 'jetpack-ai-client' ) }</span>
		</Button>
	) : (
		<Button className="jetpack-ai-logo-generator-modal-presenter__action">
			<Icon icon={ saving ? <MediaIcon /> : <CheckIcon /> } />
			<span className="action-text">{ saving ? savingLabel : savedLabel }</span>
		</Button>
	);
};

const UseOnSiteButton: React.FC< { onApplyLogo: ( mediaId: number ) => void } > = ( {
	onApplyLogo,
} ) => {
	const { tracks } = useAnalytics();
	const { recordEvent: recordTracksEvent } = tracks;
	const { isSavingLogoToLibrary, selectedLogo, logos, selectedLogoIndex, context } =
		useLogoGenerator();

	const handleClick = async () => {
		if ( ! isSavingLogoToLibrary ) {
			recordTracksEvent( EVENT_USE, {
				context,
				logos_count: logos.length,
				selected_logo: selectedLogoIndex != null ? selectedLogoIndex + 1 : 0,
			} );

			onApplyLogo?.( selectedLogo?.mediaId );
		}
	};

	return (
		<Button
			className="jetpack-ai-logo-generator-modal-presenter__action"
			onClick={ handleClick }
			disabled={ isSavingLogoToLibrary || ! selectedLogo?.mediaId }
			variant="secondary"
		>
			<Icon icon={ <LogoIcon /> } />
			<span className="action-text">{ __( 'Use on block', 'jetpack-ai-client' ) }</span>
		</Button>
	);
};

const LogoLoading: React.FC = () => {
	return (
		<>
			<ImageLoader className="jetpack-ai-logo-generator-modal-presenter__logo" />
			<span className="jetpack-ai-logo-generator-modal-presenter__loading-text">
				{ __( 'Generating new logo…', 'jetpack-ai-client' ) }
			</span>
		</>
	);
};

const LogoFetching: React.FC = () => {
	return (
		<>
			<ImageLoader className="jetpack-ai-logo-generator-modal-presenter__logo" />
			<span className="jetpack-ai-logo-generator-modal-presenter__loading-text">
				{ __( 'Fetching previous logos…', 'jetpack-ai-client' ) }
			</span>
		</>
	);
};

const LogoEmpty: React.FC = () => {
	return (
		<>
			<div style={ { width: 0, height: '229px' } }></div>
			<span className="jetpack-ai-logo-generator-modal-presenter__loading-text">
				{ __( 'Once you generate a logo, it will show up here', 'jetpack-ai-client' ) }
			</span>
		</>
	);
};

const RateLogo: React.FC< {
	disabled: boolean;
	ratedItem: string;
	onRate: ( rating: string ) => void;
} > = ( { disabled, ratedItem, onRate } ) => {
	const { logos, selectedLogo } = useLogoGenerator();
	const savedRatings = logos
		.filter( logo => logo.rating )
		.reduce( ( acc, logo ) => {
			acc[ logo.url ] = logo.rating;
			return acc;
		}, {} );

	return (
		<AiFeedbackThumbs
			disabled={ disabled }
			ratedItem={ ratedItem }
			feature="logo-generator"
			savedRatings={ savedRatings }
			options={ {
				mediaLibraryId: selectedLogo.mediaId,
				prompt: selectedLogo.description,
			} }
			onRate={ onRate }
		/>
	);
};

const LogoReady: React.FC< {
	siteId: string;
	logo: Logo;
	onApplyLogo: ( mediaId: number ) => void;
} > = ( { siteId, logo, onApplyLogo } ) => {
	const handleRateLogo = ( rating: string ) => {
		// Update localStorage
		updateLogo( {
			siteId,
			url: logo.url,
			newUrl: logo.url,
			mediaId: logo.mediaId,
			rating,
		} );
	};

	return (
		<>
			<img
				src={ logo.url }
				alt={ logo.description }
				className="jetpack-ai-logo-generator-modal-presenter__logo"
			/>
			<div className="jetpack-ai-logo-generator-modal-presenter__action-wrapper">
				<span className="jetpack-ai-logo-generator-modal-presenter__description">
					{ logo.description }
				</span>
				<div className="jetpack-ai-logo-generator-modal-presenter__actions">
					<SaveInLibraryButton siteId={ siteId } />
					<UseOnSiteButton onApplyLogo={ onApplyLogo } />
					<RateLogo ratedItem={ logo.url } disabled={ false } onRate={ handleRateLogo } />
				</div>
			</div>
		</>
	);
};

const LogoUpdated: React.FC< { logo: Logo } > = ( { logo } ) => {
	return (
		<>
			<img
				src={ logo.url }
				alt={ logo.description }
				className="jetpack-ai-logo-generator-modal-presenter__logo"
			/>
			<div className="jetpack-ai-logo-generator-modal-presenter__success-wrapper">
				<Icon icon={ <CheckIcon /> } />
				<span>{ __( 'Your new logo was set to the block!', 'jetpack-ai-client' ) }</span>
			</div>
		</>
	);
};

export const LogoPresenter: React.FC< LogoPresenterProps > = ( {
	logo = null,
	loading = false,
	onApplyLogo,
	logoAccepted = false,
	siteId,
} ) => {
	const { isRequestingImage } = useLogoGenerator();
	const { saveToLibraryError, logoUpdateError } = useRequestErrors();

	let logoContent: React.ReactNode;

	if ( ! logo && ! isRequestingImage ) {
		logoContent = <LogoEmpty />;
	} else if ( ! logo ) {
		debug( 'No logo provided, history still loading or logo being generated' );
		logoContent = <LogoFetching />;
	} else if ( loading || isRequestingImage ) {
		logoContent = <LogoLoading />;
	} else if ( logoAccepted ) {
		logoContent = <LogoUpdated logo={ logo } />;
	} else {
		logoContent = (
			<LogoReady siteId={ String( siteId ) } logo={ logo } onApplyLogo={ onApplyLogo } />
		);
	}

	return (
		<div className="jetpack-ai-logo-generator-modal-presenter__wrapper">
			<div className="jetpack-ai-logo-generator-modal-presenter">
				<div className="jetpack-ai-logo-generator-modal-presenter__content">{ logoContent }</div>
				{ ! logoAccepted && (
					<div className="jetpack-ai-logo-generator-modal-presenter__rectangle" />
				) }
			</div>
			{ saveToLibraryError && (
				<div className="jetpack-ai-logo-generator__prompt-error">
					{ __( 'Error saving the logo to your library. Please try again.', 'jetpack-ai-client' ) }
				</div>
			) }
			{ logoUpdateError && (
				<div className="jetpack-ai-logo-generator__prompt-error">
					{ __( 'Error applying the logo to your site. Please try again.', 'jetpack-ai-client' ) }
				</div>
			) }
		</div>
	);
};
