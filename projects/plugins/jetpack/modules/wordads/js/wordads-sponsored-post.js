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
		this.impressionPixelTrackerUrl = obj.creativeCountPixelUrl || '';

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
		};

		this.insertMarkup = function ( markup, selector ) {
			var articles = document.querySelectorAll( selector );
			var length = articles.length;
			var target = null;

			for ( var i = 0; i < length; i++ ) {
				if ( ! this.isBottomOfElementInViewport( articles[ i ] ) ) {
					target = articles[ i ];
					articles[ i ].insertAdjacentHTML( 'afterend', markup );
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
		var placeholder = document.getElementsByClassName( 'wa-sponsored-post' )[ 0 ];

		/*global wa_sponsored_post*/
		wa_sponsored_post.template = placeholder.outerHTML;
		wa_sponsored_post.selector = getSelector( placeholder );

		placeholder.parentElement.removeChild( placeholder );

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
