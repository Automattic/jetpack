
(function($) {

	// gallery faded layer and container elements
	var overlay, comments, gallery, container, nextButton, previousButton, info, title, resizeTimeout, mouseTimeout, photo_info, close_hint,
	screenPadding = 110;

	var keyListener = function(e){

		switch(e.which){
			case 39: // right
			case 75: // k
				e.preventDefault();
				gallery.jp_carousel('next');
				break;
			case 37: // left
			case 74: // j
				e.preventDefault();
				gallery.jp_carousel('previous');
				break;
			case 27: // escape
				e.preventDefault();
				container.jp_carousel('close');
				break;
		}
	}

	var resizeListener = function(e){
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function(){
			gallery
				.jp_carousel('slides')
				.jp_carousel('fitSlide', true);
			gallery
				.jp_carousel('fitInfo', true);
		}, 200);
	}

	var prepareGallery = function(){
		if (!overlay) {
			nextButton = $("<div><span></span></div>")
				.addClass('jp-carousel-next-button')
				.css({
					position:'absolute',
					top:'0',
					right:'0',
					bottom:'0',
					width: screenPadding
				});
			previousButton = $("<div><span></span></div>")
				.addClass('jp-carousel-previous-button')
				.css({
					position:'absolute',
					top:'0',
					left:'0',
					bottom:'0',
					width: screenPadding
				});

			overlay = $('<div></div>')
				.css({
					position:'absolute',
					top:0,
					right:0,
					bottom:0,
					left:0,
					background:'#000',
					opacity:0.90
				});

			title = $('<h2>Title</h2>');
			buttons = '<a class="jp-carousel-permalink" href="#">Permalink</a>';
			buttons = '<div class="jp-carousel-buttons">' + buttons + '</div>';
			photo_info = $('<div class="jp-carousel-photo-info"></div>').append(title).append($(buttons));
			info = $('<div></div>')
				.addClass('jp-carousel-info')
				.css({
					height:80,
					left:screenPadding,
					right:screenPadding
				})
				.append(photo_info);

			gallery = $('<div></div>')
				.addClass('jp-carousel')
				.css({
					'position':'absolute',
					'top':0,
					'bottom':info.height(),
					'left':0,
					'right':0
				});

			close_hint = $('<div class="jp-carousel-close-hint"><span>esc</span></div>');
			container = $("<div></div>")
				.addClass('jp-carousel-wrap')
				.css({
					position:'fixed',
					top:0,
					right:0,
					bottom:0,
					left:0,
					zIndex:999999
				})
				.hide()
				.append(overlay)
				.append(gallery)
				.append(info)
				.append(nextButton)
				.append(previousButton)
				.append(close_hint)
				.appendTo($('body'))
				.click(function(e){
					var target = $(e.target), wrap = target.parents('div.jp-carousel-wrap'), data = wrap.data('carousel-extra'),
						slide = wrap.find('div.selected'), attachment_id = slide.data('attachment-id');
					data = data || [];

					if ( target.is(gallery) || target.parents().add(target).is(close_hint) ) {
						container.jp_carousel('close');
					} else if ( target.hasClass('jp-carousel-permalink') ) {
						e.stopPropagation();
					} else {
						container.jp_carousel('next');
					}
				})
				.bind('jp_carousel.afterOpen', function(){
					$(window).bind('keydown', keyListener);
					$(window).bind('resize', resizeListener);
				})
				.bind('jp_carousel.beforeClose', function(){
					var scroll = $(window).scrollTop();

					$(window).unbind('keydown', keyListener);
					$(window).unbind('resize', resizeListener);
					document.location.hash = '';
					$(window).scrollTop(scroll);
				});

			nextButton.add(previousButton).click(function(e){
				e.preventDefault();
				e.stopPropagation();
				if ( nextButton.is(this) ) {
					gallery.jp_carousel('next');
				} else {
					gallery.jp_carousel('previous');
				}
			});
		};
	}

	var methods = {
		open: function(options) {
			var settings = {
				'items_selector' : ".gallery-item [data-attachment-id]",
				'start_index': 0
			},
			data = $(this).data('carousel-extra');

			if ( !data )
				return; // don't run if the default gallery functions weren't used

			prepareGallery();
			container.data('carousel-extra', data);

			return this.each(function() {
				// If options exist, lets merge them
				// with our default settings
				var $this = $(this);

				if ( options )
					$.extend( settings, options );
				if ( -1 == settings.start_index )
					settings.start_index = 0; //-1 returned if can't find index, so start from beginning

				container.trigger('jp_carousel.beforeOpen').fadeIn('fast',function(){
					container.trigger('jp_carousel.afterOpen');
					gallery
						.jp_carousel('initSlides', $this.find(settings.items_selector), settings.start_index)
						.jp_carousel('start', settings.start_index);
				});
				gallery.html('');
			});
		},

		start : function(start_index){
			var slides = this.jp_carousel('slides'), selected = slides.eq(start_index);

			if ( selected.length == 0 )
				selected = slides.eq(0)

			gallery.jp_carousel('selectSlide', selected, false);
			return this;
		},

		close : function(){
			return container
				.trigger('jp_carousel.beforeClose')
				.fadeOut('fast', function(){
					container.trigger('jp_carousel.afterClose');
				});

		},

		next : function(){
			var selected = this.jp_carousel('selectedSlide'), slide;

			if ( selected.length == 0 ) { // no selection return first item
				slide = this.jp_carousel('slides').first(0);
			} else if( selected.is( this.jp_carousel('slides').last() ) ) {
				gallery.jp_carousel('loopSlides');
			} else {
				slide = selected.next();
			}
			if (!slide) {
				return this;
			} else {
				return this.jp_carousel('selectSlide', slide);
			}
		},

		previous : function(){
			var selected = this.jp_carousel('selectedSlide'), slide;

			if ( selected.length == 0 ) { // no selection return first item
				slide = this.jp_carousel('slides').first();
			} else if ( selected.is( this.jp_carousel('slides').first() ) ) { // if it's the last slide
				gallery.jp_carousel('loopSlides', true);
			} else {
				slide = selected.prev();
			}
			if (!slide) {
				return this;
			} else {
				return this.jp_carousel('selectSlide', slide);
			}
		},

		resetButtons : function(current) {

			$('.jp-carousel-buttons a.jp-carousel-permalink').attr('href', current.data('permalink'));
		},

		loopSlides : function(reverse){
			var slides = gallery.jp_carousel('slides'), last, first;
			gallery.jp_carousel('selectedSlide').removeClass('selected');
			if (reverse !== true ) {
				last = slides.last();
				slides.first().nextAll().not(last).css({left:gallery.width()+slides.first().width()}).hide();
				last.css({
					left:-last.width()
				});
				last.prev().css({
					left:-last.width() - last.prev().width()
				});
				slides.first().css({left:gallery.width()});
				setTimeout(function(){
					gallery.jp_carousel('selectSlide', slides.show().first());
				}, 400);

			} else {
				first = slides.first();
				first.css({
					left:gallery.width()
				});
				first.next().css({
					left:gallery.width() + first.width()
				});
				first.next().nextAll().hide().css({left:-slides.last().width()});
				slides.last().css({left:-slides.last().width()});
				slides.last().prevAll().not(first, first.next()).hide().css({left:-slides.last().width()-slides.last().prev().width()});
				setTimeout(function(){
					gallery.jp_carousel('selectSlide', slides.show().last());
				}, 400);

			}
		},

		selectedSlide : function(){
			return this.find('.selected');
		},

		selectSlide : function(slide, animate){
			var last = this.find('.selected').removeClass('selected'),
				slides = gallery.jp_carousel('slides'),
				current = $(slide).addClass('selected'),
				previous = current.prev(),
				next = current.next(),
				width = $(window).width(),
				previous_previous = previous.prev(),
				next_next = next.next(),
				left = (gallery.width() - current.width()) * 0.5,
				info_left,
				animated,
				info_min;
			// center the main image

			method = 'css';
			animated = current
				.add(previous)
				.add(previous.prev())
				.add(next)
				.add(next.next())
				.jp_carousel('loadSlide');
			// slide the whole view to the x we want
			slides.not(animated).hide();

			current[method]({left:left}).show();

			// minimum width
			gallery.jp_carousel('fitInfo', animate);

			// prep the slides
			var direction = last.is(current.prevAll()) ? 1 : -1;
			if ( 1 == direction ) {
				next_next.css({left:gallery.width() + next.width()}).show();
				next.hide().css({left:gallery.width() + current.width()}).show();
				previous_previous.css({left:-previous_previous.width() - current.width()});
			} else {
				previous.css({left:-previous.width() - current.width()});
				next_next.css({left:gallery.width() + current.width()});
			}
			// if advancing prepare the slide that will enter the screen
			previous[method]({left:-previous.width() + (screenPadding * 0.75) }).show();
			next[method]({left:gallery.width() - (screenPadding * 0.75) }).show();
			title.html(current.data('title') || '');
			document.location.href = document.location.href.replace(/#.*/, '') + '#jp-carousel-' + current.data('attachment-id');
			this.jp_carousel('resetButtons', current);
			container.trigger('jp_carousel.selectSlide', [current]);
		},

		slides : function(){
			return this.find('.jp-carousel-slide');
		},

		slideDimensions : function(){
			return {
				width: $(window).width() - (screenPadding * 2),
				height: $(window).height() - info.height()*2
			}
		},

		loadSlide : function(){
			return this.each(function(){
				var slide = $(this),
				    max   = gallery.jp_carousel('slideDimensions'),
				    orig  = slide.jp_carousel('originalDimensions'),
				    src   = slide.data('src');


				slide.find('img')
					.one('load', function(){
						// set the width/height of the image if it's too big
						slide
							.jp_carousel('fitSlide',false);
							slide.find('img').fadeIn();
					})
					.attr('src', src);
			});
		},

		bestFit : function(){
			var max = gallery.jp_carousel('slideDimensions'),
				orig = this.jp_carousel('originalDimensions');

			if ( orig.width > max.width || orig.height > max.height) {
				ratio = Math.min(Math.min(max.width/orig.width, 1), Math.min(max.height/orig.height, 1));
			} else {
				ratio = 1;
			}
			return {
				width: orig.width * ratio,
				height: orig.height * ratio
			};
		},

		fitInfo : function(animated){
			var current = this.jp_carousel('selectedSlide'),
				size = current.jp_carousel('bestFit');

			photo_info.css({
				left:(info.width() - size.width) * 0.5,
				width:size.width
			});
			return this;
		},

		fitSlide : function(animated){
			return this.each(function(){
				var selected = gallery.jp_carousel('selectedSlide'),
					$this = $(this),
					dimensions = $this.jp_carousel('bestFit'),
					method = 'css',
					max = gallery.jp_carousel('slideDimensions');

				if ( selected.length == 0) {
					dimensions.left = $(window).width();
				} else if ($this.is(selected)) {
					dimensions.left = ($(window).width() - dimensions.width) * 0.5;
				} else if ($this.is(selected.next())) {
					dimensions.left = gallery.width() - ( screenPadding * 0.75 );
				} else if ($this.is(selected.prev())) {
					dimensions.left = -dimensions.width + screenPadding * 0.75;
				} else {
					if ($this.is(selected.nextAll())) {
						dimensions.left = $(window).width();
					} else {
						dimensions.left = -dimensions.width;
					}
				}
				dimensions.bottom = (max.height - dimensions.height) * 0.5;
				$this[method](dimensions);
			})
		},

		initSlides : function(items, start_index){
			var width = this.jp_carousel('slideDimensions').width,
				x = 0;
			// create the 'slide'
			items.each(function(i){
				var src_item = $(this),
					attachment_id = src_item.data('attachment-id') || 0,
					orig_size = src_item.data('orig-size') || 0;

				if ( !attachment_id || !orig_size )
					return false; // break the loop if we are missing the data-* attributes

				$('<div class="jp-carousel-slide"></div>')
					.hide()
					.css({
						left:i < start_index ? -1000 : gallery.width()
					})
					.append($('<img>'))
					.appendTo(gallery)
					.data('src', src_item.attr('src') )
					.data('title', src_item.parents('dl').find('dd.gallery-caption').html())
					.data('attachment-id', attachment_id)
					.data('permalink', src_item.parents('a').attr('href'))
					.data('orig-size', orig_size)
					.jp_carousel('fitSlide', false)
					.find('img').hide();
			});
			return this;
		},


		originalDimensions: function() {
			var splitted = $(this).data('orig-size').split(',');
			return {width: parseInt(splitted[0], 10), height: parseInt(splitted[1], 10)};
		}
	};

	$.fn.jp_carousel = function(method){
		// ask for the HTML of the gallery
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.open.apply( this, arguments );
		} else {
			$.error( 'Method ' +	method + ' does not exist on jQuery.jp_carousel' );
		}

	}
	// register the event listener for staring the gallery
	$( document.body ).on( 'click', 'div.gallery', function(e) {
		e.preventDefault();
		$(this).jp_carousel('open', {start_index: $(this).find('.gallery-item').index($(e.target).parents('.gallery-item'))});
	});

	// start on page load if hash exists
	if ( document.location.hash && document.location.hash.match(/jp-carousel-(\d+)/) ) {
		$(document).ready(function(){
			var gallery = $('div.gallery'), index = -1, n = document.location.hash.match(/jp-carousel-(\d+)/);

			n = parseInt(n[1], 10);

			gallery.find('img').each(function(num, el){
				if ( n && $(el).data('attachment-id') == n ) { // n cannot be 0 (zero)
					index = num;
					return false;
				}
			});

			if ( index != -1 )
				gallery.jp_carousel('open', {start_index: index});
		});
	}

})(jQuery);
