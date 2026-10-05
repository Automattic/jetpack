import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import ImageGuideAnalytics, { type TracksCallback } from '../analytics.ts';
import { MeasurableImageStore } from '../stores/MeasurableImageStore.ts';
import { commands, selectors, subscribeToFacts } from '../stores/store.ts';
import type { GuideSize } from '../types.ts';
import './style.scss';
import './react-transitions.scss';

type Position = { top: number; left: number };
type MouseLeave = React.MouseEventHandler< HTMLDivElement >;

function useGuideState() {
	return useSyncExternalStore( subscribeToFacts, selectors.getGuideState );
}

function useImage( controller: MeasurableImageStore ) {
	const subscribe = useCallback(
		( listener: () => void ) => subscribeToFacts( listener, controller.id ),
		[ controller ]
	);
	const read = useCallback( () => selectors.getImageFacts( controller.id ), [ controller ] );
	useSyncExternalStore( subscribe, read );
	return controller.getSnapshot();
}

function usePresence( visible: boolean, duration: number ) {
	const [ present, setPresent ] = useState( visible );
	useEffect( () => {
		if ( visible ) {
			setPresent( true );
			return;
		}
		const timeout = setTimeout( () => setPresent( false ), duration );
		return () => clearTimeout( timeout );
	}, [ visible, duration ] );
	return visible || present;
}

export function JetpackLogo( { size = 16, bg = '#069E08' } ) {
	return (
		<div style={ { width: size, height: size } } className="jb-ig-logo">
			<svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M55.4 107.8C84.3397 107.8 107.8 84.3397 107.8 55.4C107.8 26.4603 84.3397 3 55.4 3C26.4603 3 3 26.4603 3 55.4C3 84.3397 26.4603 107.8 55.4 107.8Z"
					fill={ bg }
				/>
				<path d="M58 46.6V97.4L84.2 46.6H58Z" fill="white" />
				<path d="M52.7 64.1V13.4L26.6 64.1H52.7Z" fill="white" />
			</svg>
		</div>
	);
}

function Checkmark() {
	return (
		<svg
			className="jb-ig-checkmark w-6 h-6"
			fill="none"
			stroke="white"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
		</svg>
	);
}

function External() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="jb-ig-external">
			<path d="M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z" />
		</svg>
	);
}

export function AdminBarToggle( {
	href,
	tracksCallback,
}: {
	href: string;
	tracksCallback: TracksCallback;
} ) {
	const state = useGuideState();
	useLayoutEffect(
		() => ImageGuideAnalytics.setTracksCallback( tracksCallback ),
		[ tracksCallback ]
	);
	const toggle = useCallback( ( event: React.MouseEvent< HTMLAnchorElement > ) => {
		event.preventDefault();
		commands.cycleGuideState();
		ImageGuideAnalytics.trackUIStateChange();
	}, [] );
	return (
		<a
			id="jetpack-boost-guide-bar"
			href={ href }
			className={ `jb-ig-toggle ab-item ${ state }` }
			onClick={ toggle }
		>
			<JetpackLogo />
			<span>Image Guide: { selectors.getGuideLabel() }</span>
		</a>
	);
}

export function Bubble( {
	index,
	store,
	onHover,
	exiting = false,
}: {
	index: number;
	store: MeasurableImageStore;
	onHover: ( index: number, position: Position ) => void;
	exiting?: boolean;
} ) {
	const { oversizedRatio: ratio, loading } = useImage( store );
	const spinner = usePresence( loading && ! exiting, 300 );
	const severity = ratio > 4 ? 'high' : ratio > 2.5 ? 'medium' : 'normal';
	const hover = useCallback(
		( event: React.MouseEvent< HTMLDivElement > ) => {
			const rect = event.currentTarget.getBoundingClientRect();
			onHover( index, { top: rect.top + rect.height + 10, left: rect.left } );
		},
		[ index, onHover ]
	);
	return (
		<div
			className={ `jb-ig-bubble interaction-area ${ severity } jb-ig-fly${ exiting ? ' jb-ig-exit' : '' }` }
			style={ { animationDelay: `${ 150 + 50 * index }ms` } }
			onMouseEnter={ hover }
		>
			<div className="jb-ig-bubble bubble">
				{ ! loading && (
					<div className="jb-ig-bubble bubble-inner">
						<div className="label jb-ig-label-fade">
							{ ratio > 9 ? (
								`${ Math.floor( ratio ) }x`
							) : ratio > 0.99 ? (
								severity === 'normal' ? (
									<Checkmark />
								) : (
									`${ ratio.toFixed( 1 ) }x`
								)
							) : (
								<>
									<span style={ { fontSize: '0.75em' } }>&lt;</span> 1x
								</>
							) }
						</div>
					</div>
				) }
				{ spinner && (
					<div
						className={ `jb-ig-bubble bubble-inner${ loading && ! exiting ? '' : ' jb-ig-spinner-fade' }` }
					>
						<div className="jb-ig-spinner spinner">
							<JetpackLogo size={ 12 } bg="transparent" />
						</div>
					</div>
				) }
			</div>
		</div>
	);
}

function maybeDecimals( num: number ) {
	return num % 1 === 0 ? num : parseFloat( num.toFixed( 2 ) );
}

export function Popup( {
	store,
	size,
	position,
	onMouseLeave,
}: {
	store: MeasurableImageStore;
	size: GuideSize;
	position: Position;
	onMouseLeave: MouseLeave;
} ) {
	const {
		loading,
		oversizedRatio,
		fileSize,
		fileWeight,
		sizeOnPage,
		potentialSavings,
		expectedSize,
		url,
	} = useImage( store );
	useEffect( () => store.acquire(), [ store ] );
	const initial = useRef( { scrollY: window.scrollY, top: position.top } );
	const [ displayTop, setDisplayTop ] = useState( position.top );
	useEffect( () => {
		const reposition = () => {
			if ( window.scrollY !== 0 && initial.current.scrollY !== window.scrollY ) {
				setDisplayTop( initial.current.top + initial.current.scrollY - window.scrollY );
			}
		};
		window.addEventListener( 'scroll', reposition );
		return () => window.removeEventListener( 'scroll', reposition );
	}, [] );
	const imageName = url.split( '/' ).pop();
	const previewWidth = size === 'normal' ? 100 : 50;
	const previewHeight = Math.floor( previewWidth / ( fileSize.width / fileSize.height ) );
	const ratio = maybeDecimals( oversizedRatio );
	const unknown = loading ? 'Loading...' : <em>Unknown</em>;
	return (
		<div
			className="jb-ig-popup jetpack-boost-guide-popup keep-guide-open jb-ig-fly"
			style={ { top: displayTop, left: position.left } }
			onMouseLeave={ onMouseLeave }
		>
			<div className="jb-ig-popup logo">
				<JetpackLogo size={ 250 } />
			</div>
			<div className="jb-ig-popup preview">
				<div className="jb-ig-popup description">
					<div className="jb-ig-popup title">
						<a href={ url } target="_blank noreferrer" className="jb-ig-popup">
							{ imageName }
						</a>
					</div>
					<div className="jb-ig-popup explanation">
						{ ratio >= 1.3 ? (
							<>
								The image loaded is <strong>{ ratio }x</strong> larger than it appears in the
								browser.
								{ ( fileSize as typeof fileSize & { weight?: number } ).weight > 450 &&
									' Try using a smaller image or reduce the file size by compressing it.' }
							</>
						) : ratio === 1 ? (
							'The image is exactly the correct size for this screen.'
						) : ratio >= 0.99 && ratio < 1.3 ? (
							<>
								The image size is very close to the size it appears in the browser.
								{ ratio > 1 && (
									<>
										{ ' ' }
										Because there are various screen sizes, it&apos;s okay for the image to be{ ' ' }
										<strong>{ ratio }x</strong> than it appears on the page.
									</>
								) }
							</>
						) : (
							<>
								The image file is { maybeDecimals( 1 / oversizedRatio ) }x smaller than expected on
								this screen. This might be fine, but you may want to check if the image appears
								blurry.
							</>
						) }
					</div>
				</div>
				{ url && (
					<img
						src={ url }
						alt={ imageName }
						style={ { width: previewWidth, height: `${ previewHeight }px` } }
						width={ previewWidth }
						height={ String( previewHeight ) }
						className="jb-ig-popup"
					/>
				) }
			</div>
			<div className="meta">
				<div className="jb-ig-popup row">
					<div className="label">Image File Dimensions</div>
					<div className="value">
						{ fileSize.width > 0 && fileSize.height > 0
							? `${ fileSize.width } x ${ fileSize.height }`
							: unknown }
					</div>
				</div>
				<div className="jb-ig-popup row">
					<div className="label">Expected Dimensions</div>
					<div className="value">
						{ expectedSize.width } x { expectedSize.height }
					</div>
				</div>
				<div className="jb-ig-popup row">
					<div className="label">Size on screen</div>
					<div className="value">
						{ sizeOnPage.width } x { sizeOnPage.height }
					</div>
				</div>
				<div className="jb-ig-popup row">
					<div className="label">Image Size</div>
					<div className="value">
						{ fileWeight.weight > 0 ? `${ Math.round( fileWeight.weight ) } KB` : unknown }
					</div>
				</div>
				<div className="jb-ig-popup row">
					<div className="label">Potential savings</div>
					<div className="value">
						{ potentialSavings > 0 ? (
							<strong>{ potentialSavings } KB</strong>
						) : loading ? (
							'Loading...'
						) : (
							<em>N/A</em>
						) }
					</div>
				</div>
				<div className="jb-ig-popup info">
					<a
						className="jb-ig-popup documentation"
						href="https://jetpack.com/support/jetpack-boost/image-performance-guide/"
						target="_blank noreferrer"
					>
						Learn how to improve site speed by optimizing images <External />
					</a>
				</div>
			</div>
		</div>
	);
}

export function Main( { stores }: { stores: MeasurableImageStore[] } ) {
	const state = useGuideState();
	const first = useImage( stores[ 0 ] );
	const [ show, setShow ] = useState< number | false >( false );
	const [ position, setPosition ] = useState( { top: 0, left: 0 } );
	const hasImages = useCallback( () => {
		return stores.some( controller => {
			const { fileSize } = selectors.getImageFacts( controller.id );
			return fileSize.width !== -1 && fileSize.height !== -1;
		} );
	}, [ stores ] );
	const [ hasFileSize, setHasFileSize ] = useState( hasImages );
	useLayoutEffect( () => {
		const stops = stores.map( controller =>
			subscribeToFacts( () => setHasFileSize( hasImages() ), controller.id )
		);
		stores.forEach( controller => controller.updateDimensions() );
		return () => stops.forEach( stop => stop() );
	}, [ stores, hasImages ] );
	useLayoutEffect( () => {
		stores.forEach( controller =>
			controller.node.classList.toggle( 'jetpack-boost-guide__backdrop', show !== false )
		);
		return () =>
			stores.forEach( controller =>
				controller.node.classList.remove( 'jetpack-boost-guide__backdrop' )
			);
	}, [ stores, show ] );
	const { width, height } = first.sizeOnPage;
	const size: GuideSize =
		width < 200 || height < 200 ? 'micro' : width < 400 || height < 400 ? 'small' : 'normal';
	const visible = state === 'active' && hasFileSize;
	const present = usePresence( visible, 400 + 50 * ( stores.length - 1 ) );
	const closeDetails: MouseLeave = useCallback( event => {
		if (
			event.relatedTarget instanceof Element &&
			event.relatedTarget.classList.contains( 'keep-guide-open' )
		)
			return;
		setShow( false );
	}, [] );
	const hover = useCallback( ( selected: number, next: Position ) => {
		setPosition( next );
		setShow( selected );
	}, [] );
	if ( ! present ) return null;
	return (
		<div
			className={ `jb-ig-main guide ${ size }${ show !== false ? ' show keep-guide-open' : '' }` }
			onMouseLeave={ closeDetails }
		>
			<div className="jb-ig-main previews">
				{ stores.map( ( controller, index ) => (
					<Bubble
						key={ controller.id }
						index={ index }
						store={ controller }
						exiting={ ! visible }
						onHover={ hover }
					/>
				) ) }
			</div>
			{ show !== false && (
				<Popup
					store={ stores[ show ] }
					size={ size }
					position={ position }
					onMouseLeave={ closeDetails }
				/>
			) }
		</div>
	);
}
