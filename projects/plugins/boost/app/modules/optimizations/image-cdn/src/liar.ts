import { dynamicSrcset } from './srcset';

( function () {
	const lazyImages = document.querySelectorAll< HTMLImageElement >( 'img[loading=lazy]' );
	lazyImages.forEach( dynamicSrcset );
} )();
