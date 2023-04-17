( function () {
	// Class that represents a sponsored post.
	var SponsoredPost = function ( obj ) {
		// Keeping the same names used in the template.
		this.linkText = obj.linkText || '';
		this.permalink = obj.permalink || '';
		this.postThumbnail = obj.postThumbnail || '';
		this.postThumbnailAltText = obj.postThumbnailAltText || '';
		this.cta = obj.cta || '';
		this.postContent = obj.postContent || '';
		this.sponsorLinkText = obj.sponsorLinkText || 'The WordPress.com Blog';
		this.sponsorPermalink = obj.sponsorPermalink || 'https://en.blog.wordpress.com/';
		this.postExcerpt = obj.postExcerpt || '';
		this.postDate = obj.postDate || '';

		// Trackers.
		this.clickTrackerUrl = obj.clickTrackerUrl || '';
		this.impressionPixelTrackerUrl = obj.impressionPixelTrackerUrl || '';

		this.replaceTemplate = function ( template ) {
			let _self = this;
			return template.replace( /{{sp_.+?}}/g, function ( tag ) {
				switch ( tag ) {
					case '{{sp_link_text}}':
						return _self.linkText;
					case '{{sp_permalink}}':
						return _self.permalink;
					case '{{sp_post_thumbnail}}':
						return (
							'<p><img class="native-ad-featured-image" src="' +
							_self.postThumbnail +
							'" alt="' +
							_self.postThumbnailAltText +
							'"/></p>'
						);
					case '{{sp_cta}}':
						return _self.cta;
					case '{{sp_post_content}}':
						return _self.postContent;
					case '{{sp_sponsor_link_text}}':
						return _self.sponsorLinkText;
					case '{{sp_sponsor_permalink}}':
						return _self.sponsorPermalink;
					case '{{sp_post_excerpt}}':
						return _self.postExcerpt;
					case '{{sp_post_date}}':
						return _self.postDate;
				}
			} );
		};

		this.insert = function ( template, selector ) {
			var markup = this.replaceTemplate( template );
			var root = this.insertMarkup( markup, selector );
			if ( ! root ) {
				throw new Error( 'no valid slots for content' );
			}
			this.hookEvents( root );
			this.initViewableImpressionTrackers( root, this.impressionPixelTrackerUrl );
		};

		this.insertMarkup = function ( markup, selector ) {
			var posts = document.querySelectorAll( selector );
			var length = posts.length;
			var target = null;

			for ( var i = 0; i < length; i++ ) {
				if ( ! this.isBottomOfElementInViewport( posts[ i ] ) ) {
					target = posts[ i ];
					posts[ i ].insertAdjacentHTML( 'afterend', markup );
					break;
				}
			}
			return target ? target.nextElementSibling : null;
		};

		this.isBottomOfElementInViewport = function ( el ) {
			var rect = el.getBoundingClientRect();
			return (
				rect.bottom <=
				( window.innerHeight || document.documentElement.clientHeight ) /* or $(window).height() */
			);
		};

		this.hookEvents = function ( rootEl ) {
			// Show a click pointer over the whole element.
			var wholeAd = rootEl;
			wholeAd.style.cursor = 'pointer';
			wholeAd.addEventListener( 'click', this.fireLinkTrackers.bind( this ) );
		};

		this.fireLinkTrackers = function () {
			window.open( this.clickTrackerUrl, '_blank' );
		};

		this.initViewableImpressionTrackers = function ( rootEl, impressionPixelTrackerUrl ) {
			var IMPRESSION_DURATION = 1000; // Continuous duration of sponsored post being visible before tracking is fired.
			var impressionCallbackId = null; // Set when impression callback is queued to fire.

			// Use IntersectionObserver if available.
			if ( typeof IntersectionObserver === 'function' ) {
				// Get rect of the sponsored post to determine viewability.
				var sponsoredPostRect = rootEl.getBoundingClientRect();
				var sponsoredPostArea = sponsoredPostRect.width * sponsoredPostRect.height;

				// Calculate threshold. For ads larger than 242,500 pixels, a threshold of 30% is allowed per MRC.
				var threshold = sponsoredPostArea > 242500 ? 0.3 : 0.5;

				var observer = new IntersectionObserver(
					function ( entries ) {
						if ( entries[ 0 ].intersectionRatio > 0 ) {
							if ( entries[ 0 ].intersectionRatio >= threshold ) {
								// Need to queue the impression callback to fire.
								if ( ! impressionCallbackId ) {
									impressionCallbackId = setTimeout( function () {
										this.fireViewableImpressionTracker( impressionPixelTrackerUrl );

										// Can stop observing after the impression has been fired.
										observer.disconnect();
									}, IMPRESSION_DURATION );
								}
							}
							if ( entries[ 0 ].intersectionRatio < threshold ) {
								// Cancel any queued callback.
								if ( impressionCallbackId ) {
									clearTimeout( impressionCallbackId );
									impressionCallbackId = null;
								}
							}
						}
					},
					{ threshold: [ threshold ] }
				);

				observer.observe( rootEl );
			} else {
				// Fallback to using polling.
				var POLLING_TIMEOUT = 100; // 100ms is minimum polling time per MRC.

				var pollIntervalId = setInterval( function () {
					// Get sponsored post element.
					if ( ! ( rootEl && rootEl.isConnected ) ) {
						// Sponsored post must have been deleted from the DOM. Stop our polling.
						clearInterval( pollIntervalId );
						return;
					}

					// Get window dimensions.
					var windowHeight = window.innerHeight;
					var windowWidth = window.innerWidth;

					// Get rect of the sponsored post to determine viewability.
					var sponsoredPostRect = rootEl.getBoundingClientRect();
					var sponsoredPostArea = sponsoredPostRect.width * sponsoredPostRect.height;

					if (
						sponsoredPostRect.y > windowHeight ||
						sponsoredPostRect.y + sponsoredPostRect.height < 0 ||
						sponsoredPostRect.x > windowWidth ||
						sponsoredPostRect.x + sponsoredPostRect.width < 0
					) {
						// Sponsored post is completely outside the window. Need to cancel any queued impression callback.
						if ( impressionCallbackId ) {
							clearInterval( impressionCallbackId );
							impressionCallbackId = null;
						}
					} else {
						// Sponsored post is at least partially visible. Create a rectangle that describes it's position on the window.
						var viewableRect = {
							x1: sponsoredPostRect.x,
							y1: sponsoredPostRect.y,
							x2: sponsoredPostRect.x + sponsoredPostRect.width,
							y2: sponsoredPostRect.y + sponsoredPostRect.height,
						};

						// Clip the rect to the visible extents of the window.
						if ( viewableRect.y1 < 0 ) {
							viewableRect.y1 = 0;
						}

						if ( viewableRect.y2 > windowHeight ) {
							viewableRect.y2 = windowHeight;
						}

						if ( viewableRect.x1 < 0 ) {
							viewableRect.x1 = 0;
						}

						if ( viewableRect.x2 > windowWidth ) {
							viewableRect.x2 = windowWidth;
						}

						// Calculate the viewable area of the sponsored post.
						var viewableArea =
							( viewableRect.x2 - viewableRect.x1 ) * ( viewableRect.y2 - viewableRect.y1 );
						var percentOfTotal =
							viewableArea / ( sponsoredPostRect.width * sponsoredPostRect.height );

						// Calculate threshold. For ads larger than 242,500 pixels, a threshold of 30% is allowed per MRC.
						var threshold = sponsoredPostArea > 242500 ? 0.3 : 0.5;

						// Check if our sponsored post exceeds the viewability threshold.
						if ( percentOfTotal >= threshold ) {
							// Queue the impression callback if we haven't already.
							if ( ! impressionCallbackId ) {
								impressionCallbackId = setTimeout( function () {
									this.fireViewableImpressionTracker();

									// Stop polling once the impression has been fired.
									clearInterval( pollIntervalId );
								}, IMPRESSION_DURATION );
							}
						} else {
							// Cancel any inflight impression callback.
							if ( impressionCallbackId ) {
								clearInterval( impressionCallbackId );
								impressionCallbackId = null;
							}
						}
					}
				}, POLLING_TIMEOUT );
			}
		};
	};

	this.fireViewableImpressionTracker = function ( impressionPixelTrackerUrl ) {
		fetch( impressionPixelTrackerUrl );
	};

	// Class that represents the Smart response.
	var Smart = function () {
		this.hydrateFromAdCall = async function () {
			const rawResponse = await this.fetchAdCall();
			const responseJson = JSON.parse( rawResponse );
			const contentJson = JSON.parse( responseJson.sas_117652.Content );
			const creativeJson = JSON.parse( contentJson.creativeScriptJSON );

			this.creativeClickUrl = contentJson.creativeClickUrl;
			this.creativeCountPixelUrl = contentJson.creativeCountPixelUrl;
			this.creativeUrl = contentJson.creativeUrl;
			this.imageAltText = contentJson.imageAltText;
			this.creativeOriginalClickUrl = contentJson.creativeOriginalClickUrl;
			this.title = creativeJson.title;
			this.content = creativeJson.content;
			this.cta = creativeJson.cta;
		};

		this.fetchAdCall = async function () {
			const headers = new Headers();
			headers.append( 'Content-Type', 'application/json' );

			const body = JSON.stringify( {
				timestamp: Date.now(),
				networkId: 3905,
				siteId: 474853,
				pageId: 1572546,
				getAdContent: true,
				ads: [
					{
						formatId: 117652,
						tagId: 'sas_117652',
						isLazy: false,
					},
				],
			} );

			var requestOptions = {
				method: 'POST',
				headers: headers,
				body: body,
				redirect: 'follow',
			};

			return fetch( 'https://www15.smartadserver.com/3905/call', requestOptions )
				.then( response => response.text() )
				.catch( error => {
					throw new Error( error );
				} );
		};
	};

	// Initializing.
	document.addEventListener( 'DOMContentLoaded', async function () {
		// Pull out template post.
		var getSelector = function ( el ) {
			var original = el;

			el = el.parentElement;

			if ( el.tagName === 'BODY' ) {
				return 'BODY';
			}

			const parts = [];

			while ( el.parentElement && el.tagName !== 'BODY' ) {
				if ( el.id ) {
					parts.unshift( '#' + el.getAttribute( 'id' ) );
					break;
				} else {
					let c = 1,
						e = el;
					for ( ; e.previousElementSibling; e = e.previousElementSibling ) {
						c++;
					}
					parts.unshift( el.tagName + ':nth-child(' + c + ')' );
				}
				el = el.parentElement;
			}

			parts.push( original.tagName );

			return parts.join( '>' );
		};

		// Extract the template from the rendered sponsored post placeholder.
		var template = document.getElementsByClassName( 'wa-sponsored-post' )[ 0 ];

		// Collect previous sibling elements.
		var prevElements = [];

		for (
			var prev = template.previousElementSibling;
			prev && ! prev.classList.contains( 'hentry' );
			prev = prev.previousElementSibling
		) {
			prevElements.push( prev );
		}

		// Collect next sibling elements.
		var nextElements = [];

		for (
			var next = template.nextElementSibling;
			next && ! next.classList.contains( 'hentry' );
			next = next.nextElementSibling
		) {
			nextElements.push( next );
		}

		var hasPrevElements = prevElements.length > 0;
		var hasNextElements = nextElements.length > 0;

		/*global wa_sponsored_post*/

		/* Four cases we need to handle */
		if ( ! ( hasPrevElements || hasNextElements ) ) {
			wa_sponsored_post.template = template.outerHTML;
			wa_sponsored_post.selector = getSelector( template );
			template.parentElement.removeChild( template );
		} else if ( hasPrevElements && ! hasNextElements ) {
			prevElements.forEach( el => ( wa_sponsored_post.template += el.outerHTML ) );
			wa_sponsored_post.template += template.outerHTML;
			wa_sponsored_post.selector = getSelector( template );
			prevElements.forEach( el => template.parentElement.removeChild( el ) );
			template.parentElement.removeChild( template );
		} else if ( ! hasPrevElements && hasNextElements ) {
			wa_sponsored_post.template = template.outerHTML;
			wa_sponsored_post.selector = getSelector( template );
			template.parentElement.removeChild( template );
		} else if ( hasPrevElements && hasNextElements ) {
			wa_sponsored_post.template = template.outerHTML;
			nextElements.forEach( el => ( wa_sponsored_post.template += el.outerHTML ) );
			wa_sponsored_post.selector = getSelector( template.previousElementSibling );
			nextElements.forEach( el => template.parentElement.removeChild( el ) );
			template.parentElement.removeChild( template );
		}

		const smart = new Smart();
		await smart.hydrateFromAdCall();

		const sponsoredPost = new SponsoredPost( {
			linkText: smart.title,
			permalink: smart.creativeOriginalClickUrl,
			postThumbnail: smart.creativeUrl,
			postThumbnailAltText: smart.imageAltText,
			postContent: smart.content,
			cta: smart.cta,
			clickTrackerUrl: smart.creativeClickUrl,
			impressionPixelTrackerUrl: smart.creativeCountPixelUrl,
		} );

		sponsoredPost.insert( wa_sponsored_post.template, wa_sponsored_post.selector );
	} );
} )();
