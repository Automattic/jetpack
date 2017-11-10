<p>OK, so images can get quite complicated as we have a few variables to work with! For example the image below has had a caption entered in the WordPress image upload dialog box, this creates a [caption] shortcode which then in turn wraps the whole thing in a <code>div</code> with inline styling! Maybe one day they'll be able to use the <code>figure</code> and <code>figcaption</code> elements for all this. Additionally, images can be wrapped in links which, if you're using anything other than <code>color</code> or <code>text-decoration</code> to style your links can be problematic.</p>
<div id="attachment_28" class="wp-caption alignnone" style="width: 510px"><a href="#"><img src="placeholder.jpg" alt="Your Alt Tag" title="bmxisbest" width="500" height="300" class="size-large wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_large.png"><noscript><img src="http://jetpacksite.com/img/img_large.png" alt="Your Alt Tag" title="bmxisbest" width="500" height="300" class="size-large wp-image-28"></noscript></a><p class="wp-caption-text">This is the optional caption.</p></div>
<p>The next issue we face is image alignment, users get the option of <em>None</em>, <em>Left</em>, <em>Right</em> &amp; <em>Center</em>. On top of this, they also get the options of <em>Thumbnail</em>, <em>Medium</em>, <em>Large</em> &amp; <em>Fullsize</em>. You'll probably want to add floats to style the image position so important to remember to clear these to stop images popping below the bottom of your articles.</p>
<img src="placeholder.jpg" alt="Your Alt Title" title="Your Title" width="300" height="200" class="alignright size-medium wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_medium.png"><noscript><img src="http://jetpacksite.com/img/img_medium.png" alt="Your Alt Title" title="Your Title" width="300" height="200" class="alignright size-medium wp-image-28"></noscript>
<img src="placeholder.jpg" alt="Your Alt Title" title="Your Title" width="150" height="150" class="alignleft size-thumbnail wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img src="http://jetpacksite.com/img/img_thumb.png" alt="Your Alt Title" title="Your Title" width="150" height="150" class="alignleft size-thumbnail wp-image-28"></noscript>
<img class="aligncenter size-medium wp-image-28" title="Your Title" src="placeholder.jpg" alt="Your Alt Title" width="300" height="200" data-lazy-src="http://jetpacksite.com/img/img_medium.png"><noscript><img class="aligncenter size-medium wp-image-28" title="Your Title" src="http://jetpacksite.com/img/img_medium.png" alt="Your Alt Title" width="300" height="200"></noscript>
<img src="placeholder.jpg" alt="Your Alt Title" title="Your Title" width="840" height="300" class="alignnone size-full wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_full.png"><noscript><img src="http://jetpacksite.com/img/img_full.png" alt="Your Alt Title" title="Your Title" width="840" height="300" class="alignnone size-full wp-image-28"></noscript>
<p>Additionally, to add further confusion, images can be wrapped inside paragraph content, lets test some examples here.<img src="placeholder.jpg" alt="Your Alt Title" title="Your Title" width="300" height="200" class="alignright size-medium wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_medium.png"><noscript><img src="http://jetpacksite.com/img/img_medium.png" alt="Your Alt Title" title="Your Title" width="300" height="200" class="alignright size-medium wp-image-28"></noscript>
Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Maecenas sed diam eget risus varius blandit sit amet non magna. Aenean lacinia bibendum nulla sed consectetur.<img src="placeholder.jpg" alt="Your Alt Title" title="Your Title" width="150" height="150" class="alignleft size-thumbnail wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img src="http://jetpacksite.com/img/img_thumb.png" alt="Your Alt Title" title="Your Title" width="150" height="150" class="alignleft size-thumbnail wp-image-28"></noscript>Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Maecenas sed diam eget risus varius blandit sit amet non magna. Aenean lacinia bibendum nulla sed consectetur.<img src="placeholder.jpg" alt="Your Alt Title" title="Your Title" width="150" height="150" class="aligncenter size-thumbnail wp-image-28" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img src="http://jetpacksite.com/img/img_thumb.png" alt="Your Alt Title" title="Your Title" width="150" height="150" class="aligncenter size-thumbnail wp-image-28"></noscript>Aenean lacinia bibendum nulla sed consectetur. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Donec ullamcorper nulla non metus auctor fringilla. Aenean lacinia bibendum nulla sed consectetur.</p>
<p>And then... Finally, users can insert a WordPress [gallery], which is kinda ugly and comes with some CSS stuck into the page to style it (which doesn't actually validate, nor does the markup for the gallery). The amount of columns in the gallery is also changable by the user, but the default is three so we'll work with that for our example with an added fouth image to test verticle spacing.</p>
<style type="text/css">
	#gallery-1 {
		margin: auto;
	}
	#gallery-1 .gallery-item {
		float: left;
		margin-top: 10px;
		text-align: center;
		width: 33%;
	}
	#gallery-1 img {
		border: 2px solid #cfcfcf;
	}
	#gallery-1 .gallery-caption {
		margin-left: 0;
	}
</style>

<div id="gallery-1" class="gallery galleryid-1 gallery-columns-3 gallery-size-thumbnail"><dl class="gallery-item">
<dt class="gallery-icon">
<a href="#" title="Your Title"><img width="150" height="150" src="placeholder.jpg" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img width="150" height="150" src="http://jetpacksite.com/img/img_thumb.png" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title"></noscript></a>
</dt></dl><dl class="gallery-item">
<dt class="gallery-icon">
<a href="#" title="Your Title"><img width="150" height="150" src="placeholder.jpg" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img width="150" height="150" src="http://jetpacksite.com/img/img_thumb.png" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title"></noscript></a>
</dt></dl><dl class="gallery-item">
<dt class="gallery-icon">
<a href="#" title="Your Title"><img width="150" height="150" src="placeholder.jpg" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img width="150" height="150" src="http://jetpacksite.com/img/img_thumb.png" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title"></noscript></a>
</dt></dl><br style="clear: both"><dl class="gallery-item">
<dt class="gallery-icon">
<a href="#" title="Your Title"><img width="150" height="150" src="placeholder.jpg" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title" data-lazy-src="http://jetpacksite.com/img/img_thumb.png"><noscript><img width="150" height="150" src="http://jetpacksite.com/img/img_thumb.png" class="attachment-thumbnail" alt="Your Alt Title" title="Your Title"></noscript></a>
</dt></dl>
<br style="clear: both;">
</div>
