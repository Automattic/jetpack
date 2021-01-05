<?php

/**
 * @author     Mike Cochrane <mikec@mikenz.geek.nz>
 * @author     Nick Pope <nick@nickpope.me.uk>
 * @copyright  Copyright © 2010, Mike Cochrane, Nick Pope
 * @license    http://www.apache.org/licenses/LICENSE-2.0  Apache License v2.0
 * @package    Twitter.Text
 */

namespace Twitter\Text;

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
class Regex
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
