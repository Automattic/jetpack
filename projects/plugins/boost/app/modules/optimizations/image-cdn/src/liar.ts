import { dynamicSrcset } from './srcset';

( function () {
	const lazyImages = document.querySelectorAll( 'img[loading=lazy]' );
	lazyImages.forEach( dynamicSrcset );
} )();
