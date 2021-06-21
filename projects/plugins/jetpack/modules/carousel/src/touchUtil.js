// Wipe handler, inspired by https://www.netcu.de/jquery-touchwipe-iphone-ipad-library
export function addWipeHandler( args ) {
	args = args || {};
	const config = {
		root: document.body,
		threshold: 150, // Required min distance traveled to be considered swipe.
		restraint: 100, // Maximum distance allowed at the same time in perpendicular direction.
		allowedTime: 300, // Maximum time allowed to travel that distance.
		wipeLeft: function () {},
		wipeRight: function () {},
		wipeUp: function () {},
		wipeDown: function () {},
	};

	for ( const arg in args ) {
		config[ arg ] = args[ arg ];
	}

	let startX, startY, isMoving, startTime, elapsedTime;

	function cancelTouch() {
		config.root.removeEventListener( 'touchmove', onTouchMove );
		startX = null;
		isMoving = false;
	}

	function onTouchMove( e ) {
		if ( isMoving ) {
			const x = e.touches[ 0 ].pageX;
			const y = e.touches[ 0 ].pageY;
			const dx = startX - x;
			const dy = startY - y;
			elapsedTime = new Date().getTime() - startTime;
			if ( elapsedTime <= config.allowedTime ) {
				if ( Math.abs( dx ) >= config.threshold && Math.abs( dy ) <= config.restraint ) {
					cancelTouch();
					if ( dx > 0 ) {
						config.wipeLeft( e );
					} else {
						config.wipeRight( e );
					}
				} else if ( Math.abs( dy ) >= config.threshold && Math.abs( dx ) <= config.restraint ) {
					cancelTouch();
					if ( dy > 0 ) {
						config.wipeDown( e );
					} else {
						config.wipeUp( e );
					}
				}
			}
		}
	}

	function onTouchStart( e ) {
		if ( e.touches.length === 1 ) {
			startTime = new Date().getTime();
			startX = e.touches[ 0 ].pageX;
			startY = e.touches[ 0 ].pageY;
			isMoving = true;
			config.root.addEventListener( 'touchmove', onTouchMove, false );
		}
	}

	if ( 'ontouchstart' in document.documentElement ) {
		config.root.addEventListener( 'touchstart', onTouchStart, false );
	}
}
