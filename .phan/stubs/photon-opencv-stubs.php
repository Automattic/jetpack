<?php
/**
 * Stubs for the photon-opencv extension v0.2.31
 *
 * These were something of a pain to generate, because the reflection data is
 * incorrect for a few methods and causes PHP to segfault.
 *  - setimageprofile() $profile param crashes on ReflectionParameter->getType()->getName() on PHP 8.1.
 *  - resizeimage() $fit parameter crashes when ReflectionParameter->getDefaultValue() is called.
 *  - Presumably the same for scaleimage().
 * I had to hack Phan's vendor/phan/phan/tool/make_stubs to get this output.
 */

class Photon_OpenCV {
    const CHANNEL_OPACITY = 7;
    const COLORSPACE_RGB = 1;
    const FILTER_LANCZOS = 13;
    const FILTER_CUBIC = 10;
    const FILTER_TRIANGLE = 3;
    const FILTER_POINT = 1;
    const FILTER_BOX = 2;
    const IMGTYPE_COLORSEPARATIONMATTE = 9;
    const IMGTYPE_GRAYSCALE = 2;
    const IMGTYPE_GRAYSCALEMATTE = 3;
    const IMGTYPE_PALETTE = 4;
    const IMGTYPE_PALETTEMATTE = 5;
    const IMGTYPE_TRUECOLOR = 6;
    const IMGTYPE_TRUECOLORMATTE = 7;
    const ORIENTATION_UNDEFINED = 0;
    const ORIENTATION_TOPLEFT = 1;
    const ORIENTATION_TOPRIGHT = 2;
    const ORIENTATION_BOTTOMRIGHT = 3;
    const ORIENTATION_BOTTOMLEFT = 4;
    const ORIENTATION_LEFTTOP = 5;
    const ORIENTATION_RIGHTTOP = 6;
    const ORIENTATION_RIGHTBOTTOM = 7;
    const ORIENTATION_LEFTBOTTOM = 8;
    public function readimageblob(string &$raw_image_data) {}
    public function readimage(string $filepath) {}
    public function writeimage(string $output) {}
    public function getimageblob() {}
    public function getlasterror() {}
    public function getimagewidth() {}
    public function getimageheight() {}
    public function getimagechanneldepth(int $channel) {}
    public function getimageformat() {}
    public function setimageformat(string $format) {}
    public function setcompressionquality(string $format) {}
    public function getcompressionquality() {}
    public function autoorientimage(int $current_orientation) {}
    public function getimageorientation() {}
    public function setimageprofile(string $name, $profile) {}
    public function getimagetype() {}
    public function setimagetype(int $type) {}
    public function resizeimage(int $width, int $height, int $filter = -1, bool $fit = false) {}
    public function scaleimage(int $width, int $height, bool $fit = false) {}
    public function rotateimage(string $background, int $degrees) {}
    public function cropimage(int $width, int $height, int $x, int $y) {}
    public function borderimage(string $color, int $width, int $height) {}
    public function setimageoption(string $format, string $key, string $value) {}
    public function blobrequiresreencoding() {}
}
