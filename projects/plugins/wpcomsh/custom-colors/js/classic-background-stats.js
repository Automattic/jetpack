/* global _ */
( function ( $, _ ) {
	const statBucket = 'classic-custom-background';

	const sendClientSideStat = function ( eventName ) {
		const url =
			document.location.protocol +
			'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_' +
			statBucket +
			'=' +
			eventName +
			'&baba=' +
			Math.random();
		new Image().src = url;
	};

	const processEvent = function ( e ) {
		const target = $( e.target ),
			eventName = target.data( 'event' );

		return sendClientSideStat( eventName );
	};

	$( function () {
		const oldColorChange = $( '#background-color' ).iris( 'option', 'change' );

		// Replace the Iris change handler
		// Debounce so we don't get too many colour change events from users
		// trying to find the perfect colour
		const colorChange = _.debounce(
			function () {
				$( '#background-color' ).trigger( 'custom-bg-color-change' );
				oldColorChange.apply( null, arguments );
			},
			1000,
			true
		);

		$( '#background-color' ).iris( 'option', 'change', colorChange );

		// Bind event handlers
		$( '#remove-background' ).data( 'event', 'remove-background' ).on( 'click', processEvent );
		$( '#upload' ).data( 'event', 'upload-file' ).on( 'click', processEvent );
		$( '#choose-from-library-link' )
			.data( 'event', 'choose-from-library' )
			.on( 'click', processEvent );
		$( 'input[name=background-position-x]' )
			.data( 'event', 'change-background-position' )
			.on( 'click', processEvent );
		$( 'input[name=background-repeat]' )
			.data( 'event', 'change-background-repeat' )
			.on( 'click', processEvent );
		$( 'input[name=background-attachment]' )
			.data( 'event', 'change-background-attachment' )
			.on( 'click', processEvent );
		$( '#background-color' )
			.data( 'event', 'change-background-color' )
			.on( 'custom-bg-color-change', processEvent );
	} );
} )( jQuery, _ );
