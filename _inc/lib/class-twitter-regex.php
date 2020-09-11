<?php

/**
 * @author     Mike Cochrane <mikec@mikenz.geek.nz>
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

/**
 * Twitter Regex Abstract Class
 *
 * Used by subclasses that need to parse tweets.
 *
 * Originally written by {@link http://github.com/mikenz Mike Cochrane}, this
 * is based on code by {@link http://github.com/mzsanford Matt Sanford} and
 * heavily modified by {@link http://github.com/ngnpope Nick Pope}.
 *
 * @author     Mike Cochrane <mikec@mikenz.geek.nz>
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter
 */
class Twitter_Regex
{
    /**
     * Expression to match whitespace characters.
     *
     * 0x0009-0x000D  Cc # <control-0009>..<control-000D>
     * 0x0020         Zs # SPACE
     * 0x0085         Cc # <control-0085>
     * 0x00A0         Zs # NO-BREAK SPACE
     * 0x1680         Zs # OGHAM SPACE MARK
     * 0x180E         Zs # MONGOLIAN VOWEL SEPARATOR
     * 0x2000-0x200A  Zs # EN QUAD..HAIR SPACE
     * 0x2028         Zl # LINE SEPARATOR
     * 0x2029         Zp # PARAGRAPH SEPARATOR
     * 0x202F         Zs # NARROW NO-BREAK SPACE
     * 0x205F         Zs # MEDIUM MATHEMATICAL SPACE
     * 0x3000         Zs # IDEOGRAPHIC SPACE
     *
     * @var string
     */
    // @codingStandardsIgnoreStart
    private static $spaces = '\x{0009}-\x{000D}\x{0020}\x{0085}\x{00a0}\x{1680}\x{180E}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}'; // @codingStandardsIgnoreEnd

    /**
     * Expression to match latin accented characters.
     *
     * 0x00C0-0x00D6
     * 0x00D8-0x00F6
     * 0x00F8-0x00FF
     * 0x0100-0x024f
     * 0x0253-0x0254
     * 0x0256-0x0257
     * 0x0259
     * 0x025b
     * 0x0263
     * 0x0268
     * 0x026f
     * 0x0272
     * 0x0289
     * 0x028b
     * 0x02bb
     * 0x0300-0x036f
     * 0x1e00-0x1eff
     *
     * Excludes 0x00D7 - multiplication sign (confusable with 'x').
     * Excludes 0x00F7 - division sign.
     *
     * @var string
     */
    // @codingStandardsIgnoreStart
    private static $latinAccents = '\x{00c0}-\x{00d6}\x{00d8}-\x{00f6}\x{00f8}-\x{00ff}\x{0100}-\x{024f}\x{0253}-\x{0254}\x{0256}-\x{0257}\x{0259}\x{025b}\x{0263}\x{0268}\x{026f}\x{0272}\x{0289}\x{028b}\x{02bb}\x{0300}-\x{036f}\x{1e00}-\x{1eff}'; // @codingStandardsIgnoreEnd

    /**
     * Invalid Characters
     *
     * 0xFFFE,0xFEFF # BOM
     * 0xFFFF        # Special
     * 0x202A-0x202E # Directional change
     */
    private static $invalidCharacters = '\x{202a}-\x{202e}\x{feff}\x{fffe}\x{ffff}';

    /**
     * Directional Characters
     *
     * 0x061C ARABIC LETTER MARK (ALM)
     * 0x200E LEFT-TO-RIGHT MARK (LRM)
     * 0x200F RIGHT-TO-LEFT MARK (RLM)
     * 0x202A LEFT-TO-RIGHT EMBEDDING (LRE)
     * 0x202B RIGHT-TO-LEFT EMBEDDING (RLE)
     * 0x202C POP DIRECTIONAL FORMATTING (PDF)
     * 0x202D LEFT-TO-RIGHT OVERRIDE (LRO)
     * 0x202E RIGHT-TO-LEFT OVERRIDE (RLO)
     * 0x2066 LEFT-TO-RIGHT ISOLATE (LRI)
     * 0x2067 RIGHT-TO-LEFT ISOLATE (RLI)
     * 0x2068 FIRST STRONG ISOLATE (FSI)
     * 0x2069 POP DIRECTIONAL ISOLATE (PDI)
     */
    private static $directionalCharacters = '\x{061c}\x{200e}\x{200f}\x{202a}\x{202e}\x{2066}\x{2069}';

    /**
     * Expression to match RTL characters.
     *
     * 0x0600-0x06FF Arabic
     * 0x0750-0x077F Arabic Supplement
     * 0x08A0-0x08FF Arabic Extended-A
     * 0x0590-0x05FF Hebrew
     * 0xFB50-0xFDFF Arabic Presentation Forms-A
     * 0xFE70-0xFEFF Arabic Presentation Forms-B
     *
     * @var string
     */
    // @codingStandardsIgnoreStart
    private static $rtlChars = '\x{0600}-\x{06ff}\x{0750}-\x{077f}\x{08a0}-\x{08ff}\x{0590}-\x{05ff}\x{fb50}-\x{fdff}\x{fe70}-\x{feff}'; // @codingStandardsIgnoreEnd

    # Expression to match at and hash sign characters:
    private static $atSigns = '@＠';

    private static $hashSigns = '#＃';

    # cash tags
    private static $cashSigns = '\$';

    private static $cashtag = '[a-z]{1,6}(?:[._][a-z]{1,2})?';

    # These URL validation pattern strings are based on the ABNF from RFC 3986
    private static $validateUrlUnreserved = '[a-z\p{Cyrillic}0-9\-._~]';

    private static $validateUrlPctEncoded = '(?:%[0-9a-f]{2})';

    private static $validateUrlSubDelims = '[!$&\'()*+,;=]';

    private static $validUrlQueryChars = '[a-z0-9!?\*\'\(\);:&=\+\$\/%#\[\]\-_\.,~|@]';

    private static $validUrlQueryEndingChars = '[a-z0-9_&=#\/\-]';

    // @codingStandardsIgnoreStart
    private static $validateUrlIpv4 = '(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})'; // @codingStandardsIgnoreEnd

    private static $validateUrlIpv6 = '(?:\[[a-f0-9:\.]+\])';

    private static $validateUrlPort = '[0-9]{1,5}';

    # URL related hash regex collection
    private static $validSpecialCcTLD = '(?:(?:co|tv)(?=[^0-9a-z@]|$))';

    private static $validPunycode = '(?:xn--[0-9a-z]+)';

    /**
     * Get invalid characters matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getInvalidCharactersMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/[' . static::$invalidCharacters . ']/u';
        }

        return $regexp;
    }

    /**
     * Get RTL characters matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getRtlCharsMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/[' . static::$rtlChars . ']/iu';
        }

        return $regexp;
    }

    // =================================================================================================================

    /**
     * Get valid ascii domain matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidAsciiDomainMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/' . static::getValidSubdomain() . '*(' . static::getValidDomainName()
                . ')(?:' . TldLists::getValidGTLD() . '|' . TldLists::getValidCcTLD()
                . '|' . static::$validPunycode . ')/iu';
        }

        return $regexp;
    }

    /**
     * Get valid tco url matcher
     *
     * Used by the extractor for stricter t.co URL extraction
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidTcoUrlMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/^https?:\/\/t\.co\/([a-z0-9]+)'
                . '(?:\?' . static::$validUrlQueryChars . '*' . static::$validUrlQueryEndingChars . ')?/iu';
        }

        return $regexp;
    }

    /**
     * Get invalid short domain matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getInvalidShortDomainMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/\A' . static::getValidDomainName() . TldLists::getValidCcTLD() . '\Z/iu';
        }

        return $regexp;
    }

    /**
     * Get valid special short domain matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidSpecialShortDomainMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/\A' . static::getValidDomainName() . static::$validSpecialCcTLD . '\Z/iu';
        }

        return $regexp;
    }

    /**
     * Get invalid url without protocol preceding chars matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getInvalidUrlWithoutProtocolPrecedingCharsMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/[\-_.\/]\z/iu';
        }

        return $regexp;
    }

    /**
     * Get valid url
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidUrlMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $validUrlPrecedingChars = '(?:[^a-z0-9_@＠\$#＃' . static::$invalidCharacters . ']|[' . static::$directionalCharacters . ']|^)';
            $validPortNumber = '[0-9]+';

            $regexp = '/(?:'                           # $1 Complete match (preg_match() already matches everything.)
                . '(' . $validUrlPrecedingChars . ')'  # $2 Preceding characters
                . '('                                  # $3 Complete URL
                . '(https?:\/\/)?'                     # $4 Protocol (optional)
                . '(' . static::getValidDomain() . ')' # $5 Domain(s)
                . '(?::(' . $validPortNumber . '))?'   # $6 Port number (optional)
                . '(\/' . static::getValidUrlPath() . '*)?' # $7 URL Path
                . '(\?' . static::$validUrlQueryChars . '*' . static::$validUrlQueryEndingChars . ')?' # $8 Query String
                . ')'
                . ')/iux';
        }

        return $regexp;
    }

    /**
     * Get valid domain chars
     *
     * @return string
     */
    private static function getValidDomainChars()
    {
        return '0-9a-z' . static::$latinAccents;
    }

    /**
     * Get valid subdomain
     *
     * @return string
     */
    private static function getValidSubdomain()
    {
        $domainValidChars = static::getValidDomainChars();

        return '(?>(?:[' . $domainValidChars . '][' . $domainValidChars . '\-_]*)?[' . $domainValidChars . ']\.)';
    }

    /**
     * Get valid domain name
     *
     * @return string
     */
    private static function getValidDomainName()
    {
        $domainValidChars = static::getValidDomainChars();

        return '(?:(?:[' . $domainValidChars . '][' . $domainValidChars . '\-]*)?[' . $domainValidChars . ']\.)';
    }

    /**
     * Get valid unicode domain chars
     *
     * @return string
     */
    private static function getValidUnicodeDomainChars()
    {
        return '[^\p{P}\p{Z}\p{C}' . static::$invalidCharacters . static::$spaces . ']';
    }

    /**
     * Get valid unicode domain name
     *
     * @return string
     */
    private static function getValidUnicodeDomainName()
    {
        $domainValidChars = static::getValidUnicodeDomainChars();

        return '(?:(?:' . $domainValidChars . '(?:' . $domainValidChars . '|[\-])*)?' . $domainValidChars . '\.)';
    }

    /**
     * Get valid domain
     *
     * @return string
     */
    private static function getValidDomain()
    {
        $validSubdomain = static::getValidSubdomain();
        $validDomainName = static::getValidDomainName();
        $validUnicodeDomainName = static::getValidUnicodeDomainName();
        $validGTLD = TldLists::getValidGTLD();
        $validCcTLD = TldLists::getValidCcTLD();

        return ''
            // optional sub-domain + domain + TLD
            // e.g. twitter.com, foo.co.jp, bar.co.uk
            . '(?:' . $validSubdomain . '*' . $validDomainName
            . '(?:' . $validGTLD . '|' . $validCcTLD . '|' . static::$validPunycode . '))'
            // domain + gTLD | protocol + unicode domain + gTLD
            . '|(?:'
            . '(?:' . $validSubdomain . '+' . $validDomainName
            . '|' . $validDomainName
            . '|(?:(?<=http:\/\/|https:\/\/)' . $validUnicodeDomainName . ')'
            . ')'
            . $validGTLD
            . ')'
            // protocol + (domain | unicode domain) + ccTLD
            . '|(?:(?<=http:\/\/|https:\/\/)'
            . '(?:' . $validDomainName . '|' . $validUnicodeDomainName . ')'
            . $validCcTLD . ')'
            // domain + ccTLD + '/'
            // e.g. t.co/
            . '|(?:' . $validDomainName . $validCcTLD . '(?=\/))';
    }

    /**
     * Get valid url path
     *
     * @return string
     */
    private static function getValidUrlPath()
    {
        $validGeneralUrlPathChars = '[a-z0-9' . preg_quote("!*';:=+,.$/%#[]–\x{2013}_~", '/')
            . '|&@' . static::$latinAccents . '\p{Cyrillic}]';

        # Allow URL paths to contain up to two nested levels of balanced parentheses:
        # 1. Used in Wikipedia URLs, e.g. /Primer_(film)
        # 2. Used in IIS sessions, e.g. /S(dfd346)/
        # 3. Used in Rdio URLs like /track/We_Up_(Album_Version_(Edited))/
        $validUrlBalancedParens = '(?:\('
            . '(?:' . $validGeneralUrlPathChars . '+'
            . '|'
            // allow one nested level of balanced parentheses
            . '(?:'
            . $validGeneralUrlPathChars . '*'
            . '\(' . $validGeneralUrlPathChars . '+' . '\)'
            . $validGeneralUrlPathChars . '*'
            . ')'
            . ')'
            . '\))';
        # Valid end-of-path characters (so /foo. does not gobble the period).
        # 1. Allow =&# for empty URL parameters and other URL-join artifacts.
        $validUrlPathEndingChars = '[a-z0-9=_#\/\+\-' . static::$latinAccents . '\p{Cyrillic}]'
            . '|(?:' . $validUrlBalancedParens . ')';

        return '(?:(?:'
            . $validGeneralUrlPathChars . '*(?:'
            . $validUrlBalancedParens . ' '
            . $validGeneralUrlPathChars . '*)*'
            . $validUrlPathEndingChars . ')|(?:@'
            . $validGeneralUrlPathChars . '+\/))';
    }

    // =================================================================================================================

    # NOTE: PHP doesn't have Ruby's $' (dollar apostrophe) so we have to capture
    #      $after in the following regular expression.  Note that we only use a
    #      look-ahead capture here and don't append $after when we return.

    /**
     * Get valid mentions or lists matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidMentionsOrListsMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $mentionPrecedingChars = '([^a-z0-9_!#\$%&*@＠\/]|^|(?:^|[^a-z0-9_+~.-])RT:?)';
            $regexp = '/' . $mentionPrecedingChars
                . '([' . static::$atSigns . '])([a-z0-9_]{1,20})(\/[a-z][a-z0-9_\-]{0,24})?(?=(.*|$))/iu';
        }

        return $regexp;
    }

    /**
     * Get valid hashtag matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidReplyMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/^(?:[' . static::$spaces . static::$directionalCharacters . '])*[' . static::$atSigns . ']([a-z0-9_]{1,20})(?=(.*|$))/iu';
        }

        return $regexp;
    }

    /**
     * Get end of hashtag matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getEndMentionMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/\A(?:[' . static::$atSigns . ']|[' . static::$latinAccents . ']|:\/\/)/iu';
        }

        return $regexp;
    }

    // =================================================================================================================

    /**
     * Get hashtag matcher
     *
     * @return string matcher
     */
    private static function getHashtagPattern()
    {
        $hashtag_letters = '\p{L}\p{M}';
        $hashtag_numerals = '\p{Nd}';
        # Hashtag special chars
        #
        #   _      underscore
        #   0x200c ZERO WIDTH NON-JOINER (ZWNJ)
        #   0x200d ZERO WIDTH JOINER (ZWJ)
        #   0xa67e CYRILLIC KAVYKA
        #   0x05be HEBREW PUNCTUATION MAQAF
        #   0x05f3 HEBREW PUNCTUATION GERESH
        #   0x05f4 HEBREW PUNCTUATION GERSHAYIM
        #   0xff5e FULLWIDTH TILDE
        #   0x301c WAVE DASH
        #   0x309b KATAKANA-HIRAGANA VOICED SOUND MARK
        #   0x309c KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK
        #   0x30a0 KATAKANA-HIRAGANA DOUBLE HYPHEN
        #   0x30fb KATAKANA MIDDLE DOT
        #   0x3003 DITTO MARK
        #   0x0f0b TIBETAN MARK INTERSYLLABIC TSHEG
        #   0x0f0c TIBETAN MARK DELIMITER TSHEG BSTAR
        #   0x00b7 MIDDLE DOT
        $hashtag_special_chars = '_\x{200c}\x{200d}\x{a67e}\x{05be}\x{05f3}\x{05f4}'
            . '\x{ff5e}\x{301c}\x{309b}\x{309c}\x{30a0}\x{30fb}\x{3003}\x{0f0b}\x{0f0c}\x{00b7}';
        $hashtag_letters_numerals_set = '[' . $hashtag_letters . $hashtag_numerals . $hashtag_special_chars . ']';
        $hashtag_letters_set = '[' . $hashtag_letters . ']';
        $hashtag_boundary = '(?:\A|\x{fe0e}|\x{fe0f}|[^&'
            . $hashtag_letters . $hashtag_numerals . $hashtag_special_chars . '])';

        return '(' . $hashtag_boundary . ')(#|\x{ff03})(?!\x{fe0f}|\x{20e3})('
            . $hashtag_letters_numerals_set . '*' . $hashtag_letters_set . $hashtag_letters_numerals_set . '*)';
    }

    /**
     * Get valid hashtag matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidHashtagMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/' . static::getHashtagPattern() . '(?=(.*|$))/iu';
        }

        return $regexp;
    }

    /**
     * Get end of hashtag matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getEndHashtagMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/\A(?:[' . static::$hashSigns . ']|:\/\/)/u';
        }

        return $regexp;
    }

    // =================================================================================================================

    /**
     * Get valid cachtag matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidCashtagMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/(^|[' . static::$spaces . static::$directionalCharacters . '])([' . static::$cashSigns . '])'
                . '(' . static::$cashtag . ')(?=($|\s|[[:punct:]]))/iu';
        }

        return $regexp;
    }

    /**
     * Get end of cachtag matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getEndCashtagMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/\A(?:[' . static::$cashSigns . ']|:\/\/)/u';
        }

        return $regexp;
    }

    // =================================================================================================================

    /**
     * Get url matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlUnencodedMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            # Modified version of RFC 3986 Appendix B
            $regexp = '/\A' #  Full URL
                . '(?:'
                . '([^:\/?#]+):\/\/' #  $1 Scheme
                . ')?'
                . '([^\/?#]*)'       #  $2 Authority
                . '([^?#]*)'         #  $3 Path
                . '(?:'
                . '\?([^#]*)'        #  $4 Query
                . ')?'
                . '(?:'
                . '\#(.*)'           #  $5 Fragment
                . ')?\z/iux';
        }

        return $regexp;
    }

    /**
     * Get valid url ip
     *
     * @return string matcher
     */
    private static function getValidateUrlIp()
    {
        return '(?:' . static::$validateUrlIpv4 . '|' . static::$validateUrlIpv6 . ')'; #/iox
    }

    /**
     * Get valid url domain
     *
     * @return string matcher
     */
    private static function getValidateUrlDomain()
    {
        $subdomain = '(?:[a-z0-9](?:[a-z0-9_\-]*[a-z0-9])?)'; #/i
        $domain = '(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?)'; #/i
        $tld = '(?:[a-z](?:[a-z0-9\-]*[a-z0-9])?)'; #/i

        return '(?:(?:' . $subdomain . '\.)*(?:' . $domain . '\.)' . $tld . ')'; #/iox
    }

    /**
     * Get valid url host
     *
     * @return string matcher
     */
    private static function getValidateUrlHost()
    {
        return '(?:' . static::getValidateUrlIp() . '|' . static::getValidateUrlDomain() . ')'; #/iox
    }

    /**
     * Get valid url unicode domain
     *
     * @return string matcher
     */
    private static function getValidateUrlUnicodeDomain()
    {
        $subdomain = '(?:(?:[a-z0-9]|[^\x00-\x7f])(?:(?:[a-z0-9_\-]|[^\x00-\x7f])*(?:[a-z0-9]|[^\x00-\x7f]))?)'; #/ix
        $domain = '(?:(?:[a-z0-9]|[^\x00-\x7f])(?:(?:[a-z0-9\-]|[^\x00-\x7f])*(?:[a-z0-9]|[^\x00-\x7f]))?)'; #/ix
        $tld = '(?:(?:[a-z]|[^\x00-\x7f])(?:(?:[a-z0-9\-]|[^\x00-\x7f])*(?:[a-z0-9]|[^\x00-\x7f]))?)'; #/ix

        return '(?:(?:' . $subdomain . '\.)*(?:' . $domain . '\.)' . $tld . ')'; #/iox
    }

    /**
     * Get valid url unicode host
     *
     * @return string matcher
     */
    private static function getValidateUrlUnicodeHost()
    {
        return '(?:' . static::getValidateUrlIp() . '|' . static::getValidateUrlUnicodeDomain() . ')'; #/iox
    }

    /**
     * Get valid url userinfo
     *
     * @return string matcher
     */
    private static function getValidateUrlUserinfo()
    {
        return '(?:' . static::$validateUrlUnreserved
            . '|' . static::$validateUrlPctEncoded
            . '|' . static::$validateUrlSubDelims
            . '|:)*'; #/iox
    }

    /**
     * Get url unicode authority matcher
     *
     * Unencoded internationalized domains - this doesn't check for invalid UTF-8 sequences
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlUnicodeAuthorityMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/'
                . '(?:(' . static::getValidateUrlUserinfo() . ')@)?' #  $1 userinfo
                . '(' . static::getValidateUrlUnicodeHost() . ')'    #  $2 host
                . '(?::(' . static::$validateUrlPort . '))?'         #  $3 port
                . '/iux';
        }

        return $regexp;
    }

    /**
     * Get url authority matcher
     *
     * This is more strict than the rfc specifies
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlAuthorityMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/'
                . '(?:(' . static::getValidateUrlUserinfo() . ')@)?' #  $1 userinfo
                . '(' . static::getValidateUrlHost() . ')'           #  $2 host
                . '(?::(' . static::$validateUrlPort . '))?'         #  $3 port
                . '/ix';
        }

        return $regexp;
    }

    /**
     * Get url scheme matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlSchemeMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/(?:[a-z][a-z0-9+\-.]*)/i';
        }

        return $regexp;
    }

    /**
     * Get valid url charactors
     *
     * @return string matcher
     */
    private static function getValidateUrlPchar()
    {
        return '(?:' . static::$validateUrlUnreserved
            . '|' . static::$validateUrlPctEncoded
            . '|' . static::$validateUrlSubDelims
            . '|[:\|@])'; #/iox
    }

    /**
     * Get url path matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlPathMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/(\/' . static::getValidateUrlPchar() . '*)*/iu';
        }

        return $regexp;
    }

    /**
     * Get url query matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlQueryMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/(' . static::getValidateUrlPchar() . '|\/|\?)*/iu';
        }

        return $regexp;
    }

    /**
     * Get url flagment matcher
     *
     * @staticvar string $regexp
     * @return string
     */
    public static function getValidateUrlFragmentMatcher()
    {
        static $regexp = null;

        if ($regexp === null) {
            $regexp = '/(' . static::getValidateUrlPchar() . '|\/|\?)*/iu';
        }

        return $regexp;
    }
}

/**
 * @author     Takashi Nojima
 * @copyright  Copyright 2020, Takashi Nojima
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

/**
 * TLD Lists
 */
final class TldLists
{
    /**
     * gTLDs
     *
     * @var array
     */
    private static $gTLDs = array(
        '삼성',
        '닷컴',
        '닷넷',
        '香格里拉',
        '餐厅',
        '食品',
        '飞利浦',
        '電訊盈科',
        '集团',
        '通販',
        '购物',
        '谷歌',
        '诺基亚',
        '联通',
        '网络',
        '网站',
        '网店',
        '网址',
        '组织机构',
        '移动',
        '珠宝',
        '点看',
        '游戏',
        '淡马锡',
        '机构',
        '書籍',
        '时尚',
        '新闻',
        '政府',
        '政务',
        '招聘',
        '手表',
        '手机',
        '我爱你',
        '慈善',
        '微博',
        '广东',
        '工行',
        '家電',
        '娱乐',
        '天主教',
        '大拿',
        '大众汽车',
        '在线',
        '嘉里大酒店',
        '嘉里',
        '商标',
        '商店',
        '商城',
        '公益',
        '公司',
        '八卦',
        '健康',
        '信息',
        '佛山',
        '企业',
        '中文网',
        '中信',
        '世界',
        'ポイント',
        'ファッション',
        'セール',
        'ストア',
        'コム',
        'グーグル',
        'クラウド',
        'みんな',
        'คอม',
        'संगठन',
        'नेट',
        'कॉम',
        'همراه',
        'موقع',
        'موبايلي',
        'كوم',
        'كاثوليك',
        'عرب',
        'شبكة',
        'بيتك',
        'بازار',
        'العليان',
        'ارامكو',
        'اتصالات',
        'ابوظبي',
        'קום',
        'сайт',
        'рус',
        'орг',
        'онлайн',
        'москва',
        'ком',
        'католик',
        'дети',
        'zuerich',
        'zone',
        'zippo',
        'zip',
        'zero',
        'zara',
        'zappos',
        'yun',
        'youtube',
        'you',
        'yokohama',
        'yoga',
        'yodobashi',
        'yandex',
        'yamaxun',
        'yahoo',
        'yachts',
        'xyz',
        'xxx',
        'xperia',
        'xin',
        'xihuan',
        'xfinity',
        'xerox',
        'xbox',
        'wtf',
        'wtc',
        'wow',
        'world',
        'works',
        'work',
        'woodside',
        'wolterskluwer',
        'wme',
        'winners',
        'wine',
        'windows',
        'win',
        'williamhill',
        'wiki',
        'wien',
        'whoswho',
        'weir',
        'weibo',
        'wedding',
        'wed',
        'website',
        'weber',
        'webcam',
        'weatherchannel',
        'weather',
        'watches',
        'watch',
        'warman',
        'wanggou',
        'wang',
        'walter',
        'walmart',
        'wales',
        'vuelos',
        'voyage',
        'voto',
        'voting',
        'vote',
        'volvo',
        'volkswagen',
        'vodka',
        'vlaanderen',
        'vivo',
        'viva',
        'vistaprint',
        'vista',
        'vision',
        'visa',
        'virgin',
        'vip',
        'vin',
        'villas',
        'viking',
        'vig',
        'video',
        'viajes',
        'vet',
        'versicherung',
        'vermögensberatung',
        'vermögensberater',
        'verisign',
        'ventures',
        'vegas',
        'vanguard',
        'vana',
        'vacations',
        'ups',
        'uol',
        'uno',
        'university',
        'unicom',
        'uconnect',
        'ubs',
        'ubank',
        'tvs',
        'tushu',
        'tunes',
        'tui',
        'tube',
        'trv',
        'trust',
        'travelersinsurance',
        'travelers',
        'travelchannel',
        'travel',
        'training',
        'trading',
        'trade',
        'toys',
        'toyota',
        'town',
        'tours',
        'total',
        'toshiba',
        'toray',
        'top',
        'tools',
        'tokyo',
        'today',
        'tmall',
        'tkmaxx',
        'tjx',
        'tjmaxx',
        'tirol',
        'tires',
        'tips',
        'tiffany',
        'tienda',
        'tickets',
        'tiaa',
        'theatre',
        'theater',
        'thd',
        'teva',
        'tennis',
        'temasek',
        'telefonica',
        'telecity',
        'tel',
        'technology',
        'tech',
        'team',
        'tdk',
        'tci',
        'taxi',
        'tax',
        'tattoo',
        'tatar',
        'tatamotors',
        'target',
        'taobao',
        'talk',
        'taipei',
        'tab',
        'systems',
        'symantec',
        'sydney',
        'swiss',
        'swiftcover',
        'swatch',
        'suzuki',
        'surgery',
        'surf',
        'support',
        'supply',
        'supplies',
        'sucks',
        'style',
        'study',
        'studio',
        'stream',
        'store',
        'storage',
        'stockholm',
        'stcgroup',
        'stc',
        'statoil',
        'statefarm',
        'statebank',
        'starhub',
        'star',
        'staples',
        'stada',
        'srt',
        'srl',
        'spreadbetting',
        'spot',
        'sport',
        'spiegel',
        'space',
        'soy',
        'sony',
        'song',
        'solutions',
        'solar',
        'sohu',
        'software',
        'softbank',
        'social',
        'soccer',
        'sncf',
        'smile',
        'smart',
        'sling',
        'skype',
        'sky',
        'skin',
        'ski',
        'site',
        'singles',
        'sina',
        'silk',
        'shriram',
        'showtime',
        'show',
        'shouji',
        'shopping',
        'shop',
        'shoes',
        'shiksha',
        'shia',
        'shell',
        'shaw',
        'sharp',
        'shangrila',
        'sfr',
        'sexy',
        'sex',
        'sew',
        'seven',
        'ses',
        'services',
        'sener',
        'select',
        'seek',
        'security',
        'secure',
        'seat',
        'search',
        'scot',
        'scor',
        'scjohnson',
        'science',
        'schwarz',
        'schule',
        'school',
        'scholarships',
        'schmidt',
        'schaeffler',
        'scb',
        'sca',
        'sbs',
        'sbi',
        'saxo',
        'save',
        'sas',
        'sarl',
        'sapo',
        'sap',
        'sanofi',
        'sandvikcoromant',
        'sandvik',
        'samsung',
        'samsclub',
        'salon',
        'sale',
        'sakura',
        'safety',
        'safe',
        'saarland',
        'ryukyu',
        'rwe',
        'run',
        'ruhr',
        'rugby',
        'rsvp',
        'room',
        'rogers',
        'rodeo',
        'rocks',
        'rocher',
        'rmit',
        'rip',
        'rio',
        'ril',
        'rightathome',
        'ricoh',
        'richardli',
        'rich',
        'rexroth',
        'reviews',
        'review',
        'restaurant',
        'rest',
        'republican',
        'report',
        'repair',
        'rentals',
        'rent',
        'ren',
        'reliance',
        'reit',
        'reisen',
        'reise',
        'rehab',
        'redumbrella',
        'redstone',
        'red',
        'recipes',
        'realty',
        'realtor',
        'realestate',
        'read',
        'raid',
        'radio',
        'racing',
        'qvc',
        'quest',
        'quebec',
        'qpon',
        'pwc',
        'pub',
        'prudential',
        'pru',
        'protection',
        'property',
        'properties',
        'promo',
        'progressive',
        'prof',
        'productions',
        'prod',
        'pro',
        'prime',
        'press',
        'praxi',
        'pramerica',
        'post',
        'porn',
        'politie',
        'poker',
        'pohl',
        'pnc',
        'plus',
        'plumbing',
        'playstation',
        'play',
        'place',
        'pizza',
        'pioneer',
        'pink',
        'ping',
        'pin',
        'pid',
        'pictures',
        'pictet',
        'pics',
        'piaget',
        'physio',
        'photos',
        'photography',
        'photo',
        'phone',
        'philips',
        'phd',
        'pharmacy',
        'pfizer',
        'pet',
        'pccw',
        'pay',
        'passagens',
        'party',
        'parts',
        'partners',
        'pars',
        'paris',
        'panerai',
        'panasonic',
        'pamperedchef',
        'page',
        'ovh',
        'ott',
        'otsuka',
        'osaka',
        'origins',
        'orientexpress',
        'organic',
        'org',
        'orange',
        'oracle',
        'open',
        'ooo',
        'onyourside',
        'online',
        'onl',
        'ong',
        'one',
        'omega',
        'ollo',
        'oldnavy',
        'olayangroup',
        'olayan',
        'okinawa',
        'office',
        'off',
        'observer',
        'obi',
        'nyc',
        'ntt',
        'nrw',
        'nra',
        'nowtv',
        'nowruz',
        'now',
        'norton',
        'northwesternmutual',
        'nokia',
        'nissay',
        'nissan',
        'ninja',
        'nikon',
        'nike',
        'nico',
        'nhk',
        'ngo',
        'nfl',
        'nexus',
        'nextdirect',
        'next',
        'news',
        'newholland',
        'new',
        'neustar',
        'network',
        'netflix',
        'netbank',
        'net',
        'nec',
        'nba',
        'navy',
        'natura',
        'nationwide',
        'name',
        'nagoya',
        'nadex',
        'nab',
        'mutuelle',
        'mutual',
        'museum',
        'mtr',
        'mtpc',
        'mtn',
        'msd',
        'movistar',
        'movie',
        'mov',
        'motorcycles',
        'moto',
        'moscow',
        'mortgage',
        'mormon',
        'mopar',
        'montblanc',
        'monster',
        'money',
        'monash',
        'mom',
        'moi',
        'moe',
        'moda',
        'mobily',
        'mobile',
        'mobi',
        'mma',
        'mls',
        'mlb',
        'mitsubishi',
        'mit',
        'mint',
        'mini',
        'mil',
        'microsoft',
        'miami',
        'metlife',
        'merckmsd',
        'meo',
        'menu',
        'men',
        'memorial',
        'meme',
        'melbourne',
        'meet',
        'media',
        'med',
        'mckinsey',
        'mcdonalds',
        'mcd',
        'mba',
        'mattel',
        'maserati',
        'marshalls',
        'marriott',
        'markets',
        'marketing',
        'market',
        'map',
        'mango',
        'management',
        'man',
        'makeup',
        'maison',
        'maif',
        'madrid',
        'macys',
        'luxury',
        'luxe',
        'lupin',
        'lundbeck',
        'ltda',
        'ltd',
        'lplfinancial',
        'lpl',
        'love',
        'lotto',
        'lotte',
        'london',
        'lol',
        'loft',
        'locus',
        'locker',
        'loans',
        'loan',
        'llp',
        'llc',
        'lixil',
        'living',
        'live',
        'lipsy',
        'link',
        'linde',
        'lincoln',
        'limo',
        'limited',
        'lilly',
        'like',
        'lighting',
        'lifestyle',
        'lifeinsurance',
        'life',
        'lidl',
        'liaison',
        'lgbt',
        'lexus',
        'lego',
        'legal',
        'lefrak',
        'leclerc',
        'lease',
        'lds',
        'lawyer',
        'law',
        'latrobe',
        'latino',
        'lat',
        'lasalle',
        'lanxess',
        'landrover',
        'land',
        'lancome',
        'lancia',
        'lancaster',
        'lamer',
        'lamborghini',
        'ladbrokes',
        'lacaixa',
        'kyoto',
        'kuokgroup',
        'kred',
        'krd',
        'kpn',
        'kpmg',
        'kosher',
        'komatsu',
        'koeln',
        'kiwi',
        'kitchen',
        'kindle',
        'kinder',
        'kim',
        'kia',
        'kfh',
        'kerryproperties',
        'kerrylogistics',
        'kerryhotels',
        'kddi',
        'kaufen',
        'juniper',
        'juegos',
        'jprs',
        'jpmorgan',
        'joy',
        'jot',
        'joburg',
        'jobs',
        'jnj',
        'jmp',
        'jll',
        'jlc',
        'jio',
        'jewelry',
        'jetzt',
        'jeep',
        'jcp',
        'jcb',
        'java',
        'jaguar',
        'iwc',
        'iveco',
        'itv',
        'itau',
        'istanbul',
        'ist',
        'ismaili',
        'iselect',
        'irish',
        'ipiranga',
        'investments',
        'intuit',
        'international',
        'intel',
        'int',
        'insure',
        'insurance',
        'institute',
        'ink',
        'ing',
        'info',
        'infiniti',
        'industries',
        'inc',
        'immobilien',
        'immo',
        'imdb',
        'imamat',
        'ikano',
        'iinet',
        'ifm',
        'ieee',
        'icu',
        'ice',
        'icbc',
        'ibm',
        'hyundai',
        'hyatt',
        'hughes',
        'htc',
        'hsbc',
        'how',
        'house',
        'hotmail',
        'hotels',
        'hoteles',
        'hot',
        'hosting',
        'host',
        'hospital',
        'horse',
        'honeywell',
        'honda',
        'homesense',
        'homes',
        'homegoods',
        'homedepot',
        'holiday',
        'holdings',
        'hockey',
        'hkt',
        'hiv',
        'hitachi',
        'hisamitsu',
        'hiphop',
        'hgtv',
        'hermes',
        'here',
        'helsinki',
        'help',
        'healthcare',
        'health',
        'hdfcbank',
        'hdfc',
        'hbo',
        'haus',
        'hangout',
        'hamburg',
        'hair',
        'guru',
        'guitars',
        'guide',
        'guge',
        'gucci',
        'guardian',
        'group',
        'grocery',
        'gripe',
        'green',
        'gratis',
        'graphics',
        'grainger',
        'gov',
        'got',
        'gop',
        'google',
        'goog',
        'goodyear',
        'goodhands',
        'goo',
        'golf',
        'goldpoint',
        'gold',
        'godaddy',
        'gmx',
        'gmo',
        'gmbh',
        'gmail',
        'globo',
        'global',
        'gle',
        'glass',
        'glade',
        'giving',
        'gives',
        'gifts',
        'gift',
        'ggee',
        'george',
        'genting',
        'gent',
        'gea',
        'gdn',
        'gbiz',
        'gay',
        'garden',
        'gap',
        'games',
        'game',
        'gallup',
        'gallo',
        'gallery',
        'gal',
        'fyi',
        'futbol',
        'furniture',
        'fund',
        'fun',
        'fujixerox',
        'fujitsu',
        'ftr',
        'frontier',
        'frontdoor',
        'frogans',
        'frl',
        'fresenius',
        'free',
        'fox',
        'foundation',
        'forum',
        'forsale',
        'forex',
        'ford',
        'football',
        'foodnetwork',
        'food',
        'foo',
        'fly',
        'flsmidth',
        'flowers',
        'florist',
        'flir',
        'flights',
        'flickr',
        'fitness',
        'fit',
        'fishing',
        'fish',
        'firmdale',
        'firestone',
        'fire',
        'financial',
        'finance',
        'final',
        'film',
        'fido',
        'fidelity',
        'fiat',
        'ferrero',
        'ferrari',
        'feedback',
        'fedex',
        'fast',
        'fashion',
        'farmers',
        'farm',
        'fans',
        'fan',
        'family',
        'faith',
        'fairwinds',
        'fail',
        'fage',
        'extraspace',
        'express',
        'exposed',
        'expert',
        'exchange',
        'everbank',
        'events',
        'eus',
        'eurovision',
        'etisalat',
        'esurance',
        'estate',
        'esq',
        'erni',
        'ericsson',
        'equipment',
        'epson',
        'epost',
        'enterprises',
        'engineering',
        'engineer',
        'energy',
        'emerck',
        'email',
        'education',
        'edu',
        'edeka',
        'eco',
        'eat',
        'earth',
        'dvr',
        'dvag',
        'durban',
        'dupont',
        'duns',
        'dunlop',
        'duck',
        'dubai',
        'dtv',
        'drive',
        'download',
        'dot',
        'doosan',
        'domains',
        'doha',
        'dog',
        'dodge',
        'doctor',
        'docs',
        'dnp',
        'diy',
        'dish',
        'discover',
        'discount',
        'directory',
        'direct',
        'digital',
        'diet',
        'diamonds',
        'dhl',
        'dev',
        'design',
        'desi',
        'dentist',
        'dental',
        'democrat',
        'delta',
        'deloitte',
        'dell',
        'delivery',
        'degree',
        'deals',
        'dealer',
        'deal',
        'dds',
        'dclk',
        'day',
        'datsun',
        'dating',
        'date',
        'data',
        'dance',
        'dad',
        'dabur',
        'cyou',
        'cymru',
        'cuisinella',
        'csc',
        'cruises',
        'cruise',
        'crs',
        'crown',
        'cricket',
        'creditunion',
        'creditcard',
        'credit',
        'cpa',
        'courses',
        'coupons',
        'coupon',
        'country',
        'corsica',
        'coop',
        'cool',
        'cookingchannel',
        'cooking',
        'contractors',
        'contact',
        'consulting',
        'construction',
        'condos',
        'comsec',
        'computer',
        'compare',
        'company',
        'community',
        'commbank',
        'comcast',
        'com',
        'cologne',
        'college',
        'coffee',
        'codes',
        'coach',
        'clubmed',
        'club',
        'cloud',
        'clothing',
        'clinique',
        'clinic',
        'click',
        'cleaning',
        'claims',
        'cityeats',
        'city',
        'citic',
        'citi',
        'citadel',
        'cisco',
        'circle',
        'cipriani',
        'church',
        'chrysler',
        'chrome',
        'christmas',
        'chloe',
        'chintai',
        'cheap',
        'chat',
        'chase',
        'charity',
        'channel',
        'chanel',
        'cfd',
        'cfa',
        'cern',
        'ceo',
        'center',
        'ceb',
        'cbs',
        'cbre',
        'cbn',
        'cba',
        'catholic',
        'catering',
        'cat',
        'casino',
        'cash',
        'caseih',
        'case',
        'casa',
        'cartier',
        'cars',
        'careers',
        'career',
        'care',
        'cards',
        'caravan',
        'car',
        'capitalone',
        'capital',
        'capetown',
        'canon',
        'cancerresearch',
        'camp',
        'camera',
        'cam',
        'calvinklein',
        'call',
        'cal',
        'cafe',
        'cab',
        'bzh',
        'buzz',
        'buy',
        'business',
        'builders',
        'build',
        'bugatti',
        'budapest',
        'brussels',
        'brother',
        'broker',
        'broadway',
        'bridgestone',
        'bradesco',
        'box',
        'boutique',
        'bot',
        'boston',
        'bostik',
        'bosch',
        'boots',
        'booking',
        'book',
        'boo',
        'bond',
        'bom',
        'bofa',
        'boehringer',
        'boats',
        'bnpparibas',
        'bnl',
        'bmw',
        'bms',
        'blue',
        'bloomberg',
        'blog',
        'blockbuster',
        'blanco',
        'blackfriday',
        'black',
        'biz',
        'bio',
        'bingo',
        'bing',
        'bike',
        'bid',
        'bible',
        'bharti',
        'bet',
        'bestbuy',
        'best',
        'berlin',
        'bentley',
        'beer',
        'beauty',
        'beats',
        'bcn',
        'bcg',
        'bbva',
        'bbt',
        'bbc',
        'bayern',
        'bauhaus',
        'basketball',
        'baseball',
        'bargains',
        'barefoot',
        'barclays',
        'barclaycard',
        'barcelona',
        'bar',
        'bank',
        'band',
        'bananarepublic',
        'banamex',
        'baidu',
        'baby',
        'azure',
        'axa',
        'aws',
        'avianca',
        'autos',
        'auto',
        'author',
        'auspost',
        'audio',
        'audible',
        'audi',
        'auction',
        'attorney',
        'athleta',
        'associates',
        'asia',
        'asda',
        'arte',
        'art',
        'arpa',
        'army',
        'archi',
        'aramco',
        'arab',
        'aquarelle',
        'apple',
        'app',
        'apartments',
        'aol',
        'anz',
        'anquan',
        'android',
        'analytics',
        'amsterdam',
        'amica',
        'amfam',
        'amex',
        'americanfamily',
        'americanexpress',
        'alstom',
        'alsace',
        'ally',
        'allstate',
        'allfinanz',
        'alipay',
        'alibaba',
        'alfaromeo',
        'akdn',
        'airtel',
        'airforce',
        'airbus',
        'aigo',
        'aig',
        'agency',
        'agakhan',
        'africa',
        'afl',
        'afamilycompany',
        'aetna',
        'aero',
        'aeg',
        'adult',
        'ads',
        'adac',
        'actor',
        'active',
        'aco',
        'accountants',
        'accountant',
        'accenture',
        'academy',
        'abudhabi',
        'abogado',
        'able',
        'abc',
        'abbvie',
        'abbott',
        'abb',
        'abarth',
        'aarp',
        'aaa',
        'onion',
    );

    /**
     * gTLDs
     *
     * @var array
     */
    private static $ccTLDs = array(
        '한국',
        '香港',
        '澳門',
        '新加坡',
        '台灣',
        '台湾',
        '中國',
        '中国',
        'გე',
        'ລາວ',
        'ไทย',
        'ලංකා',
        'ഭാരതം',
        'ಭಾರತ',
        'భారత్',
        'சிங்கப்பூர்',
        'இலங்கை',
        'இந்தியா',
        'ଭାରତ',
        'ભારત',
        'ਭਾਰਤ',
        'ভাৰত',
        'ভারত',
        'বাংলা',
        'भारोत',
        'भारतम्',
        'भारत',
        'ڀارت',
        'پاکستان',
        'موريتانيا',
        'مليسيا',
        'مصر',
        'قطر',
        'فلسطين',
        'عمان',
        'عراق',
        'سورية',
        'سودان',
        'تونس',
        'بھارت',
        'بارت',
        'ایران',
        'امارات',
        'المغرب',
        'السعودية',
        'الجزائر',
        'البحرين',
        'الاردن',
        'հայ',
        'қаз',
        'укр',
        'срб',
        'рф',
        'мон',
        'мкд',
        'ею',
        'бел',
        'бг',
        'ευ',
        'ελ',
        'zw',
        'zm',
        'za',
        'yt',
        'ye',
        'ws',
        'wf',
        'vu',
        'vn',
        'vi',
        'vg',
        've',
        'vc',
        'va',
        'uz',
        'uy',
        'us',
        'um',
        'uk',
        'ug',
        'ua',
        'tz',
        'tw',
        'tv',
        'tt',
        'tr',
        'tp',
        'to',
        'tn',
        'tm',
        'tl',
        'tk',
        'tj',
        'th',
        'tg',
        'tf',
        'td',
        'tc',
        'sz',
        'sy',
        'sx',
        'sv',
        'su',
        'st',
        'ss',
        'sr',
        'so',
        'sn',
        'sm',
        'sl',
        'sk',
        'sj',
        'si',
        'sh',
        'sg',
        'se',
        'sd',
        'sc',
        'sb',
        'sa',
        'rw',
        'ru',
        'rs',
        'ro',
        're',
        'qa',
        'py',
        'pw',
        'pt',
        'ps',
        'pr',
        'pn',
        'pm',
        'pl',
        'pk',
        'ph',
        'pg',
        'pf',
        'pe',
        'pa',
        'om',
        'nz',
        'nu',
        'nr',
        'np',
        'no',
        'nl',
        'ni',
        'ng',
        'nf',
        'ne',
        'nc',
        'na',
        'mz',
        'my',
        'mx',
        'mw',
        'mv',
        'mu',
        'mt',
        'ms',
        'mr',
        'mq',
        'mp',
        'mo',
        'mn',
        'mm',
        'ml',
        'mk',
        'mh',
        'mg',
        'mf',
        'me',
        'md',
        'mc',
        'ma',
        'ly',
        'lv',
        'lu',
        'lt',
        'ls',
        'lr',
        'lk',
        'li',
        'lc',
        'lb',
        'la',
        'kz',
        'ky',
        'kw',
        'kr',
        'kp',
        'kn',
        'km',
        'ki',
        'kh',
        'kg',
        'ke',
        'jp',
        'jo',
        'jm',
        'je',
        'it',
        'is',
        'ir',
        'iq',
        'io',
        'in',
        'im',
        'il',
        'ie',
        'id',
        'hu',
        'ht',
        'hr',
        'hn',
        'hm',
        'hk',
        'gy',
        'gw',
        'gu',
        'gt',
        'gs',
        'gr',
        'gq',
        'gp',
        'gn',
        'gm',
        'gl',
        'gi',
        'gh',
        'gg',
        'gf',
        'ge',
        'gd',
        'gb',
        'ga',
        'fr',
        'fo',
        'fm',
        'fk',
        'fj',
        'fi',
        'eu',
        'et',
        'es',
        'er',
        'eh',
        'eg',
        'ee',
        'ec',
        'dz',
        'do',
        'dm',
        'dk',
        'dj',
        'de',
        'cz',
        'cy',
        'cx',
        'cw',
        'cv',
        'cu',
        'cr',
        'co',
        'cn',
        'cm',
        'cl',
        'ck',
        'ci',
        'ch',
        'cg',
        'cf',
        'cd',
        'cc',
        'ca',
        'bz',
        'by',
        'bw',
        'bv',
        'bt',
        'bs',
        'br',
        'bq',
        'bo',
        'bn',
        'bm',
        'bl',
        'bj',
        'bi',
        'bh',
        'bg',
        'bf',
        'be',
        'bd',
        'bb',
        'ba',
        'az',
        'ax',
        'aw',
        'au',
        'at',
        'as',
        'ar',
        'aq',
        'ao',
        'an',
        'am',
        'al',
        'ai',
        'ag',
        'af',
        'ae',
        'ad',
        'ac',
    );

    /**
     * get valid gTLD regexp
     *
     * @staticvar string $regex
     * @return string
     */
    final public static function getValidGTLD()
    {
        static $regex;

        if (!empty($regex)) {
            return $regex;
        }

        $gTLD = implode('|', static::$gTLDs);
        $regex = '(?:(?:' . $gTLD . ')(?=[^0-9a-z@+-]|$))';

        return $regex;
    }

    /**
     * get valid ccTLD regexp
     *
     * @staticvar string $regex
     * @return string
     */
    final public static function getValidCcTLD()
    {
        static $regex;

        if (!empty($regex)) {
            return $regex;
        }

        $ccTLD = implode('|', static::$ccTLDs);
        $regex = '(?:(?:' . $ccTLD . ')(?=[^0-9a-z@+-]|$))';

        return $regex;
    }
}
