/* Jetpack retina support - adding srcest attribute with retina support
 * Fallback for non-srcset browsers is done by Detect-Zoom Script
 */

/* Detect-zoom
 * -----------
 * Cross Browser Zoom and Pixel Ratio Detector
 * Version 1.0.4 | Apr 1 2013
 * dual-licensed under the WTFPL and MIT license
 * Maintained by https://github.com/tombigel
 * Original developer https://github.com/yonran
 */

//AMD and CommonJS initialization copied from https://github.com/zohararad/audio5js
(function (root, ns, factory) {
    /*global module, define, detectZoom, window, console  */
    'use strict';

    if (typeof (module) !== 'undefined' && module.exports) { // CommonJS
        module.exports = factory(ns, root);
    } else if (typeof (define) === 'function' && define.amd) { // AMD
        define('factory', function () {
            return factory(ns, root);
        });
    } else {
        root[ns] = factory(ns, root);
    }

}(window, 'detectZoom', function () {
    var fallback, devicePixelRatio, ie8, ie10,webkitMobile,webkit,firefox4,firefox18,opera11,
        mediaQueryBinarySearch,detectFunction;
    /**
     * Use devicePixelRatio if supported by the browser
     * @return {Number}
     * @private
     */
    devicePixelRatio = function () {
        return window.devicePixelRatio || 1;
    };

    /**
     * Fallback function to set default values
     * @return {Object}
     * @private
     */
    fallback = function () {
        return {
            zoom: 1,
            devicePxPerCssPx: 1
        };
    };
    /**
     * IE 8 and 9: no trick needed!
     * TODO: Test on IE10 and Windows 8 RT
     * @return {Object}
     * @private
     **/
    ie8 = function () {
        var zoom = Math.round((screen.deviceXDPI / screen.logicalXDPI) * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * For IE10 we need to change our technique again...
     * thanks https://github.com/stefanvanburen
     * @return {Object}
     * @private
     */
    ie10 = function () {
        var zoom = Math.round((document.documentElement.offsetHeight / window.innerHeight) * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * Mobile WebKit
     * the trick: window.innerWIdth is in CSS pixels, while
     * screen.width and screen.height are in system pixels.
     * And there are no scrollbars to mess up the measurement.
     * @return {Object}
     * @private
     */
    webkitMobile = function () {
        var deviceWidth, zoom;
        deviceWidth = (Math.abs(window.orientation) === 90) ? screen.height : screen.width;
        zoom = deviceWidth / window.innerWidth;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * Desktop Webkit
     * the trick: an element's clientHeight is in CSS pixels, while you can
     * set its line-height in system pixels using font-size and
     * -webkit-text-size-adjust:none.
     * device-pixel-ratio: http://www.webkit.org/blog/55/high-dpi-web-sites/
     *
     * Previous trick (used before http://trac.webkit.org/changeset/100847):
     * documentElement.scrollWidth is in CSS pixels, while
     * document.width was in system pixels. Note that this is the
     * layout width of the document, which is slightly different from viewport
     * because document width does not include scrollbars and might be wider
     * due to big elements.
     * @return {Object}
     * @private
     */
    webkit = function () {
        var important, div, container ,zoom;
        important = function (str) {
            return str.replace(/;/g, ' !important;');
        };

        div = document.createElement('div');
        div.innerHTML = '1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0';
        div.setAttribute('style', important('font: 100px/1em sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none; height: auto; width: 1em; padding: 0; overflow: visible;'));

        // The container exists so that the div will be laid out in its own flow
        // while not impacting the layout, viewport size, or display of the
        // webpage as a whole.
        // Add !important and relevant CSS rule resets
        // so that other rules cannot affect the results.
        container = document.createElement('div');
        container.setAttribute('style', important('width:0; height:0; overflow:hidden; visibility:hidden; position: absolute;'));
        container.appendChild(div);

        document.body.appendChild(container);
        zoom = 1000 / div.clientHeight;
        zoom = Math.round(zoom * 100) / 100;
        document.body.removeChild(container);

        return{
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * no real trick; device-pixel-ratio is the ratio of device dpi / css dpi.
     * (Note that this is a different interpretation than Webkit's device
     * pixel ratio, which is the ratio device dpi / system dpi).
     *
     * Also, for Mozilla, there is no difference between the zoom factor and the device ratio.
     *
     * @return {Object}
     * @private
     */
    firefox4 = function () {
        var zoom = mediaQueryBinarySearch('min--moz-device-pixel-ratio', '', 0, 10, 20, 0.0001);
        zoom = Math.round(zoom * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom
        };
    };

    /**
     * Firefox 18.x
     * Mozilla added support for devicePixelRatio to Firefox 18,
     * but it is affected by the zoom level, so, like in older
     * Firefox we can't tell if we are in zoom mode or in a device
     * with a different pixel ratio
     * @return {Object}
     * @private
     */
    firefox18 = function () {
        return {
            zoom: firefox4().zoom,
            devicePxPerCssPx: devicePixelRatio()
        };
    };

    /**
     * works starting Opera 11.11
     * the trick: outerWidth is the viewport width including scrollbars in
     * system px, while innerWidth is the viewport width including scrollbars
     * in CSS px
     * @return {Object}
     * @private
     */
    opera11 = function () {
        var zoom = window.top.outerWidth / window.top.innerWidth;
        zoom = Math.round(zoom * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * Use a binary search through media queries to find zoom level in Firefox
     * @param property
     * @param unit
     * @param a
     * @param b
     * @param maxIter
     * @param epsilon
     * @return {Number}
     */
    mediaQueryBinarySearch = function (property, unit, a, b, maxIter, epsilon) {
        var matchMedia, head, style, div, ratio;
        if (window.matchMedia) {
            matchMedia = window.matchMedia;
        } else {
            head = document.getElementsByTagName('head')[0];
            style = document.createElement('style');
            head.appendChild(style);

            div = document.createElement('div');
            div.className = 'mediaQueryBinarySearch';
            div.style.display = 'none';
            document.body.appendChild(div);

            matchMedia = function (query) {
                var matched;
                style.sheet.insertRule('@media ' + query + '{.mediaQueryBinarySearch ' + '{text-decoration: underline} }', 0);
                matched = getComputedStyle(div, null).textDecoration === 'underline';
                style.sheet.deleteRule(0);
                return {matches: matched};
            };
        }
        ratio = binarySearch(a, b, maxIter);
        if (div) {
            head.removeChild(style);
            document.body.removeChild(div);
        }
        return ratio;

        function binarySearch(a, b, maxIter) {
            var mid, query;
            mid = (a + b) / 2;
            if (maxIter <= 0 || b - a < epsilon) {
                return mid;
            }
            query = '(' + property + ':' + mid + unit + ')';
            if (matchMedia(query).matches) {
                return binarySearch(mid, b, maxIter - 1);
            } else {
                return binarySearch(a, mid, maxIter - 1);
            }
        }
    };

    /**
     * Generate detection function
     * @private
     */
    detectFunction = (function () {
        var func = fallback;
        //IE8+
        if (!isNaN(screen.logicalXDPI) && !isNaN(screen.systemXDPI)) {
            func = ie8;
        }
        // IE10+ / Touch
        else if (window.navigator.msMaxTouchPoints) {
            func = ie10;
        }
        //Mobile Webkit
        else if ('orientation' in window && typeof document.body.style.webkitMarquee === 'string') {
            func = webkitMobile;
        }
        //WebKit
        else if (typeof document.body.style.webkitMarquee === 'string') {
            func = webkit;
        }
        //Opera
        else if (navigator.userAgent.indexOf('Opera') >= 0) {
            func = opera11;
        }
        //Last one is Firefox
        //FF 18.x
        else if (window.devicePixelRatio) {
            func = firefox18;
        }
        //FF 4.0 - 17.x
        else if (firefox4().zoom > 0.001) {
            func = firefox4;
        }

        return func;
    }());


    return ({

        /**
         * Ratios.zoom shorthand
         * @return {Number} Zoom level
         */
        zoom: function () {
            return detectFunction().zoom;
        },

        /**
         * Ratios.devicePxPerCssPx shorthand
         * @return {Number} devicePxPerCssPx level
         */
        device: function () {
            return detectFunction().devicePxPerCssPx;
        }
    });
}));


(function () {
    'use strict';
    var wpcom_img_zoomer = {
        zoomed: false,
        timer: null,
        interval: 1000, // zoom polling interval in millisecond

        /**
         * Constructor
         */
        init: function() {
            var _this = this;
            //Detecting srcset support. if  srcset support is true, add the srcset attribute for zoom support
            if( _this.getSrcSetSupport() === true ) {
                _this.addSrcSetToImages();
            } else {
                //If no srcset - fallback to detect zoom by calling zoomimages every second
                try{
                    _this.zoomImages();
                    _this.timer = setInterval( function() { _this.zoomImages(); }, _this.interval );
                }
                catch(e){
                    // print the error to the console with more information on failing
                    if(!window.console) {
                        console.log(e);
                    }

                }
            }
        },
        /**
         * clearing the interval for zoomImages: srcset fallback.
         */

        stop: function() {
            if ( this.timer ) {
                clearInterval( this.timer );
            }

        },

        /**
         * testing srcset support in elements
         * @returns {boolean}
         */

        getSrcSetSupport: function() {
            var img = document.createElement('img');
            return typeof img.srcset !== 'undefined';
        },

        /**
         * converts floating scaling to real numbers
         *
         * @returns {Number}
         */

        getScale: function() {
            var scale = detectZoom.device();
            // Round up to 1.5 or the next integer below the cap.
            // To avoid long list of ifs, we are using  conditional logic.
            switch (true) {
                case scale <= 1.0 :
                    scale = 1.0;
                    break;
                case scale <= 1.5 :
                    scale = 1.5;
                    break;
                case scale <= 2.0 :
                    scale = 2.0;
                    break;
                case scale <= 3.0 :
                    scale = 3.0;
                    break;
                case scale <= 4.0 :
                    scale = 4.0;
                    break;
                default:
                    scale = 5.0;
            }
            return scale;
        },

        /**
         * Returns false if no Retina image is needed.
         *
         * @param scale
         * @returns {boolean}
         */

        shouldZoom: function( scale ) {
            var _this = this;
            // Do not operate on hidden frames.
            if ( 'innerWidth' in window && !window.innerWidth ) {
                return false;
            }
            // Don't do anything until scale > 1
            return !(scale === 1.0 && _this.zoomed === false);

        },

        /**
         * Test if img height and width should be set up again. depends on the images attributes.
         *
         * @param img
         * @returns {boolean}
         */
        imgNeedsSizeAtts: function( img ) {
            // Do not overwrite existing width/height attributes.
            if ( img.getAttribute('width') !== null || img.getAttribute('height') !== null ) {
                return false;
            }
            // Do not apply the attributes if the image is already constrained by a parent element.
            return !(img.width < img.naturalWidth || img.height < img.naturalHeight);

        },

        /**
         * Run through all images and add to those image the srcset according to the same rules as zoomImages.
         */
        addSrcSetToImages: function() {
            var imgs, i;
            imgs = document.getElementsByTagName('img');

            for ( i = 0; i < imgs.length; i++ ) {
                this.setScaledImageSrcSet(imgs[i]);
            }
        },
        /**
         * Run through all images and change the src according to the zoom being detected at detectZoom
         */
        zoomImages: function() {
            var _this,scale, imgs, i, scaleSuccess;
            _this = this;
            scale = _this.getScale();
            if ( ! _this.shouldZoom( scale ) ){
                return;
            }
            _this.zoomed = true;
            // Loop through all the <img> elements on the page and scale those images
            imgs = document.getElementsByTagName('img');
            for ( i = 0; i < imgs.length; i++ ) {
                _this.setScaledImageSrc( imgs[i], scale );
            }
        },
        /**
         * Check if image should be scaled
         * @param img
         * @returns {boolean}
         */
        isImageIsScalable: function ( img, scale ) {
            var imgScale, scaleFail;
            imgScale = img.getAttribute('scale');
            scaleFail = img.getAttribute('scale-fail');

            // Wait for original images to load
            if ( 'complete' in img && ! img.complete ) {
                return false;
            }
            // Skip images that don'_this need processing.
            if ( imgScale === scale || imgScale === '0' ) {
                return false;
            }
            // Skip images that have already failed at this scale
            if ( scaleFail && scaleFail <= scale ) {
                return false;
            }
            // Skip images that have no dimensions yet.
            if ( ! ( img.width && img.height ) ) {
                return false;
            }
            // Skip images from Lazy Load plugins
            if ( ! imgScale && img.getAttribute('data-lazy-src') && (img.getAttribute('data-lazy-src') !== img.getAttribute('src'))) {
                return false;
            }
            return true;
        },
        /**
         * Adding src attribute according to zoom state
         *
         * @param img
         * @param scale
         * @returns {boolean}
         */
        setScaledImageSrc: function ( img, scale ) {
            var _this, newSrc,prevSrc,origSrc;
            _this = this;
            //first check if this image should be scaled. if not, return false.
            if( false === _this.isImageIsScalable( img, scale ) ) {
                return false;
            }

            newSrc = _this.getScaledImageSrc(img, scale);
            // Don't  set img.src unless it has changed. This avoids unnecessary reloads.
            if ( newSrc !== img.src ) {
                // Store the original img.src
                origSrc = img.getAttribute('src-orig');
                if ( !origSrc ) {
                    origSrc = img.src;
                    img.setAttribute('src-orig', origSrc);
                }
                // In case of error, revert img.src
                prevSrc = img.src;

                // Finally load the new image
                img.src = newSrc;
                img.setAttribute('scale', scale.toString());

                img.onerror = function(){
                    img.src = prevSrc;
                    if ( img.getAttribute('scale-fail') < scale ) {
                        img.setAttribute('scale-fail', scale);
                    }
                    img.onerror = null;
                };

                return true;
            }
            //if the change is failing, mark the scale as zero so no more scaling attempts will be made
            img.setAttribute('scale', '0');

            return false;
        },
        /**
         * Adding srcset attributes to 1-5 zoom levels
         *
         * @param img
         * @returns {boolean}
         */
        setScaledImageSrcSet: function ( img ) {
            var _this, srcSetArray,scale,newSrc,availableScales,i;
            _this = this;
            srcSetArray = new Array([]);
            availableScales = new Array( 1, 1.5, 2, 3, 4, 5); //The scales that we support
            for( i = 0; i < availableScales.length; i++ ) {
                scale = availableScales[i];
                newSrc = _this.getScaledImageSrc(img, scale);
                if( newSrc && typeof newSrc !== 'undefined' ) {
                    srcSetArray.push(newSrc+' '+scale+'x');
                }
            }
            if(srcSetArray.length > 0) {
                img.srcset = srcSetArray.join();
                return true;
            }

            return false;
        },
        /**
         * Returns new src URLs of images based on scale.
         *
         * @param img
         * @param scale
         * @returns string || false
         */
        getScaledImageSrc: function( img, scale ) {
            var _this = this;

            // Skip slideshow images
            if ( img.parentNode.className.match(/slideshow-slide/) ) {
                return '';
            }
            // Scale gravatars that have ?s= or ?size=
            if ( img.src.match( /^https?:\/\/([^\/]*\.)?gravatar\.com\/.+[?&](s|size)=/ ) ) {
                return _this.getGravatarScale(img, scale);
            }

            // Scale resize queries (*.files.wordpress.com) that have ?w= or ?h=
            else if ( img.src.match( /^https?:\/\/([^\/]+)\.files\.wordpress\.com\/.+[?&][wh]=/ ) ) {
                return _this.getFilesWordpressComScale(img, scale);
            }

            // Scale mshots that have width
            else if ( img.src.match(/^https?:\/\/([^\/]+\.)*(wordpress|wp)\.com\/mshots\/.+[?&]w=\d+/) ) {
                return _this.getMshotsWithWidthScale(img, scale);
            }

            // Scale simple imgpress queries (s0.wp.com) that only specify w/h/fit
            else if ( img.src.match(/^https?:\/\/([^\/.]+\.)*(wp|wordpress)\.com\/imgpress\?(.+)/) ) {
                return _this.getImgpressQueriesScale(img, scale);
            }

            // Scale LaTeX images
            else if ( img.src.match(/^https?:\/\/([^\/.]+\.)*(wp|wordpress)\.com\/latex\.php\?(latex|zoom)=(.+)/) ) {
                return _this.getLatexScale(img, scale);
            }

            //Scale Photon queries (i#.wp.com)
            else if( img.src.match(/^https?:\/\/i[\d]{1}\.wp\.com\/(.+)/) ) {
                return _this.getPhotonScale(img, scale);
            }

            // Scale static assets that have a name matching *-1x.png or *@1x.png
            else if ( img.src.match(/^https?:\/\/[^\/]+\/.*[-@]([12])x\.(gif|jpeg|jpg|png)(\?|$)/) ) {
                return _this.getStaticAssetsScale(img, scale);
            }

            else {
                return '';
            }


        },
        /**
         * Returns Enlarged Gravatar images based on scaling
         *
         * @param img
         * @param scale
         * @returns {*|XML|string|void}
         */
        getGravatarScale: function(img, scale) {
            var _this, newSrc,size,targetSize;
            _this = this;
            newSrc = img.src.replace( /([?&](s|size)=)(\d+)/, function( $0, $1, $2, $3 ) {
                // Stash the original size
                var originalAtt = 'originals',
                    originalSize = img.getAttribute(originalAtt);
                if ( originalSize === null ) {
                    originalSize = $3;
                    img.setAttribute(originalAtt, originalSize);
                    if ( _this.imgNeedsSizeAtts( img ) ) {
                        // Fix width and height attributes to rendered dimensions.
                        img.width !== 0 ? img.width = img.width : '';
                        img.height !== 0 ? img.height =  img.height : '';
                    }
                }
                // Get the width/height of the image in CSS pixels
                size = img.clientWidth;
                // Convert CSS pixels to device pixels
                targetSize = Math.ceil(img.clientWidth * scale);
                // Don'_this go smaller than the original size
                targetSize = Math.max( targetSize, originalSize );
                // Don'_this go larger than the service supports
                targetSize = Math.min( targetSize, 512 );
                return $1 + targetSize;
            });
            return newSrc;
        },
        /**
         * Return enlarged WordPress.com URL hosted files based on scale
         *
         * @param img
         * @param scale
         * @returns {*}
         */
        getFilesWordpressComScale: function (img, scale) {
            var newSrc, changedAttrs, matches,lr, thisAttr, thisVal, originalAtt,size,naturalSize,targetSize,
                w, h, i, _this,originalSize;
            _this = this;
            newSrc = img.src;
            if ( img.src.match( /[?&]crop/ ) ) {
                return false;
            }
            changedAttrs = {};
            matches = img.src.match( /([?&]([wh])=)(\d+)/g );
            for ( i = 0; i < matches.length; i++ ) {
                lr = matches[i].split( '=' );
                thisAttr = lr[0].replace(/[?&]/g, '' );
                thisVal = lr[1];

                // Stash the original size
                originalAtt = 'original' + thisAttr, originalSize = img.getAttribute( originalAtt );
                if ( originalSize === null ) {
                    originalSize = thisVal;
                    img.setAttribute(originalAtt, originalSize);
                    if ( _this.imgNeedsSizeAtts( img ) ) {
                        // Fix width and height attributes to rendered dimensions.
                        img.width !== 0 ? img.width = img.width : '';
                        img.height !== 0 ? img.height =  img.height : '';
                    }
                }
                // Get the width/height of the image in CSS pixels
                size = thisAttr === 'w' ? img.clientWidth : img.clientHeight;
                naturalSize = ( thisAttr === 'w' ? img.naturalWidth : img.naturalHeight );
                // Convert CSS pixels to device pixels
                targetSize = Math.ceil(size * scale);
                // Don'_this go smaller than the original size
                targetSize = Math.max( targetSize, originalSize );
                // Don'_this go bigger unless the current one is actually lacking
                if ( scale > img.getAttribute('scale') && targetSize <= naturalSize ) {
                    targetSize = thisVal;
                }
                // Don'_this try to go bigger if the image is already smaller than was requested
                if ( naturalSize < thisVal ) {
                    targetSize = thisVal;
                }
                if ( targetSize !== thisVal ) {
                    changedAttrs[ thisAttr ] = targetSize;
                }
            }
            w = changedAttrs.w || false;
            h = changedAttrs.h || false;

            if ( w ) {
                newSrc = img.src.replace(/([?&])w=\d+/g, function( $0, $1 ) {
                    return $1 + 'w=' + w;
                });
            }
            if ( h ) {
                newSrc = newSrc.replace(/([?&])h=\d+/g, function( $0, $1 ) {
                    return $1 + 'h=' + h;
                });
            }
            return newSrc;
        },
        /**
         * Return enlarged mshots images according to scale
         *
         * @param img
         * @param scale
         * @returns {*|XML|string|void}
         */
        getMshotsWithWidthScale: function( img, scale ) {
            var newSrc,originalAtt,size,targetSize, _this,originalSize;
            _this = this;
            newSrc = img.src.replace( /([?&]w=)(\d+)/, function($0, $1, $2) {
                // Stash the original size
                originalAtt = 'originalw', originalSize = img.getAttribute(originalAtt);
                if ( originalSize === null ) {
                    originalSize = $2;
                    img.setAttribute(originalAtt, originalSize);
                    if ( _this.imgNeedsSizeAtts( img ) ) {
                        // Fix width and height attributes to rendered dimensions.
                        img.width !== 0 ? img.width = img.width : '';
                        img.height !== 0 ? img.height =  img.height : '';
                    }
                }
                // Get the width of the image in CSS pixels
                size = img.clientWidth;
                // Convert CSS pixels to device pixels
                targetSize = Math.ceil(size * scale);
                // Don't go smaller than the original size
                targetSize = Math.max( targetSize, originalSize );
                // Don't go bigger unless the current one is actually lacking
                if ( scale > img.getAttribute('scale') && targetSize <= img.naturalWidth ) {
                    targetSize = $2;
                }
                if ( $2 !== targetSize ) {
                    return $1 + targetSize;
                }

                return $0;
            });
            return newSrc;
        },
        /**
         * Return WordPress images URLS with Zoom parameters according to scale
         *
         * @param img
         * @param scale
         * @returns {*}
         */
        getImgpressQueriesScale: function( img, scale ) {
            var imgpressSafeFunctions, qs, q;
            imgpressSafeFunctions = ['zoom', 'url', 'h', 'w', 'fit', 'filter', 'brightness', 'contrast', 'colorize', 'smooth', 'unsharpmask'];
            // Search the query string for unsupported functions.
            qs = RegExp.$3.split('&');
            for ( q in qs ) {
                q = qs[q].split('=')[0];
                if ( imgpressSafeFunctions.indexOf(q) === -1 ) {
                    return false;
                }
            }
            return this.getImgSrcWithZoom( img, scale );
        },
        /**
         * Returning Latex URLS with Zoom parameters according to scale
         *
         * @param img
         * @param scale
         * @returns {*}
         */
        getLatexScale: function( img, scale ) {
            return this.getImgSrcWithZoom( img, scale );
        },
        /**
         * Returning Photon URLS with Zoom parameters according to scale
         *
         * @param img
         * @param scale
         * @returns {*}
         */
        getPhotonScale: function( img, scale ) {
            return this.getImgSrcWithZoom( img, scale );
        },
        /**
         * Return static assets images dimensions based on scale
         *
         * @param img
         * @param scale
         * @returns {*}
         */
        getStaticAssetsScale: function( img, scale ) {
            var newSrc, currentSize, newSize;
            newSrc = img.src;
            // Fix width and height attributes to rendered dimensions.
            img.width !== 0 ? img.width = img.width : '';
            img.height !== 0 ? img.height =  img.height : '';
            currentSize = RegExp.$1, newSize = currentSize;
            if ( scale <= 1 ) {
                newSize = 1;
            } else {
                newSize = 2;
            }

            if ( currentSize !== newSize ) {
                newSrc = img.src.replace(/([-@])[12]x\.(gif|jpeg|jpg|png)(\?|$)/, '$1'+newSize+'x.$2$3');
            }

            return newSrc;
        },
        /**
         * Return image src with zoom parameter according to scale
         *
         * @param img
         * @param scale
         * @returns {*}
         */
        getImgSrcWithZoom: function( img, scale ) {
            var newSrc = img.src;
            // Fix width and height attributes to rendered dimensions.
            img.width !== 0 ? img.width = img.width : '';
            img.height !== 0 ? img.height =  img.height : '';
            // Compute new src
            if ( scale === 1 ) {
                newSrc = img.src.replace(/\?(zoom=[^&]+&)?/, '?');
            } else {
                newSrc = img.src.replace(/\?(zoom=[^&]+&)?/, '?zoom=' + scale + '&');
            }

            return newSrc;
        }

    };

    wpcom_img_zoomer.init();

})();
