const resizeMapContainer = ( container, fixedHeight = null ) => {
	if ( fixedHeight ) {
		container.style.height = fixedHeight + 'px';
	} else {
		const blockWidth = container.offsetWidth;
		const maxHeight =
			window.location.search.indexOf( 'map-block-counter' ) > -1
				? window.innerHeight
				: window.innerHeight * 0.8;
		const blockHeight = Math.min( blockWidth * ( 3 / 4 ), maxHeight );
		container.style.height = blockHeight + 'px';
	}
};

export default resizeMapContainer;
