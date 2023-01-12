// phpcs:disable no-undef

/*
 * Thickbox 3.1 - One Box To Rule Them All. jQuery was removed by Automattic.
 * By Cody Lindley (http://www.codylindley.com)
 * Copyright (c) 2007 cody lindley
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
 */

/*!!!!!!!!!!!!!!!!! edit below this line at your own risk !!!!!!!!!!!!!!!!!!!!!!!*/

let TB_WIDTH = 0;
let TB_HEIGHT = 0;
let imgLoader = null;
let TB_PrevCaption = '';
let TB_PrevURL = '';
let TB_PrevHTML = '';
let TB_NextCaption = '';
let TB_NextURL = '';
let TB_NextHTML = '';
let TB_imageCount = '';
let TB_FoundURL = false;
const a8c_tb_pathToImage = 'images/loadingAnimation.gif';
let imageGroup = null;

//on page load call a8c_tb_init
document.addEventListener(
	'DOMContentLoaded',
	function () {
		a8c_tb_init( 'a.thickbox, area.thickbox, input.thickbox' ); //pass where to apply thickbox
		imgLoader = new Image(); // preload image
		imgLoader.src = a8c_tb_pathToImage;
	},
	false
);

function show( element ) {
	element.style.display = 'block';
	element.style.visibility = 'visible';
}

function goPrev() {
	document.removeEventListener( 'click', goPrev );
	document.getElementById( 'TB_window' ).remove();
	document.querySelector( 'body' ).insertAdjacentHTML( 'beforeend', "<div id='TB_window'></div>" );
	a8c_tb_show( TB_PrevCaption, TB_PrevURL, imageGroup );
	return false;
}

function goNext() {
	document.getElementById( 'TB_window' ).remove();
	document.querySelector( 'body' ).insertAdjacentHTML( 'beforeend', "<div id='TB_window'></div>" );
	a8c_tb_show( TB_NextCaption, TB_NextURL, imageGroup );
	return false;
}

//add thickbox to href & area elements that have a class of .thickbox
function a8c_tb_init( domChunk ) {
	document.querySelectorAll( domChunk ).forEach( function ( el ) {
		el.addEventListener(
			'click',
			function () {
				const t = this.title || this.name || null;
				const a = this.href || this.alt;
				const g = this.rel || false;
				a8c_tb_show( t, a, g );
				this.blur();
				return false;
			},
			false
		);
	} );
}

export const a8c_tb_show = function ( caption, url, imageGroupIn ) {
	imageGroup = imageGroupIn;

	let params;
	//function called when the user clicks on a thickbox link

	// try {
	if ( typeof document.body.style.maxHeight === 'undefined' ) {
		//if IE 6
		$( 'body', 'html' ).css( { height: '100%', width: '100%' } );
		$( 'html' ).css( 'overflow', 'hidden' );
		if ( document.getElementById( 'TB_HideSelect' ) === null ) {
			//iframe to hide select elements in ie6
			document
				.querySelector( 'body' )
				.insertAdjacentHTML(
					'beforeend',
					"<iframe id='TB_HideSelect'></iframe><div id='TB_overlay'></div><div id='TB_window'></div>"
				);
			document.getElementById( 'TB_overlay' ).addEventListener( 'click', a8c_tb_remove, false );
		}
	} else if ( document.getElementById( 'TB_overlay' ) === null ) {
		document
			.querySelector( 'body' )
			.insertAdjacentHTML( 'beforeend', "<div id='TB_overlay'></div><div id='TB_window'></div>" );
		document.getElementById( 'TB_overlay' ).addEventListener( 'click', a8c_tb_remove, false );
	}

	if ( a8c_tb_detectMacXFF() ) {
		document.getElementById( 'TB_overlay' ).classList.add( 'TB_overlayMacFFBGHack' ); //use png overlay so hide flash
	} else {
		document.getElementById( 'TB_overlay' ).classList.add( 'TB_overlayBG' ); //use background and opacity
	}

	if ( caption === null ) {
		caption = '';
	}
	document
		.querySelector( 'body' )
		.insertAdjacentHTML(
			'beforeend',
			"<div id='TB_load'><img src='" + imgLoader.src + "' /></div>"
		); //add loader to the page
	show( document.getElementById( 'TB_load' ) ); //show loader

	let baseURL;
	if ( url.indexOf( '?' ) !== -1 ) {
		//ff there is a query string involved
		baseURL = url.substr( 0, url.indexOf( '?' ) );
	} else {
		baseURL = url;
	}

	const urlString = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/;
	const urlType = baseURL.toLowerCase().match( urlString );

	if (
		urlType === '.jpg' ||
		urlType === '.jpeg' ||
		urlType === '.png' ||
		urlType === '.gif' ||
		urlType === '.bmp'
	) {
		//code to show images

		if ( imageGroup ) {
			const TB_TempArray = document.querySelector( 'a[@rel=' + imageGroup + ']' );
			for (
				let TB_Counter = 0;
				TB_Counter < TB_TempArray.length && TB_NextHTML === '';
				TB_Counter++
			) {
				if ( ! ( TB_TempArray[ TB_Counter ].href === url ) ) {
					if ( TB_FoundURL ) {
						TB_NextCaption = TB_TempArray[ TB_Counter ].title;
						TB_NextURL = TB_TempArray[ TB_Counter ].href;
						TB_NextHTML = "<span id='TB_next'>&nbsp;&nbsp;<a href='#'>Next &gt;</a></span>";
					} else {
						TB_PrevCaption = TB_TempArray[ TB_Counter ].title;
						TB_PrevURL = TB_TempArray[ TB_Counter ].href;
						TB_PrevHTML = "<span id='TB_prev'>&nbsp;&nbsp;<a href='#'>&lt; Prev</a></span>";
					}
				} else {
					TB_FoundURL = true;
					TB_imageCount = 'Image ' + ( TB_Counter + 1 ) + ' of ' + TB_TempArray.length;
				}
			}
		}

		const imgPreloader = new Image();
		imgPreloader.onload = function () {
			imgPreloader.onload = null;

			// Resizing large images - orginal by Christian Montoya edited by me.
			const pagesize = a8c_tb_getPageSize();
			const x = pagesize[ 0 ] - 150;
			const y = pagesize[ 1 ] - 150;
			let imageWidth = imgPreloader.width;
			let imageHeight = imgPreloader.height;
			if ( imageWidth > x ) {
				imageHeight = imageHeight * ( x / imageWidth );
				imageWidth = x;
				if ( imageHeight > y ) {
					imageWidth = imageWidth * ( y / imageHeight );
					imageHeight = y;
				}
			} else if ( imageHeight > y ) {
				imageWidth = imageWidth * ( y / imageHeight );
				imageHeight = y;
				if ( imageWidth > x ) {
					imageHeight = imageHeight * ( x / imageWidth );
					imageWidth = x;
				}
			}
			// End Resizing

			TB_WIDTH = imageWidth + 30;
			TB_HEIGHT = imageHeight + 60;
			document
				.getElementById( 'TB_window' )
				.insertAdjacentHTML(
					'beforeend',
					"<a href='' id='TB_ImageOff' title='Close'><img id='TB_Image' src='" +
						url +
						"' width='" +
						imageWidth +
						"' height='" +
						imageHeight +
						"' alt='" +
						caption +
						"'/></a>" +
						"<div id='TB_caption'>" +
						caption +
						"<div id='TB_secondLine'>" +
						TB_imageCount +
						TB_PrevHTML +
						TB_NextHTML +
						"</div></div><div id='TB_closeWindow'><a href='#' id='TB_closeWindowButton' title='Close'>close</a> or Esc Key</div>"
				);

			document
				.getElementById( 'TB_closeWindowButton' )
				.addEventListener( 'click', a8c_tb_remove, false );

			if ( ! ( TB_PrevHTML === '' ) ) {
				document.getElementById( 'TB_prev' ).addEventListener( 'click', goPrev, false );
			}

			if ( ! ( TB_NextHTML === '' ) ) {
				document.getElementById( 'TB_next' ).click( goNext );
			}

			document.onkeydown = function ( e ) {
				let keycode = null;
				if ( e === null ) {
					// ie
					keycode = event.keyCode;
				} else {
					// mozilla
					keycode = e.which;
				}
				if ( keycode === 27 ) {
					// close
					a8c_tb_remove();
				} else if ( keycode === 190 ) {
					// display previous image
					if ( ! ( TB_NextHTML === '' ) ) {
						document.onkeydown = '';
						goNext();
					}
				} else if ( keycode === 188 ) {
					// display next image
					if ( ! ( TB_PrevHTML === '' ) ) {
						document.onkeydown = '';
						goPrev();
					}
				}
			};

			a8c_tb_position();
			document.getElementById( 'TB_load' ).remove();
			document.getElementById( 'TB_ImageOff' ).addEventListener( 'click', a8c_tb_remove, false );
			show( document.getElementById( 'TB_window' ) ); //for safari using css instead of show
		};

		imgPreloader.src = url;
	} else {
		//code to show html
		const queryString = url.replace( /^[^?]+\??/, '' );
		params = a8c_tb_parseQuery( queryString );
		TB_WIDTH = params.width * 1 + 30 || 630; //defaults to 630 if no paramaters were added to URL
		TB_HEIGHT = params.height * 1 + 40 || 440; //defaults to 440 if no paramaters were added to URL
		const ajaxContentW = TB_WIDTH - 30;
		const ajaxContentH = TB_HEIGHT - 45;

		if ( url.indexOf( 'TB_iframe' ) !== -1 ) {
			// either iframe or ajax window
			const urlNoQuery = url.split( 'TB_' );
			document.getElementById( 'TB_iframeContent' )?.remove();
			if ( params.modal !== 'true' ) {
				//iframe no modal
				document
					.getElementById( 'TB_window' )
					.insertAdjacentHTML(
						'beforeend',
						"<div id='TB_title'><div id='TB_ajaxWindowTitle'>" +
							caption +
							"</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton' title='Close'>close</a> or Esc Key</div></div><iframe frameborder='0' hspace='0' src='" +
							urlNoQuery[ 0 ] +
							"' id='TB_iframeContent' name='TB_iframeContent" +
							Math.round( Math.random() * 1000 ) +
							"' style='width:" +
							( ajaxContentW + 29 ) +
							'px;height:' +
							( ajaxContentH + 17 ) +
							"px;' > </iframe>"
					);
			} else {
				//iframe modal
				document
					.getElementById( 'TB_overlay' )
					.removeEventListener( 'click', a8c_tb_remove, false );
				document
					.getElementById( 'TB_window' )
					.insertAdjacentHTML(
						'beforeend',
						"<iframe frameborder='0' hspace='0' src='" +
							urlNoQuery[ 0 ] +
							"' id='TB_iframeContent' name='TB_iframeContent" +
							Math.round( Math.random() * 1000 ) +
							"' style='width:" +
							( ajaxContentW + 29 ) +
							'px;height:' +
							( ajaxContentH + 17 ) +
							"px;'> </iframe>"
					);
			}
			document.getElementById( 'TB_iframeContent' ).onload = a8c_tb_showIframe;
		} else if ( document.getElementById( 'TB_window' ).style.display !== 'block' ) {
			// not an iframe, ajax
			if ( params.modal !== 'true' ) {
				//ajax no modal
				document
					.getElementById( 'TB_window' )
					.insertAdjacentHTML(
						'beforeend',
						"<div id='TB_title'><div id='TB_ajaxWindowTitle'>" +
							caption +
							"</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton'>close</a> or Esc Key</div></div><div id='TB_ajaxContent' style='width:" +
							ajaxContentW +
							'px;height:' +
							ajaxContentH +
							"px'></div>"
					);
			} else {
				//ajax modal
				document.getElementById( 'TB_overlay' ).removeEventListener( 'click', a8c_tb_remove );
				document
					.getElementById( 'TB_window' )
					.insertAdjacentHTML(
						'beforeend',
						"<div id='TB_ajaxContent' class='TB_modal' style='width:" +
							ajaxContentW +
							'px;height:' +
							ajaxContentH +
							"px;'></div>"
					);
			}
		} else {
			//this means the window is already up, we are just loading new content via ajax
			document.getElementById( 'TB_ajaxContent' )[ 0 ].style.width = ajaxContentW + 'px';
			document.getElementById( 'TB_ajaxContent' )[ 0 ].style.height = ajaxContentH + 'px';
			document.getElementById( 'TB_ajaxContent' )[ 0 ].scrollTop = 0;
			document.getElementById( 'TB_ajaxWindowTitle' ).html( caption );
		}

		document
			.getElementById( 'TB_closeWindowButton' )
			.addEventListener( 'click', a8c_tb_remove, false );

		if ( url.indexOf( 'TB_inline' ) !== -1 ) {
			document
				.getElementById( 'TB_ajaxContent' )
				.append( document.getElementById( params.inlineId ).children() );
			document.getElementById( 'TB_window' ).unload = function () {
				document
					.getElementById( params.inlineId )
					.append( document.getElementById( 'TB_ajaxContent' ).children() ); // move elements back when you're finished
			};
			a8c_tb_position();
			document.getElementById( 'TB_load' ).remove();
			show( document.getElementById( 'TB_window' ) );
		} else if ( url.indexOf( 'TB_iframe' ) !== -1 ) {
			a8c_tb_position();
			const isSafari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent );

			if ( isSafari ) {
				//safari needs help because it will not fire iframe onload
				document.getElementById( 'TB_load' ).remove();
				show( document.getElementById( 'TB_window' ) );
			}
		} else {
			document
				.getElementById( 'TB_ajaxContent' )
				.load( ( url += '&random=' + new Date().getTime() ), function () {
					//to do a post change this load method
					a8c_tb_position();
					document.getElementById( 'TB_load' ).remove();
					a8c_tb_init( '#TB_ajaxContent a.thickbox' );
					show( document.getElementById( 'TB_window' ) );
				} );
		}
	}

	if ( ! params.modal ) {
		document.onkeyup = function ( e ) {
			let keycode = null;
			if ( e === null ) {
				// ie
				keycode = event.keyCode;
			} else {
				// mozilla
				keycode = e.which;
			}
			if ( keycode === 27 ) {
				// close
				a8c_tb_remove();
			}
		};
	}
	// } catch ( e ) {
	// 	//nothing here
	// }
};

//helper functions below
export const a8c_tb_showIframe = function () {
	document.getElementById( 'TB_load' )?.remove();
	show( document.getElementById( 'TB_window' ) );
};

export const a8c_tb_remove = function () {
	document.getElementById( 'TB_imageOff' )?.removeEventListener( 'click', a8c_tb_remove );
	document.getElementById( 'TB_closeWindowButton' )?.removeEventListener( 'click', a8c_tb_remove );
	document.getElementById( 'TB_window' )?.remove();
	document.querySelector( '#TB_window,#TB_overlay,#TB_HideSelect' ).foreach( el => {
		el.dispatchEvent( new Event( 'unload' ) );
		el.removeAllEventListeners();
		el.remove();
	} );
	document.getElementById( 'TB_load' )?.remove();
	if ( typeof document.body.style.maxHeight === 'undefined' ) {
		//if IE 6
		document.querySelector( 'body', 'html' ).forEach( function ( el ) {
			el.style.height = 'auto';
			el.style.width = 'auto';
		} );
		document.querySelector( 'html' ).style.overflow = '';
	}
	document.onkeydown = '';
	document.onkeyup = '';
	return false;
};

function a8c_tb_position() {
	document.getElementById( 'TB_window' ).style.marginLeft =
		'-' + parseInt( TB_WIDTH / 2, 10 ) + 'px';
	document.getElementById( 'TB_window' ).style.width = TB_WIDTH + 'px';
	// Not supporting IR6 anymore
	// if ( ! ( jQuery.browser.msie && jQuery.browser.version < 7 ) ) {
	// 	// take away IE6
	// 	document.getElementById( 'TB_window' ).style.marginTop =
	// 		'-' + parseInt( TB_HEIGHT / 2, 10 ) + 'px';
	// }
}

function a8c_tb_parseQuery( query ) {
	const Params = {};
	if ( ! query ) {
		return Params;
	} // return empty object
	const Pairs = query.split( /[;&]/ );
	for ( let i = 0; i < Pairs.length; i++ ) {
		const KeyVal = Pairs[ i ].split( '=' );
		if ( ! KeyVal || KeyVal.length !== 2 ) {
			continue;
		}
		const key = unescape( KeyVal[ 0 ] );
		let val = unescape( KeyVal[ 1 ] );
		val = val.replace( /\+/g, ' ' );
		Params[ key ] = val;
	}
	return Params;
}

function a8c_tb_getPageSize() {
	const de = document.documentElement;
	const w =
		window.innerWidth || self.innerWidth || ( de && de.clientWidth ) || document.body.clientWidth;
	const h =
		window.innerHeight ||
		self.innerHeight ||
		( de && de.clientHeight ) ||
		document.body.clientHeight;
	const arrayPageSize = [ w, h ];
	return arrayPageSize;
}

function a8c_tb_detectMacXFF() {
	const userAgent = navigator.userAgent.toLowerCase();
	if ( userAgent.indexOf( 'mac' ) !== -1 && userAgent.indexOf( 'firefox' ) !== -1 ) {
		return true;
	}
}
