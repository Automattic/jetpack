(() => {
var _window$dateFns;function ownKeys(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);r&&(o=o.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable;})),t.push.apply(t,o);}return t;}function _objectSpread(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?ownKeys(Object(t),!0).forEach(function(r){_defineProperty(e,r,t[r]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):ownKeys(Object(t)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r));});}return e;}function _defineProperty(e,r,t){return(r=_toPropertyKey(r))in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e;}function _toPropertyKey(t){var i=_toPrimitive(t,"string");return"symbol"==_typeof(i)?i:i+"";}function _toPrimitive(t,r){if("object"!=_typeof(t)||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var i=e.call(t,r||"default");if("object"!=_typeof(i))return i;throw new TypeError("@@toPrimitive must return a primitive value.");}return("string"===r?String:Number)(t);}function _slicedToArray(r,e){return _arrayWithHoles(r)||_iterableToArrayLimit(r,e)||_unsupportedIterableToArray(r,e)||_nonIterableRest();}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");}function _unsupportedIterableToArray(r,a){if(r){if("string"==typeof r)return _arrayLikeToArray(r,a);var t={}.toString.call(r).slice(8,-1);return"Object"===t&&r.constructor&&(t=r.constructor.name),"Map"===t||"Set"===t?Array.from(r):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?_arrayLikeToArray(r,a):void 0;}}function _arrayLikeToArray(r,a){(null==a||a>r.length)&&(a=r.length);for(var e=0,n=Array(a);e<a;e++)n[e]=r[e];return n;}function _iterableToArrayLimit(r,l){var t=null==r?null:"undefined"!=typeof Symbol&&r[Symbol.iterator]||r["@@iterator"];if(null!=t){var e,n,i,u,a=[],f=!0,o=!1;try{if(i=(t=t.call(r)).next,0===l){if(Object(t)!==t)return;f=!1;}else for(;!(f=(e=i.call(t)).done)&&(a.push(e.value),a.length!==l);f=!0);}catch(r){o=!0,n=r;}finally{try{if(!f&&null!=t.return&&(u=t.return(),Object(u)!==u))return;}finally{if(o)throw n;}}return a;}}function _arrayWithHoles(r){if(Array.isArray(r))return r;}function _typeof(o){"@babel/helpers - typeof";return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(o){return typeof o;}:function(o){return o&&"function"==typeof Symbol&&o.constructor===Symbol&&o!==Symbol.prototype?"symbol":typeof o;},_typeof(o);}//#region \0rolldown/runtime.js
var __defProp=Object.defineProperty;
var __exportAll=function __exportAll(all,no_symbols){
var target={};
for(var name in all)__defProp(target,name,{
get:all[name],
enumerable:true
});
if(!no_symbols)__defProp(target,Symbol.toStringTag,{value:"Module"});
return target;
};
//#endregion
//#region dist/date-fns/locale/af/_lib/formatDistance.js
var formatDistanceLocale$83={
lessThanXSeconds:{
one:"minder as 'n sekonde",
other:"minder as {{count}} sekondes"
},
xSeconds:{
one:"1 sekonde",
other:"{{count}} sekondes"
},
halfAMinute:"'n halwe minuut",
lessThanXMinutes:{
one:"minder as 'n minuut",
other:"minder as {{count}} minute"
},
xMinutes:{
one:"'n minuut",
other:"{{count}} minute"
},
aboutXHours:{
one:"ongeveer 1 uur",
other:"ongeveer {{count}} ure"
},
xHours:{
one:"1 uur",
other:"{{count}} ure"
},
xDays:{
one:"1 dag",
other:"{{count}} dae"
},
aboutXWeeks:{
one:"ongeveer 1 week",
other:"ongeveer {{count}} weke"
},
xWeeks:{
one:"1 week",
other:"{{count}} weke"
},
aboutXMonths:{
one:"ongeveer 1 maand",
other:"ongeveer {{count}} maande"
},
xMonths:{
one:"1 maand",
other:"{{count}} maande"
},
aboutXYears:{
one:"ongeveer 1 jaar",
other:"ongeveer {{count}} jaar"
},
xYears:{
one:"1 jaar",
other:"{{count}} jaar"
},
overXYears:{
one:"meer as 1 jaar",
other:"meer as {{count}} jaar"
},
almostXYears:{
one:"byna 1 jaar",
other:"byna {{count}} jaar"
}
};
var formatDistance$84=function formatDistance$84(token,count,options){
var result;
var tokenValue=formatDistanceLocale$83[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"oor "+result;else
return result+" gelede";
return result;
};
//#endregion
//#region dist/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args){
return function(){var options=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};
var width=options.width?String(options.width):args.defaultWidth;
return args.formats[width]||args.formats[args.defaultWidth];
};
}
var formatLong$92={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"yyyy/MM/dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'om' {{time}}",
long:"{{date}} 'om' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/af/_lib/formatRelative.js
var formatRelativeLocale$84={
lastWeek:"'verlede' eeee 'om' p",
yesterday:"'gister om' p",
today:"'vandag om' p",
tomorrow:"'môre om' p",
nextWeek:"eeee 'om' p",
other:"P"
};
var formatRelative$84=function formatRelative$84(token,_date,_baseDate,_options){return formatRelativeLocale$84[token];};
//#endregion
//#region dist/date-fns/locale/_lib/buildLocalizeFn.js
/**
* The localize function argument callback which allows to convert raw value to
* the actual type.
*
* @param value - The value to convert
*
* @returns The converted value
*/
/**
* The map of localized values for each width.
*/
/**
* The index type of the locale unit value. It types conversion of units of
* values that don't start at 0 (i.e. quarters).
*/
/**
* Converts the unit value to the tuple of values.
*/
/**
* The tuple of localized era values. The first element represents BC,
* the second element represents AD.
*/
/**
* The tuple of localized quarter values. The first element represents Q1.
*/
/**
* The tuple of localized day values. The first element represents Sunday.
*/
/**
* The tuple of localized month values. The first element represents January.
*/
function buildLocalizeFn(args){
return function(value,options){
var context=options!==null&&options!==void 0&&options.context?String(options.context):"standalone";
var valuesArray;
if(context==="formatting"&&args.formattingValues){
var defaultWidth=args.defaultFormattingWidth||args.defaultWidth;
var width=options!==null&&options!==void 0&&options.width?String(options.width):defaultWidth;
valuesArray=args.formattingValues[width]||args.formattingValues[defaultWidth];
}else{
var _defaultWidth=args.defaultWidth;
var _width=options!==null&&options!==void 0&&options.width?String(options.width):args.defaultWidth;
valuesArray=args.values[_width]||args.values[_defaultWidth];
}
var index=args.argumentCallback?args.argumentCallback(value):value;
return valuesArray[index];
};
}
//#endregion
//#region dist/date-fns/locale/af/_lib/localize.js
var eraValues$84={
narrow:["vC","nC"],
abbreviated:["vC","nC"],
wide:["voor Christus","na Christus"]
};
var quarterValues$84={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1ste kwartaal",
"2de kwartaal",
"3de kwartaal",
"4de kwartaal"]

};
var monthValues$84={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Feb",
"Mrt",
"Apr",
"Mei",
"Jun",
"Jul",
"Aug",
"Sep",
"Okt",
"Nov",
"Des"],

wide:[
"Januarie",
"Februarie",
"Maart",
"April",
"Mei",
"Junie",
"Julie",
"Augustus",
"September",
"Oktober",
"November",
"Desember"]

};
var dayValues$84={
narrow:[
"S",
"M",
"D",
"W",
"D",
"V",
"S"],

short:[
"So",
"Ma",
"Di",
"Wo",
"Do",
"Vr",
"Sa"],

abbreviated:[
"Son",
"Maa",
"Din",
"Woe",
"Don",
"Vry",
"Sat"],

wide:[
"Sondag",
"Maandag",
"Dinsdag",
"Woensdag",
"Donderdag",
"Vrydag",
"Saterdag"]

};
var dayPeriodValues$84={
narrow:{
am:"vm",
pm:"nm",
midnight:"middernag",
noon:"middaguur",
morning:"oggend",
afternoon:"middag",
evening:"laat middag",
night:"aand"
},
abbreviated:{
am:"vm",
pm:"nm",
midnight:"middernag",
noon:"middaguur",
morning:"oggend",
afternoon:"middag",
evening:"laat middag",
night:"aand"
},
wide:{
am:"vm",
pm:"nm",
midnight:"middernag",
noon:"middaguur",
morning:"oggend",
afternoon:"middag",
evening:"laat middag",
night:"aand"
}
};
var formattingDayPeriodValues$68={
narrow:{
am:"vm",
pm:"nm",
midnight:"middernag",
noon:"uur die middag",
morning:"uur die oggend",
afternoon:"uur die middag",
evening:"uur die aand",
night:"uur die aand"
},
abbreviated:{
am:"vm",
pm:"nm",
midnight:"middernag",
noon:"uur die middag",
morning:"uur die oggend",
afternoon:"uur die middag",
evening:"uur die aand",
night:"uur die aand"
},
wide:{
am:"vm",
pm:"nm",
midnight:"middernag",
noon:"uur die middag",
morning:"uur die oggend",
afternoon:"uur die middag",
evening:"uur die aand",
night:"uur die aand"
}
};
var ordinalNumber$84=function ordinalNumber$84(dirtyNumber){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100<20)switch(rem100){
case 1:
case 8:return number+"ste";
default:return number+"de";
}
return number+"ste";
};
var localize$84={
ordinalNumber:ordinalNumber$84,
era:buildLocalizeFn({
values:eraValues$84,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$84,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$84,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$84,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$84,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$68,
defaultFormattingWidth:"wide"
})
};
//#endregion
//#region dist/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args){
return function(string){var options=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};
var width=options.width;
var matchPattern=width&&args.matchPatterns[width]||args.matchPatterns[args.defaultMatchWidth];
var matchResult=string.match(matchPattern);
if(!matchResult)return null;
var matchedString=matchResult[0];
var parsePatterns=width&&args.parsePatterns[width]||args.parsePatterns[args.defaultParseWidth];
var key=Array.isArray(parsePatterns)?findIndex(parsePatterns,function(pattern){return pattern.test(matchedString);}):findKey(parsePatterns,function(pattern){return pattern.test(matchedString);});
var value;
value=args.valueCallback?args.valueCallback(key):key;
value=options.valueCallback?options.valueCallback(value):value;
var rest=string.slice(matchedString.length);
return{
value:value,
rest:rest
};
};
}
function findKey(object,predicate){
for(var key in object)if(Object.prototype.hasOwnProperty.call(object,key)&&predicate(object[key]))return key;
}
function findIndex(array,predicate){
for(var key=0;key<array.length;key++)if(predicate(array[key]))return key;
}
//#endregion
//#region dist/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args){
return function(string){var options=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};
var matchResult=string.match(args.matchPattern);
if(!matchResult)return null;
var matchedString=matchResult[0];
var parseResult=string.match(args.parsePattern);
if(!parseResult)return null;
var value=args.valueCallback?args.valueCallback(parseResult[0]):parseResult[0];
value=options.valueCallback?options.valueCallback(value):value;
var rest=string.slice(matchedString.length);
return{
value:value,
rest:rest
};
};
}
//#endregion
//#region dist/date-fns/locale/af.js
/**
* @category Locales
* @summary Afrikaans locale.
* @language Afrikaans
* @iso-639-2 afr
* @author Marnus Weststrate [@marnusw](https://github.com/marnusw)
*/
var _af={
code:"af",
formatDistance:formatDistance$84,
formatLong:formatLong$92,
formatRelative:formatRelative$84,
localize:localize$84,
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(ste|de)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^([vn]\.? ?C\.?)/,
abbreviated:/^([vn]\. ?C\.?)/,
wide:/^((voor|na) Christus)/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^v/,/^n/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^K[1234]/i,
wide:/^[1234](st|d)e kwartaal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(Jan|Feb|Mrt|Apr|Mei|Jun|Jul|Aug|Sep|Okt|Nov|Dec)\.?/i,
wide:/^(Januarie|Februarie|Maart|April|Mei|Junie|Julie|Augustus|September|Oktober|November|Desember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^J/i,
/^F/i,
/^M/i,
/^A/i,
/^M/i,
/^J/i,
/^J/i,
/^A/i,
/^S/i,
/^O/i,
/^N/i,
/^D/i],

any:[
/^Jan/i,
/^Feb/i,
/^Mrt/i,
/^Apr/i,
/^Mei/i,
/^Jun/i,
/^Jul/i,
/^Aug/i,
/^Sep/i,
/^Okt/i,
/^Nov/i,
/^Dec/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smdwv]/i,
short:/^(So|Ma|Di|Wo|Do|Vr|Sa)/i,
abbreviated:/^(Son|Maa|Din|Woe|Don|Vry|Sat)/i,
wide:/^(Sondag|Maandag|Dinsdag|Woensdag|Donderdag|Vrydag|Saterdag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^S/i,
/^M/i,
/^D/i,
/^W/i,
/^D/i,
/^V/i,
/^S/i],

any:[
/^So/i,
/^Ma/i,
/^Di/i,
/^Wo/i,
/^Do/i,
/^Vr/i,
/^Sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(vm|nm|middernag|(?:uur )?die (oggend|middag|aand))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^vm/i,
pm:/^nm/i,
midnight:/^middernag/i,
noon:/^middaguur/i,
morning:/oggend/i,
afternoon:/middag/i,
evening:/laat middag/i,
night:/aand/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ar/_lib/formatDistance.js
var formatDistanceLocale$82={
lessThanXSeconds:{
one:"أقل من ثانية",
two:"أقل من ثانيتين",
threeToTen:"أقل من {{count}} ثواني",
other:"أقل من {{count}} ثانية"
},
xSeconds:{
one:"ثانية واحدة",
two:"ثانيتان",
threeToTen:"{{count}} ثواني",
other:"{{count}} ثانية"
},
halfAMinute:"نصف دقيقة",
lessThanXMinutes:{
one:"أقل من دقيقة",
two:"أقل من دقيقتين",
threeToTen:"أقل من {{count}} دقائق",
other:"أقل من {{count}} دقيقة"
},
xMinutes:{
one:"دقيقة واحدة",
two:"دقيقتان",
threeToTen:"{{count}} دقائق",
other:"{{count}} دقيقة"
},
aboutXHours:{
one:"ساعة واحدة تقريباً",
two:"ساعتين تقريبا",
threeToTen:"{{count}} ساعات تقريباً",
other:"{{count}} ساعة تقريباً"
},
xHours:{
one:"ساعة واحدة",
two:"ساعتان",
threeToTen:"{{count}} ساعات",
other:"{{count}} ساعة"
},
xDays:{
one:"يوم واحد",
two:"يومان",
threeToTen:"{{count}} أيام",
other:"{{count}} يوم"
},
aboutXWeeks:{
one:"أسبوع واحد تقريبا",
two:"أسبوعين تقريبا",
threeToTen:"{{count}} أسابيع تقريبا",
other:"{{count}} أسبوعا تقريبا"
},
xWeeks:{
one:"أسبوع واحد",
two:"أسبوعان",
threeToTen:"{{count}} أسابيع",
other:"{{count}} أسبوعا"
},
aboutXMonths:{
one:"شهر واحد تقريباً",
two:"شهرين تقريبا",
threeToTen:"{{count}} أشهر تقريبا",
other:"{{count}} شهرا تقريباً"
},
xMonths:{
one:"شهر واحد",
two:"شهران",
threeToTen:"{{count}} أشهر",
other:"{{count}} شهرا"
},
aboutXYears:{
one:"سنة واحدة تقريباً",
two:"سنتين تقريبا",
threeToTen:"{{count}} سنوات تقريباً",
other:"{{count}} سنة تقريباً"
},
xYears:{
one:"سنة واحد",
two:"سنتان",
threeToTen:"{{count}} سنوات",
other:"{{count}} سنة"
},
overXYears:{
one:"أكثر من سنة",
two:"أكثر من سنتين",
threeToTen:"أكثر من {{count}} سنوات",
other:"أكثر من {{count}} سنة"
},
almostXYears:{
one:"ما يقارب سنة واحدة",
two:"ما يقارب سنتين",
threeToTen:"ما يقارب {{count}} سنوات",
other:"ما يقارب {{count}} سنة"
}
};
var formatDistance$83=function formatDistance$83(token,count,options){
var usageGroup=formatDistanceLocale$82[token];
var result;
if(typeof usageGroup==="string")result=usageGroup;else
if(count===1)result=usageGroup.one;else
if(count===2)result=usageGroup.two;else
if(count<=10)result=usageGroup.threeToTen.replace("{{count}}",String(count));else
result=usageGroup.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"خلال "+result;else
return"منذ "+result;
return result;
};
var formatLong$91={
date:buildFormatLongFn({
formats:{
full:"EEEE، do MMMM y",
long:"do MMMM y",
medium:"d MMM y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss",
long:"HH:mm:ss",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'عند الساعة' {{time}}",
long:"{{date}} 'عند الساعة' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ar/_lib/formatRelative.js
var formatRelativeLocale$83={
lastWeek:"eeee 'الماضي عند الساعة' p",
yesterday:"'الأمس عند الساعة' p",
today:"'اليوم عند الساعة' p",
tomorrow:"'غدا عند الساعة' p",
nextWeek:"eeee 'القادم عند الساعة' p",
other:"P"
};
var formatRelative$83=function formatRelative$83(token){return formatRelativeLocale$83[token];};
//#endregion
//#region dist/date-fns/locale/ar/_lib/localize.js
var eraValues$83={
narrow:["ق","ب"],
abbreviated:["ق.م.","ب.م."],
wide:["قبل الميلاد","بعد الميلاد"]
};
var quarterValues$83={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ر1",
"ر2",
"ر3",
"ر4"],

wide:[
"الربع الأول",
"الربع الثاني",
"الربع الثالث",
"الربع الرابع"]

};
var monthValues$83={
narrow:[
"ي",
"ف",
"م",
"أ",
"م",
"ي",
"ي",
"أ",
"س",
"أ",
"ن",
"د"],

abbreviated:[
"يناير",
"فبراير",
"مارس",
"أبريل",
"مايو",
"يونيو",
"يوليو",
"أغسطس",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"],

wide:[
"يناير",
"فبراير",
"مارس",
"أبريل",
"مايو",
"يونيو",
"يوليو",
"أغسطس",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"]

};
var dayValues$83={
narrow:[
"ح",
"ن",
"ث",
"ر",
"خ",
"ج",
"س"],

short:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

abbreviated:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

wide:[
"الأحد",
"الاثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"]

};
var dayPeriodValues$83={
narrow:{
am:"ص",
pm:"م",
morning:"الصباح",
noon:"الظهر",
afternoon:"بعد الظهر",
evening:"المساء",
night:"الليل",
midnight:"منتصف الليل"
},
abbreviated:{
am:"ص",
pm:"م",
morning:"الصباح",
noon:"الظهر",
afternoon:"بعد الظهر",
evening:"المساء",
night:"الليل",
midnight:"منتصف الليل"
},
wide:{
am:"ص",
pm:"م",
morning:"الصباح",
noon:"الظهر",
afternoon:"بعد الظهر",
evening:"المساء",
night:"الليل",
midnight:"منتصف الليل"
}
};
var formattingDayPeriodValues$67={
narrow:{
am:"ص",
pm:"م",
morning:"في الصباح",
noon:"الظهر",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل",
midnight:"منتصف الليل"
},
abbreviated:{
am:"ص",
pm:"م",
morning:"في الصباح",
noon:"الظهر",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل",
midnight:"منتصف الليل"
},
wide:{
am:"ص",
pm:"م",
morning:"في الصباح",
noon:"الظهر",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل",
midnight:"منتصف الليل"
}
};
var ordinalNumber$83=function ordinalNumber$83(num){return String(num);};
//#endregion
//#region dist/date-fns/locale/ar.js
/**
* @category Locales
* @summary Arabic locale (Modern Standard Arabic - Al-fussha).
* @language Modern Standard Arabic
* @iso-639-2 ara
* @author Abdallah Hassan [@AbdallahAHO](https://github.com/AbdallahAHO)
* @author Koussay Haj Kacem [@essana3](https://github.com/essana3)
*/
var _ar={
code:"ar",
formatDistance:formatDistance$83,
formatLong:formatLong$91,
formatRelative:formatRelative$83,
localize:{
ordinalNumber:ordinalNumber$83,
era:buildLocalizeFn({
values:eraValues$83,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$83,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$83,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$83,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$83,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$67,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/[قب]/,
abbreviated:/[قب]\.م\./,
wide:/(قبل|بعد) الميلاد/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/قبل/,/بعد/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/ر[1234]/,
wide:/الربع (الأول|الثاني|الثالث|الرابع)/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[أيفمسند]/,
abbreviated:/^(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/,
wide:/^(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ي/i,
/^ف/i,
/^م/i,
/^أ/i,
/^م/i,
/^ي/i,
/^ي/i,
/^أ/i,
/^س/i,
/^أ/i,
/^ن/i,
/^د/i],

any:[
/^يناير/i,
/^فبراير/i,
/^مارس/i,
/^أبريل/i,
/^مايو/i,
/^يونيو/i,
/^يوليو/i,
/^أغسطس/i,
/^سبتمبر/i,
/^أكتوبر/i,
/^نوفمبر/i,
/^ديسمبر/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[حنثرخجس]/i,
short:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
abbreviated:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
wide:/^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ح/i,
/^ن/i,
/^ث/i,
/^ر/i,
/^خ/i,
/^ج/i,
/^س/i],

wide:[
/^الأحد/i,
/^الاثنين/i,
/^الثلاثاء/i,
/^الأربعاء/i,
/^الخميس/i,
/^الجمعة/i,
/^السبت/i],

any:[
/^أح/i,
/^اث/i,
/^ث/i,
/^أر/i,
/^خ/i,
/^ج/i,
/^س/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ص|م|منتصف الليل|الظهر|بعد الظهر|في الصباح|في المساء|في الليل)/,
any:/^(ص|م|منتصف الليل|الظهر|بعد الظهر|في الصباح|في المساء|في الليل)/
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ص/,
pm:/^م/,
midnight:/منتصف الليل/,
noon:/الظهر/,
afternoon:/بعد الظهر/,
morning:/في الصباح/,
evening:/في المساء/,
night:/في الليل/
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:6,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ar-DZ/_lib/formatDistance.js
var formatDistanceLocale$81={
lessThanXSeconds:{
one:"أقل من ثانية واحدة",
two:"أقل من ثانتين",
threeToTen:"أقل من {{count}} ثواني",
other:"أقل من {{count}} ثانية"
},
xSeconds:{
one:"ثانية واحدة",
two:"ثانتين",
threeToTen:"{{count}} ثواني",
other:"{{count}} ثانية"
},
halfAMinute:"نصف دقيقة",
lessThanXMinutes:{
one:"أقل من دقيقة",
two:"أقل من دقيقتين",
threeToTen:"أقل من {{count}} دقائق",
other:"أقل من {{count}} دقيقة"
},
xMinutes:{
one:"دقيقة واحدة",
two:"دقيقتين",
threeToTen:"{{count}} دقائق",
other:"{{count}} دقيقة"
},
aboutXHours:{
one:"ساعة واحدة تقريباً",
two:"ساعتين تقريباً",
threeToTen:"{{count}} ساعات تقريباً",
other:"{{count}} ساعة تقريباً"
},
xHours:{
one:"ساعة واحدة",
two:"ساعتين",
threeToTen:"{{count}} ساعات",
other:"{{count}} ساعة"
},
xDays:{
one:"يوم واحد",
two:"يومين",
threeToTen:"{{count}} أيام",
other:"{{count}} يوم"
},
aboutXWeeks:{
one:"أسبوع واحد تقريباً",
two:"أسبوعين تقريباً",
threeToTen:"{{count}} أسابيع تقريباً",
other:"{{count}} أسبوع تقريباً"
},
xWeeks:{
one:"أسبوع واحد",
two:"أسبوعين",
threeToTen:"{{count}} أسابيع",
other:"{{count}} أسبوع"
},
aboutXMonths:{
one:"شهر واحد تقريباً",
two:"شهرين تقريباً",
threeToTen:"{{count}} أشهر تقريباً",
other:"{{count}} شهر تقريباً"
},
xMonths:{
one:"شهر واحد",
two:"شهرين",
threeToTen:"{{count}} أشهر",
other:"{{count}} شهر"
},
aboutXYears:{
one:"عام واحد تقريباً",
two:"عامين تقريباً",
threeToTen:"{{count}} أعوام تقريباً",
other:"{{count}} عام تقريباً"
},
xYears:{
one:"عام واحد",
two:"عامين",
threeToTen:"{{count}} أعوام",
other:"{{count}} عام"
},
overXYears:{
one:"أكثر من عام",
two:"أكثر من عامين",
threeToTen:"أكثر من {{count}} أعوام",
other:"أكثر من {{count}} عام"
},
almostXYears:{
one:"عام واحد تقريباً",
two:"عامين تقريباً",
threeToTen:"{{count}} أعوام تقريباً",
other:"{{count}} عام تقريباً"
}
};
var formatDistance$82=function formatDistance$82(token,count,options){
options=options||{};
var usageGroup=formatDistanceLocale$81[token];
var result;
if(typeof usageGroup==="string")result=usageGroup;else
if(count===1)result=usageGroup.one;else
if(count===2)result=usageGroup.two;else
if(count<=10)result=usageGroup.threeToTen.replace("{{count}}",String(count));else
result=usageGroup.other.replace("{{count}}",String(count));
if(options.addSuffix)if(options.comparison&&options.comparison>0)return"في خلال "+result;else
return"منذ "+result;
return result;
};
var formatLong$90={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'عند' {{time}}",
long:"{{date}} 'عند' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ar-DZ/_lib/formatRelative.js
var formatRelativeLocale$82={
lastWeek:"'أخر' eeee 'عند' p",
yesterday:"'أمس عند' p",
today:"'اليوم عند' p",
tomorrow:"'غداً عند' p",
nextWeek:"eeee 'عند' p",
other:"P"
};
var formatRelative$82=function formatRelative$82(token,_date,_baseDate,_options){
return formatRelativeLocale$82[token];
};
//#endregion
//#region dist/date-fns/locale/ar-DZ/_lib/localize.js
var eraValues$82={
narrow:["ق","ب"],
abbreviated:["ق.م.","ب.م."],
wide:["قبل الميلاد","بعد الميلاد"]
};
var quarterValues$82={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ر1",
"ر2",
"ر3",
"ر4"],

wide:[
"الربع الأول",
"الربع الثاني",
"الربع الثالث",
"الربع الرابع"]

};
var monthValues$82={
narrow:[
"ج",
"ف",
"م",
"أ",
"م",
"ج",
"ج",
"أ",
"س",
"أ",
"ن",
"د"],

abbreviated:[
"جانـ",
"فيفـ",
"مارس",
"أفريل",
"مايـ",
"جوانـ",
"جويـ",
"أوت",
"سبتـ",
"أكتـ",
"نوفـ",
"ديسـ"],

wide:[
"جانفي",
"فيفري",
"مارس",
"أفريل",
"ماي",
"جوان",
"جويلية",
"أوت",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"]

};
var dayValues$82={
narrow:[
"ح",
"ن",
"ث",
"ر",
"خ",
"ج",
"س"],

short:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

abbreviated:[
"أحد",
"اثنـ",
"ثلا",
"أربـ",
"خميـ",
"جمعة",
"سبت"],

wide:[
"الأحد",
"الاثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"]

};
var dayPeriodValues$82={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
}
};
var formattingDayPeriodValues$66={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"في الصباح",
afternoon:"بعد الظـهر",
evening:"في المساء",
night:"في الليل"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"في الصباح",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظـهر",
evening:"في المساء",
night:"في الليل"
}
};
var ordinalNumber$82=function ordinalNumber$82(dirtyNumber){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ar-DZ.js
/**
* @category Locales
* @summary Arabic locale (Algerian Arabic).
* @language Algerian Arabic
* @iso-639-2 ara
* @author Badreddine Boumaza [@badre429](https://github.com/badre429)
* @author Ahmed ElShahat [@elshahat](https://github.com/elshahat)
*/
var _arDZ={
code:"ar-DZ",
formatDistance:formatDistance$82,
formatLong:formatLong$90,
formatRelative:formatRelative$82,
localize:{
ordinalNumber:ordinalNumber$82,
era:buildLocalizeFn({
values:eraValues$82,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$82,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return Number(quarter)-1;}
}),
month:buildLocalizeFn({
values:monthValues$82,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$82,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$82,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$66,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ق|ب)/i,
abbreviated:/^(ق\.?\s?م\.?|ق\.?\s?م\.?\s?|a\.?\s?d\.?|c\.?\s?)/i,
wide:/^(قبل الميلاد|قبل الميلاد|بعد الميلاد|بعد الميلاد)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^قبل/i,/^بعد/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ر[1234]/i,
wide:/^الربع [1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return Number(index)+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[جفمأسند]/i,
abbreviated:/^(جان|فيف|مار|أفر|ماي|جوا|جوي|أوت|سبت|أكت|نوف|ديس)/i,
wide:/^(جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ج/i,
/^ف/i,
/^م/i,
/^أ/i,
/^م/i,
/^ج/i,
/^ج/i,
/^أ/i,
/^س/i,
/^أ/i,
/^ن/i,
/^د/i],

any:[
/^جان/i,
/^فيف/i,
/^مار/i,
/^أفر/i,
/^ماي/i,
/^جوا/i,
/^جوي/i,
/^أوت/i,
/^سبت/i,
/^أكت/i,
/^نوف/i,
/^ديس/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[حنثرخجس]/i,
short:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
abbreviated:/^(أحد|اثن|ثلا|أرب|خمي|جمعة|سبت)/i,
wide:/^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ح/i,
/^ن/i,
/^ث/i,
/^ر/i,
/^خ/i,
/^ج/i,
/^س/i],

wide:[
/^الأحد/i,
/^الاثنين/i,
/^الثلاثاء/i,
/^الأربعاء/i,
/^الخميس/i,
/^الجمعة/i,
/^السبت/i],

any:[
/^أح/i,
/^اث/i,
/^ث/i,
/^أر/i,
/^خ/i,
/^ج/i,
/^س/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mi/i,
noon:/^no/i,
morning:/morning/i,
afternoon:/afternoon/i,
evening:/evening/i,
night:/night/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ar-EG/_lib/formatDistance.js
var formatDistanceLocale$80={
lessThanXSeconds:{
one:"أقل من ثانية",
two:"أقل من ثانيتين",
threeToTen:"أقل من {{count}} ثواني",
other:"أقل من {{count}} ثانية"
},
xSeconds:{
one:"ثانية",
two:"ثانيتين",
threeToTen:"{{count}} ثواني",
other:"{{count}} ثانية"
},
halfAMinute:"نص دقيقة",
lessThanXMinutes:{
one:"أقل من دقيقة",
two:"أقل من دقيقتين",
threeToTen:"أقل من {{count}} دقايق",
other:"أقل من {{count}} دقيقة"
},
xMinutes:{
one:"دقيقة",
two:"دقيقتين",
threeToTen:"{{count}} دقايق",
other:"{{count}} دقيقة"
},
aboutXHours:{
one:"حوالي ساعة",
two:"حوالي ساعتين",
threeToTen:"حوالي {{count}} ساعات",
other:"حوالي {{count}} ساعة"
},
xHours:{
one:"ساعة",
two:"ساعتين",
threeToTen:"{{count}} ساعات",
other:"{{count}} ساعة"
},
xDays:{
one:"يوم",
two:"يومين",
threeToTen:"{{count}} أيام",
other:"{{count}} يوم"
},
aboutXWeeks:{
one:"حوالي أسبوع",
two:"حوالي أسبوعين",
threeToTen:"حوالي {{count}} أسابيع",
other:"حوالي {{count}} أسبوع"
},
xWeeks:{
one:"أسبوع",
two:"أسبوعين",
threeToTen:"{{count}} أسابيع",
other:"{{count}} أسبوع"
},
aboutXMonths:{
one:"حوالي شهر",
two:"حوالي شهرين",
threeToTen:"حوالي {{count}} أشهر",
other:"حوالي {{count}} شهر"
},
xMonths:{
one:"شهر",
two:"شهرين",
threeToTen:"{{count}} أشهر",
other:"{{count}} شهر"
},
aboutXYears:{
one:"حوالي سنة",
two:"حوالي سنتين",
threeToTen:"حوالي {{count}} سنين",
other:"حوالي {{count}} سنة"
},
xYears:{
one:"عام",
two:"عامين",
threeToTen:"{{count}} أعوام",
other:"{{count}} عام"
},
overXYears:{
one:"أكثر من سنة",
two:"أكثر من سنتين",
threeToTen:"أكثر من {{count}} سنين",
other:"أكثر من {{count}} سنة"
},
almostXYears:{
one:"عام تقريبًا",
two:"عامين تقريبًا",
threeToTen:"{{count}} أعوام تقريبًا",
other:"{{count}} عام تقريبًا"
}
};
var formatDistance$81=function formatDistance$81(token,count,options){
var result;
var tokenValue=formatDistanceLocale$80[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===2)result=tokenValue.two;else
if(count<=10)result=tokenValue.threeToTen.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"\u0641\u064A \u062E\u0644\u0627\u0644 ".concat(result);else
return"\u0645\u0646\u0630 ".concat(result);
return result;
};
var formatLong$89={
date:buildFormatLongFn({
formats:{
full:"EEEE، do MMMM y",
long:"do MMMM y",
medium:"dd/MMM/y",
short:"d/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'الساعة' {{time}}",
long:"{{date}} 'الساعة' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ar-EG/_lib/formatRelative.js
var formatRelativeLocale$81={
lastWeek:"eeee 'اللي جاي الساعة' p",
yesterday:"'إمبارح الساعة' p",
today:"'النهاردة الساعة' p",
tomorrow:"'بكرة الساعة' p",
nextWeek:"eeee 'الساعة' p",
other:"P"
};
var formatRelative$81=function formatRelative$81(token,_date,_baseDate,_options){return formatRelativeLocale$81[token];};
//#endregion
//#region dist/date-fns/locale/ar-EG/_lib/localize.js
var eraValues$81={
narrow:["ق","ب"],
abbreviated:["ق.م","ب.م"],
wide:["قبل الميلاد","بعد الميلاد"]
};
var quarterValues$81={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ر1",
"ر2",
"ر3",
"ر4"],

wide:[
"الربع الأول",
"الربع الثاني",
"الربع الثالث",
"الربع الرابع"]

};
var monthValues$81={
narrow:[
"ي",
"ف",
"م",
"أ",
"م",
"ي",
"ي",
"أ",
"س",
"أ",
"ن",
"د"],

abbreviated:[
"ينا",
"فبر",
"مارس",
"أبريل",
"مايو",
"يونـ",
"يولـ",
"أغسـ",
"سبتـ",
"أكتـ",
"نوفـ",
"ديسـ"],

wide:[
"يناير",
"فبراير",
"مارس",
"أبريل",
"مايو",
"يونيو",
"يوليو",
"أغسطس",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"]

};
var dayValues$81={
narrow:[
"ح",
"ن",
"ث",
"ر",
"خ",
"ج",
"س"],

short:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

abbreviated:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

wide:[
"الأحد",
"الاثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"]

};
var dayPeriodValues$81={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءً",
night:"ليلاً"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهراً",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءً",
night:"ليلاً"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهراً",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءً",
night:"ليلاً"
}
};
var formattingDayPeriodValues$65={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"في الصباح",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهراً",
morning:"في الصباح",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
morning:"في الصباح",
noon:"ظهراً",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل"
}
};
var ordinalNumber$81=function ordinalNumber$81(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ar-EG.js
/**
* @category Locales
* @summary Arabic locale (Egypt).
* @language Arabic
* @iso-639-2 ara
* @author AbdAllah AbdElFattah [@AbdAllahAbdElFattah13](https://github.com/AbdAllahAbdElFattah13)
*/
var _arEG={
code:"ar-EG",
formatDistance:formatDistance$81,
formatLong:formatLong$89,
formatRelative:formatRelative$81,
localize:{
ordinalNumber:ordinalNumber$81,
era:buildLocalizeFn({
values:eraValues$81,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$81,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$81,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$81,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$81,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$65,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)/,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ق|ب)/g,
abbreviated:/^(ق.م|ب.م)/g,
wide:/^(قبل الميلاد|بعد الميلاد)/g
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^ق/g,/^ب/g]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/,
abbreviated:/^ر[1234]/,
wide:/^الربع (الأول|الثاني|الثالث|الرابع)/
},
defaultMatchWidth:"wide",
parsePatterns:{
wide:[
/الربع الأول/,
/الربع الثاني/,
/الربع الثالث/,
/الربع الرابع/],

any:[
/1/,
/2/,
/3/,
/4/]

},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(ي|ف|م|أ|س|ن|د)/,
abbreviated:/^(ينا|فبر|مارس|أبريل|مايو|يونـ|يولـ|أغسـ|سبتـ|أكتـ|نوفـ|ديسـ)/,
wide:/^(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ي/,
/^ف/,
/^م/,
/^أ/,
/^م/,
/^ي/,
/^ي/,
/^أ/,
/^س/,
/^أ/,
/^ن/,
/^د/],

any:[
/^ينا/,
/^فبر/,
/^مارس/,
/^أبريل/,
/^مايو/,
/^يون/,
/^يول/,
/^أغس/,
/^سبت/,
/^أكت/,
/^نوف/,
/^ديس/]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ح|ن|ث|ر|خ|ج|س)/,
short:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/,
abbreviated:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/,
wide:/^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ح/,
/^ن/,
/^ث/,
/^ر/,
/^خ/,
/^ج/,
/^س/],

any:[
/أحد/,
/اثنين/,
/ثلاثاء/,
/أربعاء/,
/خميس/,
/جمعة/,
/سبت/]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ص|م|ن|ظ|في الصباح|بعد الظهر|في المساء|في الليل)/,
abbreviated:/^(ص|م|نصف الليل|ظهراً|في الصباح|بعد الظهر|في المساء|في الليل)/,
wide:/^(ص|م|نصف الليل|في الصباح|ظهراً|بعد الظهر|في المساء|في الليل)/,
any:/^(ص|م|صباح|ظهر|مساء|ليل)/
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ص/,
pm:/^م/,
midnight:/^ن/,
noon:/^ظ/,
morning:/^ص/,
afternoon:/^بعد/,
evening:/^م/,
night:/^ل/
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ar-MA/_lib/formatDistance.js
var formatDistanceLocale$79={
lessThanXSeconds:{
one:"أقل من ثانية واحدة",
two:"أقل من ثانتين",
threeToTen:"أقل من {{count}} ثواني",
other:"أقل من {{count}} ثانية"
},
xSeconds:{
one:"ثانية واحدة",
two:"ثانتين",
threeToTen:"{{count}} ثواني",
other:"{{count}} ثانية"
},
halfAMinute:"نصف دقيقة",
lessThanXMinutes:{
one:"أقل من دقيقة",
two:"أقل من دقيقتين",
threeToTen:"أقل من {{count}} دقائق",
other:"أقل من {{count}} دقيقة"
},
xMinutes:{
one:"دقيقة واحدة",
two:"دقيقتين",
threeToTen:"{{count}} دقائق",
other:"{{count}} دقيقة"
},
aboutXHours:{
one:"ساعة واحدة تقريباً",
two:"ساعتين تقريباً",
threeToTen:"{{count}} ساعات تقريباً",
other:"{{count}} ساعة تقريباً"
},
xHours:{
one:"ساعة واحدة",
two:"ساعتين",
threeToTen:"{{count}} ساعات",
other:"{{count}} ساعة"
},
xDays:{
one:"يوم واحد",
two:"يومين",
threeToTen:"{{count}} أيام",
other:"{{count}} يوم"
},
aboutXWeeks:{
one:"أسبوع واحد تقريباً",
two:"أسبوعين تقريباً",
threeToTen:"{{count}} أسابيع تقريباً",
other:"{{count}} أسبوع تقريباً"
},
xWeeks:{
one:"أسبوع واحد",
two:"أسبوعين",
threeToTen:"{{count}} أسابيع",
other:"{{count}} أسبوع"
},
aboutXMonths:{
one:"شهر واحد تقريباً",
two:"شهرين تقريباً",
threeToTen:"{{count}} أشهر تقريباً",
other:"{{count}} شهر تقريباً"
},
xMonths:{
one:"شهر واحد",
two:"شهرين",
threeToTen:"{{count}} أشهر",
other:"{{count}} شهر"
},
aboutXYears:{
one:"عام واحد تقريباً",
two:"عامين تقريباً",
threeToTen:"{{count}} أعوام تقريباً",
other:"{{count}} عام تقريباً"
},
xYears:{
one:"عام واحد",
two:"عامين",
threeToTen:"{{count}} أعوام",
other:"{{count}} عام"
},
overXYears:{
one:"أكثر من عام",
two:"أكثر من عامين",
threeToTen:"أكثر من {{count}} أعوام",
other:"أكثر من {{count}} عام"
},
almostXYears:{
one:"عام واحد تقريباً",
two:"عامين تقريباً",
threeToTen:"{{count}} أعوام تقريباً",
other:"{{count}} عام تقريباً"
}
};
var formatDistance$80=function formatDistance$80(token,count,options){
options=options||{};
var usageGroup=formatDistanceLocale$79[token];
var result;
if(typeof usageGroup==="string")result=usageGroup;else
if(count===1)result=usageGroup.one;else
if(count===2)result=usageGroup.two;else
if(count<=10)result=usageGroup.threeToTen.replace("{{count}}",String(count));else
result=usageGroup.other.replace("{{count}}",String(count));
if(options.addSuffix)if(options.comparison&&options.comparison>0)return"في خلال "+result;else
return"منذ "+result;
return result;
};
var formatLong$88={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'عند' {{time}}",
long:"{{date}} 'عند' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ar-MA/_lib/formatRelative.js
var formatRelativeLocale$80={
lastWeek:"'أخر' eeee 'عند' p",
yesterday:"'أمس عند' p",
today:"'اليوم عند' p",
tomorrow:"'غداً عند' p",
nextWeek:"eeee 'عند' p",
other:"P"
};
var formatRelative$80=function formatRelative$80(token,_date,_baseDate,_options){
return formatRelativeLocale$80[token];
};
//#endregion
//#region dist/date-fns/locale/ar-MA/_lib/localize.js
var eraValues$80={
narrow:["ق","ب"],
abbreviated:["ق.م.","ب.م."],
wide:["قبل الميلاد","بعد الميلاد"]
};
var quarterValues$80={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ر1",
"ر2",
"ر3",
"ر4"],

wide:[
"الربع الأول",
"الربع الثاني",
"الربع الثالث",
"الربع الرابع"]

};
var monthValues$80={
narrow:[
"ي",
"ف",
"م",
"أ",
"م",
"ي",
"ي",
"غ",
"ش",
"أ",
"ن",
"د"],

abbreviated:[
"ينا",
"فبر",
"مارس",
"أبريل",
"ماي",
"يونـ",
"يولـ",
"غشت",
"شتنـ",
"أكتـ",
"نونـ",
"دجنـ"],

wide:[
"يناير",
"فبراير",
"مارس",
"أبريل",
"ماي",
"يونيو",
"يوليوز",
"غشت",
"شتنبر",
"أكتوبر",
"نونبر",
"دجنبر"]

};
var dayValues$80={
narrow:[
"ح",
"ن",
"ث",
"ر",
"خ",
"ج",
"س"],

short:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

abbreviated:[
"أحد",
"اثنـ",
"ثلا",
"أربـ",
"خميـ",
"جمعة",
"سبت"],

wide:[
"الأحد",
"الإثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"]

};
var dayPeriodValues$80={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
}
};
var formattingDayPeriodValues$64={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"في الصباح",
afternoon:"بعد الظـهر",
evening:"في المساء",
night:"في الليل"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"في الصباح",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظـهر",
evening:"في المساء",
night:"في الليل"
}
};
var ordinalNumber$80=function ordinalNumber$80(dirtyNumber){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ar-MA.js
/**
* @category Locales
* @summary Arabic locale (Moroccan Arabic).
* @language Moroccan Arabic
* @iso-639-2 ara
* @author Achraf Rrami [@rramiachraf](https://github.com/rramiachraf)
*/
var _arMA={
code:"ar-MA",
formatDistance:formatDistance$80,
formatLong:formatLong$88,
formatRelative:formatRelative$80,
localize:{
ordinalNumber:ordinalNumber$80,
era:buildLocalizeFn({
values:eraValues$80,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$80,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return Number(quarter)-1;}
}),
month:buildLocalizeFn({
values:monthValues$80,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$80,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$80,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$64,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ق|ب)/i,
abbreviated:/^(ق\.?\s?م\.?|ق\.?\s?م\.?\s?|a\.?\s?d\.?|c\.?\s?)/i,
wide:/^(قبل الميلاد|قبل الميلاد|بعد الميلاد|بعد الميلاد)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^قبل/i,/^بعد/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ر[1234]/i,
wide:/^الربع [1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return Number(index)+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[يفمأمسند]/i,
abbreviated:/^(ين|ف|مار|أب|ماي|يون|يول|غش|شت|أك|ن|د)/i,
wide:/^(ين|ف|مار|أب|ماي|يون|يول|غش|شت|أك|ن|د)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ي/i,
/^ف/i,
/^م/i,
/^أ/i,
/^م/i,
/^ي/i,
/^ي/i,
/^غ/i,
/^ش/i,
/^أ/i,
/^ن/i,
/^د/i],

any:[
/^ين/i,
/^فب/i,
/^مار/i,
/^أب/i,
/^ماي/i,
/^يون/i,
/^يول/i,
/^غشت/i,
/^ش/i,
/^أك/i,
/^ن/i,
/^د/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[حنثرخجس]/i,
short:/^(أحد|إثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
abbreviated:/^(أحد|إثن|ثلا|أرب|خمي|جمعة|سبت)/i,
wide:/^(الأحد|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ح/i,
/^ن/i,
/^ث/i,
/^ر/i,
/^خ/i,
/^ج/i,
/^س/i],

wide:[
/^الأحد/i,
/^الإثنين/i,
/^الثلاثاء/i,
/^الأربعاء/i,
/^الخميس/i,
/^الجمعة/i,
/^السبت/i],

any:[
/^أح/i,
/^إث/i,
/^ث/i,
/^أر/i,
/^خ/i,
/^ج/i,
/^س/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mi/i,
noon:/^no/i,
morning:/morning/i,
afternoon:/afternoon/i,
evening:/evening/i,
night:/night/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ar-SA/_lib/formatDistance.js
var formatDistanceLocale$78={
lessThanXSeconds:{
one:"أقل من ثانية واحدة",
two:"أقل من ثانتين",
threeToTen:"أقل من {{count}} ثواني",
other:"أقل من {{count}} ثانية"
},
xSeconds:{
one:"ثانية واحدة",
two:"ثانتين",
threeToTen:"{{count}} ثواني",
other:"{{count}} ثانية"
},
halfAMinute:"نصف دقيقة",
lessThanXMinutes:{
one:"أقل من دقيقة",
two:"أقل من دقيقتين",
threeToTen:"أقل من {{count}} دقائق",
other:"أقل من {{count}} دقيقة"
},
xMinutes:{
one:"دقيقة واحدة",
two:"دقيقتين",
threeToTen:"{{count}} دقائق",
other:"{{count}} دقيقة"
},
aboutXHours:{
one:"ساعة واحدة تقريباً",
two:"ساعتين تقريباً",
threeToTen:"{{count}} ساعات تقريباً",
other:"{{count}} ساعة تقريباً"
},
xHours:{
one:"ساعة واحدة",
two:"ساعتين",
threeToTen:"{{count}} ساعات",
other:"{{count}} ساعة"
},
xDays:{
one:"يوم واحد",
two:"يومين",
threeToTen:"{{count}} أيام",
other:"{{count}} يوم"
},
aboutXWeeks:{
one:"أسبوع واحد تقريباً",
two:"أسبوعين تقريباً",
threeToTen:"{{count}} أسابيع تقريباً",
other:"{{count}} أسبوع تقريباً"
},
xWeeks:{
one:"أسبوع واحد",
two:"أسبوعين",
threeToTen:"{{count}} أسابيع",
other:"{{count}} أسبوع"
},
aboutXMonths:{
one:"شهر واحد تقريباً",
two:"شهرين تقريباً",
threeToTen:"{{count}} أشهر تقريباً",
other:"{{count}} شهر تقريباً"
},
xMonths:{
one:"شهر واحد",
two:"شهرين",
threeToTen:"{{count}} أشهر",
other:"{{count}} شهر"
},
aboutXYears:{
one:"عام واحد تقريباً",
two:"عامين تقريباً",
threeToTen:"{{count}} أعوام تقريباً",
other:"{{count}} عام تقريباً"
},
xYears:{
one:"عام واحد",
two:"عامين",
threeToTen:"{{count}} أعوام",
other:"{{count}} عام"
},
overXYears:{
one:"أكثر من عام",
two:"أكثر من عامين",
threeToTen:"أكثر من {{count}} أعوام",
other:"أكثر من {{count}} عام"
},
almostXYears:{
one:"عام واحد تقريباً",
two:"عامين تقريباً",
threeToTen:"{{count}} أعوام تقريباً",
other:"{{count}} عام تقريباً"
}
};
var formatDistance$79=function formatDistance$79(token,count,options){
var result;
var tokenValue=formatDistanceLocale$78[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===2)result=tokenValue.two;else
if(count<=10)result=tokenValue.threeToTen.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"في خلال "+result;else
return"منذ "+result;
return result;
};
var formatLong$87={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'عند' {{time}}",
long:"{{date}} 'عند' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ar-SA/_lib/formatRelative.js
var formatRelativeLocale$79={
lastWeek:"'أخر' eeee 'عند' p",
yesterday:"'أمس عند' p",
today:"'اليوم عند' p",
tomorrow:"'غداً عند' p",
nextWeek:"eeee 'عند' p",
other:"P"
};
var formatRelative$79=function formatRelative$79(token,_date,_baseDate,_options){return formatRelativeLocale$79[token];};
//#endregion
//#region dist/date-fns/locale/ar-SA/_lib/localize.js
var eraValues$79={
narrow:["ق","ب"],
abbreviated:["ق.م.","ب.م."],
wide:["قبل الميلاد","بعد الميلاد"]
};
var quarterValues$79={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ر1",
"ر2",
"ر3",
"ر4"],

wide:[
"الربع الأول",
"الربع الثاني",
"الربع الثالث",
"الربع الرابع"]

};
var monthValues$79={
narrow:[
"ي",
"ف",
"م",
"أ",
"م",
"ي",
"ي",
"أ",
"س",
"أ",
"ن",
"د"],

abbreviated:[
"ينا",
"فبر",
"مارس",
"أبريل",
"مايو",
"يونـ",
"يولـ",
"أغسـ",
"سبتـ",
"أكتـ",
"نوفـ",
"ديسـ"],

wide:[
"يناير",
"فبراير",
"مارس",
"أبريل",
"مايو",
"يونيو",
"يوليو",
"أغسطس",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"]

};
var dayValues$79={
narrow:[
"ح",
"ن",
"ث",
"ر",
"خ",
"ج",
"س"],

short:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

abbreviated:[
"أحد",
"اثنـ",
"ثلا",
"أربـ",
"خميـ",
"جمعة",
"سبت"],

wide:[
"الأحد",
"الاثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"]

};
var dayPeriodValues$79={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظهر",
evening:"مساءاً",
night:"ليلاً"
}
};
var formattingDayPeriodValues$63={
narrow:{
am:"ص",
pm:"م",
midnight:"ن",
noon:"ظ",
morning:"في الصباح",
afternoon:"بعد الظـهر",
evening:"في المساء",
night:"في الليل"
},
abbreviated:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"في الصباح",
afternoon:"بعد الظهر",
evening:"في المساء",
night:"في الليل"
},
wide:{
am:"ص",
pm:"م",
midnight:"نصف الليل",
noon:"ظهر",
morning:"صباحاً",
afternoon:"بعد الظـهر",
evening:"في المساء",
night:"في الليل"
}
};
var ordinalNumber$79=function ordinalNumber$79(dirtyNumber){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ar-SA.js
/**
* @category Locales
* @summary Arabic locale (Sauid Arabic).
* @language Arabic
* @iso-639-2 ara
* @author Dhaifallah Alwadani [@dalwadani](https://github.com/dalwadani)
*/
var _arSA={
code:"ar-SA",
formatDistance:formatDistance$79,
formatLong:formatLong$87,
formatRelative:formatRelative$79,
localize:{
ordinalNumber:ordinalNumber$79,
era:buildLocalizeFn({
values:eraValues$79,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$79,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$79,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$79,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$79,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$63,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ق|ب)/i,
abbreviated:/^(ق\.?\s?م\.?|ق\.?\s?م\.?\s?|a\.?\s?d\.?|c\.?\s?)/i,
wide:/^(قبل الميلاد|قبل الميلاد|بعد الميلاد|بعد الميلاد)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^قبل/i,/^بعد/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ر[1234]/i,
wide:/^الربع [1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[يفمأمسند]/i,
abbreviated:/^(ين|ف|مار|أب|ماي|يون|يول|أغ|س|أك|ن|د)/i,
wide:/^(ين|ف|مار|أب|ماي|يون|يول|أغ|س|أك|ن|د)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ي/i,
/^ف/i,
/^م/i,
/^أ/i,
/^م/i,
/^ي/i,
/^ي/i,
/^أ/i,
/^س/i,
/^أ/i,
/^ن/i,
/^د/i],

any:[
/^ين/i,
/^ف/i,
/^مار/i,
/^أب/i,
/^ماي/i,
/^يون/i,
/^يول/i,
/^أغ/i,
/^س/i,
/^أك/i,
/^ن/i,
/^د/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[حنثرخجس]/i,
short:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
abbreviated:/^(أحد|اثن|ثلا|أرب|خمي|جمعة|سبت)/i,
wide:/^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ح/i,
/^ن/i,
/^ث/i,
/^ر/i,
/^خ/i,
/^ج/i,
/^س/i],

wide:[
/^الأحد/i,
/^الاثنين/i,
/^الثلاثاء/i,
/^الأربعاء/i,
/^الخميس/i,
/^الجمعة/i,
/^السبت/i],

any:[
/^أح/i,
/^اث/i,
/^ث/i,
/^أر/i,
/^خ/i,
/^ج/i,
/^س/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mi/i,
noon:/^no/i,
morning:/morning/i,
afternoon:/afternoon/i,
evening:/evening/i,
night:/night/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ar-TN/_lib/formatDistance.js
var formatDistanceLocale$77={
lessThanXSeconds:{
one:"أقل من ثانية",
two:"أقل من زوز ثواني",
threeToTen:"أقل من {{count}} ثواني",
other:"أقل من {{count}} ثانية"
},
xSeconds:{
one:"ثانية",
two:"زوز ثواني",
threeToTen:"{{count}} ثواني",
other:"{{count}} ثانية"
},
halfAMinute:"نص دقيقة",
lessThanXMinutes:{
one:"أقل من دقيقة",
two:"أقل من دقيقتين",
threeToTen:"أقل من {{count}} دقايق",
other:"أقل من {{count}} دقيقة"
},
xMinutes:{
one:"دقيقة",
two:"دقيقتين",
threeToTen:"{{count}} دقايق",
other:"{{count}} دقيقة"
},
aboutXHours:{
one:"ساعة تقريب",
two:"ساعتين تقريب",
threeToTen:"{{count}} سوايع تقريب",
other:"{{count}} ساعة تقريب"
},
xHours:{
one:"ساعة",
two:"ساعتين",
threeToTen:"{{count}} سوايع",
other:"{{count}} ساعة"
},
xDays:{
one:"نهار",
two:"نهارين",
threeToTen:"{{count}} أيام",
other:"{{count}} يوم"
},
aboutXWeeks:{
one:"جمعة تقريب",
two:"جمعتين تقريب",
threeToTen:"{{count}} جماع تقريب",
other:"{{count}} جمعة تقريب"
},
xWeeks:{
one:"جمعة",
two:"جمعتين",
threeToTen:"{{count}} جماع",
other:"{{count}} جمعة"
},
aboutXMonths:{
one:"شهر تقريب",
two:"شهرين تقريب",
threeToTen:"{{count}} أشهرة تقريب",
other:"{{count}} شهر تقريب"
},
xMonths:{
one:"شهر",
two:"شهرين",
threeToTen:"{{count}} أشهرة",
other:"{{count}} شهر"
},
aboutXYears:{
one:"عام تقريب",
two:"عامين تقريب",
threeToTen:"{{count}} أعوام تقريب",
other:"{{count}} عام تقريب"
},
xYears:{
one:"عام",
two:"عامين",
threeToTen:"{{count}} أعوام",
other:"{{count}} عام"
},
overXYears:{
one:"أكثر من عام",
two:"أكثر من عامين",
threeToTen:"أكثر من {{count}} أعوام",
other:"أكثر من {{count}} عام"
},
almostXYears:{
one:"عام تقريب",
two:"عامين تقريب",
threeToTen:"{{count}} أعوام تقريب",
other:"{{count}} عام تقريب"
}
};
var formatDistance$78=function formatDistance$78(token,count,options){
var usageGroup=formatDistanceLocale$77[token];
var result;
if(typeof usageGroup==="string")result=usageGroup;else
if(count===1)result=usageGroup.one;else
if(count===2)result=usageGroup.two;else
if(count<=10)result=usageGroup.threeToTen.replace("{{count}}",String(count));else
result=usageGroup.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"في "+result;else
return"عندو "+result;
return result;
};
var formatLong$86={
date:buildFormatLongFn({
formats:{
full:"EEEE، do MMMM y",
long:"do MMMM y",
medium:"d MMM y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss",
long:"HH:mm:ss",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'مع' {{time}}",
long:"{{date}} 'مع' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ar-TN/_lib/formatRelative.js
var formatRelativeLocale$78={
lastWeek:"eeee 'إلي فات مع' p",
yesterday:"'البارح مع' p",
today:"'اليوم مع' p",
tomorrow:"'غدوة مع' p",
nextWeek:"eeee 'الجمعة الجاية مع' p 'نهار'",
other:"P"
};
var formatRelative$78=function formatRelative$78(token){return formatRelativeLocale$78[token];};
//#endregion
//#region dist/date-fns/locale/ar-TN/_lib/localize.js
var eraValues$78={
narrow:["ق","ب"],
abbreviated:["ق.م.","ب.م."],
wide:["قبل الميلاد","بعد الميلاد"]
};
var quarterValues$78={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ر1",
"ر2",
"ر3",
"ر4"],

wide:[
"الربع الأول",
"الربع الثاني",
"الربع الثالث",
"الربع الرابع"]

};
var monthValues$78={
narrow:[
"د",
"ن",
"أ",
"س",
"أ",
"ج",
"ج",
"م",
"أ",
"م",
"ف",
"ج"],

abbreviated:[
"جانفي",
"فيفري",
"مارس",
"أفريل",
"ماي",
"جوان",
"جويلية",
"أوت",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"],

wide:[
"جانفي",
"فيفري",
"مارس",
"أفريل",
"ماي",
"جوان",
"جويلية",
"أوت",
"سبتمبر",
"أكتوبر",
"نوفمبر",
"ديسمبر"]

};
var dayValues$78={
narrow:[
"ح",
"ن",
"ث",
"ر",
"خ",
"ج",
"س"],

short:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

abbreviated:[
"أحد",
"اثنين",
"ثلاثاء",
"أربعاء",
"خميس",
"جمعة",
"سبت"],

wide:[
"الأحد",
"الاثنين",
"الثلاثاء",
"الأربعاء",
"الخميس",
"الجمعة",
"السبت"]

};
var dayPeriodValues$78={
narrow:{
am:"ص",
pm:"ع",
morning:"الصباح",
noon:"القايلة",
afternoon:"بعد القايلة",
evening:"العشية",
night:"الليل",
midnight:"نص الليل"
},
abbreviated:{
am:"ص",
pm:"ع",
morning:"الصباح",
noon:"القايلة",
afternoon:"بعد القايلة",
evening:"العشية",
night:"الليل",
midnight:"نص الليل"
},
wide:{
am:"ص",
pm:"ع",
morning:"الصباح",
noon:"القايلة",
afternoon:"بعد القايلة",
evening:"العشية",
night:"الليل",
midnight:"نص الليل"
}
};
var formattingDayPeriodValues$62={
narrow:{
am:"ص",
pm:"ع",
morning:"في الصباح",
noon:"في القايلة",
afternoon:"بعد القايلة",
evening:"في العشية",
night:"في الليل",
midnight:"نص الليل"
},
abbreviated:{
am:"ص",
pm:"ع",
morning:"في الصباح",
noon:"في القايلة",
afternoon:"بعد القايلة",
evening:"في العشية",
night:"في الليل",
midnight:"نص الليل"
},
wide:{
am:"ص",
pm:"ع",
morning:"في الصباح",
noon:"في القايلة",
afternoon:"بعد القايلة",
evening:"في العشية",
night:"في الليل",
midnight:"نص الليل"
}
};
var ordinalNumber$78=function ordinalNumber$78(num){return String(num);};
//#endregion
//#region dist/date-fns/locale/ar-TN.js
/**
* @category Locales
* @summary Arabic locale (Tunisian Arabic).
* @language Arabic
* @iso-639-2 ara
* @author Koussay Haj Kacem [@essana3](https://github.com/essana3)
*/
var _arTN={
code:"ar-TN",
formatDistance:formatDistance$78,
formatLong:formatLong$86,
formatRelative:formatRelative$78,
localize:{
ordinalNumber:ordinalNumber$78,
era:buildLocalizeFn({
values:eraValues$78,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$78,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$78,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$78,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$78,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$62,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/[قب]/,
abbreviated:/[قب]\.م\./,
wide:/(قبل|بعد) الميلاد/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/قبل/,/بعد/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/ر[1234]/,
wide:/الربع (الأول|الثاني|الثالث|الرابع)/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[جفمأسند]/,
abbreviated:/^(جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/,
wide:/^(جانفي|فيفري|مارس|أفريل|ماي|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ج/i,
/^ف/i,
/^م/i,
/^أ/i,
/^م/i,
/^ج/i,
/^ج/i,
/^أ/i,
/^س/i,
/^أ/i,
/^ن/i,
/^د/i],

any:[
/^جانفي/i,
/^فيفري/i,
/^مارس/i,
/^أفريل/i,
/^ماي/i,
/^جوان/i,
/^جويلية/i,
/^أوت/i,
/^سبتمبر/i,
/^أكتوبر/i,
/^نوفمبر/i,
/^ديسمبر/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[حنثرخجس]/i,
short:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
abbreviated:/^(أحد|اثنين|ثلاثاء|أربعاء|خميس|جمعة|سبت)/i,
wide:/^(الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ح/i,
/^ن/i,
/^ث/i,
/^ر/i,
/^خ/i,
/^ج/i,
/^س/i],

wide:[
/^الأحد/i,
/^الاثنين/i,
/^الثلاثاء/i,
/^الأربعاء/i,
/^الخميس/i,
/^الجمعة/i,
/^السبت/i],

any:[
/^أح/i,
/^اث/i,
/^ث/i,
/^أر/i,
/^خ/i,
/^ج/i,
/^س/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ص|ع|ن ل|ل|(في|مع) (صباح|قايلة|عشية|ليل))/,
any:/^([صع]|نص الليل|قايلة|(في|مع) (صباح|قايلة|عشية|ليل))/
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ص/,
pm:/^ع/,
midnight:/نص الليل/,
noon:/قايلة/,
afternoon:/بعد القايلة/,
morning:/صباح/,
evening:/عشية/,
night:/ليل/
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/az/_lib/formatDistance.js
var formatDistanceLocale$76={
lessThanXSeconds:{
one:"bir saniyədən az",
other:"{{count}} bir saniyədən az"
},
xSeconds:{
one:"1 saniyə",
other:"{{count}} saniyə"
},
halfAMinute:"yarım dəqiqə",
lessThanXMinutes:{
one:"bir dəqiqədən az",
other:"{{count}} bir dəqiqədən az"
},
xMinutes:{
one:"bir dəqiqə",
other:"{{count}} dəqiqə"
},
aboutXHours:{
one:"təxminən 1 saat",
other:"təxminən {{count}} saat"
},
xHours:{
one:"1 saat",
other:"{{count}} saat"
},
xDays:{
one:"1 gün",
other:"{{count}} gün"
},
aboutXWeeks:{
one:"təxminən 1 həftə",
other:"təxminən {{count}} həftə"
},
xWeeks:{
one:"1 həftə",
other:"{{count}} həftə"
},
aboutXMonths:{
one:"təxminən 1 ay",
other:"təxminən {{count}} ay"
},
xMonths:{
one:"1 ay",
other:"{{count}} ay"
},
aboutXYears:{
one:"təxminən 1 il",
other:"təxminən {{count}} il"
},
xYears:{
one:"1 il",
other:"{{count}} il"
},
overXYears:{
one:"1 ildən çox",
other:"{{count}} ildən çox"
},
almostXYears:{
one:"demək olar ki 1 il",
other:"demək olar ki {{count}} il"
}
};
var formatDistance$77=function formatDistance$77(token,count,options){
var result;
var tokenValue=formatDistanceLocale$76[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" sonra";else
return result+" əvvəl";
return result;
};
var formatLong$85={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y 'il'",
long:"do MMMM y 'il'",
medium:"d MMM y 'il'",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}} - 'də'",
long:"{{date}} {{time}} - 'də'",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/az/_lib/formatRelative.js
var formatRelativeLocale$77={
lastWeek:"'sonuncu' eeee p -'də'",
yesterday:"'dünən' p -'də'",
today:"'bugün' p -'də'",
tomorrow:"'sabah' p -'də'",
nextWeek:"eeee p -'də'",
other:"P"
};
var formatRelative$77=function formatRelative$77(token,_date,_baseDate,_options){return formatRelativeLocale$77[token];};
//#endregion
//#region dist/date-fns/locale/az/_lib/localize.js
var eraValues$77={
narrow:["e.ə","b.e"],
abbreviated:["e.ə","b.e"],
wide:["eramızdan əvvəl","bizim era"]
};
var quarterValues$77={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1ci kvartal",
"2ci kvartal",
"3cü kvartal",
"4cü kvartal"]

};
var monthValues$77={
narrow:[
"Y",
"F",
"M",
"A",
"M",
"İ",
"İ",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Yan",
"Fev",
"Mar",
"Apr",
"May",
"İyun",
"İyul",
"Avq",
"Sen",
"Okt",
"Noy",
"Dek"],

wide:[
"Yanvar",
"Fevral",
"Mart",
"Aprel",
"May",
"İyun",
"İyul",
"Avqust",
"Sentyabr",
"Oktyabr",
"Noyabr",
"Dekabr"]

};
var dayValues$77={
narrow:[
"B.",
"B.e",
"Ç.a",
"Ç.",
"C.a",
"C.",
"Ş."],

short:[
"B.",
"B.e",
"Ç.a",
"Ç.",
"C.a",
"C.",
"Ş."],

abbreviated:[
"Baz",
"Baz.e",
"Çər.a",
"Çər",
"Cüm.a",
"Cüm",
"Şə"],

wide:[
"Bazar",
"Bazar ertəsi",
"Çərşənbə axşamı",
"Çərşənbə",
"Cümə axşamı",
"Cümə",
"Şənbə"]

};
var dayPeriodValues$77={
narrow:{
am:"am",
pm:"pm",
midnight:"gecəyarı",
noon:"gün",
morning:"səhər",
afternoon:"gündüz",
evening:"axşam",
night:"gecə"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"gecəyarı",
noon:"gün",
morning:"səhər",
afternoon:"gündüz",
evening:"axşam",
night:"gecə"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"gecəyarı",
noon:"gün",
morning:"səhər",
afternoon:"gündüz",
evening:"axşam",
night:"gecə"
}
};
var formattingDayPeriodValues$61={
narrow:{
am:"a",
pm:"p",
midnight:"gecəyarı",
noon:"gün",
morning:"səhər",
afternoon:"gündüz",
evening:"axşam",
night:"gecə"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"gecəyarı",
noon:"gün",
morning:"səhər",
afternoon:"gündüz",
evening:"axşam",
night:"gecə"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"gecəyarı",
noon:"gün",
morning:"səhər",
afternoon:"gündüz",
evening:"axşam",
night:"gecə"
}
};
var suffixes$1={
1:"-inci",
5:"-inci",
8:"-inci",
70:"-inci",
80:"-inci",
2:"-nci",
7:"-nci",
20:"-nci",
50:"-nci",
3:"-üncü",
4:"-üncü",
100:"-üncü",
6:"-ncı",
9:"-uncu",
10:"-uncu",
30:"-uncu",
60:"-ıncı",
90:"-ıncı"
};
var getSuffix=function getSuffix(number){
if(number===0)return number+"-ıncı";
var a=number%10;
var b=number%100-a;
var c=number>=100?100:null;
if(suffixes$1[a])return suffixes$1[a];else
if(suffixes$1[b])return suffixes$1[b];else
if(c!==null)return suffixes$1[c];
return"";
};
var ordinalNumber$77=function ordinalNumber$77(dirtyNumber,_options){
var number=Number(dirtyNumber);
return number+getSuffix(number);
};
//#endregion
//#region dist/date-fns/locale/az.js
/**
* @category Locales
* @summary Azerbaijani locale.
* @language Azerbaijani
* @iso-639-2 aze
*/
var _az={
code:"az",
formatDistance:formatDistance$77,
formatLong:formatLong$85,
formatRelative:formatRelative$77,
localize:{
ordinalNumber:ordinalNumber$77,
era:buildLocalizeFn({
values:eraValues$77,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$77,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$77,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$77,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$77,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$61,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?(ci|inci|nci|uncu|üncü|ncı))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(b|a)$/i,
abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)$/i,
wide:/^(bizim eradan əvvəl|bizim era)$/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^b$/i,/^(a|c)$/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]$/i,
abbreviated:/^K[1234]$/i,
wide:/^[1234](ci)? kvartal$/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[(?-i)yfmaisond]$/i,
abbreviated:/^(Yan|Fev|Mar|Apr|May|İyun|İyul|Avq|Sen|Okt|Noy|Dek)$/i,
wide:/^(Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avgust|Sentyabr|Oktyabr|Noyabr|Dekabr)$/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^[(?-i)y]$/i,
/^[(?-i)f]$/i,
/^[(?-i)m]$/i,
/^[(?-i)a]$/i,
/^[(?-i)m]$/i,
/^[(?-i)i]$/i,
/^[(?-i)i]$/i,
/^[(?-i)a]$/i,
/^[(?-i)s]$/i,
/^[(?-i)o]$/i,
/^[(?-i)n]$/i,
/^[(?-i)d]$/i],

abbreviated:[
/^Yan$/i,
/^Fev$/i,
/^Mar$/i,
/^Apr$/i,
/^May$/i,
/^İyun$/i,
/^İyul$/i,
/^Avg$/i,
/^Sen$/i,
/^Okt$/i,
/^Noy$/i,
/^Dek$/i],

wide:[
/^Yanvar$/i,
/^Fevral$/i,
/^Mart$/i,
/^Aprel$/i,
/^May$/i,
/^İyun$/i,
/^İyul$/i,
/^Avgust$/i,
/^Sentyabr$/i,
/^Oktyabr$/i,
/^Noyabr$/i,
/^Dekabr$/i]

},
defaultParseWidth:"narrow"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(B\.|B\.e|Ç\.a|Ç\.|C\.a|C\.|Ş\.)$/i,
short:/^(B\.|B\.e|Ç\.a|Ç\.|C\.a|C\.|Ş\.)$/i,
abbreviated:/^(Baz\.e|Çər|Çər\.a|Cüm|Cüm\.a|Şə)$/i,
wide:/^(Bazar|Bazar ertəsi|Çərşənbə axşamı|Çərşənbə|Cümə axşamı|Cümə|Şənbə)$/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^B\.$/i,
/^B\.e$/i,
/^Ç\.a$/i,
/^Ç\.$/i,
/^C\.a$/i,
/^C\.$/i,
/^Ş\.$/i],

abbreviated:[
/^Baz$/i,
/^Baz\.e$/i,
/^Çər\.a$/i,
/^Çər$/i,
/^Cüm\.a$/i,
/^Cüm$/i,
/^Şə$/i],

wide:[
/^Bazar$/i,
/^Bazar ertəsi$/i,
/^Çərşənbə axşamı$/i,
/^Çərşənbə$/i,
/^Cümə axşamı$/i,
/^Cümə$/i,
/^Şənbə$/i],

any:[
/^B\.$/i,
/^B\.e$/i,
/^Ç\.a$/i,
/^Ç\.$/i,
/^C\.a$/i,
/^C\.$/i,
/^Ş\.$/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|gecəyarı|gün|səhər|gündüz|axşam|gecə)$/i,
any:/^(am|pm|a\.m\.|p\.m\.|AM|PM|gecəyarı|gün|səhər|gündüz|axşam|gecə)$/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a$/i,
pm:/^p$/i,
midnight:/^gecəyarı$/i,
noon:/^gün$/i,
morning:/səhər$/i,
afternoon:/gündüz$/i,
evening:/axşam$/i,
night:/gecə$/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/be/_lib/formatDistance.js
function declension$6(scheme,count){
if(scheme.one!==void 0&&count===1)return scheme.one;
var rem10=count%10;
var rem100=count%100;
if(rem10===1&&rem100!==11)return scheme.singularNominative.replace("{{count}}",String(count));else
if(rem10>=2&&rem10<=4&&(rem100<10||rem100>20))return scheme.singularGenitive.replace("{{count}}",String(count));else
return scheme.pluralGenitive.replace("{{count}}",String(count));
}
function buildLocalizeTokenFn$4(scheme){
return function(count,options){
if(options&&options.addSuffix){if(options.comparison&&options.comparison>0){if(scheme.future)return declension$6(scheme.future,count);else
return"праз "+declension$6(scheme.regular,count);}else
if(scheme.past)return declension$6(scheme.past,count);else
return declension$6(scheme.regular,count)+" таму";}else
return declension$6(scheme.regular,count);
};
}
var halfAMinute$1=function halfAMinute$1(_,options){
if(options&&options.addSuffix)if(options.comparison&&options.comparison>0)return"праз паўхвіліны";else
return"паўхвіліны таму";
return"паўхвіліны";
};
var formatDistanceLocale$75={
lessThanXSeconds:buildLocalizeTokenFn$4({
regular:{
one:"менш за секунду",
singularNominative:"менш за {{count}} секунду",
singularGenitive:"менш за {{count}} секунды",
pluralGenitive:"менш за {{count}} секунд"
},
future:{
one:"менш, чым праз секунду",
singularNominative:"менш, чым праз {{count}} секунду",
singularGenitive:"менш, чым праз {{count}} секунды",
pluralGenitive:"менш, чым праз {{count}} секунд"
}
}),
xSeconds:buildLocalizeTokenFn$4({
regular:{
singularNominative:"{{count}} секунда",
singularGenitive:"{{count}} секунды",
pluralGenitive:"{{count}} секунд"
},
past:{
singularNominative:"{{count}} секунду таму",
singularGenitive:"{{count}} секунды таму",
pluralGenitive:"{{count}} секунд таму"
},
future:{
singularNominative:"праз {{count}} секунду",
singularGenitive:"праз {{count}} секунды",
pluralGenitive:"праз {{count}} секунд"
}
}),
halfAMinute:halfAMinute$1,
lessThanXMinutes:buildLocalizeTokenFn$4({
regular:{
one:"менш за хвіліну",
singularNominative:"менш за {{count}} хвіліну",
singularGenitive:"менш за {{count}} хвіліны",
pluralGenitive:"менш за {{count}} хвілін"
},
future:{
one:"менш, чым праз хвіліну",
singularNominative:"менш, чым праз {{count}} хвіліну",
singularGenitive:"менш, чым праз {{count}} хвіліны",
pluralGenitive:"менш, чым праз {{count}} хвілін"
}
}),
xMinutes:buildLocalizeTokenFn$4({
regular:{
singularNominative:"{{count}} хвіліна",
singularGenitive:"{{count}} хвіліны",
pluralGenitive:"{{count}} хвілін"
},
past:{
singularNominative:"{{count}} хвіліну таму",
singularGenitive:"{{count}} хвіліны таму",
pluralGenitive:"{{count}} хвілін таму"
},
future:{
singularNominative:"праз {{count}} хвіліну",
singularGenitive:"праз {{count}} хвіліны",
pluralGenitive:"праз {{count}} хвілін"
}
}),
aboutXHours:buildLocalizeTokenFn$4({
regular:{
singularNominative:"каля {{count}} гадзіны",
singularGenitive:"каля {{count}} гадзін",
pluralGenitive:"каля {{count}} гадзін"
},
future:{
singularNominative:"прыблізна праз {{count}} гадзіну",
singularGenitive:"прыблізна праз {{count}} гадзіны",
pluralGenitive:"прыблізна праз {{count}} гадзін"
}
}),
xHours:buildLocalizeTokenFn$4({
regular:{
singularNominative:"{{count}} гадзіна",
singularGenitive:"{{count}} гадзіны",
pluralGenitive:"{{count}} гадзін"
},
past:{
singularNominative:"{{count}} гадзіну таму",
singularGenitive:"{{count}} гадзіны таму",
pluralGenitive:"{{count}} гадзін таму"
},
future:{
singularNominative:"праз {{count}} гадзіну",
singularGenitive:"праз {{count}} гадзіны",
pluralGenitive:"праз {{count}} гадзін"
}
}),
xDays:buildLocalizeTokenFn$4({regular:{
singularNominative:"{{count}} дзень",
singularGenitive:"{{count}} дні",
pluralGenitive:"{{count}} дзён"
}}),
aboutXWeeks:buildLocalizeTokenFn$4({
regular:{
singularNominative:"каля {{count}} тыдні",
singularGenitive:"каля {{count}} тыдняў",
pluralGenitive:"каля {{count}} тыдняў"
},
future:{
singularNominative:"прыблізна праз {{count}} тыдзень",
singularGenitive:"прыблізна праз {{count}} тыдні",
pluralGenitive:"прыблізна праз {{count}} тыдняў"
}
}),
xWeeks:buildLocalizeTokenFn$4({regular:{
singularNominative:"{{count}} тыдзень",
singularGenitive:"{{count}} тыдні",
pluralGenitive:"{{count}} тыдняў"
}}),
aboutXMonths:buildLocalizeTokenFn$4({
regular:{
singularNominative:"каля {{count}} месяца",
singularGenitive:"каля {{count}} месяцаў",
pluralGenitive:"каля {{count}} месяцаў"
},
future:{
singularNominative:"прыблізна праз {{count}} месяц",
singularGenitive:"прыблізна праз {{count}} месяцы",
pluralGenitive:"прыблізна праз {{count}} месяцаў"
}
}),
xMonths:buildLocalizeTokenFn$4({regular:{
singularNominative:"{{count}} месяц",
singularGenitive:"{{count}} месяцы",
pluralGenitive:"{{count}} месяцаў"
}}),
aboutXYears:buildLocalizeTokenFn$4({
regular:{
singularNominative:"каля {{count}} года",
singularGenitive:"каля {{count}} гадоў",
pluralGenitive:"каля {{count}} гадоў"
},
future:{
singularNominative:"прыблізна праз {{count}} год",
singularGenitive:"прыблізна праз {{count}} гады",
pluralGenitive:"прыблізна праз {{count}} гадоў"
}
}),
xYears:buildLocalizeTokenFn$4({regular:{
singularNominative:"{{count}} год",
singularGenitive:"{{count}} гады",
pluralGenitive:"{{count}} гадоў"
}}),
overXYears:buildLocalizeTokenFn$4({
regular:{
singularNominative:"больш за {{count}} год",
singularGenitive:"больш за {{count}} гады",
pluralGenitive:"больш за {{count}} гадоў"
},
future:{
singularNominative:"больш, чым праз {{count}} год",
singularGenitive:"больш, чым праз {{count}} гады",
pluralGenitive:"больш, чым праз {{count}} гадоў"
}
}),
almostXYears:buildLocalizeTokenFn$4({
regular:{
singularNominative:"амаль {{count}} год",
singularGenitive:"амаль {{count}} гады",
pluralGenitive:"амаль {{count}} гадоў"
},
future:{
singularNominative:"амаль праз {{count}} год",
singularGenitive:"амаль праз {{count}} гады",
pluralGenitive:"амаль праз {{count}} гадоў"
}
})
};
var formatDistance$76=function formatDistance$76(token,count,options){
options=options||{};
return formatDistanceLocale$75[token](count,options);
};
var formatLong$84={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM y 'г.'",
long:"d MMMM y 'г.'",
medium:"d MMM y 'г.'",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}}, {{time}}"},
defaultWidth:"any"
})
};
-(Math.pow(10,8)*24*60*60*1e3);
/**
* @constant
* @name constructFromSymbol
* @summary Symbol enabling Date extensions to inherit properties from the reference date.
*
* The symbol is used to enable the `constructFrom` function to construct a date
* using a reference date and a value. It allows to transfer extra properties
* from the reference date to the new date. It's useful for extensions like
* [`TZDate`](https://github.com/date-fns/tz) that accept a time zone as
* a constructor argument.
*/
var constructFromSymbol=Symbol.for("constructDateFrom");
//#endregion
//#region dist/date-fns/constructFrom.js
/**
* @name constructFrom
* @category Generic Helpers
* @summary Constructs a date using the reference date and the value
*
* @description
* The function constructs a new date using the constructor from the reference
* date and the given value. It helps to build generic functions that accept
* date extensions.
*
* It defaults to `Date` if the passed reference date is a number or a string.
*
* Starting from v3.7.0, it allows to construct a date using `[Symbol.for("constructDateFrom")]`
* enabling to transfer extra properties from the reference date to the new date.
* It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
* that accept a time zone as a constructor argument.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
*
* @param date - The reference date to take constructor from
* @param value - The value to create the date
*
* @returns Date initialized using the given date and value
*
* @example
* import { constructFrom } from "./constructFrom/date-fns";
*
* // A function that clones a date preserving the original type
* function cloneDate<DateType extends Date>(date: DateType): DateType {
*   return constructFrom(
*     date, // Use constructor from the given date
*     date.getTime() // Use the date value to create a new date
*   );
* }
*/
function constructFrom(date,value){
if(typeof date==="function")return date(value);
if(date&&_typeof(date)==="object"&&constructFromSymbol in date)return date[constructFromSymbol](value);
if(date instanceof Date)return new date.constructor(value);
return new Date(value);
}
//#endregion
//#region dist/date-fns/_lib/normalizeDates.js
function normalizeDates(context){for(var _len=arguments.length,dates=new Array(_len>1?_len-1:0),_key2=1;_key2<_len;_key2++){dates[_key2-1]=arguments[_key2];}
var normalize=constructFrom.bind(null,context||dates.find(function(date){return _typeof(date)==="object";}));
return dates.map(normalize);
}
//#endregion
//#region dist/date-fns/_lib/defaultOptions.js
var defaultOptions={};
function getDefaultOptions(){
return defaultOptions;
}
//#endregion
//#region dist/date-fns/toDate.js
/**
* @name toDate
* @category Common Helpers
* @summary Convert the given argument to an instance of Date.
*
* @description
* Convert the given argument to an instance of Date.
*
* If the argument is an instance of Date, the function returns its clone.
*
* If the argument is a number, it is treated as a timestamp.
*
* If the argument is none of the above, the function returns Invalid Date.
*
* Starting from v3.7.0, it clones a date using `[Symbol.for("constructDateFrom")]`
* enabling to transfer extra properties from the reference date to the new date.
* It's useful for extensions like [`TZDate`](https://github.com/date-fns/tz)
* that accept a time zone as a constructor argument.
*
* **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param argument - The value to convert
*
* @returns The parsed date in the local time zone
*
* @example
* // Clone the date:
* const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
* //=> Tue Feb 11 2014 11:30:30
*
* @example
* // Convert the timestamp to date:
* const result = toDate(1392098430000)
* //=> Tue Feb 11 2014 11:30:30
*/
function toDate(argument,context){
return constructFrom(context||argument,argument);
}
//#endregion
//#region dist/date-fns/startOfWeek.js
/**
* The {@link startOfWeek} function options.
*/
/**
* @name startOfWeek
* @category Week Helpers
* @summary Return the start of a week for the given date.
*
* @description
* Return the start of a week for the given date.
* The result will be in the local timezone.
*
* @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
* @typeParam ResultDate - The result `Date` type, it is the type returned from the context function if it is passed, or inferred from the arguments.
*
* @param date - The original date
* @param options - An object with options
*
* @returns The start of a week
*
* @example
* // The start of a week for 2 September 2014 11:55:00:
* const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0))
* //=> Sun Aug 31 2014 00:00:00
*
* @example
* // If the week starts on Monday, the start of the week for 2 September 2014 11:55:00:
* const result = startOfWeek(new Date(2014, 8, 2, 11, 55, 0), { weekStartsOn: 1 })
* //=> Mon Sep 01 2014 00:00:00
*/
function startOfWeek(date,options){var _ref,_ref2,_ref3,_options$weekStartsOn,_options$locale,_defaultOptions$local;
var defaultOptions=getDefaultOptions();
var weekStartsOn=(_ref=(_ref2=(_ref3=(_options$weekStartsOn=options===null||options===void 0?void 0:options.weekStartsOn)!==null&&_options$weekStartsOn!==void 0?_options$weekStartsOn:options===null||options===void 0||(_options$locale=options.locale)===null||_options$locale===void 0||(_options$locale=_options$locale.options)===null||_options$locale===void 0?void 0:_options$locale.weekStartsOn)!==null&&_ref3!==void 0?_ref3:defaultOptions.weekStartsOn)!==null&&_ref2!==void 0?_ref2:(_defaultOptions$local=defaultOptions.locale)===null||_defaultOptions$local===void 0||(_defaultOptions$local=_defaultOptions$local.options)===null||_defaultOptions$local===void 0?void 0:_defaultOptions$local.weekStartsOn)!==null&&_ref!==void 0?_ref:0;
var _date=toDate(date,options===null||options===void 0?void 0:options.in);
var day=_date.getDay();
var diff=(day<weekStartsOn?7:0)+day-weekStartsOn;
_date.setDate(_date.getDate()-diff);
_date.setHours(0,0,0,0);
return _date;
}
//#endregion
//#region dist/date-fns/isSameWeek.js
/**
* The {@link isSameWeek} function options.
*/
/**
* @name isSameWeek
* @category Week Helpers
* @summary Are the given dates in the same week (and month and year)?
*
* @description
* Are the given dates in the same week (and month and year)?
*
* @param laterDate - The first date to check
* @param earlierDate - The second date to check
* @param options - An object with options
*
* @returns The dates are in the same week (and month and year)
*
* @example
* // Are 31 August 2014 and 4 September 2014 in the same week?
* const result = isSameWeek(new Date(2014, 7, 31), new Date(2014, 8, 4))
* //=> true
*
* @example
* // If week starts with Monday,
* // are 31 August 2014 and 4 September 2014 in the same week?
* const result = isSameWeek(new Date(2014, 7, 31), new Date(2014, 8, 4), {
*   weekStartsOn: 1
* })
* //=> false
*
* @example
* // Are 1 January 2014 and 1 January 2015 in the same week?
* const result = isSameWeek(new Date(2014, 0, 1), new Date(2015, 0, 1))
* //=> false
*/
function isSameWeek(laterDate,earlierDate,options){
var _normalizeDates=normalizeDates(options===null||options===void 0?void 0:options.in,laterDate,earlierDate),_normalizeDates2=_slicedToArray(_normalizeDates,2),laterDate_=_normalizeDates2[0],earlierDate_=_normalizeDates2[1];
return+startOfWeek(laterDate_,options)===+startOfWeek(earlierDate_,options);
}
//#endregion
//#region dist/date-fns/locale/be/_lib/formatRelative.js
var accusativeWeekdays$7=[
"нядзелю",
"панядзелак",
"аўторак",
"сераду",
"чацвер",
"пятніцу",
"суботу"];

function lastWeek$8(day){
var weekday=accusativeWeekdays$7[day];
switch(day){
case 0:
case 3:
case 5:
case 6:return"'у мінулую "+weekday+" а' p";
case 1:
case 2:
case 4:return"'у мінулы "+weekday+" а' p";
}
}
function thisWeek$8(day){
return"'у "+accusativeWeekdays$7[day]+" а' p";
}
function nextWeek$8(day){
var weekday=accusativeWeekdays$7[day];
switch(day){
case 0:
case 3:
case 5:
case 6:return"'у наступную "+weekday+" а' p";
case 1:
case 2:
case 4:return"'у наступны "+weekday+" а' p";
}
}
var lastWeekFormat$2=function lastWeekFormat$2(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$8(day);else
return lastWeek$8(day);
};
var nextWeekFormat$2=function nextWeekFormat$2(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$8(day);else
return nextWeek$8(day);
};
var formatRelativeLocale$76={
lastWeek:lastWeekFormat$2,
yesterday:"'учора а' p",
today:"'сёння а' p",
tomorrow:"'заўтра а' p",
nextWeek:nextWeekFormat$2,
other:"P"
};
var formatRelative$76=function formatRelative$76(token,date,baseDate,options){
var format=formatRelativeLocale$76[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/be/_lib/localize.js
var eraValues$76={
narrow:["да н.э.","н.э."],
abbreviated:["да н. э.","н. э."],
wide:["да нашай эры","нашай эры"]
};
var quarterValues$76={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-ы кв.",
"2-і кв.",
"3-і кв.",
"4-ы кв."],

wide:[
"1-ы квартал",
"2-і квартал",
"3-і квартал",
"4-ы квартал"]

};
var monthValues$76={
narrow:[
"С",
"Л",
"С",
"К",
"М",
"Ч",
"Л",
"Ж",
"В",
"К",
"Л",
"С"],

abbreviated:[
"студз.",
"лют.",
"сак.",
"крас.",
"май",
"чэрв.",
"ліп.",
"жн.",
"вер.",
"кастр.",
"ліст.",
"снеж."],

wide:[
"студзень",
"люты",
"сакавік",
"красавік",
"май",
"чэрвень",
"ліпень",
"жнівень",
"верасень",
"кастрычнік",
"лістапад",
"снежань"]

};
var formattingMonthValues$18={
narrow:[
"С",
"Л",
"С",
"К",
"М",
"Ч",
"Л",
"Ж",
"В",
"К",
"Л",
"С"],

abbreviated:[
"студз.",
"лют.",
"сак.",
"крас.",
"мая",
"чэрв.",
"ліп.",
"жн.",
"вер.",
"кастр.",
"ліст.",
"снеж."],

wide:[
"студзеня",
"лютага",
"сакавіка",
"красавіка",
"мая",
"чэрвеня",
"ліпеня",
"жніўня",
"верасня",
"кастрычніка",
"лістапада",
"снежня"]

};
var dayValues$76={
narrow:[
"Н",
"П",
"А",
"С",
"Ч",
"П",
"С"],

short:[
"нд",
"пн",
"аў",
"ср",
"чц",
"пт",
"сб"],

abbreviated:[
"нядз",
"пан",
"аўт",
"сер",
"чац",
"пят",
"суб"],

wide:[
"нядзеля",
"панядзелак",
"аўторак",
"серада",
"чацвер",
"пятніца",
"субота"]

};
var dayPeriodValues$76={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дзень",
evening:"веч.",
night:"ноч"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дзень",
evening:"веч.",
night:"ноч"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"поўнач",
noon:"поўдзень",
morning:"раніца",
afternoon:"дзень",
evening:"вечар",
night:"ноч"
}
};
var formattingDayPeriodValues$60={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дня",
evening:"веч.",
night:"ночы"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дня",
evening:"веч.",
night:"ночы"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"поўнач",
noon:"поўдзень",
morning:"раніцы",
afternoon:"дня",
evening:"вечара",
night:"ночы"
}
};
var ordinalNumber$76=function ordinalNumber$76(dirtyNumber,options){
var unit=String(options===null||options===void 0?void 0:options.unit);
var number=Number(dirtyNumber);
var suffix;
/** Though it's an incorrect ordinal form of a date we use it here for consistency with other similar locales (ru, uk)
	*  For date-month combinations should be used `d` formatter.
	*  Correct:   `d MMMM` (4 верасня)
	*  Incorrect: `do MMMM` (4-га верасня)
	*
	*  But following the consistency leads to mistakes for literal uses of `do` formatter (ordinal day of month).
	*  So for phrase "5th day of month" (`do дзень месяца`)
	*  library will produce:            `5-га дзень месяца`
	*  but correct spelling should be:  `5-ы дзень месяца`
	*
	*  So I guess there should be a stand-alone and a formatting version of "day of month" formatters
	*/
if(unit==="date")suffix="-га";else
if(unit==="hour"||unit==="minute"||unit==="second")suffix="-я";else
suffix=(number%10===2||number%10===3)&&number%100!==12&&number%100!==13?"-і":"-ы";
return number+suffix;
};
//#endregion
//#region dist/date-fns/locale/be.js
/**
* @category Locales
* @summary Belarusian locale.
* @language Belarusian
* @iso-639-2 bel
* @author Kiryl Anokhin [@alyrik](https://github.com/alyrik)
* @author Martin Wind [@arvigeus](https://github.com/mawi12345)
*/
var _be={
code:"be",
formatDistance:formatDistance$76,
formatLong:formatLong$84,
formatRelative:formatRelative$76,
localize:{
ordinalNumber:ordinalNumber$76,
era:buildLocalizeFn({
values:eraValues$76,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$76,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$76,
defaultWidth:"wide",
formattingValues:formattingMonthValues$18,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$76,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$76,
defaultWidth:"any",
formattingValues:formattingDayPeriodValues$60,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?(е|я|га|і|ы|ае|ая|яя|шы|гі|ці|ты|мы))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((да )?н\.?\s?э\.?)/i,
abbreviated:/^((да )?н\.?\s?э\.?)/i,
wide:/^(да нашай эры|нашай эры|наша эра)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^д/i,/^н/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?[ыі]?)? кв.?/i,
wide:/^[1234](-?[ыі]?)? квартал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[слкмчжв]/i,
abbreviated:/^(студз|лют|сак|крас|ма[йя]|чэрв|ліп|жн|вер|кастр|ліст|снеж)\.?/i,
wide:/^(студзен[ья]|лют(ы|ага)|сакавіка?|красавіка?|ма[йя]|чэрвен[ья]|ліпен[ья]|жні(вень|ўня)|верас(ень|ня)|кастрычніка?|лістапада?|снеж(ань|ня))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^с/i,
/^л/i,
/^с/i,
/^к/i,
/^м/i,
/^ч/i,
/^л/i,
/^ж/i,
/^в/i,
/^к/i,
/^л/i,
/^с/i],

any:[
/^ст/i,
/^лю/i,
/^са/i,
/^кр/i,
/^ма/i,
/^ч/i,
/^ліп/i,
/^ж/i,
/^в/i,
/^ка/i,
/^ліс/i,
/^сн/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[нпасч]/i,
short:/^(нд|ня|пн|па|аў|ат|ср|се|чц|ча|пт|пя|сб|су)\.?/i,
abbreviated:/^(нядз?|ндз|пнд|пан|аўт|срд|сер|чцв|чац|птн|пят|суб).?/i,
wide:/^(нядзел[яі]|панядзел(ак|ка)|аўтор(ак|ка)|серад[аы]|чацв(ер|ярга)|пятніц[аы]|субот[аы])/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^н/i,
/^п/i,
/^а/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i],

any:[
/^н/i,
/^п[ан]/i,
/^а/i,
/^с[ер]/i,
/^ч/i,
/^п[ят]/i,
/^с[уб]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
abbreviated:/^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
wide:/^([дп]п|поўнач|поўдзень|раніц[аы]|дзень|дня|вечара?|ночы?)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^дп/i,
pm:/^пп/i,
midnight:/^поўн/i,
noon:/^поўд/i,
morning:/^р/i,
afternoon:/^д[зн]/i,
evening:/^в/i,
night:/^н/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/be-tarask/_lib/formatDistance.js
function declension$5(scheme,count){
if(scheme.one!==void 0&&count===1)return scheme.one;
var rem10=count%10;
var rem100=count%100;
if(rem10===1&&rem100!==11)return scheme.singularNominative.replace("{{count}}",String(count));else
if(rem10>=2&&rem10<=4&&(rem100<10||rem100>20))return scheme.singularGenitive.replace("{{count}}",String(count));else
return scheme.pluralGenitive.replace("{{count}}",String(count));
}
function buildLocalizeTokenFn$3(scheme){
return function(count,options){
if(options&&options.addSuffix){if(options.comparison&&options.comparison>0){if(scheme.future)return declension$5(scheme.future,count);else
return"праз "+declension$5(scheme.regular,count);}else
if(scheme.past)return declension$5(scheme.past,count);else
return declension$5(scheme.regular,count)+" таму";}else
return declension$5(scheme.regular,count);
};
}
var halfAMinute=function halfAMinute(_,options){
if(options&&options.addSuffix)if(options.comparison&&options.comparison>0)return"праз паўхвіліны";else
return"паўхвіліны таму";
return"паўхвіліны";
};
var formatDistanceLocale$74={
lessThanXSeconds:buildLocalizeTokenFn$3({
regular:{
one:"менш за секунду",
singularNominative:"менш за {{count}} секунду",
singularGenitive:"менш за {{count}} секунды",
pluralGenitive:"менш за {{count}} секунд"
},
future:{
one:"менш, чым праз секунду",
singularNominative:"менш, чым праз {{count}} секунду",
singularGenitive:"менш, чым праз {{count}} секунды",
pluralGenitive:"менш, чым праз {{count}} секунд"
}
}),
xSeconds:buildLocalizeTokenFn$3({
regular:{
singularNominative:"{{count}} секунда",
singularGenitive:"{{count}} секунды",
pluralGenitive:"{{count}} секунд"
},
past:{
singularNominative:"{{count}} секунду таму",
singularGenitive:"{{count}} секунды таму",
pluralGenitive:"{{count}} секунд таму"
},
future:{
singularNominative:"праз {{count}} секунду",
singularGenitive:"праз {{count}} секунды",
pluralGenitive:"праз {{count}} секунд"
}
}),
halfAMinute:halfAMinute,
lessThanXMinutes:buildLocalizeTokenFn$3({
regular:{
one:"менш за хвіліну",
singularNominative:"менш за {{count}} хвіліну",
singularGenitive:"менш за {{count}} хвіліны",
pluralGenitive:"менш за {{count}} хвілін"
},
future:{
one:"менш, чым праз хвіліну",
singularNominative:"менш, чым праз {{count}} хвіліну",
singularGenitive:"менш, чым праз {{count}} хвіліны",
pluralGenitive:"менш, чым праз {{count}} хвілін"
}
}),
xMinutes:buildLocalizeTokenFn$3({
regular:{
singularNominative:"{{count}} хвіліна",
singularGenitive:"{{count}} хвіліны",
pluralGenitive:"{{count}} хвілін"
},
past:{
singularNominative:"{{count}} хвіліну таму",
singularGenitive:"{{count}} хвіліны таму",
pluralGenitive:"{{count}} хвілін таму"
},
future:{
singularNominative:"праз {{count}} хвіліну",
singularGenitive:"праз {{count}} хвіліны",
pluralGenitive:"праз {{count}} хвілін"
}
}),
aboutXHours:buildLocalizeTokenFn$3({
regular:{
singularNominative:"каля {{count}} гадзіны",
singularGenitive:"каля {{count}} гадзін",
pluralGenitive:"каля {{count}} гадзін"
},
future:{
singularNominative:"прыблізна праз {{count}} гадзіну",
singularGenitive:"прыблізна праз {{count}} гадзіны",
pluralGenitive:"прыблізна праз {{count}} гадзін"
}
}),
xHours:buildLocalizeTokenFn$3({
regular:{
singularNominative:"{{count}} гадзіна",
singularGenitive:"{{count}} гадзіны",
pluralGenitive:"{{count}} гадзін"
},
past:{
singularNominative:"{{count}} гадзіну таму",
singularGenitive:"{{count}} гадзіны таму",
pluralGenitive:"{{count}} гадзін таму"
},
future:{
singularNominative:"праз {{count}} гадзіну",
singularGenitive:"праз {{count}} гадзіны",
pluralGenitive:"праз {{count}} гадзін"
}
}),
xDays:buildLocalizeTokenFn$3({regular:{
singularNominative:"{{count}} дзень",
singularGenitive:"{{count}} дні",
pluralGenitive:"{{count}} дзён"
}}),
aboutXWeeks:buildLocalizeTokenFn$3({
regular:{
singularNominative:"каля {{count}} тыдні",
singularGenitive:"каля {{count}} тыдняў",
pluralGenitive:"каля {{count}} тыдняў"
},
future:{
singularNominative:"прыблізна праз {{count}} тыдзень",
singularGenitive:"прыблізна праз {{count}} тыдні",
pluralGenitive:"прыблізна праз {{count}} тыдняў"
}
}),
xWeeks:buildLocalizeTokenFn$3({regular:{
singularNominative:"{{count}} тыдзень",
singularGenitive:"{{count}} тыдні",
pluralGenitive:"{{count}} тыдняў"
}}),
aboutXMonths:buildLocalizeTokenFn$3({
regular:{
singularNominative:"каля {{count}} месяца",
singularGenitive:"каля {{count}} месяцаў",
pluralGenitive:"каля {{count}} месяцаў"
},
future:{
singularNominative:"прыблізна праз {{count}} месяц",
singularGenitive:"прыблізна праз {{count}} месяцы",
pluralGenitive:"прыблізна праз {{count}} месяцаў"
}
}),
xMonths:buildLocalizeTokenFn$3({regular:{
singularNominative:"{{count}} месяц",
singularGenitive:"{{count}} месяцы",
pluralGenitive:"{{count}} месяцаў"
}}),
aboutXYears:buildLocalizeTokenFn$3({
regular:{
singularNominative:"каля {{count}} года",
singularGenitive:"каля {{count}} гадоў",
pluralGenitive:"каля {{count}} гадоў"
},
future:{
singularNominative:"прыблізна праз {{count}} год",
singularGenitive:"прыблізна праз {{count}} гады",
pluralGenitive:"прыблізна праз {{count}} гадоў"
}
}),
xYears:buildLocalizeTokenFn$3({regular:{
singularNominative:"{{count}} год",
singularGenitive:"{{count}} гады",
pluralGenitive:"{{count}} гадоў"
}}),
overXYears:buildLocalizeTokenFn$3({
regular:{
singularNominative:"больш за {{count}} год",
singularGenitive:"больш за {{count}} гады",
pluralGenitive:"больш за {{count}} гадоў"
},
future:{
singularNominative:"больш, чым праз {{count}} год",
singularGenitive:"больш, чым праз {{count}} гады",
pluralGenitive:"больш, чым праз {{count}} гадоў"
}
}),
almostXYears:buildLocalizeTokenFn$3({
regular:{
singularNominative:"амаль {{count}} год",
singularGenitive:"амаль {{count}} гады",
pluralGenitive:"амаль {{count}} гадоў"
},
future:{
singularNominative:"амаль праз {{count}} год",
singularGenitive:"амаль праз {{count}} гады",
pluralGenitive:"амаль праз {{count}} гадоў"
}
})
};
var formatDistance$75=function formatDistance$75(token,count,options){
options=options||{};
return formatDistanceLocale$74[token](count,options);
};
var formatLong$83={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM y 'г.'",
long:"d MMMM y 'г.'",
medium:"d MMM y 'г.'",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}}, {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/be-tarask/_lib/formatRelative.js
var accusativeWeekdays$6=[
"нядзелю",
"панядзелак",
"аўторак",
"сераду",
"чацьвер",
"пятніцу",
"суботу"];

function lastWeek$7(day){
var weekday=accusativeWeekdays$6[day];
switch(day){
case 0:
case 3:
case 5:
case 6:return"'у мінулую "+weekday+" а' p";
case 1:
case 2:
case 4:return"'у мінулы "+weekday+" а' p";
}
}
function thisWeek$7(day){
return"'у "+accusativeWeekdays$6[day]+" а' p";
}
function nextWeek$7(day){
var weekday=accusativeWeekdays$6[day];
switch(day){
case 0:
case 3:
case 5:
case 6:return"'у наступную "+weekday+" а' p";
case 1:
case 2:
case 4:return"'у наступны "+weekday+" а' p";
}
}
var lastWeekFormat$1=function lastWeekFormat$1(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$7(day);else
return lastWeek$7(day);
};
var nextWeekFormat$1=function nextWeekFormat$1(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$7(day);else
return nextWeek$7(day);
};
var formatRelativeLocale$75={
lastWeek:lastWeekFormat$1,
yesterday:"'учора а' p",
today:"'сёньня а' p",
tomorrow:"'заўтра а' p",
nextWeek:nextWeekFormat$1,
other:"P"
};
var formatRelative$75=function formatRelative$75(token,date,baseDate,options){
var format=formatRelativeLocale$75[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/be-tarask/_lib/localize.js
var eraValues$75={
narrow:["да н.э.","н.э."],
abbreviated:["да н. э.","н. э."],
wide:["да нашай эры","нашай эры"]
};
var quarterValues$75={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-ы кв.",
"2-і кв.",
"3-і кв.",
"4-ы кв."],

wide:[
"1-ы квартал",
"2-і квартал",
"3-і квартал",
"4-ы квартал"]

};
var monthValues$75={
narrow:[
"С",
"Л",
"С",
"К",
"Т",
"Ч",
"Л",
"Ж",
"В",
"К",
"Л",
"С"],

abbreviated:[
"студз.",
"лют.",
"сак.",
"крас.",
"трав.",
"чэрв.",
"ліп.",
"жн.",
"вер.",
"кастр.",
"ліст.",
"сьнеж."],

wide:[
"студзень",
"люты",
"сакавік",
"красавік",
"травень",
"чэрвень",
"ліпень",
"жнівень",
"верасень",
"кастрычнік",
"лістапад",
"сьнежань"]

};
var formattingMonthValues$17={
narrow:[
"С",
"Л",
"С",
"К",
"Т",
"Ч",
"Л",
"Ж",
"В",
"К",
"Л",
"С"],

abbreviated:[
"студз.",
"лют.",
"сак.",
"крас.",
"трав.",
"чэрв.",
"ліп.",
"жн.",
"вер.",
"кастр.",
"ліст.",
"сьнеж."],

wide:[
"студзеня",
"лютага",
"сакавіка",
"красавіка",
"траўня",
"чэрвеня",
"ліпеня",
"жніўня",
"верасня",
"кастрычніка",
"лістапада",
"сьнежня"]

};
var dayValues$75={
narrow:[
"Н",
"П",
"А",
"С",
"Ч",
"П",
"С"],

short:[
"нд",
"пн",
"аў",
"ср",
"чц",
"пт",
"сб"],

abbreviated:[
"нядз",
"пан",
"аўт",
"сер",
"чаць",
"пят",
"суб"],

wide:[
"нядзеля",
"панядзелак",
"аўторак",
"серада",
"чацьвер",
"пятніца",
"субота"]

};
var dayPeriodValues$75={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дзень",
evening:"веч.",
night:"ноч"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дзень",
evening:"веч.",
night:"ноч"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"поўнач",
noon:"поўдзень",
morning:"раніца",
afternoon:"дзень",
evening:"вечар",
night:"ноч"
}
};
var formattingDayPeriodValues$59={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дня",
evening:"веч.",
night:"ночы"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"поўн.",
noon:"поўд.",
morning:"ран.",
afternoon:"дня",
evening:"веч.",
night:"ночы"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"поўнач",
noon:"поўдзень",
morning:"раніцы",
afternoon:"дня",
evening:"вечара",
night:"ночы"
}
};
var ordinalNumber$75=function ordinalNumber$75(dirtyNumber,options){
var unit=String(options===null||options===void 0?void 0:options.unit);
var number=Number(dirtyNumber);
var suffix;
/** Though it's an incorrect ordinal form of a date we use it here for consistency with other similar locales (ru, uk)
	*  For date-month combinations should be used `d` formatter.
	*  Correct:   `d MMMM` (4 верасня)
	*  Incorrect: `do MMMM` (4-га верасня)
	*
	*  But following the consistency leads to mistakes for literal uses of `do` formatter (ordinal day of month).
	*  So for phrase "5th day of month" (`do дзень месяца`)
	*  library will produce:            `5-га дзень месяца`
	*  but correct spelling should be:  `5-ы дзень месяца`
	*
	*  So I guess there should be a stand-alone and a formatting version of "day of month" formatters
	*/
if(unit==="date")suffix="-га";else
if(unit==="hour"||unit==="minute"||unit==="second")suffix="-я";else
suffix=(number%10===2||number%10===3)&&number%100!==12&&number%100!==13?"-і":"-ы";
return number+suffix;
};
//#endregion
//#region dist/date-fns/locale/be-tarask.js
/**
* @category Locales
* @summary Belarusian Classic locale.
* @language Belarusian Classic
* @iso-639-2 bel
* @author Ryhor Nopears [@nopears](https://github.com/nopears)
*/
var _beTarask={
code:"be-tarask",
formatDistance:formatDistance$75,
formatLong:formatLong$83,
formatRelative:formatRelative$75,
localize:{
ordinalNumber:ordinalNumber$75,
era:buildLocalizeFn({
values:eraValues$75,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$75,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$75,
defaultWidth:"wide",
formattingValues:formattingMonthValues$17,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$75,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$75,
defaultWidth:"any",
formattingValues:formattingDayPeriodValues$59,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?(е|я|га|і|ы|ае|ая|яя|шы|гі|ці|ты|мы))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((да )?н\.?\s?э\.?)/i,
abbreviated:/^((да )?н\.?\s?э\.?)/i,
wide:/^(да нашай эры|нашай эры|наша эра)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^д/i,/^н/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?[ыі]?)? кв.?/i,
wide:/^[1234](-?[ыі]?)? квартал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[слкмчжв]/i,
abbreviated:/^(студз|лют|сак|крас|тр(ав)?|чэрв|ліп|жн|вер|кастр|ліст|сьнеж)\.?/i,
wide:/^(студзен[ья]|лют(ы|ага)|сакавіка?|красавіка?|тра(вень|ўня)|чэрвен[ья]|ліпен[ья]|жні(вень|ўня)|верас(ень|ня)|кастрычніка?|лістапада?|сьнеж(ань|ня))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^с/i,
/^л/i,
/^с/i,
/^к/i,
/^т/i,
/^ч/i,
/^л/i,
/^ж/i,
/^в/i,
/^к/i,
/^л/i,
/^с/i],

any:[
/^ст/i,
/^лю/i,
/^са/i,
/^кр/i,
/^тр/i,
/^ч/i,
/^ліп/i,
/^ж/i,
/^в/i,
/^ка/i,
/^ліс/i,
/^сн/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[нпасч]/i,
short:/^(нд|ня|пн|па|аў|ат|ср|се|чц|ча|пт|пя|сб|су)\.?/i,
abbreviated:/^(нядз?|ндз|пнд|пан|аўт|срд|сер|чцьв|чаць|птн|пят|суб).?/i,
wide:/^(нядзел[яі]|панядзел(ак|ка)|аўтор(ак|ка)|серад[аы]|чацьв(ер|ярга)|пятніц[аы]|субот[аы])/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^н/i,
/^п/i,
/^а/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i],

any:[
/^н/i,
/^п[ан]/i,
/^а/i,
/^с[ер]/i,
/^ч/i,
/^п[ят]/i,
/^с[уб]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
abbreviated:/^([дп]п|поўн\.?|поўд\.?|ран\.?|дзень|дня|веч\.?|ночы?)/i,
wide:/^([дп]п|поўнач|поўдзень|раніц[аы]|дзень|дня|вечара?|ночы?)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^дп/i,
pm:/^пп/i,
midnight:/^поўн/i,
noon:/^поўд/i,
morning:/^р/i,
afternoon:/^д[зн]/i,
evening:/^в/i,
night:/^н/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/bg/_lib/formatDistance.js
var formatDistanceLocale$73={
lessThanXSeconds:{
one:"по-малко от секунда",
other:"по-малко от {{count}} секунди"
},
xSeconds:{
one:"1 секунда",
other:"{{count}} секунди"
},
halfAMinute:"половин минута",
lessThanXMinutes:{
one:"по-малко от минута",
other:"по-малко от {{count}} минути"
},
xMinutes:{
one:"1 минута",
other:"{{count}} минути"
},
aboutXHours:{
one:"около час",
other:"около {{count}} часа"
},
xHours:{
one:"1 час",
other:"{{count}} часа"
},
xDays:{
one:"1 ден",
other:"{{count}} дни"
},
aboutXWeeks:{
one:"около седмица",
other:"около {{count}} седмици"
},
xWeeks:{
one:"1 седмица",
other:"{{count}} седмици"
},
aboutXMonths:{
one:"около месец",
other:"около {{count}} месеца"
},
xMonths:{
one:"1 месец",
other:"{{count}} месеца"
},
aboutXYears:{
one:"около година",
other:"около {{count}} години"
},
xYears:{
one:"1 година",
other:"{{count}} години"
},
overXYears:{
one:"над година",
other:"над {{count}} години"
},
almostXYears:{
one:"почти година",
other:"почти {{count}} години"
}
};
var formatDistance$74=function formatDistance$74(token,count,options){
var result;
var tokenValue=formatDistanceLocale$73[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"след "+result;else
return"преди "+result;
return result;
};
var formatLong$82={
date:buildFormatLongFn({
formats:{
full:"EEEE, dd MMMM yyyy",
long:"dd MMMM yyyy",
medium:"dd MMM yyyy",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}} {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/bg/_lib/formatRelative.js
var weekdays$3=[
"неделя",
"понеделник",
"вторник",
"сряда",
"четвъртък",
"петък",
"събота"];

function lastWeek$6(day){
var weekday=weekdays$3[day];
switch(day){
case 0:
case 3:
case 6:return"'миналата "+weekday+" в' p";
case 1:
case 2:
case 4:
case 5:return"'миналия "+weekday+" в' p";
}
}
function thisWeek$6(day){
var weekday=weekdays$3[day];
if(day===2)return"'във "+weekday+" в' p";else
return"'в "+weekday+" в' p";
}
function nextWeek$6(day){
var weekday=weekdays$3[day];
switch(day){
case 0:
case 3:
case 6:return"'следващата "+weekday+" в' p";
case 1:
case 2:
case 4:
case 5:return"'следващия "+weekday+" в' p";
}
}
var lastWeekFormatToken=function lastWeekFormatToken(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$6(day);else
return lastWeek$6(day);
};
var nextWeekFormatToken=function nextWeekFormatToken(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$6(day);else
return nextWeek$6(day);
};
var formatRelativeLocale$74={
lastWeek:lastWeekFormatToken,
yesterday:"'вчера в' p",
today:"'днес в' p",
tomorrow:"'утре в' p",
nextWeek:nextWeekFormatToken,
other:"P"
};
var formatRelative$74=function formatRelative$74(token,date,baseDate,options){
var format=formatRelativeLocale$74[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/bg/_lib/localize.js
var eraValues$74={
narrow:["пр.н.е.","н.е."],
abbreviated:["преди н. е.","н. е."],
wide:["преди новата ера","новата ера"]
};
var quarterValues$74={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-во тримес.",
"2-ро тримес.",
"3-то тримес.",
"4-то тримес."],

wide:[
"1-во тримесечие",
"2-ро тримесечие",
"3-то тримесечие",
"4-то тримесечие"]

};
var monthValues$74={
abbreviated:[
"яну",
"фев",
"мар",
"апр",
"май",
"юни",
"юли",
"авг",
"сеп",
"окт",
"ное",
"дек"],

wide:[
"януари",
"февруари",
"март",
"април",
"май",
"юни",
"юли",
"август",
"септември",
"октомври",
"ноември",
"декември"]

};
var dayValues$74={
narrow:[
"Н",
"П",
"В",
"С",
"Ч",
"П",
"С"],

short:[
"нд",
"пн",
"вт",
"ср",
"чт",
"пт",
"сб"],

abbreviated:[
"нед",
"пон",
"вто",
"сря",
"чет",
"пет",
"съб"],

wide:[
"неделя",
"понеделник",
"вторник",
"сряда",
"четвъртък",
"петък",
"събота"]

};
var dayPeriodValues$74={wide:{
am:"преди обяд",
pm:"след обяд",
midnight:"в полунощ",
noon:"на обяд",
morning:"сутринта",
afternoon:"следобед",
evening:"вечерта",
night:"през нощта"
}};
function isFeminine(unit){
return unit==="year"||unit==="week"||unit==="minute"||unit==="second";
}
function isNeuter(unit){
return unit==="quarter";
}
function numberWithSuffix(number,unit,masculine,feminine,neuter){
var suffix=isNeuter(unit)?neuter:isFeminine(unit)?feminine:masculine;
return number+"-"+suffix;
}
var ordinalNumber$74=function ordinalNumber$74(dirtyNumber,options){
var number=Number(dirtyNumber);
var unit=options===null||options===void 0?void 0:options.unit;
if(number===0)return numberWithSuffix(0,unit,"ев","ева","ево");else
if(number%1e3===0)return numberWithSuffix(number,unit,"ен","на","но");else
if(number%100===0)return numberWithSuffix(number,unit,"тен","тна","тно");
var rem100=number%100;
if(rem100>20||rem100<10)switch(rem100%10){
case 1:return numberWithSuffix(number,unit,"ви","ва","во");
case 2:return numberWithSuffix(number,unit,"ри","ра","ро");
case 7:
case 8:return numberWithSuffix(number,unit,"ми","ма","мо");
}
return numberWithSuffix(number,unit,"ти","та","то");
};
//#endregion
//#region dist/date-fns/locale/bg.js
/**
* @category Locales
* @summary Bulgarian locale.
* @language Bulgarian
* @iso-639-2 bul
* @author Nikolay Stoynov [@arvigeus](https://github.com/arvigeus)
* @author Tsvetan Ovedenski [@fintara](https://github.com/fintara)
*/
var _bg={
code:"bg",
formatDistance:formatDistance$74,
formatLong:formatLong$82,
formatRelative:formatRelative$74,
localize:{
ordinalNumber:ordinalNumber$74,
era:buildLocalizeFn({
values:eraValues$74,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$74,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$74,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$74,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$74,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?[врмт][аи]|-?т?(ен|на)|-?(ев|ева))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((пр)?н\.?\s?е\.?)/i,
abbreviated:/^((пр)?н\.?\s?е\.?)/i,
wide:/^(преди новата ера|новата ера|нова ера)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^п/i,/^н/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?[врт]?o?)? тримес.?/i,
wide:/^[1234](-?[врт]?о?)? тримесечие/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
abbreviated:/^(яну|фев|мар|апр|май|юни|юли|авг|сеп|окт|ное|дек)/i,
wide:/^(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^я/i,
/^ф/i,
/^мар/i,
/^ап/i,
/^май/i,
/^юн/i,
/^юл/i,
/^ав/i,
/^се/i,
/^окт/i,
/^но/i,
/^де/i]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[нпвсч]/i,
short:/^(нд|пн|вт|ср|чт|пт|сб)/i,
abbreviated:/^(нед|пон|вто|сря|чет|пет|съб)/i,
wide:/^(неделя|понеделник|вторник|сряда|четвъртък|петък|събота)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^н/i,
/^п/i,
/^в/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i],

any:[
/^н[ед]/i,
/^п[он]/i,
/^вт/i,
/^ср/i,
/^ч[ет]/i,
/^п[ет]/i,
/^с[ъб]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(преди о|след о|в по|на о|през|веч|сут|следо)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^преди о/i,
pm:/^след о/i,
midnight:/^в пол/i,
noon:/^на об/i,
morning:/^сут/i,
afternoon:/^следо/i,
evening:/^веч/i,
night:/^през н/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/bn/_lib/localize.js
var numberValues$1={
locale:{
1:"১",
2:"২",
3:"৩",
4:"৪",
5:"৫",
6:"৬",
7:"৭",
8:"৮",
9:"৯",
0:"০"
},
number:{
"১":"1",
"২":"2",
"৩":"3",
"৪":"4",
"৫":"5",
"৬":"6",
"৭":"7",
"৮":"8",
"৯":"9",
"০":"0"
}
};
var eraValues$73={
narrow:["খ্রিঃপূঃ","খ্রিঃ"],
abbreviated:["খ্রিঃপূর্ব","খ্রিঃ"],
wide:["খ্রিস্টপূর্ব","খ্রিস্টাব্দ"]
};
var quarterValues$73={
narrow:[
"১",
"২",
"৩",
"৪"],

abbreviated:[
"১ত্রৈ",
"২ত্রৈ",
"৩ত্রৈ",
"৪ত্রৈ"],

wide:[
"১ম ত্রৈমাসিক",
"২য় ত্রৈমাসিক",
"৩য় ত্রৈমাসিক",
"৪র্থ ত্রৈমাসিক"]

};
var monthValues$73={
narrow:[
"জানু",
"ফেব্রু",
"মার্চ",
"এপ্রিল",
"মে",
"জুন",
"জুলাই",
"আগস্ট",
"সেপ্ট",
"অক্টো",
"নভে",
"ডিসে"],

abbreviated:[
"জানু",
"ফেব্রু",
"মার্চ",
"এপ্রিল",
"মে",
"জুন",
"জুলাই",
"আগস্ট",
"সেপ্ট",
"অক্টো",
"নভে",
"ডিসে"],

wide:[
"জানুয়ারি",
"ফেব্রুয়ারি",
"মার্চ",
"এপ্রিল",
"মে",
"জুন",
"জুলাই",
"আগস্ট",
"সেপ্টেম্বর",
"অক্টোবর",
"নভেম্বর",
"ডিসেম্বর"]

};
var dayValues$73={
narrow:[
"র",
"সো",
"ম",
"বু",
"বৃ",
"শু",
"শ"],

short:[
"রবি",
"সোম",
"মঙ্গল",
"বুধ",
"বৃহ",
"শুক্র",
"শনি"],

abbreviated:[
"রবি",
"সোম",
"মঙ্গল",
"বুধ",
"বৃহ",
"শুক্র",
"শনি"],

wide:[
"রবিবার",
"সোমবার",
"মঙ্গলবার",
"বুধবার",
"বৃহস্পতিবার ",
"শুক্রবার",
"শনিবার"]

};
var dayPeriodValues$73={
narrow:{
am:"পূ",
pm:"অপ",
midnight:"মধ্যরাত",
noon:"মধ্যাহ্ন",
morning:"সকাল",
afternoon:"বিকাল",
evening:"সন্ধ্যা",
night:"রাত"
},
abbreviated:{
am:"পূর্বাহ্ন",
pm:"অপরাহ্ন",
midnight:"মধ্যরাত",
noon:"মধ্যাহ্ন",
morning:"সকাল",
afternoon:"বিকাল",
evening:"সন্ধ্যা",
night:"রাত"
},
wide:{
am:"পূর্বাহ্ন",
pm:"অপরাহ্ন",
midnight:"মধ্যরাত",
noon:"মধ্যাহ্ন",
morning:"সকাল",
afternoon:"বিকাল",
evening:"সন্ধ্যা",
night:"রাত"
}
};
var formattingDayPeriodValues$58={
narrow:{
am:"পূ",
pm:"অপ",
midnight:"মধ্যরাত",
noon:"মধ্যাহ্ন",
morning:"সকাল",
afternoon:"বিকাল",
evening:"সন্ধ্যা",
night:"রাত"
},
abbreviated:{
am:"পূর্বাহ্ন",
pm:"অপরাহ্ন",
midnight:"মধ্যরাত",
noon:"মধ্যাহ্ন",
morning:"সকাল",
afternoon:"বিকাল",
evening:"সন্ধ্যা",
night:"রাত"
},
wide:{
am:"পূর্বাহ্ন",
pm:"অপরাহ্ন",
midnight:"মধ্যরাত",
noon:"মধ্যাহ্ন",
morning:"সকাল",
afternoon:"বিকাল",
evening:"সন্ধ্যা",
night:"রাত"
}
};
function dateOrdinalNumber(number,localeNumber){
if(number>18&&number<=31)return localeNumber+"শে";else
switch(number){
case 1:return localeNumber+"লা";
case 2:
case 3:return localeNumber+"রা";
case 4:return localeNumber+"ঠা";
default:return localeNumber+"ই";
}
}
var ordinalNumber$73=function ordinalNumber$73(dirtyNumber,options){
var number=Number(dirtyNumber);
var localeNumber=numberToLocale$1(number);
if((options===null||options===void 0?void 0:options.unit)==="date")return dateOrdinalNumber(number,localeNumber);
if(number>10||number===0)return localeNumber+"তম";
switch(number%10){
case 2:
case 3:return localeNumber+"য়";
case 4:return localeNumber+"র্থ";
case 6:return localeNumber+"ষ্ঠ";
default:return localeNumber+"ম";
}
};
function numberToLocale$1(enNumber){
return enNumber.toString().replace(/\d/g,function(match){
return numberValues$1.locale[match];
});
}
var localize$73={
ordinalNumber:ordinalNumber$73,
era:buildLocalizeFn({
values:eraValues$73,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$73,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$73,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$73,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$73,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$58,
defaultFormattingWidth:"wide"
})
};
//#endregion
//#region dist/date-fns/locale/bn/_lib/formatDistance.js
var formatDistanceLocale$72={
lessThanXSeconds:{
one:"প্রায় ১ সেকেন্ড",
other:"প্রায় {{count}} সেকেন্ড"
},
xSeconds:{
one:"১ সেকেন্ড",
other:"{{count}} সেকেন্ড"
},
halfAMinute:"আধ মিনিট",
lessThanXMinutes:{
one:"প্রায় ১ মিনিট",
other:"প্রায় {{count}} মিনিট"
},
xMinutes:{
one:"১ মিনিট",
other:"{{count}} মিনিট"
},
aboutXHours:{
one:"প্রায় ১ ঘন্টা",
other:"প্রায় {{count}} ঘন্টা"
},
xHours:{
one:"১ ঘন্টা",
other:"{{count}} ঘন্টা"
},
xDays:{
one:"১ দিন",
other:"{{count}} দিন"
},
aboutXWeeks:{
one:"প্রায় ১ সপ্তাহ",
other:"প্রায় {{count}} সপ্তাহ"
},
xWeeks:{
one:"১ সপ্তাহ",
other:"{{count}} সপ্তাহ"
},
aboutXMonths:{
one:"প্রায় ১ মাস",
other:"প্রায় {{count}} মাস"
},
xMonths:{
one:"১ মাস",
other:"{{count}} মাস"
},
aboutXYears:{
one:"প্রায় ১ বছর",
other:"প্রায় {{count}} বছর"
},
xYears:{
one:"১ বছর",
other:"{{count}} বছর"
},
overXYears:{
one:"১ বছরের বেশি",
other:"{{count}} বছরের বেশি"
},
almostXYears:{
one:"প্রায় ১ বছর",
other:"প্রায় {{count}} বছর"
}
};
var formatDistance$73=function formatDistance$73(token,count,options){
var result;
var tokenValue=formatDistanceLocale$72[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",numberToLocale$1(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" এর মধ্যে";else
return result+" আগে";
return result;
};
var formatLong$81={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}} 'সময়'",
long:"{{date}} {{time}} 'সময়'",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/bn/_lib/formatRelative.js
var formatRelativeLocale$73={
lastWeek:"'গত' eeee 'সময়' p",
yesterday:"'গতকাল' 'সময়' p",
today:"'আজ' 'সময়' p",
tomorrow:"'আগামীকাল' 'সময়' p",
nextWeek:"eeee 'সময়' p",
other:"P"
};
var formatRelative$73=function formatRelative$73(token,_date,_baseDate,_options){return formatRelativeLocale$73[token];};
//#endregion
//#region dist/date-fns/locale/bn.js
/**
* @category Locales
* @summary Bengali locale.
* @language Bengali
* @iso-639-2 ben
* @author Touhidur Rahman [@touhidrahman](https://github.com/touhidrahman)
* @author Farhad Yasir [@nutboltu](https://github.com/nutboltu)
*/
var _bn={
code:"bn",
formatDistance:formatDistance$73,
formatLong:formatLong$81,
formatRelative:formatRelative$73,
localize:localize$73,
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(ম|য়|র্থ|ষ্ঠ|শে|ই|তম)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(খ্রিঃপূঃ|খ্রিঃ)/i,
abbreviated:/^(খ্রিঃপূর্ব|খ্রিঃ)/i,
wide:/^(খ্রিস্টপূর্ব|খ্রিস্টাব্দ)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[/^খ্রিঃপূঃ/i,/^খ্রিঃ/i],
abbreviated:[/^খ্রিঃপূর্ব/i,/^খ্রিঃ/i],
wide:[/^খ্রিস্টপূর্ব/i,/^খ্রিস্টাব্দ/i]
},
defaultParseWidth:"wide"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[১২৩৪]/i,
abbreviated:/^[১২৩৪]ত্রৈ/i,
wide:/^[১২৩৪](ম|য়|র্থ)? ত্রৈমাসিক/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/১/i,
/২/i,
/৩/i,
/৪/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(জানু|ফেব্রু|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্ট|অক্টো|নভে|ডিসে)/i,
abbreviated:/^(জানু|ফেব্রু|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্ট|অক্টো|নভে|ডিসে)/i,
wide:/^(জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^জানু/i,
/^ফেব্রু/i,
/^মার্চ/i,
/^এপ্রিল/i,
/^মে/i,
/^জুন/i,
/^জুলাই/i,
/^আগস্ট/i,
/^সেপ্ট/i,
/^অক্টো/i,
/^নভে/i,
/^ডিসে/i]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(র|সো|ম|বু|বৃ|শু|শ)+/i,
short:/^(রবি|সোম|মঙ্গল|বুধ|বৃহ|শুক্র|শনি)+/i,
abbreviated:/^(রবি|সোম|মঙ্গল|বুধ|বৃহ|শুক্র|শনি)+/i,
wide:/^(রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার |শুক্রবার|শনিবার)+/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^র/i,
/^সো/i,
/^ম/i,
/^বু/i,
/^বৃ/i,
/^শু/i,
/^শ/i],

short:[
/^রবি/i,
/^সোম/i,
/^মঙ্গল/i,
/^বুধ/i,
/^বৃহ/i,
/^শুক্র/i,
/^শনি/i],

abbreviated:[
/^রবি/i,
/^সোম/i,
/^মঙ্গল/i,
/^বুধ/i,
/^বৃহ/i,
/^শুক্র/i,
/^শনি/i],

wide:[
/^রবিবার/i,
/^সোমবার/i,
/^মঙ্গলবার/i,
/^বুধবার/i,
/^বৃহস্পতিবার /i,
/^শুক্রবার/i,
/^শনিবার/i]

},
defaultParseWidth:"wide"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(পূ|অপ|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i,
abbreviated:/^(পূর্বাহ্ন|অপরাহ্ন|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i,
wide:/^(পূর্বাহ্ন|অপরাহ্ন|মধ্যরাত|মধ্যাহ্ন|সকাল|বিকাল|সন্ধ্যা|রাত)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^পূ/i,
pm:/^অপ/i,
midnight:/^মধ্যরাত/i,
noon:/^মধ্যাহ্ন/i,
morning:/সকাল/i,
afternoon:/বিকাল/i,
evening:/সন্ধ্যা/i,
night:/রাত/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/bs/_lib/formatDistance.js
var formatDistanceLocale$71={
lessThanXSeconds:{
one:{
standalone:"manje od 1 sekunde",
withPrepositionAgo:"manje od 1 sekunde",
withPrepositionIn:"manje od 1 sekundu"
},
dual:"manje od {{count}} sekunde",
other:"manje od {{count}} sekundi"
},
xSeconds:{
one:{
standalone:"1 sekunda",
withPrepositionAgo:"1 sekunde",
withPrepositionIn:"1 sekundu"
},
dual:"{{count}} sekunde",
other:"{{count}} sekundi"
},
halfAMinute:"pola minute",
lessThanXMinutes:{
one:{
standalone:"manje od 1 minute",
withPrepositionAgo:"manje od 1 minute",
withPrepositionIn:"manje od 1 minutu"
},
dual:"manje od {{count}} minute",
other:"manje od {{count}} minuta"
},
xMinutes:{
one:{
standalone:"1 minuta",
withPrepositionAgo:"1 minute",
withPrepositionIn:"1 minutu"
},
dual:"{{count}} minute",
other:"{{count}} minuta"
},
aboutXHours:{
one:{
standalone:"oko 1 sat",
withPrepositionAgo:"oko 1 sat",
withPrepositionIn:"oko 1 sat"
},
dual:"oko {{count}} sata",
other:"oko {{count}} sati"
},
xHours:{
one:{
standalone:"1 sat",
withPrepositionAgo:"1 sat",
withPrepositionIn:"1 sat"
},
dual:"{{count}} sata",
other:"{{count}} sati"
},
xDays:{
one:{
standalone:"1 dan",
withPrepositionAgo:"1 dan",
withPrepositionIn:"1 dan"
},
dual:"{{count}} dana",
other:"{{count}} dana"
},
aboutXWeeks:{
one:{
standalone:"oko 1 sedmicu",
withPrepositionAgo:"oko 1 sedmicu",
withPrepositionIn:"oko 1 sedmicu"
},
dual:"oko {{count}} sedmice",
other:"oko {{count}} sedmice"
},
xWeeks:{
one:{
standalone:"1 sedmicu",
withPrepositionAgo:"1 sedmicu",
withPrepositionIn:"1 sedmicu"
},
dual:"{{count}} sedmice",
other:"{{count}} sedmice"
},
aboutXMonths:{
one:{
standalone:"oko 1 mjesec",
withPrepositionAgo:"oko 1 mjesec",
withPrepositionIn:"oko 1 mjesec"
},
dual:"oko {{count}} mjeseca",
other:"oko {{count}} mjeseci"
},
xMonths:{
one:{
standalone:"1 mjesec",
withPrepositionAgo:"1 mjesec",
withPrepositionIn:"1 mjesec"
},
dual:"{{count}} mjeseca",
other:"{{count}} mjeseci"
},
aboutXYears:{
one:{
standalone:"oko 1 godinu",
withPrepositionAgo:"oko 1 godinu",
withPrepositionIn:"oko 1 godinu"
},
dual:"oko {{count}} godine",
other:"oko {{count}} godina"
},
xYears:{
one:{
standalone:"1 godina",
withPrepositionAgo:"1 godine",
withPrepositionIn:"1 godinu"
},
dual:"{{count}} godine",
other:"{{count}} godina"
},
overXYears:{
one:{
standalone:"preko 1 godinu",
withPrepositionAgo:"preko 1 godinu",
withPrepositionIn:"preko 1 godinu"
},
dual:"preko {{count}} godine",
other:"preko {{count}} godina"
},
almostXYears:{
one:{
standalone:"gotovo 1 godinu",
withPrepositionAgo:"gotovo 1 godinu",
withPrepositionIn:"gotovo 1 godinu"
},
dual:"gotovo {{count}} godine",
other:"gotovo {{count}} godina"
}
};
var formatDistance$72=function formatDistance$72(token,count,options){
var result;
var tokenValue=formatDistanceLocale$71[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1){if(options!==null&&options!==void 0&&options.addSuffix){if(options.comparison&&options.comparison>0)result=tokenValue.one.withPrepositionIn;else
result=tokenValue.one.withPrepositionAgo;}else
result=tokenValue.one.standalone;}else
if(count%10>1&&count%10<5&&String(count).substr(-2,1)!=="1")result=tokenValue.dual.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"za "+result;else
return"prije "+result;
return result;
};
var formatLong$80={
date:buildFormatLongFn({
formats:{
full:"EEEE, d. MMMM yyyy.",
long:"d. MMMM yyyy.",
medium:"d. MMM yy.",
short:"dd. MM. yy."
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss (zzzz)",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'u' {{time}}",
long:"{{date}} 'u' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/bs/_lib/formatRelative.js
var formatRelativeLocale$72={
lastWeek:function lastWeek(date){
switch(date.getDay()){
case 0:return"'prošle nedjelje u' p";
case 3:return"'prošle srijede u' p";
case 6:return"'prošle subote u' p";
default:return"'prošli' EEEE 'u' p";
}
},
yesterday:"'juče u' p",
today:"'danas u' p",
tomorrow:"'sutra u' p",
nextWeek:function nextWeek(date){
switch(date.getDay()){
case 0:return"'sljedeće nedjelje u' p";
case 3:return"'sljedeću srijedu u' p";
case 6:return"'sljedeću subotu u' p";
default:return"'sljedeći' EEEE 'u' p";
}
},
other:"P"
};
var formatRelative$72=function formatRelative$72(token,date,_baseDate,_options){
var format=formatRelativeLocale$72[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/bs/_lib/localize.js
var eraValues$72={
narrow:["pr.n.e.","AD"],
abbreviated:["pr. Hr.","po. Hr."],
wide:["Prije Hrista","Poslije Hrista"]
};
var quarterValues$72={
narrow:[
"1.",
"2.",
"3.",
"4."],

abbreviated:[
"1. kv.",
"2. kv.",
"3. kv.",
"4. kv."],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$72={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"maj",
"jun",
"jul",
"avg",
"sep",
"okt",
"nov",
"dec"],

wide:[
"januar",
"februar",
"mart",
"april",
"maj",
"juni",
"juli",
"avgust",
"septembar",
"oktobar",
"novembar",
"decembar"]

};
var formattingMonthValues$16={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"maj",
"jun",
"jul",
"avg",
"sep",
"okt",
"nov",
"dec"],

wide:[
"januar",
"februar",
"mart",
"april",
"maj",
"juni",
"juli",
"avgust",
"septembar",
"oktobar",
"novembar",
"decembar"]

};
var dayValues$72={
narrow:[
"N",
"P",
"U",
"S",
"Č",
"P",
"S"],

short:[
"ned",
"pon",
"uto",
"sre",
"čet",
"pet",
"sub"],

abbreviated:[
"ned",
"pon",
"uto",
"sre",
"čet",
"pet",
"sub"],

wide:[
"nedjelja",
"ponedjeljak",
"utorak",
"srijeda",
"četvrtak",
"petak",
"subota"]

};
var dayPeriodValues$72={
narrow:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
wide:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"poslije podne",
evening:"uveče",
night:"noću"
}
};
var formattingDayPeriodValues$57={
narrow:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
wide:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"poslije podne",
evening:"uveče",
night:"noću"
}
};
var ordinalNumber$72=function ordinalNumber$72(dirtyNumber,_options){
var number=Number(dirtyNumber);
return String(number)+".";
};
//#endregion
//#region dist/date-fns/locale/bs.js
/**
* @category Locales
* @summary Bosnian locale.
* @language Bosnian
* @iso-639-2 bos
* @author Branislav Lazić [@branislavlazic](https://github.com/branislavlazic)
*/
var _bs={
code:"bs",
formatDistance:formatDistance$72,
formatLong:formatLong$80,
formatRelative:formatRelative$72,
localize:{
ordinalNumber:ordinalNumber$72,
era:buildLocalizeFn({
values:eraValues$72,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$72,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$72,
defaultWidth:"wide",
formattingValues:formattingMonthValues$16,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$72,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$72,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$57,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(pr\.n\.e\.|AD)/i,
abbreviated:/^(pr\.\s?Hr\.|po\.\s?Hr\.)/i,
wide:/^(Prije Hrista|prije nove ere|Poslije Hrista|nova era)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^pr/i,/^(po|nova)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]\.\s?kv\.?/i,
wide:/^[1234]\. kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(10|11|12|[123456789])\./i,
abbreviated:/^(jan|feb|mar|apr|maj|jun|jul|avg|sep|okt|nov|dec)/i,
wide:/^((januar|januara)|(februar|februara)|(mart|marta)|(april|aprila)|(maj|maja)|(juni|juna)|(juli|jula)|(avgust|avgusta)|(septembar|septembra)|(oktobar|oktobra)|(novembar|novembra)|(decembar|decembra))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^1/i,
/^2/i,
/^3/i,
/^4/i,
/^5/i,
/^6/i,
/^7/i,
/^8/i,
/^9/i,
/^10/i,
/^11/i,
/^12/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^avg/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[npusčc]/i,
short:/^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
abbreviated:/^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
wide:/^(nedjelja|ponedjeljak|utorak|srijeda|(četvrtak|cetvrtak)|petak|subota)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^w/i,
/^t/i,
/^f/i,
/^s/i],

any:[
/^su/i,
/^m/i,
/^tu/i,
/^w/i,
/^th/i,
/^f/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|ponoc|ponoć|(po)?podne|uvece|uveče|noću|poslije podne|ujutru)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^pono/i,
noon:/^pod/i,
morning:/jutro/i,
afternoon:/(poslije\s|po)+podne/i,
evening:/(uvece|uveče)/i,
night:/(nocu|noću)/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/ca/_lib/formatDistance.js
/**
* Davant de les xifres que es diuen amb vocal inicial, 1 i 11, s'apostrofen els articles el i la i la preposició de igual que si estiguessin escrits amb lletres.
*    l'1 de juliol ('l'u')
*    l'11 de novembre ('l'onze')
*    l'11a clàusula del contracte ('l'onzena')
*    la contractació d'11 jugadors ('d'onze')
*    l'aval d'11.000 socis ('d'onze mil')
*
* Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=apostrofaci%25F3+davant+xifres&action=Principal&method=detall_completa&numPagina=1&idHit=11236&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=11236&titol=apostrofaci%F3%20davant%20de%20xifres%20%2F%20apostrofaci%F3%20davant%20de%201%20i%2011&numeroResultat=1&clickLink=detall&tipusCerca=cerca.normes
*/
var formatDistanceLocale$70={
lessThanXSeconds:{
one:"menys d'un segon",
eleven:"menys d'onze segons",
other:"menys de {{count}} segons"
},
xSeconds:{
one:"1 segon",
other:"{{count}} segons"
},
halfAMinute:"mig minut",
lessThanXMinutes:{
one:"menys d'un minut",
eleven:"menys d'onze minuts",
other:"menys de {{count}} minuts"
},
xMinutes:{
one:"1 minut",
other:"{{count}} minuts"
},
aboutXHours:{
one:"aproximadament una hora",
other:"aproximadament {{count}} hores"
},
xHours:{
one:"1 hora",
other:"{{count}} hores"
},
xDays:{
one:"1 dia",
other:"{{count}} dies"
},
aboutXWeeks:{
one:"aproximadament una setmana",
other:"aproximadament {{count}} setmanes"
},
xWeeks:{
one:"1 setmana",
other:"{{count}} setmanes"
},
aboutXMonths:{
one:"aproximadament un mes",
other:"aproximadament {{count}} mesos"
},
xMonths:{
one:"1 mes",
other:"{{count}} mesos"
},
aboutXYears:{
one:"aproximadament un any",
other:"aproximadament {{count}} anys"
},
xYears:{
one:"1 any",
other:"{{count}} anys"
},
overXYears:{
one:"més d'un any",
eleven:"més d'onze anys",
other:"més de {{count}} anys"
},
almostXYears:{
one:"gairebé un any",
other:"gairebé {{count}} anys"
}
};
var formatDistance$71=function formatDistance$71(token,count,options){
var result;
var tokenValue=formatDistanceLocale$70[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===11&&tokenValue.eleven)result=tokenValue.eleven;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"en "+result;else
return"fa "+result;
return result;
};
var formatLong$79={
date:buildFormatLongFn({
formats:{
full:"EEEE, d 'de' MMMM y",
long:"d 'de' MMMM y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'a les' {{time}}",
long:"{{date}} 'a les' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ca/_lib/formatRelative.js
var formatRelativeLocale$71={
lastWeek:"'el' eeee 'passat a la' LT",
yesterday:"'ahir a la' p",
today:"'avui a la' p",
tomorrow:"'demà a la' p",
nextWeek:"eeee 'a la' p",
other:"P"
};
var formatRelativeLocalePlural$3={
lastWeek:"'el' eeee 'passat a les' p",
yesterday:"'ahir a les' p",
today:"'avui a les' p",
tomorrow:"'demà a les' p",
nextWeek:"eeee 'a les' p",
other:"P"
};
var formatRelative$71=function formatRelative$71(token,date,_baseDate,_options){
if(date.getHours()!==1)return formatRelativeLocalePlural$3[token];
return formatRelativeLocale$71[token];
};
//#endregion
//#region dist/date-fns/locale/ca/_lib/localize.js
/**
* General information
* Reference: https://aplicacions.llengua.gencat.cat
* Reference: https://www.uoc.edu/portal/ca/servei-linguistic/convencions/abreviacions/simbols/simbols-habituals.html
*/
/**
* Abans de Crist: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=abans+de+crist&action=Principal&method=detall_completa&numPagina=1&idHit=6876&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=6876&titol=abans%20de%20Crist%20(abreviatura)%20/%20abans%20de%20Crist%20(sigla)&numeroResultat=1&clickLink=detall&tipusCerca=cerca.fitxes
* Desprest de Crist: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=despr%E9s+de+crist&action=Principal&method=detall_completa&numPagina=1&idHit=6879&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=6879&titol=despr%E9s%20de%20Crist%20(sigla)%20/%20despr%E9s%20de%20Crist%20(abreviatura)&numeroResultat=1&clickLink=detall&tipusCerca=cerca.fitxes
*/
var eraValues$71={
narrow:["aC","dC"],
abbreviated:["a. de C.","d. de C."],
wide:["abans de Crist","després de Crist"]
};
var quarterValues$71={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"1r trimestre",
"2n trimestre",
"3r trimestre",
"4t trimestre"]

};
/**
* Dins d'un text convé fer servir la forma sencera dels mesos, ja que sempre és més clar el mot sencer que l'abreviatura, encara que aquesta sigui força coneguda.
* Cal reservar, doncs, les abreviatures per a les llistes o classificacions, els gràfics, les taules o quadres estadístics, els textos publicitaris, etc.
*
* Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=abreviacions+mesos&action=Principal&method=detall_completa&numPagina=1&idHit=8402&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=8402&titol=abreviatures%20dels%20mesos%20de%20l%27any&numeroResultat=5&clickLink=detall&tipusCerca=cerca.fitxes
*/
var monthValues$71={
narrow:[
"GN",
"FB",
"MÇ",
"AB",
"MG",
"JN",
"JL",
"AG",
"ST",
"OC",
"NV",
"DS"],

/**
	* Les abreviatures dels mesos de l'any es formen seguint una de les normes generals de formació d'abreviatures.
	* S'escriu la primera síl·laba i les consonants de la síl·laba següent anteriors a la primera vocal.
	* Els mesos de març, maig i juny no s'abreugen perquè són paraules d'una sola síl·laba.
	*/
abbreviated:[
"gen.",
"febr.",
"març",
"abr.",
"maig",
"juny",
"jul.",
"ag.",
"set.",
"oct.",
"nov.",
"des."],

wide:[
"gener",
"febrer",
"març",
"abril",
"maig",
"juny",
"juliol",
"agost",
"setembre",
"octubre",
"novembre",
"desembre"]

};
/**
* Les abreviatures dels dies de la setmana comencen totes amb la lletra d.
* Tot seguit porten la consonant següent a la i, excepte en el cas de dimarts, dimecres i diumenge, en què aquesta consonant és la m i, per tant, hi podria haver confusió.
* Per evitar-ho, s'ha substituït la m per una t (en el cas de dimarts), una c (en el cas de dimecres) i una g (en el cas de diumenge), respectivament.
*
* Seguint la norma general d'ús de les abreviatures, les dels dies de la setmana sempre porten punt final.
* Igualment, van amb la primera lletra en majúscula quan la paraula sencera també hi aniria.
* En canvi, van amb la primera lletra en minúscula quan la inicial de la paraula sencera també hi aniria.
*
* Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?input_cercar=abreviatures+dies&action=Principal&method=detall_completa&numPagina=1&idHit=8387&database=FITXES_PUB&tipusFont=Fitxes%20de%20l%27Optimot&idFont=8387&titol=abreviatures%20dels%20dies%20de%20la%20setmana&numeroResultat=1&clickLink=detall&tipusCerca=cerca.tot
*/
var dayValues$71={
narrow:[
"dg.",
"dl.",
"dt.",
"dm.",
"dj.",
"dv.",
"ds."],

short:[
"dg.",
"dl.",
"dt.",
"dm.",
"dj.",
"dv.",
"ds."],

abbreviated:[
"dg.",
"dl.",
"dt.",
"dm.",
"dj.",
"dv.",
"ds."],

wide:[
"diumenge",
"dilluns",
"dimarts",
"dimecres",
"dijous",
"divendres",
"dissabte"]

};
/**
* Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/index.html?action=Principal&method=detall&input_cercar=parts+del+dia&numPagina=1&database=FITXES_PUB&idFont=12801&idHit=12801&tipusFont=Fitxes+de+l%27Optimot&numeroResultat=1&databases_avansada=&categories_avansada=&clickLink=detall&titol=Nom+de+les+parts+del+dia&tematica=&tipusCerca=cerca.fitxes
*/
var dayPeriodValues$71={
narrow:{
am:"am",
pm:"pm",
midnight:"mitjanit",
noon:"migdia",
morning:"matí",
afternoon:"tarda",
evening:"vespre",
night:"nit"
},
abbreviated:{
am:"a.m.",
pm:"p.m.",
midnight:"mitjanit",
noon:"migdia",
morning:"matí",
afternoon:"tarda",
evening:"vespre",
night:"nit"
},
wide:{
am:"ante meridiem",
pm:"post meridiem",
midnight:"mitjanit",
noon:"migdia",
morning:"matí",
afternoon:"tarda",
evening:"vespre",
night:"nit"
}
};
var formattingDayPeriodValues$56={
narrow:{
am:"am",
pm:"pm",
midnight:"de la mitjanit",
noon:"del migdia",
morning:"del matí",
afternoon:"de la tarda",
evening:"del vespre",
night:"de la nit"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"de la mitjanit",
noon:"del migdia",
morning:"del matí",
afternoon:"de la tarda",
evening:"del vespre",
night:"de la nit"
},
wide:{
am:"ante meridiem",
pm:"post meridiem",
midnight:"de la mitjanit",
noon:"del migdia",
morning:"del matí",
afternoon:"de la tarda",
evening:"del vespre",
night:"de la nit"
}
};
/**
* Quan van en singular, els nombres ordinals es representen, en forma d’abreviatura, amb la xifra seguida de l’última lletra del mot desplegat.
* És optatiu posar punt després de la lletra.
*
* Reference: https://aplicacions.llengua.gencat.cat/llc/AppJava/pdf/abrevia.pdf#page=18
*/
var ordinalNumber$71=function ordinalNumber$71(dirtyNumber,_options){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100>20||rem100<10)switch(rem100%10){
case 1:return number+"r";
case 2:return number+"n";
case 3:return number+"r";
case 4:return number+"t";
}
return number+"è";
};
//#endregion
//#region dist/date-fns/locale/ca.js
/**
* @category Locales
* @summary Catalan locale.
* @language Catalan
* @iso-639-2 cat
* @author Guillermo Grau [@guigrpa](https://github.com/guigrpa)
* @author Alex Vizcaino [@avizcaino](https://github.com/avizcaino)
*/
var _ca={
code:"ca",
formatDistance:formatDistance$71,
formatLong:formatLong$79,
formatRelative:formatRelative$71,
localize:{
ordinalNumber:ordinalNumber$71,
era:buildLocalizeFn({
values:eraValues$71,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$71,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$71,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$71,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$71,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$56,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(è|r|n|r|t)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(aC|dC)/i,
abbreviated:/^(a. de C.|d. de C.)/i,
wide:/^(abans de Crist|despr[eé]s de Crist)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[/^aC/i,/^dC/i],
abbreviated:[/^(a. de C.)/i,/^(d. de C.)/i],
wide:[/^(abans de Crist)/i,/^(despr[eé]s de Crist)/i]
},
defaultParseWidth:"wide"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^T[1234]/i,
wide:/^[1234](è|r|n|r|t)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(GN|FB|MÇ|AB|MG|JN|JL|AG|ST|OC|NV|DS)/i,
abbreviated:/^(gen.|febr.|març|abr.|maig|juny|jul.|ag.|set.|oct.|nov.|des.)/i,
wide:/^(gener|febrer|març|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^GN/i,
/^FB/i,
/^MÇ/i,
/^AB/i,
/^MG/i,
/^JN/i,
/^JL/i,
/^AG/i,
/^ST/i,
/^OC/i,
/^NV/i,
/^DS/i],

abbreviated:[
/^gen./i,
/^febr./i,
/^març/i,
/^abr./i,
/^maig/i,
/^juny/i,
/^jul./i,
/^ag./i,
/^set./i,
/^oct./i,
/^nov./i,
/^des./i],

wide:[
/^gener/i,
/^febrer/i,
/^març/i,
/^abril/i,
/^maig/i,
/^juny/i,
/^juliol/i,
/^agost/i,
/^setembre/i,
/^octubre/i,
/^novembre/i,
/^desembre/i]

},
defaultParseWidth:"wide"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(dg\.|dl\.|dt\.|dm\.|dj\.|dv\.|ds\.)/i,
short:/^(dg\.|dl\.|dt\.|dm\.|dj\.|dv\.|ds\.)/i,
abbreviated:/^(dg\.|dl\.|dt\.|dm\.|dj\.|dv\.|ds\.)/i,
wide:/^(diumenge|dilluns|dimarts|dimecres|dijous|divendres|dissabte)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^dg./i,
/^dl./i,
/^dt./i,
/^dm./i,
/^dj./i,
/^dv./i,
/^ds./i],

abbreviated:[
/^dg./i,
/^dl./i,
/^dt./i,
/^dm./i,
/^dj./i,
/^dv./i,
/^ds./i],

wide:[
/^diumenge/i,
/^dilluns/i,
/^dimarts/i,
/^dimecres/i,
/^dijous/i,
/^divendres/i,
/^disssabte/i]

},
defaultParseWidth:"wide"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mn|md|(del|de la) (matí|tarda|vespre|nit))/i,
abbreviated:/^([ap]\.?\s?m\.?|mitjanit|migdia|(del|de la) (matí|tarda|vespre|nit))/i,
wide:/^(ante meridiem|post meridiem|mitjanit|migdia|(del|de la) (matí|tarda|vespre|nit))/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mitjanit/i,
noon:/^migdia/i,
morning:/matí/i,
afternoon:/tarda/i,
evening:/vespre/i,
night:/nit/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/ckb/_lib/formatDistance.js
var formatDistanceLocale$69={
lessThanXSeconds:{
one:"کەمتر لە یەک چرکە",
other:"کەمتر لە {{count}} چرکە"
},
xSeconds:{
one:"1 چرکە",
other:"{{count}} چرکە"
},
halfAMinute:"نیو کاتژمێر",
lessThanXMinutes:{
one:"کەمتر لە یەک خولەک",
other:"کەمتر لە {{count}} خولەک"
},
xMinutes:{
one:"1 خولەک",
other:"{{count}} خولەک"
},
aboutXHours:{
one:"دەوروبەری 1 کاتژمێر",
other:"دەوروبەری {{count}} کاتژمێر"
},
xHours:{
one:"1 کاتژمێر",
other:"{{count}} کاتژمێر"
},
xDays:{
one:"1 ڕۆژ",
other:"{{count}} ژۆژ"
},
aboutXWeeks:{
one:"دەوروبەری 1 هەفتە",
other:"دوروبەری {{count}} هەفتە"
},
xWeeks:{
one:"1 هەفتە",
other:"{{count}} هەفتە"
},
aboutXMonths:{
one:"داوروبەری 1 مانگ",
other:"دەوروبەری {{count}} مانگ"
},
xMonths:{
one:"1 مانگ",
other:"{{count}} مانگ"
},
aboutXYears:{
one:"دەوروبەری  1 ساڵ",
other:"دەوروبەری {{count}} ساڵ"
},
xYears:{
one:"1 ساڵ",
other:"{{count}} ساڵ"
},
overXYears:{
one:"زیاتر لە ساڵێک",
other:"زیاتر لە {{count}} ساڵ"
},
almostXYears:{
one:"بەنزیکەیی ساڵێک  ",
other:"بەنزیکەیی {{count}} ساڵ"
}
};
var formatDistance$70=function formatDistance$70(token,count,options){
var result;
var tokenValue=formatDistanceLocale$69[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"لە ماوەی "+result+"دا";else
return result+"پێش ئێستا";
return result;
};
var formatLong$78={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'کاتژمێر' {{time}}",
long:"{{date}} 'کاتژمێر' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ckb/_lib/formatRelative.js
var formatRelativeLocale$70={
lastWeek:"'هەفتەی ڕابردوو' eeee 'کاتژمێر' p",
yesterday:"'دوێنێ کاتژمێر' p",
today:"'ئەمڕۆ کاتژمێر' p",
tomorrow:"'بەیانی کاتژمێر' p",
nextWeek:"eeee 'کاتژمێر' p",
other:"P"
};
var formatRelative$70=function formatRelative$70(token,_date,_baseDate,_options){return formatRelativeLocale$70[token];};
//#endregion
//#region dist/date-fns/locale/ckb/_lib/localize.js
var eraValues$70={
narrow:["پ","د"],
abbreviated:["پ-ز","د-ز"],
wide:["پێش زاین","دوای زاین"]
};
var quarterValues$70={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"چ1م",
"چ2م",
"چ3م",
"چ4م"],

wide:[
"چارەگی یەکەم",
"چارەگی دووەم",
"چارەگی سێیەم",
"چارەگی چوارەم"]

};
var monthValues$70={
narrow:[
"ک-د",
"ش",
"ئا",
"ن",
"م",
"ح",
"ت",
"ئا",
"ئە",
"تش-ی",
"تش-د",
"ک-ی"],

abbreviated:[
"کان-دوو",
"شوب",
"ئاد",
"نیس",
"مایس",
"حوز",
"تەم",
"ئاب",
"ئەل",
"تش-یەک",
"تش-دوو",
"کان-یەک"],

wide:[
"کانوونی دووەم",
"شوبات",
"ئادار",
"نیسان",
"مایس",
"حوزەیران",
"تەمموز",
"ئاب",
"ئەیلول",
"تشرینی یەکەم",
"تشرینی دووەم",
"کانوونی یەکەم"]

};
var dayValues$70={
narrow:[
"ی-ش",
"د-ش",
"س-ش",
"چ-ش",
"پ-ش",
"هە",
"ش"],

short:[
"یە-شە",
"دوو-شە",
"سێ-شە",
"چو-شە",
"پێ-شە",
"هەی",
"شە"],

abbreviated:[
"یەک-شەم",
"دوو-شەم",
"سێ-شەم",
"چوار-شەم",
"پێنج-شەم",
"هەینی",
"شەمە"],

wide:[
"یەک شەمە",
"دوو شەمە",
"سێ شەمە",
"چوار شەمە",
"پێنج شەمە",
"هەینی",
"شەمە"]

};
var dayPeriodValues$70={
narrow:{
am:"پ",
pm:"د",
midnight:"ن-ش",
noon:"ن",
morning:"بەیانی",
afternoon:"دوای نیوەڕۆ",
evening:"ئێوارە",
night:"شەو"
},
abbreviated:{
am:"پ-ن",
pm:"د-ن",
midnight:"نیوە شەو",
noon:"نیوەڕۆ",
morning:"بەیانی",
afternoon:"دوای نیوەڕۆ",
evening:"ئێوارە",
night:"شەو"
},
wide:{
am:"پێش نیوەڕۆ",
pm:"دوای نیوەڕۆ",
midnight:"نیوە شەو",
noon:"نیوەڕۆ",
morning:"بەیانی",
afternoon:"دوای نیوەڕۆ",
evening:"ئێوارە",
night:"شەو"
}
};
var formattingDayPeriodValues$55={
narrow:{
am:"پ",
pm:"د",
midnight:"ن-ش",
noon:"ن",
morning:"لە بەیانیدا",
afternoon:"لە دوای نیوەڕۆدا",
evening:"لە ئێوارەدا",
night:"لە شەودا"
},
abbreviated:{
am:"پ-ن",
pm:"د-ن",
midnight:"نیوە شەو",
noon:"نیوەڕۆ",
morning:"لە بەیانیدا",
afternoon:"لە دوای نیوەڕۆدا",
evening:"لە ئێوارەدا",
night:"لە شەودا"
},
wide:{
am:"پێش نیوەڕۆ",
pm:"دوای نیوەڕۆ",
midnight:"نیوە شەو",
noon:"نیوەڕۆ",
morning:"لە بەیانیدا",
afternoon:"لە دوای نیوەڕۆدا",
evening:"لە ئێوارەدا",
night:"لە شەودا"
}
};
var ordinalNumber$70=function ordinalNumber$70(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ckb.js
/**
* @type {Locale}
* @category Locales
* @summary Central Kurdish locale.
* @language Central Kurdish
* @iso-639-2 kur
* @author Revan Sarbast [@Revan99]{@link https://github.com/Revan99}
*/
var _ckb={
code:"ckb",
formatDistance:formatDistance$70,
formatLong:formatLong$78,
formatRelative:formatRelative$70,
localize:{
ordinalNumber:ordinalNumber$70,
era:buildLocalizeFn({
values:eraValues$70,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$70,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$70,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$70,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$70,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$55,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(پ|د)/i,
abbreviated:/^(پ-ز|د.ز)/i,
wide:/^(پێش زاین| دوای زاین)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^د/g,/^پ/g]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^م[1234]چ/i,
wide:/^(یەکەم|دووەم|سێیەم| چوارەم) (چارەگی)? quarter/i
},
defaultMatchWidth:"wide",
parsePatterns:{
wide:[
/چارەگی یەکەم/,
/چارەگی دووەم/,
/چارەگی سيیەم/,
/چارەگی چوارەم/],

any:[
/1/i,
/2/i,
/3/i,
/4/i]

},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(ک-د|ش|ئا|ن|م|ح|ت|ئە|تش-ی|تش-د|ک-ی)/i,
abbreviated:/^(کان-دوو|شوب|ئاد|نیس|مایس|حوز|تەم|ئاب|ئەل|تش-یەک|تش-دوو|کان-یەک)/i,
wide:/^(کانوونی دووەم|شوبات|ئادار|نیسان|مایس|حوزەیران|تەمموز|ئاب|ئەیلول|تشرینی یەکەم|تشرینی دووەم|کانوونی یەکەم)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ک-د/i,
/^ش/i,
/^ئا/i,
/^ن/i,
/^م/i,
/^ح/i,
/^ت/i,
/^ئا/i,
/^ئە/i,
/^تش-ی/i,
/^تش-د/i,
/^ک-ی/i],

any:[
/^کان-دوو/i,
/^شوب/i,
/^ئاد/i,
/^نیس/i,
/^مایس/i,
/^حوز/i,
/^تەم/i,
/^ئاب/i,
/^ئەل/i,
/^تش-یەک/i,
/^تش-دوو/i,
/^|کان-یەک/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ش|ی|د|س|چ|پ|هە)/i,
short:/^(یە-شە|دوو-شە|سێ-شە|چو-شە|پێ-شە|هە|شە)/i,
abbreviated:/^(یەک-شەم|دوو-شەم|سێ-شەم|چوار-شەم|پێنخ-شەم|هەینی|شەمە)/i,
wide:/^(یەک شەمە|دوو شەمە|سێ شەمە|چوار شەمە|پێنج شەمە|هەینی|شەمە)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^w/i,
/^t/i,
/^f/i,
/^s/i],

any:[
/^su/i,
/^m/i,
/^tu/i,
/^w/i,
/^th/i,
/^f/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(پ|د|ن-ش|ن| (بەیانی|دوای نیوەڕۆ|ئێوارە|شەو))/i,
abbreviated:/^(پ-ن|د-ن|نیوە شەو|نیوەڕۆ|بەیانی|دوای نیوەڕۆ|ئێوارە|شەو)/,
wide:/^(پێش نیوەڕۆ|دوای نیوەڕۆ|نیوەڕۆ|نیوە شەو|لەبەیانیدا|لەدواینیوەڕۆدا|لە ئێوارەدا|لە شەودا)/,
any:/^(پ|د|بەیانی|نیوەڕۆ|ئێوارە|شەو)/
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^د/i,
pm:/^پ/i,
midnight:/^ن-ش/i,
noon:/^ن/i,
morning:/بەیانی/i,
afternoon:/دواینیوەڕۆ/i,
evening:/ئێوارە/i,
night:/شەو/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/cs/_lib/formatDistance.js
var formatDistanceLocale$68={
lessThanXSeconds:{
one:{
regular:"méně než 1 sekunda",
past:"před méně než 1 sekundou",
future:"za méně než 1 sekundu"
},
few:{
regular:"méně než {{count}} sekundy",
past:"před méně než {{count}} sekundami",
future:"za méně než {{count}} sekundy"
},
many:{
regular:"méně než {{count}} sekund",
past:"před méně než {{count}} sekundami",
future:"za méně než {{count}} sekund"
}
},
xSeconds:{
one:{
regular:"1 sekunda",
past:"před 1 sekundou",
future:"za 1 sekundu"
},
few:{
regular:"{{count}} sekundy",
past:"před {{count}} sekundami",
future:"za {{count}} sekundy"
},
many:{
regular:"{{count}} sekund",
past:"před {{count}} sekundami",
future:"za {{count}} sekund"
}
},
halfAMinute:{
type:"other",
other:{
regular:"půl minuty",
past:"před půl minutou",
future:"za půl minuty"
}
},
lessThanXMinutes:{
one:{
regular:"méně než 1 minuta",
past:"před méně než 1 minutou",
future:"za méně než 1 minutu"
},
few:{
regular:"méně než {{count}} minuty",
past:"před méně než {{count}} minutami",
future:"za méně než {{count}} minuty"
},
many:{
regular:"méně než {{count}} minut",
past:"před méně než {{count}} minutami",
future:"za méně než {{count}} minut"
}
},
xMinutes:{
one:{
regular:"1 minuta",
past:"před 1 minutou",
future:"za 1 minutu"
},
few:{
regular:"{{count}} minuty",
past:"před {{count}} minutami",
future:"za {{count}} minuty"
},
many:{
regular:"{{count}} minut",
past:"před {{count}} minutami",
future:"za {{count}} minut"
}
},
aboutXHours:{
one:{
regular:"přibližně 1 hodina",
past:"přibližně před 1 hodinou",
future:"přibližně za 1 hodinu"
},
few:{
regular:"přibližně {{count}} hodiny",
past:"přibližně před {{count}} hodinami",
future:"přibližně za {{count}} hodiny"
},
many:{
regular:"přibližně {{count}} hodin",
past:"přibližně před {{count}} hodinami",
future:"přibližně za {{count}} hodin"
}
},
xHours:{
one:{
regular:"1 hodina",
past:"před 1 hodinou",
future:"za 1 hodinu"
},
few:{
regular:"{{count}} hodiny",
past:"před {{count}} hodinami",
future:"za {{count}} hodiny"
},
many:{
regular:"{{count}} hodin",
past:"před {{count}} hodinami",
future:"za {{count}} hodin"
}
},
xDays:{
one:{
regular:"1 den",
past:"před 1 dnem",
future:"za 1 den"
},
few:{
regular:"{{count}} dny",
past:"před {{count}} dny",
future:"za {{count}} dny"
},
many:{
regular:"{{count}} dní",
past:"před {{count}} dny",
future:"za {{count}} dní"
}
},
aboutXWeeks:{
one:{
regular:"přibližně 1 týden",
past:"přibližně před 1 týdnem",
future:"přibližně za 1 týden"
},
few:{
regular:"přibližně {{count}} týdny",
past:"přibližně před {{count}} týdny",
future:"přibližně za {{count}} týdny"
},
many:{
regular:"přibližně {{count}} týdnů",
past:"přibližně před {{count}} týdny",
future:"přibližně za {{count}} týdnů"
}
},
xWeeks:{
one:{
regular:"1 týden",
past:"před 1 týdnem",
future:"za 1 týden"
},
few:{
regular:"{{count}} týdny",
past:"před {{count}} týdny",
future:"za {{count}} týdny"
},
many:{
regular:"{{count}} týdnů",
past:"před {{count}} týdny",
future:"za {{count}} týdnů"
}
},
aboutXMonths:{
one:{
regular:"přibližně 1 měsíc",
past:"přibližně před 1 měsícem",
future:"přibližně za 1 měsíc"
},
few:{
regular:"přibližně {{count}} měsíce",
past:"přibližně před {{count}} měsíci",
future:"přibližně za {{count}} měsíce"
},
many:{
regular:"přibližně {{count}} měsíců",
past:"přibližně před {{count}} měsíci",
future:"přibližně za {{count}} měsíců"
}
},
xMonths:{
one:{
regular:"1 měsíc",
past:"před 1 měsícem",
future:"za 1 měsíc"
},
few:{
regular:"{{count}} měsíce",
past:"před {{count}} měsíci",
future:"za {{count}} měsíce"
},
many:{
regular:"{{count}} měsíců",
past:"před {{count}} měsíci",
future:"za {{count}} měsíců"
}
},
aboutXYears:{
one:{
regular:"přibližně 1 rok",
past:"přibližně před 1 rokem",
future:"přibližně za 1 rok"
},
few:{
regular:"přibližně {{count}} roky",
past:"přibližně před {{count}} roky",
future:"přibližně za {{count}} roky"
},
many:{
regular:"přibližně {{count}} roků",
past:"přibližně před {{count}} roky",
future:"přibližně za {{count}} roků"
}
},
xYears:{
one:{
regular:"1 rok",
past:"před 1 rokem",
future:"za 1 rok"
},
few:{
regular:"{{count}} roky",
past:"před {{count}} roky",
future:"za {{count}} roky"
},
many:{
regular:"{{count}} roků",
past:"před {{count}} roky",
future:"za {{count}} roků"
}
},
overXYears:{
one:{
regular:"více než 1 rok",
past:"před více než 1 rokem",
future:"za více než 1 rok"
},
few:{
regular:"více než {{count}} roky",
past:"před více než {{count}} roky",
future:"za více než {{count}} roky"
},
many:{
regular:"více než {{count}} roků",
past:"před více než {{count}} roky",
future:"za více než {{count}} roků"
}
},
almostXYears:{
one:{
regular:"skoro 1 rok",
past:"skoro před 1 rokem",
future:"skoro za 1 rok"
},
few:{
regular:"skoro {{count}} roky",
past:"skoro před {{count}} roky",
future:"skoro za {{count}} roky"
},
many:{
regular:"skoro {{count}} roků",
past:"skoro před {{count}} roky",
future:"skoro za {{count}} roků"
}
}
};
var formatDistance$69=function formatDistance$69(token,count,options){
var pluralResult;
var tokenValue=formatDistanceLocale$68[token];
if(tokenValue.type==="other")pluralResult=tokenValue.other;else
if(count===1)pluralResult=tokenValue.one;else
if(count>1&&count<5)pluralResult=tokenValue.few;else
pluralResult=tokenValue.many;
var suffixExist=(options===null||options===void 0?void 0:options.addSuffix)===true;
var comparison=options===null||options===void 0?void 0:options.comparison;
var timeResult;
if(suffixExist&&comparison===-1)timeResult=pluralResult.past;else
if(suffixExist&&comparison===1)timeResult=pluralResult.future;else
timeResult=pluralResult.regular;
return timeResult.replace("{{count}}",String(count));
};
var formatLong$77={
date:buildFormatLongFn({
formats:{
full:"EEEE, d. MMMM yyyy",
long:"d. MMMM yyyy",
medium:"d. M. yyyy",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'v' {{time}}",
long:"{{date}} 'v' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/cs/_lib/formatRelative.js
var accusativeWeekdays$5=[
"neděli",
"pondělí",
"úterý",
"středu",
"čtvrtek",
"pátek",
"sobotu"];

var formatRelativeLocale$69={
lastWeek:"'poslední' eeee 've' p",
yesterday:"'včera v' p",
today:"'dnes v' p",
tomorrow:"'zítra v' p",
nextWeek:function nextWeek(date){
return"'v "+accusativeWeekdays$5[date.getDay()]+" o' p";
},
other:"P"
};
var formatRelative$69=function formatRelative$69(token,date){
var format=formatRelativeLocale$69[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/cs/_lib/localize.js
var eraValues$69={
narrow:["př. n. l.","n. l."],
abbreviated:["př. n. l.","n. l."],
wide:["před naším letopočtem","našeho letopočtu"]
};
var quarterValues$69={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1. čtvrtletí",
"2. čtvrtletí",
"3. čtvrtletí",
"4. čtvrtletí"],

wide:[
"1. čtvrtletí",
"2. čtvrtletí",
"3. čtvrtletí",
"4. čtvrtletí"]

};
var monthValues$69={
narrow:[
"L",
"Ú",
"B",
"D",
"K",
"Č",
"Č",
"S",
"Z",
"Ř",
"L",
"P"],

abbreviated:[
"led",
"úno",
"bře",
"dub",
"kvě",
"čvn",
"čvc",
"srp",
"zář",
"říj",
"lis",
"pro"],

wide:[
"leden",
"únor",
"březen",
"duben",
"květen",
"červen",
"červenec",
"srpen",
"září",
"říjen",
"listopad",
"prosinec"]

};
var formattingMonthValues$15={
narrow:[
"L",
"Ú",
"B",
"D",
"K",
"Č",
"Č",
"S",
"Z",
"Ř",
"L",
"P"],

abbreviated:[
"led",
"úno",
"bře",
"dub",
"kvě",
"čvn",
"čvc",
"srp",
"zář",
"říj",
"lis",
"pro"],

wide:[
"ledna",
"února",
"března",
"dubna",
"května",
"června",
"července",
"srpna",
"září",
"října",
"listopadu",
"prosince"]

};
var dayValues$69={
narrow:[
"ne",
"po",
"út",
"st",
"čt",
"pá",
"so"],

short:[
"ne",
"po",
"út",
"st",
"čt",
"pá",
"so"],

abbreviated:[
"ned",
"pon",
"úte",
"stř",
"čtv",
"pát",
"sob"],

wide:[
"neděle",
"pondělí",
"úterý",
"středa",
"čtvrtek",
"pátek",
"sobota"]

};
var dayPeriodValues$69={
narrow:{
am:"dop.",
pm:"odp.",
midnight:"půlnoc",
noon:"poledne",
morning:"ráno",
afternoon:"odpoledne",
evening:"večer",
night:"noc"
},
abbreviated:{
am:"dop.",
pm:"odp.",
midnight:"půlnoc",
noon:"poledne",
morning:"ráno",
afternoon:"odpoledne",
evening:"večer",
night:"noc"
},
wide:{
am:"dopoledne",
pm:"odpoledne",
midnight:"půlnoc",
noon:"poledne",
morning:"ráno",
afternoon:"odpoledne",
evening:"večer",
night:"noc"
}
};
var formattingDayPeriodValues$54={
narrow:{
am:"dop.",
pm:"odp.",
midnight:"půlnoc",
noon:"poledne",
morning:"ráno",
afternoon:"odpoledne",
evening:"večer",
night:"noc"
},
abbreviated:{
am:"dop.",
pm:"odp.",
midnight:"půlnoc",
noon:"poledne",
morning:"ráno",
afternoon:"odpoledne",
evening:"večer",
night:"noc"
},
wide:{
am:"dopoledne",
pm:"odpoledne",
midnight:"půlnoc",
noon:"poledne",
morning:"ráno",
afternoon:"odpoledne",
evening:"večer",
night:"noc"
}
};
var ordinalNumber$69=function ordinalNumber$69(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/cs.js
/**
* @category Locales
* @summary Czech locale.
* @language Czech
* @iso-639-2 ces
* @author David Rus [@davidrus](https://github.com/davidrus)
* @author Pavel Hrách [@SilenY](https://github.com/SilenY)
* @author Jozef Bíroš [@JozefBiros](https://github.com/JozefBiros)
*/
var _cs={
code:"cs",
formatDistance:formatDistance$69,
formatLong:formatLong$77,
formatRelative:formatRelative$69,
localize:{
ordinalNumber:ordinalNumber$69,
era:buildLocalizeFn({
values:eraValues$69,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$69,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$69,
defaultWidth:"wide",
formattingValues:formattingMonthValues$15,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$69,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$69,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$54,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\.?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(p[řr](\.|ed) Kr\.|p[řr](\.|ed) n\. l\.|po Kr\.|n\. l\.)/i,
abbreviated:/^(p[řr](\.|ed) Kr\.|p[řr](\.|ed) n\. l\.|po Kr\.|n\. l\.)/i,
wide:/^(p[řr](\.|ed) Kristem|p[řr](\.|ed) na[šs][íi]m letopo[čc]tem|po Kristu|na[šs]eho letopo[čc]tu)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^p[řr]/i,/^(po|n)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]\. [čc]tvrtlet[íi]/i,
wide:/^[1234]\. [čc]tvrtlet[íi]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[lúubdkčcszřrlp]/i,
abbreviated:/^(led|[úu]no|b[řr]e|dub|kv[ěe]|[čc]vn|[čc]vc|srp|z[áa][řr]|[řr][íi]j|lis|pro)/i,
wide:/^(leden|ledna|[úu]nora?|b[řr]ezen|b[řr]ezna|duben|dubna|kv[ěe]ten|kv[ěe]tna|[čc]erven(ec|ce)?|[čc]ervna|srpen|srpna|z[áa][řr][íi]|[řr][íi]jen|[řr][íi]jna|listopad(a|u)?|prosinec|prosince)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^l/i,
/^[úu]/i,
/^b/i,
/^d/i,
/^k/i,
/^[čc]/i,
/^[čc]/i,
/^s/i,
/^z/i,
/^[řr]/i,
/^l/i,
/^p/i],

any:[
/^led/i,
/^[úu]n/i,
/^b[řr]e/i,
/^dub/i,
/^kv[ěe]/i,
/^[čc]vn|[čc]erven(?!\w)|[čc]ervna/i,
/^[čc]vc|[čc]erven(ec|ce)/i,
/^srp/i,
/^z[áa][řr]/i,
/^[řr][íi]j/i,
/^lis/i,
/^pro/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[npuúsčps]/i,
short:/^(ne|po|[úu]t|st|[čc]t|p[áa]|so)/i,
abbreviated:/^(ned|pon|[úu]te|st[rř]|[čc]tv|p[áa]t|sob)/i,
wide:/^(ned[ěe]le|pond[ěe]l[íi]|[úu]ter[ýy]|st[řr]eda|[čc]tvrtek|p[áa]tek|sobota)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^n/i,
/^p/i,
/^[úu]/i,
/^s/i,
/^[čc]/i,
/^p/i,
/^s/i],

any:[
/^ne/i,
/^po/i,
/^[úu]t/i,
/^st/i,
/^[čc]t/i,
/^p[áa]/i,
/^so/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^dopoledne|dop\.?|odpoledne|odp\.?|p[ůu]lnoc|poledne|r[áa]no|odpoledne|ve[čc]er|(v )?noci?/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^dop/i,
pm:/^odp/i,
midnight:/^p[ůu]lnoc/i,
noon:/^poledne/i,
morning:/r[áa]no/i,
afternoon:/odpoledne/i,
evening:/ve[čc]er/i,
night:/noc/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/cy/_lib/formatDistance.js
var formatDistanceLocale$67={
lessThanXSeconds:{
one:"llai na eiliad",
other:"llai na {{count}} eiliad"
},
xSeconds:{
one:"1 eiliad",
other:"{{count}} eiliad"
},
halfAMinute:"hanner munud",
lessThanXMinutes:{
one:"llai na munud",
two:"llai na 2 funud",
other:"llai na {{count}} munud"
},
xMinutes:{
one:"1 munud",
two:"2 funud",
other:"{{count}} munud"
},
aboutXHours:{
one:"tua 1 awr",
other:"tua {{count}} awr"
},
xHours:{
one:"1 awr",
other:"{{count}} awr"
},
xDays:{
one:"1 diwrnod",
two:"2 ddiwrnod",
other:"{{count}} diwrnod"
},
aboutXWeeks:{
one:"tua 1 wythnos",
two:"tua pythefnos",
other:"tua {{count}} wythnos"
},
xWeeks:{
one:"1 wythnos",
two:"pythefnos",
other:"{{count}} wythnos"
},
aboutXMonths:{
one:"tua 1 mis",
two:"tua 2 fis",
other:"tua {{count}} mis"
},
xMonths:{
one:"1 mis",
two:"2 fis",
other:"{{count}} mis"
},
aboutXYears:{
one:"tua 1 flwyddyn",
two:"tua 2 flynedd",
other:"tua {{count}} mlynedd"
},
xYears:{
one:"1 flwyddyn",
two:"2 flynedd",
other:"{{count}} mlynedd"
},
overXYears:{
one:"dros 1 flwyddyn",
two:"dros 2 flynedd",
other:"dros {{count}} mlynedd"
},
almostXYears:{
one:"bron 1 flwyddyn",
two:"bron 2 flynedd",
other:"bron {{count}} mlynedd"
}
};
var formatDistance$68=function formatDistance$68(token,count,options){
var result;
var tokenValue=formatDistanceLocale$67[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===2&&!!tokenValue.two)result=tokenValue.two;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"mewn "+result;else
return result+" yn ôl";
return result;
};
var formatLong$76={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'am' {{time}}",
long:"{{date}} 'am' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/cy/_lib/formatRelative.js
var formatRelativeLocale$68={
lastWeek:"eeee 'diwethaf am' p",
yesterday:"'ddoe am' p",
today:"'heddiw am' p",
tomorrow:"'yfory am' p",
nextWeek:"eeee 'am' p",
other:"P"
};
var formatRelative$68=function formatRelative$68(token,_date,_baseDate,_options){return formatRelativeLocale$68[token];};
//#endregion
//#region dist/date-fns/locale/cy/_lib/localize.js
var eraValues$68={
narrow:["C","O"],
abbreviated:["CC","OC"],
wide:["Cyn Crist","Ar ôl Crist"]
};
var quarterValues$68={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Ch1",
"Ch2",
"Ch3",
"Ch4"],

wide:[
"Chwarter 1af",
"2ail chwarter",
"3ydd chwarter",
"4ydd chwarter"]

};
var monthValues$68={
narrow:[
"I",
"Ch",
"Ma",
"E",
"Mi",
"Me",
"G",
"A",
"Md",
"H",
"T",
"Rh"],

abbreviated:[
"Ion",
"Chwe",
"Maw",
"Ebr",
"Mai",
"Meh",
"Gor",
"Aws",
"Med",
"Hyd",
"Tach",
"Rhag"],

wide:[
"Ionawr",
"Chwefror",
"Mawrth",
"Ebrill",
"Mai",
"Mehefin",
"Gorffennaf",
"Awst",
"Medi",
"Hydref",
"Tachwedd",
"Rhagfyr"]

};
var dayValues$68={
narrow:[
"S",
"Ll",
"M",
"M",
"I",
"G",
"S"],

short:[
"Su",
"Ll",
"Ma",
"Me",
"Ia",
"Gw",
"Sa"],

abbreviated:[
"Sul",
"Llun",
"Maw",
"Mer",
"Iau",
"Gwe",
"Sad"],

wide:[
"dydd Sul",
"dydd Llun",
"dydd Mawrth",
"dydd Mercher",
"dydd Iau",
"dydd Gwener",
"dydd Sadwrn"]

};
var dayPeriodValues$68={
narrow:{
am:"b",
pm:"h",
midnight:"hn",
noon:"hd",
morning:"bore",
afternoon:"prynhawn",
evening:"gyda'r nos",
night:"nos"
},
abbreviated:{
am:"yb",
pm:"yh",
midnight:"hanner nos",
noon:"hanner dydd",
morning:"bore",
afternoon:"prynhawn",
evening:"gyda'r nos",
night:"nos"
},
wide:{
am:"y.b.",
pm:"y.h.",
midnight:"hanner nos",
noon:"hanner dydd",
morning:"bore",
afternoon:"prynhawn",
evening:"gyda'r nos",
night:"nos"
}
};
var formattingDayPeriodValues$53={
narrow:{
am:"b",
pm:"h",
midnight:"hn",
noon:"hd",
morning:"yn y bore",
afternoon:"yn y prynhawn",
evening:"gyda'r nos",
night:"yn y nos"
},
abbreviated:{
am:"yb",
pm:"yh",
midnight:"hanner nos",
noon:"hanner dydd",
morning:"yn y bore",
afternoon:"yn y prynhawn",
evening:"gyda'r nos",
night:"yn y nos"
},
wide:{
am:"y.b.",
pm:"y.h.",
midnight:"hanner nos",
noon:"hanner dydd",
morning:"yn y bore",
afternoon:"yn y prynhawn",
evening:"gyda'r nos",
night:"yn y nos"
}
};
var ordinalNumber$68=function ordinalNumber$68(dirtyNumber,_options){
var number=Number(dirtyNumber);
if(number<20)switch(number){
case 0:return number+"fed";
case 1:return number+"af";
case 2:return number+"ail";
case 3:
case 4:return number+"ydd";
case 5:
case 6:return number+"ed";
case 7:
case 8:
case 9:
case 10:
case 12:
case 15:
case 18:return number+"fed";
case 11:
case 13:
case 14:
case 16:
case 17:
case 19:return number+"eg";
}else
if(number>=50&&number<=60||number===80||number>=100)return number+"fed";
return number+"ain";
};
//#endregion
//#region dist/date-fns/locale/cy.js
/**
* @category Locales
* @summary Welsh locale.
* @language Welsh
* @iso-639-2 cym
* @author Elwyn Malethan [@elmomalmo](https://github.com/elmomalmo)
*/
var _cy={
code:"cy",
formatDistance:formatDistance$68,
formatLong:formatLong$76,
formatRelative:formatRelative$68,
localize:{
ordinalNumber:ordinalNumber$68,
era:buildLocalizeFn({
values:eraValues$68,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$68,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$68,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$68,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$68,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$53,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(af|ail|ydd|ed|fed|eg|ain)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(c|o)/i,
abbreviated:/^(c\.?\s?c\.?|o\.?\s?c\.?)/i,
wide:/^(cyn christ|ar ôl crist|ar ol crist)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
wide:[/^c/i,/^(ar ôl crist|ar ol crist)/i],
any:[/^c/i,/^o/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ch[1234]/i,
wide:/^(chwarter 1af)|([234](ail|ydd)? chwarter)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(i|ch|m|e|g|a|h|t|rh)/i,
abbreviated:/^(ion|chwe|maw|ebr|mai|meh|gor|aws|med|hyd|tach|rhag)/i,
wide:/^(ionawr|chwefror|mawrth|ebrill|mai|mehefin|gorffennaf|awst|medi|hydref|tachwedd|rhagfyr)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^i/i,
/^ch/i,
/^m/i,
/^e/i,
/^m/i,
/^m/i,
/^g/i,
/^a/i,
/^m/i,
/^h/i,
/^t/i,
/^rh/i],

any:[
/^io/i,
/^ch/i,
/^maw/i,
/^e/i,
/^mai/i,
/^meh/i,
/^g/i,
/^a/i,
/^med/i,
/^h/i,
/^t/i,
/^rh/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(s|ll|m|i|g)/i,
short:/^(su|ll|ma|me|ia|gw|sa)/i,
abbreviated:/^(sul|llun|maw|mer|iau|gwe|sad)/i,
wide:/^dydd (sul|llun|mawrth|mercher|iau|gwener|sadwrn)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^ll/i,
/^m/i,
/^m/i,
/^i/i,
/^g/i,
/^s/i],

wide:[
/^dydd su/i,
/^dydd ll/i,
/^dydd ma/i,
/^dydd me/i,
/^dydd i/i,
/^dydd g/i,
/^dydd sa/i],

any:[
/^su/i,
/^ll/i,
/^ma/i,
/^me/i,
/^i/i,
/^g/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(b|h|hn|hd|(yn y|y|yr|gyda'r) (bore|prynhawn|nos|hwyr))/i,
any:/^(y\.?\s?[bh]\.?|hanner nos|hanner dydd|(yn y|y|yr|gyda'r) (bore|prynhawn|nos|hwyr))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^b|(y\.?\s?b\.?)/i,
pm:/^h|(y\.?\s?h\.?)|(yr hwyr)/i,
midnight:/^hn|hanner nos/i,
noon:/^hd|hanner dydd/i,
morning:/bore/i,
afternoon:/prynhawn/i,
evening:/^gyda'r nos$/i,
night:/blah/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/da/_lib/formatDistance.js
var formatDistanceLocale$66={
lessThanXSeconds:{
one:"mindre end ét sekund",
other:"mindre end {{count}} sekunder"
},
xSeconds:{
one:"1 sekund",
other:"{{count}} sekunder"
},
halfAMinute:"ét halvt minut",
lessThanXMinutes:{
one:"mindre end ét minut",
other:"mindre end {{count}} minutter"
},
xMinutes:{
one:"1 minut",
other:"{{count}} minutter"
},
aboutXHours:{
one:"cirka 1 time",
other:"cirka {{count}} timer"
},
xHours:{
one:"1 time",
other:"{{count}} timer"
},
xDays:{
one:"1 dag",
other:"{{count}} dage"
},
aboutXWeeks:{
one:"cirka 1 uge",
other:"cirka {{count}} uger"
},
xWeeks:{
one:"1 uge",
other:"{{count}} uger"
},
aboutXMonths:{
one:"cirka 1 måned",
other:"cirka {{count}} måneder"
},
xMonths:{
one:"1 måned",
other:"{{count}} måneder"
},
aboutXYears:{
one:"cirka 1 år",
other:"cirka {{count}} år"
},
xYears:{
one:"1 år",
other:"{{count}} år"
},
overXYears:{
one:"over 1 år",
other:"over {{count}} år"
},
almostXYears:{
one:"næsten 1 år",
other:"næsten {{count}} år"
}
};
var formatDistance$67=function formatDistance$67(token,count,options){
var result;
var tokenValue=formatDistanceLocale$66[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"om "+result;else
return result+" siden";
return result;
};
var formatLong$75={
date:buildFormatLongFn({
formats:{
full:"EEEE 'den' d. MMMM y",
long:"d. MMMM y",
medium:"d. MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'kl'. {{time}}",
long:"{{date}} 'kl'. {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/da/_lib/formatRelative.js
var formatRelativeLocale$67={
lastWeek:"'sidste' eeee 'kl.' p",
yesterday:"'i går kl.' p",
today:"'i dag kl.' p",
tomorrow:"'i morgen kl.' p",
nextWeek:"'på' eeee 'kl.' p",
other:"P"
};
var formatRelative$67=function formatRelative$67(token,_date,_baseDate,_options){return formatRelativeLocale$67[token];};
//#endregion
//#region dist/date-fns/locale/da/_lib/localize.js
var eraValues$67={
narrow:["fvt","vt"],
abbreviated:["f.v.t.","v.t."],
wide:["før vesterlandsk tidsregning","vesterlandsk tidsregning"]
};
var quarterValues$67={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1. kvt.",
"2. kvt.",
"3. kvt.",
"4. kvt."],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$67={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mar.",
"apr.",
"maj",
"jun.",
"jul.",
"aug.",
"sep.",
"okt.",
"nov.",
"dec."],

wide:[
"januar",
"februar",
"marts",
"april",
"maj",
"juni",
"juli",
"august",
"september",
"oktober",
"november",
"december"]

};
var dayValues$67={
narrow:[
"S",
"M",
"T",
"O",
"T",
"F",
"L"],

short:[
"sø",
"ma",
"ti",
"on",
"to",
"fr",
"lø"],

abbreviated:[
"søn.",
"man.",
"tir.",
"ons.",
"tor.",
"fre.",
"lør."],

wide:[
"søndag",
"mandag",
"tirsdag",
"onsdag",
"torsdag",
"fredag",
"lørdag"]

};
var dayPeriodValues$67={
narrow:{
am:"a",
pm:"p",
midnight:"midnat",
noon:"middag",
morning:"morgen",
afternoon:"eftermiddag",
evening:"aften",
night:"nat"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"midnat",
noon:"middag",
morning:"morgen",
afternoon:"eftermiddag",
evening:"aften",
night:"nat"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"midnat",
noon:"middag",
morning:"morgen",
afternoon:"eftermiddag",
evening:"aften",
night:"nat"
}
};
var formattingDayPeriodValues$52={
narrow:{
am:"a",
pm:"p",
midnight:"midnat",
noon:"middag",
morning:"om morgenen",
afternoon:"om eftermiddagen",
evening:"om aftenen",
night:"om natten"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"midnat",
noon:"middag",
morning:"om morgenen",
afternoon:"om eftermiddagen",
evening:"om aftenen",
night:"om natten"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"midnat",
noon:"middag",
morning:"om morgenen",
afternoon:"om eftermiddagen",
evening:"om aftenen",
night:"om natten"
}
};
var ordinalNumber$67=function ordinalNumber$67(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/da.js
/**
* @category Locales
* @summary Danish locale.
* @language Danish
* @iso-639-2 dan
* @author Mathias Wøbbe [@MathiasKandelborg](https://github.com/MathiasKandelborg)
* @author Anders B. Hansen [@Andersbiha](https://github.com/Andersbiha)
* @author [@kgram](https://github.com/kgram)
* @author [@stefanbugge](https://github.com/stefanbugge)
*/
var _da={
code:"da",
formatDistance:formatDistance$67,
formatLong:formatLong$75,
formatRelative:formatRelative$67,
localize:{
ordinalNumber:ordinalNumber$67,
era:buildLocalizeFn({
values:eraValues$67,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$67,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$67,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$67,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$67,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$52,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(\.)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(fKr|fvt|eKr|vt)/i,
abbreviated:/^(f\.Kr\.?|f\.v\.t\.?|e\.Kr\.?|v\.t\.)/i,
wide:/^(f.Kr.|før vesterlandsk tidsregning|e.Kr.|vesterlandsk tidsregning)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^f/i,/^(v|e)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]. kvt\./i,
wide:/^[1234]\.? kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan.|feb.|mar.|apr.|maj|jun.|jul.|aug.|sep.|okt.|nov.|dec.)/i,
wide:/^(januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtofl]/i,
short:/^(søn.|man.|tir.|ons.|tor.|fre.|lør.)/i,
abbreviated:/^(søn|man|tir|ons|tor|fre|lør)/i,
wide:/^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^o/i,
/^t/i,
/^f/i,
/^l/i],

any:[
/^s/i,
/^m/i,
/^ti/i,
/^o/i,
/^to/i,
/^f/i,
/^l/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|midnat|middag|(om) (morgenen|eftermiddagen|aftenen|natten))/i,
any:/^([ap]\.?\s?m\.?|midnat|middag|(om) (morgenen|eftermiddagen|aftenen|natten))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/midnat/i,
noon:/middag/i,
morning:/morgen/i,
afternoon:/eftermiddag/i,
evening:/aften/i,
night:/nat/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/de/_lib/formatDistance.js
var formatDistanceLocale$65={
lessThanXSeconds:{
standalone:{
one:"weniger als 1 Sekunde",
other:"weniger als {{count}} Sekunden"
},
withPreposition:{
one:"weniger als 1 Sekunde",
other:"weniger als {{count}} Sekunden"
}
},
xSeconds:{
standalone:{
one:"1 Sekunde",
other:"{{count}} Sekunden"
},
withPreposition:{
one:"1 Sekunde",
other:"{{count}} Sekunden"
}
},
halfAMinute:{
standalone:"eine halbe Minute",
withPreposition:"einer halben Minute"
},
lessThanXMinutes:{
standalone:{
one:"weniger als 1 Minute",
other:"weniger als {{count}} Minuten"
},
withPreposition:{
one:"weniger als 1 Minute",
other:"weniger als {{count}} Minuten"
}
},
xMinutes:{
standalone:{
one:"1 Minute",
other:"{{count}} Minuten"
},
withPreposition:{
one:"1 Minute",
other:"{{count}} Minuten"
}
},
aboutXHours:{
standalone:{
one:"etwa 1 Stunde",
other:"etwa {{count}} Stunden"
},
withPreposition:{
one:"etwa 1 Stunde",
other:"etwa {{count}} Stunden"
}
},
xHours:{
standalone:{
one:"1 Stunde",
other:"{{count}} Stunden"
},
withPreposition:{
one:"1 Stunde",
other:"{{count}} Stunden"
}
},
xDays:{
standalone:{
one:"1 Tag",
other:"{{count}} Tage"
},
withPreposition:{
one:"1 Tag",
other:"{{count}} Tagen"
}
},
aboutXWeeks:{
standalone:{
one:"etwa 1 Woche",
other:"etwa {{count}} Wochen"
},
withPreposition:{
one:"etwa 1 Woche",
other:"etwa {{count}} Wochen"
}
},
xWeeks:{
standalone:{
one:"1 Woche",
other:"{{count}} Wochen"
},
withPreposition:{
one:"1 Woche",
other:"{{count}} Wochen"
}
},
aboutXMonths:{
standalone:{
one:"etwa 1 Monat",
other:"etwa {{count}} Monate"
},
withPreposition:{
one:"etwa 1 Monat",
other:"etwa {{count}} Monaten"
}
},
xMonths:{
standalone:{
one:"1 Monat",
other:"{{count}} Monate"
},
withPreposition:{
one:"1 Monat",
other:"{{count}} Monaten"
}
},
aboutXYears:{
standalone:{
one:"etwa 1 Jahr",
other:"etwa {{count}} Jahre"
},
withPreposition:{
one:"etwa 1 Jahr",
other:"etwa {{count}} Jahren"
}
},
xYears:{
standalone:{
one:"1 Jahr",
other:"{{count}} Jahre"
},
withPreposition:{
one:"1 Jahr",
other:"{{count}} Jahren"
}
},
overXYears:{
standalone:{
one:"mehr als 1 Jahr",
other:"mehr als {{count}} Jahre"
},
withPreposition:{
one:"mehr als 1 Jahr",
other:"mehr als {{count}} Jahren"
}
},
almostXYears:{
standalone:{
one:"fast 1 Jahr",
other:"fast {{count}} Jahre"
},
withPreposition:{
one:"fast 1 Jahr",
other:"fast {{count}} Jahren"
}
}
};
var formatDistance$66=function formatDistance$66(token,count,options){
var result;
var tokenValue=options!==null&&options!==void 0&&options.addSuffix?formatDistanceLocale$65[token].withPreposition:formatDistanceLocale$65[token].standalone;
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"in "+result;else
return"vor "+result;
return result;
};
var formatLong$74={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y",
long:"do MMMM y",
medium:"do MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'um' {{time}}",
long:"{{date}} 'um' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/de/_lib/formatRelative.js
var formatRelativeLocale$66={
lastWeek:"'letzten' eeee 'um' p",
yesterday:"'gestern um' p",
today:"'heute um' p",
tomorrow:"'morgen um' p",
nextWeek:"eeee 'um' p",
other:"P"
};
var formatRelative$66=function formatRelative$66(token,_date,_baseDate,_options){return formatRelativeLocale$66[token];};
//#endregion
//#region dist/date-fns/locale/de/_lib/localize.js
var eraValues$66={
narrow:["v.Chr.","n.Chr."],
abbreviated:["v.Chr.","n.Chr."],
wide:["vor Christus","nach Christus"]
};
var quarterValues$66={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. Quartal",
"2. Quartal",
"3. Quartal",
"4. Quartal"]

};
var monthValues$66={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Feb",
"Mär",
"Apr",
"Mai",
"Jun",
"Jul",
"Aug",
"Sep",
"Okt",
"Nov",
"Dez"],

wide:[
"Januar",
"Februar",
"März",
"April",
"Mai",
"Juni",
"Juli",
"August",
"September",
"Oktober",
"November",
"Dezember"]

};
var formattingMonthValues$14={
narrow:monthValues$66.narrow,
abbreviated:[
"Jan.",
"Feb.",
"März",
"Apr.",
"Mai",
"Juni",
"Juli",
"Aug.",
"Sep.",
"Okt.",
"Nov.",
"Dez."],

wide:monthValues$66.wide
};
var dayValues$66={
narrow:[
"S",
"M",
"D",
"M",
"D",
"F",
"S"],

short:[
"So",
"Mo",
"Di",
"Mi",
"Do",
"Fr",
"Sa"],

abbreviated:[
"So.",
"Mo.",
"Di.",
"Mi.",
"Do.",
"Fr.",
"Sa."],

wide:[
"Sonntag",
"Montag",
"Dienstag",
"Mittwoch",
"Donnerstag",
"Freitag",
"Samstag"]

};
var dayPeriodValues$66={
narrow:{
am:"vm.",
pm:"nm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"Morgen",
afternoon:"Nachm.",
evening:"Abend",
night:"Nacht"
},
abbreviated:{
am:"vorm.",
pm:"nachm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"Morgen",
afternoon:"Nachmittag",
evening:"Abend",
night:"Nacht"
},
wide:{
am:"vormittags",
pm:"nachmittags",
midnight:"Mitternacht",
noon:"Mittag",
morning:"Morgen",
afternoon:"Nachmittag",
evening:"Abend",
night:"Nacht"
}
};
var formattingDayPeriodValues$51={
narrow:{
am:"vm.",
pm:"nm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"morgens",
afternoon:"nachm.",
evening:"abends",
night:"nachts"
},
abbreviated:{
am:"vorm.",
pm:"nachm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"morgens",
afternoon:"nachmittags",
evening:"abends",
night:"nachts"
},
wide:{
am:"vormittags",
pm:"nachmittags",
midnight:"Mitternacht",
noon:"Mittag",
morning:"morgens",
afternoon:"nachmittags",
evening:"abends",
night:"nachts"
}
};
var ordinalNumber$66=function ordinalNumber$66(dirtyNumber){
return Number(dirtyNumber)+".";
};
var localize$66={
ordinalNumber:ordinalNumber$66,
era:buildLocalizeFn({
values:eraValues$66,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$66,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$66,
formattingValues:formattingMonthValues$14,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$66,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$66,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$51,
defaultFormattingWidth:"wide"
})
};
var match$65={
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(\.)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
abbreviated:/^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
wide:/^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^v/i,/^n/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](\.)? Quartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(j[aä]n|feb|mär[z]?|apr|mai|jun[i]?|jul[i]?|aug|sep|okt|nov|dez)\.?/i,
wide:/^(jänner|januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^j[aä]/i,
/^f/i,
/^mär/i,
/^ap/i,
/^mai/i,
/^jun/i,
/^jul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smdmf]/i,
short:/^(so|mo|di|mi|do|fr|sa)/i,
abbreviated:/^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
wide:/^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^so/i,
/^mo/i,
/^di/i,
/^mi/i,
/^do/i,
/^f/i,
/^sa/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
abbreviated:/^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
wide:/^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^v/i,
pm:/^n/i,
midnight:/^Mitte/i,
noon:/^Mitta/i,
morning:/morgens/i,
afternoon:/nachmittags/i,
evening:/abends/i,
night:/nachts/i
}},
defaultParseWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/de.js
/**
* @category Locales
* @summary German locale.
* @language German
* @iso-639-2 deu
* @author Thomas Eilmsteiner [@DeMuu](https://github.com/DeMuu)
* @author Asia [@asia-t](https://github.com/asia-t)
* @author Van Vuong Ngo [@vanvuongngo](https://github.com/vanvuongngo)
* @author RomanErnst [@pex](https://github.com/pex)
* @author Philipp Keck [@Philipp91](https://github.com/Philipp91)
*/
var _de={
code:"de",
formatDistance:formatDistance$66,
formatLong:formatLong$74,
formatRelative:formatRelative$66,
localize:localize$66,
match:match$65,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/de-AT/_lib/localize.js
var eraValues$65={
narrow:["v.Chr.","n.Chr."],
abbreviated:["v.Chr.","n.Chr."],
wide:["vor Christus","nach Christus"]
};
var quarterValues$65={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. Quartal",
"2. Quartal",
"3. Quartal",
"4. Quartal"]

};
var monthValues$65={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jän",
"Feb",
"Mär",
"Apr",
"Mai",
"Jun",
"Jul",
"Aug",
"Sep",
"Okt",
"Nov",
"Dez"],

wide:[
"Jänner",
"Februar",
"März",
"April",
"Mai",
"Juni",
"Juli",
"August",
"September",
"Oktober",
"November",
"Dezember"]

};
var formattingMonthValues$13={
narrow:monthValues$65.narrow,
abbreviated:[
"Jän.",
"Feb.",
"März",
"Apr.",
"Mai",
"Juni",
"Juli",
"Aug.",
"Sep.",
"Okt.",
"Nov.",
"Dez."],

wide:monthValues$65.wide
};
var dayValues$65={
narrow:[
"S",
"M",
"D",
"M",
"D",
"F",
"S"],

short:[
"So",
"Mo",
"Di",
"Mi",
"Do",
"Fr",
"Sa"],

abbreviated:[
"So.",
"Mo.",
"Di.",
"Mi.",
"Do.",
"Fr.",
"Sa."],

wide:[
"Sonntag",
"Montag",
"Dienstag",
"Mittwoch",
"Donnerstag",
"Freitag",
"Samstag"]

};
var dayPeriodValues$65={
narrow:{
am:"vm.",
pm:"nm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"Morgen",
afternoon:"Nachm.",
evening:"Abend",
night:"Nacht"
},
abbreviated:{
am:"vorm.",
pm:"nachm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"Morgen",
afternoon:"Nachmittag",
evening:"Abend",
night:"Nacht"
},
wide:{
am:"vormittags",
pm:"nachmittags",
midnight:"Mitternacht",
noon:"Mittag",
morning:"Morgen",
afternoon:"Nachmittag",
evening:"Abend",
night:"Nacht"
}
};
var formattingDayPeriodValues$50={
narrow:{
am:"vm.",
pm:"nm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"morgens",
afternoon:"nachm.",
evening:"abends",
night:"nachts"
},
abbreviated:{
am:"vorm.",
pm:"nachm.",
midnight:"Mitternacht",
noon:"Mittag",
morning:"morgens",
afternoon:"nachmittags",
evening:"abends",
night:"nachts"
},
wide:{
am:"vormittags",
pm:"nachmittags",
midnight:"Mitternacht",
noon:"Mittag",
morning:"morgens",
afternoon:"nachmittags",
evening:"abends",
night:"nachts"
}
};
var ordinalNumber$65=function ordinalNumber$65(dirtyNumber){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/de-AT.js
/**
* @category Locales
* @summary German locale (Austria).
* @language German
* @iso-639-2 deu
* @author Christoph Tobias Stenglein [@cstenglein](https://github.com/cstenglein)
*/
var _deAT={
code:"de-AT",
formatDistance:formatDistance$66,
formatLong:formatLong$74,
formatRelative:formatRelative$66,
localize:{
ordinalNumber:ordinalNumber$65,
era:buildLocalizeFn({
values:eraValues$65,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$65,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$65,
formattingValues:formattingMonthValues$13,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$65,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$65,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$50,
defaultFormattingWidth:"wide"
})
},
match:match$65,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/el/_lib/formatDistance.js
var formatDistanceLocale$64={
lessThanXSeconds:{
one:"λιγότερο από ένα δευτερόλεπτο",
other:"λιγότερο από {{count}} δευτερόλεπτα"
},
xSeconds:{
one:"1 δευτερόλεπτο",
other:"{{count}} δευτερόλεπτα"
},
halfAMinute:"μισό λεπτό",
lessThanXMinutes:{
one:"λιγότερο από ένα λεπτό",
other:"λιγότερο από {{count}} λεπτά"
},
xMinutes:{
one:"1 λεπτό",
other:"{{count}} λεπτά"
},
aboutXHours:{
one:"περίπου 1 ώρα",
other:"περίπου {{count}} ώρες"
},
xHours:{
one:"1 ώρα",
other:"{{count}} ώρες"
},
xDays:{
one:"1 ημέρα",
other:"{{count}} ημέρες"
},
aboutXWeeks:{
one:"περίπου 1 εβδομάδα",
other:"περίπου {{count}} εβδομάδες"
},
xWeeks:{
one:"1 εβδομάδα",
other:"{{count}} εβδομάδες"
},
aboutXMonths:{
one:"περίπου 1 μήνας",
other:"περίπου {{count}} μήνες"
},
xMonths:{
one:"1 μήνας",
other:"{{count}} μήνες"
},
aboutXYears:{
one:"περίπου 1 χρόνο",
other:"περίπου {{count}} χρόνια"
},
xYears:{
one:"1 χρόνο",
other:"{{count}} χρόνια"
},
overXYears:{
one:"πάνω από 1 χρόνο",
other:"πάνω από {{count}} χρόνια"
},
almostXYears:{
one:"περίπου 1 χρόνο",
other:"περίπου {{count}} χρόνια"
}
};
var formatDistance$65=function formatDistance$65(token,count,options){
var result;
var tokenValue=formatDistanceLocale$64[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"σε "+result;else
return result+" πριν";
return result;
};
var formatLong$73={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"d/M/yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} - {{time}}",
long:"{{date}} - {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/el/_lib/formatRelative.js
var formatRelativeLocale$65={
lastWeek:function lastWeek(date){
switch(date.getDay()){
case 6:return"'το προηγούμενο' eeee 'στις' p";
default:return"'την προηγούμενη' eeee 'στις' p";
}
},
yesterday:"'χθες στις' p",
today:"'σήμερα στις' p",
tomorrow:"'αύριο στις' p",
nextWeek:"eeee 'στις' p",
other:"P"
};
var formatRelative$65=function formatRelative$65(token,date){
var format=formatRelativeLocale$65[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/el/_lib/localize.js
var eraValues$64={
narrow:["πΧ","μΧ"],
abbreviated:["π.Χ.","μ.Χ."],
wide:["προ Χριστού","μετά Χριστόν"]
};
var quarterValues$64={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Τ1",
"Τ2",
"Τ3",
"Τ4"],

wide:[
"1ο τρίμηνο",
"2ο τρίμηνο",
"3ο τρίμηνο",
"4ο τρίμηνο"]

};
var monthValues$64={
narrow:[
"Ι",
"Φ",
"Μ",
"Α",
"Μ",
"Ι",
"Ι",
"Α",
"Σ",
"Ο",
"Ν",
"Δ"],

abbreviated:[
"Ιαν",
"Φεβ",
"Μάρ",
"Απρ",
"Μάι",
"Ιούν",
"Ιούλ",
"Αύγ",
"Σεπ",
"Οκτ",
"Νοέ",
"Δεκ"],

wide:[
"Ιανουάριος",
"Φεβρουάριος",
"Μάρτιος",
"Απρίλιος",
"Μάιος",
"Ιούνιος",
"Ιούλιος",
"Αύγουστος",
"Σεπτέμβριος",
"Οκτώβριος",
"Νοέμβριος",
"Δεκέμβριος"]

};
var formattingMonthValues$12={
narrow:[
"Ι",
"Φ",
"Μ",
"Α",
"Μ",
"Ι",
"Ι",
"Α",
"Σ",
"Ο",
"Ν",
"Δ"],

abbreviated:[
"Ιαν",
"Φεβ",
"Μαρ",
"Απρ",
"Μαΐ",
"Ιουν",
"Ιουλ",
"Αυγ",
"Σεπ",
"Οκτ",
"Νοε",
"Δεκ"],

wide:[
"Ιανουαρίου",
"Φεβρουαρίου",
"Μαρτίου",
"Απριλίου",
"Μαΐου",
"Ιουνίου",
"Ιουλίου",
"Αυγούστου",
"Σεπτεμβρίου",
"Οκτωβρίου",
"Νοεμβρίου",
"Δεκεμβρίου"]

};
var dayValues$64={
narrow:[
"Κ",
"Δ",
"T",
"Τ",
"Π",
"Π",
"Σ"],

short:[
"Κυ",
"Δε",
"Τρ",
"Τε",
"Πέ",
"Πα",
"Σά"],

abbreviated:[
"Κυρ",
"Δευ",
"Τρί",
"Τετ",
"Πέμ",
"Παρ",
"Σάβ"],

wide:[
"Κυριακή",
"Δευτέρα",
"Τρίτη",
"Τετάρτη",
"Πέμπτη",
"Παρασκευή",
"Σάββατο"]

};
var dayPeriodValues$64={
narrow:{
am:"πμ",
pm:"μμ",
midnight:"μεσάνυχτα",
noon:"μεσημέρι",
morning:"πρωί",
afternoon:"απόγευμα",
evening:"βράδυ",
night:"νύχτα"
},
abbreviated:{
am:"π.μ.",
pm:"μ.μ.",
midnight:"μεσάνυχτα",
noon:"μεσημέρι",
morning:"πρωί",
afternoon:"απόγευμα",
evening:"βράδυ",
night:"νύχτα"
},
wide:{
am:"π.μ.",
pm:"μ.μ.",
midnight:"μεσάνυχτα",
noon:"μεσημέρι",
morning:"πρωί",
afternoon:"απόγευμα",
evening:"βράδυ",
night:"νύχτα"
}
};
var ordinalNumber$64=function ordinalNumber$64(dirtyNumber,options){
var number=Number(dirtyNumber);
var unit=options===null||options===void 0?void 0:options.unit;
var suffix;
if(unit==="year"||unit==="month")suffix="ος";else
if(unit==="week"||unit==="dayOfYear"||unit==="day"||unit==="hour"||unit==="date")suffix="η";else
suffix="ο";
return number+suffix;
};
//#endregion
//#region dist/date-fns/locale/el.js
/**
* @category Locales
* @summary Greek locale.
* @language Greek
* @iso-639-2 ell
* @author Fanis Katsimpas [@fanixk](https://github.com/fanixk)
* @author Theodoros Orfanidis [@teoulas](https://github.com/teoulas)
*/
var _el={
code:"el",
formatDistance:formatDistance$65,
formatLong:formatLong$73,
formatRelative:formatRelative$65,
localize:{
ordinalNumber:ordinalNumber$64,
era:buildLocalizeFn({
values:eraValues$64,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$64,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$64,
defaultWidth:"wide",
formattingValues:formattingMonthValues$12,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$64,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$64,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(ος|η|ο)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(πΧ|μΧ)/i,
abbreviated:/^(π\.?\s?χ\.?|π\.?\s?κ\.?\s?χ\.?|μ\.?\s?χ\.?|κ\.?\s?χ\.?)/i,
wide:/^(προ Χριστο(ύ|υ)|πριν απ(ό|ο) την Κοιν(ή|η) Χρονολογ(ί|ι)α|μετ(ά|α) Χριστ(ό|ο)ν|Κοιν(ή|η) Χρονολογ(ί|ι)α)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^π/i,/^(μ|κ)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^τ[1234]/i,
wide:/^[1234]ο? τρ(ί|ι)μηνο/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[ιφμαμιιασονδ]/i,
abbreviated:/^(ιαν|φεβ|μ[άα]ρ|απρ|μ[άα][ιΐ]|ιο[ύυ]ν|ιο[ύυ]λ|α[ύυ]γ|σεπ|οκτ|νο[έε]|δεκ)/i,
wide:/^(μ[άα][ιΐ]|α[ύυ]γο[υύ]στ)(ος|ου)|(ιανου[άα]ρ|φεβρου[άα]ρ|μ[άα]ρτ|απρ[ίι]λ|ιο[ύυ]ν|ιο[ύυ]λ|σεπτ[έε]μβρ|οκτ[ώω]βρ|νο[έε]μβρ|δεκ[έε]μβρ)(ιος|ίου)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ι/i,
/^φ/i,
/^μ/i,
/^α/i,
/^μ/i,
/^ι/i,
/^ι/i,
/^α/i,
/^σ/i,
/^ο/i,
/^ν/i,
/^δ/i],

any:[
/^ια/i,
/^φ/i,
/^μ[άα]ρ/i,
/^απ/i,
/^μ[άα][ιΐ]/i,
/^ιο[ύυ]ν/i,
/^ιο[ύυ]λ/i,
/^α[ύυ]/i,
/^σ/i,
/^ο/i,
/^ν/i,
/^δ/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[κδτπσ]/i,
short:/^(κυ|δε|τρ|τε|π[εέ]|π[αά]|σ[αά])/i,
abbreviated:/^(κυρ|δευ|τρι|τετ|πεμ|παρ|σαβ)/i,
wide:/^(κυριακ(ή|η)|δευτ(έ|ε)ρα|τρ(ί|ι)τη|τετ(ά|α)ρτη|π(έ|ε)μπτη|παρασκευ(ή|η)|σ(ά|α)ββατο)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^κ/i,
/^δ/i,
/^τ/i,
/^τ/i,
/^π/i,
/^π/i,
/^σ/i],

any:[
/^κ/i,
/^δ/i,
/^τρ/i,
/^τε/i,
/^π[εέ]/i,
/^π[αά]/i,
/^σ/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(πμ|μμ|μεσ(ά|α)νυχτα|μεσημ(έ|ε)ρι|πρω(ί|ι)|απ(ό|ο)γευμα|βρ(ά|α)δυ|ν(ύ|υ)χτα)/i,
any:/^([πμ]\.?\s?μ\.?|μεσ(ά|α)νυχτα|μεσημ(έ|ε)ρι|πρω(ί|ι)|απ(ό|ο)γευμα|βρ(ά|α)δυ|ν(ύ|υ)χτα)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^πμ|π\.\s?μ\./i,
pm:/^μμ|μ\.\s?μ\./i,
midnight:/^μεσάν/i,
noon:/^μεσημ(έ|ε)/i,
morning:/πρω(ί|ι)/i,
afternoon:/απ(ό|ο)γευμα/i,
evening:/βρ(ά|α)δυ/i,
night:/ν(ύ|υ)χτα/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale$63={
lessThanXSeconds:{
one:"less than a second",
other:"less than {{count}} seconds"
},
xSeconds:{
one:"1 second",
other:"{{count}} seconds"
},
halfAMinute:"half a minute",
lessThanXMinutes:{
one:"less than a minute",
other:"less than {{count}} minutes"
},
xMinutes:{
one:"1 minute",
other:"{{count}} minutes"
},
aboutXHours:{
one:"about 1 hour",
other:"about {{count}} hours"
},
xHours:{
one:"1 hour",
other:"{{count}} hours"
},
xDays:{
one:"1 day",
other:"{{count}} days"
},
aboutXWeeks:{
one:"about 1 week",
other:"about {{count}} weeks"
},
xWeeks:{
one:"1 week",
other:"{{count}} weeks"
},
aboutXMonths:{
one:"about 1 month",
other:"about {{count}} months"
},
xMonths:{
one:"1 month",
other:"{{count}} months"
},
aboutXYears:{
one:"about 1 year",
other:"about {{count}} years"
},
xYears:{
one:"1 year",
other:"{{count}} years"
},
overXYears:{
one:"over 1 year",
other:"over {{count}} years"
},
almostXYears:{
one:"almost 1 year",
other:"almost {{count}} years"
}
};
var formatDistance$64=function formatDistance$64(token,count,options){
var result;
var tokenValue=formatDistanceLocale$63[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"in "+result;else
return result+" ago";
return result;
};
var formatLong$72={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale$64={
lastWeek:"'last' eeee 'at' p",
yesterday:"'yesterday at' p",
today:"'today at' p",
tomorrow:"'tomorrow at' p",
nextWeek:"eeee 'at' p",
other:"P"
};
var formatRelative$64=function formatRelative$64(token,_date,_baseDate,_options){return formatRelativeLocale$64[token];};
//#endregion
//#region dist/date-fns/locale/en-US/_lib/localize.js
var eraValues$63={
narrow:["B","A"],
abbreviated:["BC","AD"],
wide:["Before Christ","Anno Domini"]
};
var quarterValues$63={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1st quarter",
"2nd quarter",
"3rd quarter",
"4th quarter"]

};
var monthValues$63={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Feb",
"Mar",
"Apr",
"May",
"Jun",
"Jul",
"Aug",
"Sep",
"Oct",
"Nov",
"Dec"],

wide:[
"January",
"February",
"March",
"April",
"May",
"June",
"July",
"August",
"September",
"October",
"November",
"December"]

};
var dayValues$63={
narrow:[
"S",
"M",
"T",
"W",
"T",
"F",
"S"],

short:[
"Su",
"Mo",
"Tu",
"We",
"Th",
"Fr",
"Sa"],

abbreviated:[
"Sun",
"Mon",
"Tue",
"Wed",
"Thu",
"Fri",
"Sat"],

wide:[
"Sunday",
"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday",
"Saturday"]

};
var dayPeriodValues$63={
narrow:{
am:"a",
pm:"p",
midnight:"mi",
noon:"n",
morning:"morning",
afternoon:"afternoon",
evening:"evening",
night:"night"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"midnight",
noon:"noon",
morning:"morning",
afternoon:"afternoon",
evening:"evening",
night:"night"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"midnight",
noon:"noon",
morning:"morning",
afternoon:"afternoon",
evening:"evening",
night:"night"
}
};
var formattingDayPeriodValues$49={
narrow:{
am:"a",
pm:"p",
midnight:"mi",
noon:"n",
morning:"in the morning",
afternoon:"in the afternoon",
evening:"in the evening",
night:"at night"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"midnight",
noon:"noon",
morning:"in the morning",
afternoon:"in the afternoon",
evening:"in the evening",
night:"at night"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"midnight",
noon:"noon",
morning:"in the morning",
afternoon:"in the afternoon",
evening:"in the evening",
night:"at night"
}
};
var ordinalNumber$63=function ordinalNumber$63(dirtyNumber,_options){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100>20||rem100<10)switch(rem100%10){
case 1:return number+"st";
case 2:return number+"nd";
case 3:return number+"rd";
}
return number+"th";
};
var localize$63={
ordinalNumber:ordinalNumber$63,
era:buildLocalizeFn({
values:eraValues$63,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$63,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$63,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$63,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$63,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$49,
defaultFormattingWidth:"wide"
})
};
var match$63={
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(b|a)/i,
abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
wide:/^(before christ|before common era|anno domini|common era)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^b/i,/^(a|c)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](th|st|nd|rd)? quarter/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
wide:/^(january|february|march|april|may|june|july|august|september|october|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^may/i,
/^jun/i,
/^jul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtwf]/i,
short:/^(su|mo|tu|we|th|fr|sa)/i,
abbreviated:/^(sun|mon|tue|wed|thu|fri|sat)/i,
wide:/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^w/i,
/^t/i,
/^f/i,
/^s/i],

any:[
/^su/i,
/^m/i,
/^tu/i,
/^w/i,
/^th/i,
/^f/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
any:/^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mi/i,
noon:/^no/i,
morning:/morning/i,
afternoon:/afternoon/i,
evening:/evening/i,
night:/night/i
}},
defaultParseWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/en-AU.js
/**
* @category Locales
* @summary English locale (Australia).
* @language English
* @iso-639-2 eng
* @author Julien Malige [@JulienMalige](https://github.com/JulienMalige)
*/
var _enAU={
code:"en-AU",
formatDistance:formatDistance$64,
formatLong:formatLong$72,
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/en-CA/_lib/formatDistance.js
var formatDistanceLocale$62={
lessThanXSeconds:{
one:"less than a second",
other:"less than {{count}} seconds"
},
xSeconds:{
one:"a second",
other:"{{count}} seconds"
},
halfAMinute:"half a minute",
lessThanXMinutes:{
one:"less than a minute",
other:"less than {{count}} minutes"
},
xMinutes:{
one:"a minute",
other:"{{count}} minutes"
},
aboutXHours:{
one:"about an hour",
other:"about {{count}} hours"
},
xHours:{
one:"an hour",
other:"{{count}} hours"
},
xDays:{
one:"a day",
other:"{{count}} days"
},
aboutXWeeks:{
one:"about a week",
other:"about {{count}} weeks"
},
xWeeks:{
one:"a week",
other:"{{count}} weeks"
},
aboutXMonths:{
one:"about a month",
other:"about {{count}} months"
},
xMonths:{
one:"a month",
other:"{{count}} months"
},
aboutXYears:{
one:"about a year",
other:"about {{count}} years"
},
xYears:{
one:"a year",
other:"{{count}} years"
},
overXYears:{
one:"over a year",
other:"over {{count}} years"
},
almostXYears:{
one:"almost a year",
other:"almost {{count}} years"
}
};
var formatDistance$63=function formatDistance$63(token,count,options){
var result;
var tokenValue=formatDistanceLocale$62[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"in "+result;else
return result+" ago";
return result;
};
//#endregion
//#region dist/date-fns/locale/en-CA.js
/**
* @category Locales
* @summary English locale (Canada).
* @language English
* @iso-639-2 eng
* @author Mark Owsiak [@markowsiak](https://github.com/markowsiak)
* @author Marco Imperatore [@mimperatore](https://github.com/mimperatore)
*/
var _enCA={
code:"en-CA",
formatDistance:formatDistance$63,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, yyyy",
long:"MMMM do, yyyy",
medium:"MMM d, yyyy",
short:"yyyy-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
var formatLong$70={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/en-GB.js
/**
* @category Locales
* @summary English locale (United Kingdom).
* @language English
* @iso-639-2 eng
* @author Alex [@glintik](https://github.com/glintik)
*/
var _enGB={
code:"en-GB",
formatDistance:formatDistance$64,
formatLong:formatLong$70,
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/en-IE.js
/**
* @category Locales
* @summary English locale (Ireland).
* @language English
* @iso-639-2 eng
* @author Tetiana [@tan75](https://github.com/tan75)
*/
var _enIE={
code:"en-IE",
formatDistance:formatDistance$64,
formatLong:formatLong$70,
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/en-IN.js
/**
* @category Locales
* @summary English locale (India).
* @language English
* @iso-639-2 eng
* @author Galeel Bhasha Satthar [@gbhasha](https://github.com/gbhasha)
*/
var _enIN={
code:"en-IN",
formatDistance:formatDistance$64,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM, yyyy",
medium:"d MMM, yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/en-NZ.js
/**
* @category Locales
* @summary English locale (New Zealand).
* @language English
* @iso-639-2 eng
* @author Murray Lucas [@muntact](https://github.com/muntact)
*/
var _enNZ={
code:"en-NZ",
formatDistance:formatDistance$64,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/en-US.js
/**
* @category Locales
* @summary English locale (United States).
* @language English
* @iso-639-2 eng
* @author Sasha Koss [@kossnocorp](https://github.com/kossnocorp)
* @author Lesha Koss [@leshakoss](https://github.com/leshakoss)
*/
var _enUS={
code:"en-US",
formatDistance:formatDistance$64,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/en-ZA.js
/**
* @category Locales
* @summary English locale (South Africa).
* @language English
* @iso-639-2 eng
* @author Shaila Kavrakova [@shaykav](https://github.com/shaykav)
*/
var _enZA={
code:"en-ZA",
formatDistance:formatDistance$64,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE, dd MMMM yyyy",
long:"dd MMMM yyyy",
medium:"dd MMM yyyy",
short:"yyyy/MM/dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'at' {{time}}",
long:"{{date}} 'at' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$64,
localize:localize$63,
match:match$63,
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/eo/_lib/formatDistance.js
var formatDistanceLocale$61={
lessThanXSeconds:{
one:"malpli ol sekundo",
other:"malpli ol {{count}} sekundoj"
},
xSeconds:{
one:"1 sekundo",
other:"{{count}} sekundoj"
},
halfAMinute:"duonminuto",
lessThanXMinutes:{
one:"malpli ol minuto",
other:"malpli ol {{count}} minutoj"
},
xMinutes:{
one:"1 minuto",
other:"{{count}} minutoj"
},
aboutXHours:{
one:"proksimume 1 horo",
other:"proksimume {{count}} horoj"
},
xHours:{
one:"1 horo",
other:"{{count}} horoj"
},
xDays:{
one:"1 tago",
other:"{{count}} tagoj"
},
aboutXMonths:{
one:"proksimume 1 monato",
other:"proksimume {{count}} monatoj"
},
xWeeks:{
one:"1 semajno",
other:"{{count}} semajnoj"
},
aboutXWeeks:{
one:"proksimume 1 semajno",
other:"proksimume {{count}} semajnoj"
},
xMonths:{
one:"1 monato",
other:"{{count}} monatoj"
},
aboutXYears:{
one:"proksimume 1 jaro",
other:"proksimume {{count}} jaroj"
},
xYears:{
one:"1 jaro",
other:"{{count}} jaroj"
},
overXYears:{
one:"pli ol 1 jaro",
other:"pli ol {{count}} jaroj"
},
almostXYears:{
one:"preskaŭ 1 jaro",
other:"preskaŭ {{count}} jaroj"
}
};
var formatDistance$62=function formatDistance$62(token,count,options){
var result;
var tokenValue=formatDistanceLocale$61[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options!==null&&options!==void 0&&options.comparison&&options.comparison>0)return"post "+result;else
return"antaŭ "+result;
return result;
};
var formatLong$65={
date:buildFormatLongFn({
formats:{
full:"EEEE, do 'de' MMMM y",
long:"y-MMMM-dd",
medium:"y-MMM-dd",
short:"yyyy-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"Ho 'horo kaj' m:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}} {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/eo/_lib/formatRelative.js
var formatRelativeLocale$63={
lastWeek:"'pasinta' eeee 'je' p",
yesterday:"'hieraŭ je' p",
today:"'hodiaŭ je' p",
tomorrow:"'morgaŭ je' p",
nextWeek:"eeee 'je' p",
other:"P"
};
var formatRelative$63=function formatRelative$63(token,_date,_baseDate,_options){return formatRelativeLocale$63[token];};
//#endregion
//#region dist/date-fns/locale/eo/_lib/localize.js
var eraValues$62={
narrow:["aK","pK"],
abbreviated:["a.K.E.","p.K.E."],
wide:["antaŭ Komuna Erao","Komuna Erao"]
};
var quarterValues$62={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1-a kvaronjaro",
"2-a kvaronjaro",
"3-a kvaronjaro",
"4-a kvaronjaro"]

};
var monthValues$62={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"maj",
"jun",
"jul",
"aŭg",
"sep",
"okt",
"nov",
"dec"],

wide:[
"januaro",
"februaro",
"marto",
"aprilo",
"majo",
"junio",
"julio",
"aŭgusto",
"septembro",
"oktobro",
"novembro",
"decembro"]

};
var dayValues$62={
narrow:[
"D",
"L",
"M",
"M",
"Ĵ",
"V",
"S"],

short:[
"di",
"lu",
"ma",
"me",
"ĵa",
"ve",
"sa"],

abbreviated:[
"dim",
"lun",
"mar",
"mer",
"ĵaŭ",
"ven",
"sab"],

wide:[
"dimanĉo",
"lundo",
"mardo",
"merkredo",
"ĵaŭdo",
"vendredo",
"sabato"]

};
var dayPeriodValues$62={
narrow:{
am:"a",
pm:"p",
midnight:"noktomezo",
noon:"tagmezo",
morning:"matene",
afternoon:"posttagmeze",
evening:"vespere",
night:"nokte"
},
abbreviated:{
am:"a.t.m.",
pm:"p.t.m.",
midnight:"noktomezo",
noon:"tagmezo",
morning:"matene",
afternoon:"posttagmeze",
evening:"vespere",
night:"nokte"
},
wide:{
am:"antaŭtagmeze",
pm:"posttagmeze",
midnight:"noktomezo",
noon:"tagmezo",
morning:"matene",
afternoon:"posttagmeze",
evening:"vespere",
night:"nokte"
}
};
var ordinalNumber$62=function ordinalNumber$62(dirtyNumber){
return Number(dirtyNumber)+"-a";
};
//#endregion
//#region dist/date-fns/locale/eo.js
/**
* @category Locales
* @summary Esperanto locale.
* @language Esperanto
* @iso-639-2 epo
* @author date-fns
*/
var _eo={
code:"eo",
formatDistance:formatDistance$62,
formatLong:formatLong$65,
formatRelative:formatRelative$63,
localize:{
ordinalNumber:ordinalNumber$62,
era:buildLocalizeFn({
values:eraValues$62,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$62,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){
return Number(quarter)-1;
}
}),
month:buildLocalizeFn({
values:monthValues$62,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$62,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$62,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?a)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^([ap]k)/i,
abbreviated:/^([ap]\.?\s?k\.?\s?e\.?)/i,
wide:/^((antaǔ |post )?komuna erao)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^a/i,/^[kp]/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^k[1234]/i,
wide:/^[1234](-?a)? kvaronjaro/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){
return index+1;
}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mar|apr|maj|jun|jul|a(ŭ|ux|uh|u)g|sep|okt|nov|dec)/i,
wide:/^(januaro|februaro|marto|aprilo|majo|junio|julio|a(ŭ|ux|uh|u)gusto|septembro|oktobro|novembro|decembro)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^a(u|ŭ)/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dlmĵjvs]/i,
short:/^(di|lu|ma|me|(ĵ|jx|jh|j)a|ve|sa)/i,
abbreviated:/^(dim|lun|mar|mer|(ĵ|jx|jh|j)a(ŭ|ux|uh|u)|ven|sab)/i,
wide:/^(diman(ĉ|cx|ch|c)o|lundo|mardo|merkredo|(ĵ|jx|jh|j)a(ŭ|ux|uh|u)do|vendredo|sabato)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^(j|ĵ)/i,
/^v/i,
/^s/i],

any:[
/^d/i,
/^l/i,
/^ma/i,
/^me/i,
/^(j|ĵ)/i,
/^v/i,
/^s/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^([ap]|(posttagmez|noktomez|tagmez|maten|vesper|nokt)[eo])/i,
abbreviated:/^([ap][.\s]?t[.\s]?m[.\s]?|(posttagmez|noktomez|tagmez|maten|vesper|nokt)[eo])/i,
wide:/^(anta(ŭ|ux)tagmez|posttagmez|noktomez|tagmez|maten|vesper|nokt)[eo]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^noktom/i,
noon:/^t/i,
morning:/^m/i,
afternoon:/^posttagmeze/i,
evening:/^v/i,
night:/^n/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/es/_lib/formatDistance.js
var formatDistanceLocale$60={
lessThanXSeconds:{
one:"menos de un segundo",
other:"menos de {{count}} segundos"
},
xSeconds:{
one:"1 segundo",
other:"{{count}} segundos"
},
halfAMinute:"medio minuto",
lessThanXMinutes:{
one:"menos de un minuto",
other:"menos de {{count}} minutos"
},
xMinutes:{
one:"1 minuto",
other:"{{count}} minutos"
},
aboutXHours:{
one:"alrededor de 1 hora",
other:"alrededor de {{count}} horas"
},
xHours:{
one:"1 hora",
other:"{{count}} horas"
},
xDays:{
one:"1 día",
other:"{{count}} días"
},
aboutXWeeks:{
one:"alrededor de 1 semana",
other:"alrededor de {{count}} semanas"
},
xWeeks:{
one:"1 semana",
other:"{{count}} semanas"
},
aboutXMonths:{
one:"alrededor de 1 mes",
other:"alrededor de {{count}} meses"
},
xMonths:{
one:"1 mes",
other:"{{count}} meses"
},
aboutXYears:{
one:"alrededor de 1 año",
other:"alrededor de {{count}} años"
},
xYears:{
one:"1 año",
other:"{{count}} años"
},
overXYears:{
one:"más de 1 año",
other:"más de {{count}} años"
},
almostXYears:{
one:"casi 1 año",
other:"casi {{count}} años"
}
};
var formatDistance$61=function formatDistance$61(token,count,options){
var result;
var tokenValue=formatDistanceLocale$60[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"en "+result;else
return"hace "+result;
return result;
};
var formatLong$64={
date:buildFormatLongFn({
formats:{
full:"EEEE, d 'de' MMMM 'de' y",
long:"d 'de' MMMM 'de' y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'a las' {{time}}",
long:"{{date}} 'a las' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/es/_lib/formatRelative.js
var formatRelativeLocale$62={
lastWeek:"'el' eeee 'pasado a la' p",
yesterday:"'ayer a la' p",
today:"'hoy a la' p",
tomorrow:"'mañana a la' p",
nextWeek:"eeee 'a la' p",
other:"P"
};
var formatRelativeLocalePlural$2={
lastWeek:"'el' eeee 'pasado a las' p",
yesterday:"'ayer a las' p",
today:"'hoy a las' p",
tomorrow:"'mañana a las' p",
nextWeek:"eeee 'a las' p",
other:"P"
};
var formatRelative$62=function formatRelative$62(token,date,_baseDate,_options){
if(date.getHours()!==1)return formatRelativeLocalePlural$2[token];else
return formatRelativeLocale$62[token];
};
//#endregion
//#region dist/date-fns/locale/es/_lib/localize.js
var eraValues$61={
narrow:["AC","DC"],
abbreviated:["AC","DC"],
wide:["antes de cristo","después de cristo"]
};
var quarterValues$61={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"1º trimestre",
"2º trimestre",
"3º trimestre",
"4º trimestre"]

};
var monthValues$61={
narrow:[
"e",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"ene",
"feb",
"mar",
"abr",
"may",
"jun",
"jul",
"ago",
"sep",
"oct",
"nov",
"dic"],

wide:[
"enero",
"febrero",
"marzo",
"abril",
"mayo",
"junio",
"julio",
"agosto",
"septiembre",
"octubre",
"noviembre",
"diciembre"]

};
var dayValues$61={
narrow:[
"d",
"l",
"m",
"m",
"j",
"v",
"s"],

short:[
"do",
"lu",
"ma",
"mi",
"ju",
"vi",
"sá"],

abbreviated:[
"dom",
"lun",
"mar",
"mié",
"jue",
"vie",
"sáb"],

wide:[
"domingo",
"lunes",
"martes",
"miércoles",
"jueves",
"viernes",
"sábado"]

};
var dayPeriodValues$61={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"md",
morning:"mañana",
afternoon:"tarde",
evening:"tarde",
night:"noche"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"medianoche",
noon:"mediodia",
morning:"mañana",
afternoon:"tarde",
evening:"tarde",
night:"noche"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"medianoche",
noon:"mediodia",
morning:"mañana",
afternoon:"tarde",
evening:"tarde",
night:"noche"
}
};
var formattingDayPeriodValues$48={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"md",
morning:"de la mañana",
afternoon:"de la tarde",
evening:"de la tarde",
night:"de la noche"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"medianoche",
noon:"mediodia",
morning:"de la mañana",
afternoon:"de la tarde",
evening:"de la tarde",
night:"de la noche"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"medianoche",
noon:"mediodia",
morning:"de la mañana",
afternoon:"de la tarde",
evening:"de la tarde",
night:"de la noche"
}
};
var ordinalNumber$61=function ordinalNumber$61(dirtyNumber,_options){
return Number(dirtyNumber)+"º";
};
//#endregion
//#region dist/date-fns/locale/es.js
/**
* @category Locales
* @summary Spanish locale.
* @language Spanish
* @iso-639-2 spa
* @author Juan Angosto [@juanangosto](https://github.com/juanangosto)
* @author Guillermo Grau [@guigrpa](https://github.com/guigrpa)
* @author Fernando Agüero [@fjaguero](https://github.com/fjaguero)
* @author Gastón Haro [@harogaston](https://github.com/harogaston)
* @author Yago Carballo [@YagoCarballo](https://github.com/YagoCarballo)
*/
var _es={
code:"es",
formatDistance:formatDistance$61,
formatLong:formatLong$64,
formatRelative:formatRelative$62,
localize:{
ordinalNumber:ordinalNumber$61,
era:buildLocalizeFn({
values:eraValues$61,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$61,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return Number(quarter)-1;}
}),
month:buildLocalizeFn({
values:monthValues$61,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$61,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$61,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$48,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(º)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ac|dc|a|d)/i,
abbreviated:/^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
wide:/^(antes de cristo|antes de la era com[uú]n|despu[eé]s de cristo|era com[uú]n)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
any:[/^ac/i,/^dc/i],
wide:[/^(antes de cristo|antes de la era com[uú]n)/i,/^(despu[eé]s de cristo|era com[uú]n)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^T[1234]/i,
wide:/^[1234](º)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[efmajsond]/i,
abbreviated:/^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
wide:/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^e/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^en/i,
/^feb/i,
/^mar/i,
/^abr/i,
/^may/i,
/^jun/i,
/^jul/i,
/^ago/i,
/^sep/i,
/^oct/i,
/^nov/i,
/^dic/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dlmjvs]/i,
short:/^(do|lu|ma|mi|ju|vi|s[áa])/i,
abbreviated:/^(dom|lun|mar|mi[ée]|jue|vie|s[áa]b)/i,
wide:/^(domingo|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^j/i,
/^v/i,
/^s/i],

any:[
/^do/i,
/^lu/i,
/^ma/i,
/^mi/i,
/^ju/i,
/^vi/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mn|md|(de la|a las) (mañana|tarde|noche))/i,
any:/^([ap]\.?\s?m\.?|medianoche|mediodia|(de la|a las) (mañana|tarde|noche))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mn/i,
noon:/^md/i,
morning:/mañana/i,
afternoon:/tarde/i,
evening:/tarde/i,
night:/noche/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/et/_lib/formatDistance.js
var formatDistanceLocale$59={
lessThanXSeconds:{
standalone:{
one:"vähem kui üks sekund",
other:"vähem kui {{count}} sekundit"
},
withPreposition:{
one:"vähem kui ühe sekundi",
other:"vähem kui {{count}} sekundi"
}
},
xSeconds:{
standalone:{
one:"üks sekund",
other:"{{count}} sekundit"
},
withPreposition:{
one:"ühe sekundi",
other:"{{count}} sekundi"
}
},
halfAMinute:{
standalone:"pool minutit",
withPreposition:"poole minuti"
},
lessThanXMinutes:{
standalone:{
one:"vähem kui üks minut",
other:"vähem kui {{count}} minutit"
},
withPreposition:{
one:"vähem kui ühe minuti",
other:"vähem kui {{count}} minuti"
}
},
xMinutes:{
standalone:{
one:"üks minut",
other:"{{count}} minutit"
},
withPreposition:{
one:"ühe minuti",
other:"{{count}} minuti"
}
},
aboutXHours:{
standalone:{
one:"umbes üks tund",
other:"umbes {{count}} tundi"
},
withPreposition:{
one:"umbes ühe tunni",
other:"umbes {{count}} tunni"
}
},
xHours:{
standalone:{
one:"üks tund",
other:"{{count}} tundi"
},
withPreposition:{
one:"ühe tunni",
other:"{{count}} tunni"
}
},
xDays:{
standalone:{
one:"üks päev",
other:"{{count}} päeva"
},
withPreposition:{
one:"ühe päeva",
other:"{{count}} päeva"
}
},
aboutXWeeks:{
standalone:{
one:"umbes üks nädal",
other:"umbes {{count}} nädalat"
},
withPreposition:{
one:"umbes ühe nädala",
other:"umbes {{count}} nädala"
}
},
xWeeks:{
standalone:{
one:"üks nädal",
other:"{{count}} nädalat"
},
withPreposition:{
one:"ühe nädala",
other:"{{count}} nädala"
}
},
aboutXMonths:{
standalone:{
one:"umbes üks kuu",
other:"umbes {{count}} kuud"
},
withPreposition:{
one:"umbes ühe kuu",
other:"umbes {{count}} kuu"
}
},
xMonths:{
standalone:{
one:"üks kuu",
other:"{{count}} kuud"
},
withPreposition:{
one:"ühe kuu",
other:"{{count}} kuu"
}
},
aboutXYears:{
standalone:{
one:"umbes üks aasta",
other:"umbes {{count}} aastat"
},
withPreposition:{
one:"umbes ühe aasta",
other:"umbes {{count}} aasta"
}
},
xYears:{
standalone:{
one:"üks aasta",
other:"{{count}} aastat"
},
withPreposition:{
one:"ühe aasta",
other:"{{count}} aasta"
}
},
overXYears:{
standalone:{
one:"rohkem kui üks aasta",
other:"rohkem kui {{count}} aastat"
},
withPreposition:{
one:"rohkem kui ühe aasta",
other:"rohkem kui {{count}} aasta"
}
},
almostXYears:{
standalone:{
one:"peaaegu üks aasta",
other:"peaaegu {{count}} aastat"
},
withPreposition:{
one:"peaaegu ühe aasta",
other:"peaaegu {{count}} aasta"
}
}
};
var formatDistance$60=function formatDistance$60(token,count,options){
var usageGroup=options!==null&&options!==void 0&&options.addSuffix?formatDistanceLocale$59[token].withPreposition:formatDistanceLocale$59[token].standalone;
var result;
if(typeof usageGroup==="string")result=usageGroup;else
if(count===1)result=usageGroup.one;else
result=usageGroup.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" pärast";else
return result+" eest";
return result;
};
var formatLong$63={
date:buildFormatLongFn({
formats:{
full:"EEEE, d. MMMM y",
long:"d. MMMM y",
medium:"d. MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'kell' {{time}}",
long:"{{date}} 'kell' {{time}}",
medium:"{{date}}. {{time}}",
short:"{{date}}. {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/et/_lib/formatRelative.js
var formatRelativeLocale$61={
lastWeek:"'eelmine' eeee 'kell' p",
yesterday:"'eile kell' p",
today:"'täna kell' p",
tomorrow:"'homme kell' p",
nextWeek:"'järgmine' eeee 'kell' p",
other:"P"
};
var formatRelative$61=function formatRelative$61(token,_date,_baseDate,_options){return formatRelativeLocale$61[token];};
//#endregion
//#region dist/date-fns/locale/et/_lib/localize.js
var eraValues$60={
narrow:["e.m.a","m.a.j"],
abbreviated:["e.m.a","m.a.j"],
wide:["enne meie ajaarvamist","meie ajaarvamise järgi"]
};
var quarterValues$60={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$60={
narrow:[
"J",
"V",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jaan",
"veebr",
"märts",
"apr",
"mai",
"juuni",
"juuli",
"aug",
"sept",
"okt",
"nov",
"dets"],

wide:[
"jaanuar",
"veebruar",
"märts",
"aprill",
"mai",
"juuni",
"juuli",
"august",
"september",
"oktoober",
"november",
"detsember"]

};
var dayValues$60={
narrow:[
"P",
"E",
"T",
"K",
"N",
"R",
"L"],

short:[
"P",
"E",
"T",
"K",
"N",
"R",
"L"],

abbreviated:[
"pühap.",
"esmasp.",
"teisip.",
"kolmap.",
"neljap.",
"reede.",
"laup."],

wide:[
"pühapäev",
"esmaspäev",
"teisipäev",
"kolmapäev",
"neljapäev",
"reede",
"laupäev"]

};
var dayPeriodValues$60={
narrow:{
am:"AM",
pm:"PM",
midnight:"kesköö",
noon:"keskpäev",
morning:"hommik",
afternoon:"pärastlõuna",
evening:"õhtu",
night:"öö"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"kesköö",
noon:"keskpäev",
morning:"hommik",
afternoon:"pärastlõuna",
evening:"õhtu",
night:"öö"
},
wide:{
am:"AM",
pm:"PM",
midnight:"kesköö",
noon:"keskpäev",
morning:"hommik",
afternoon:"pärastlõuna",
evening:"õhtu",
night:"öö"
}
};
var formattingDayPeriodValues$47={
narrow:{
am:"AM",
pm:"PM",
midnight:"keskööl",
noon:"keskpäeval",
morning:"hommikul",
afternoon:"pärastlõunal",
evening:"õhtul",
night:"öösel"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"keskööl",
noon:"keskpäeval",
morning:"hommikul",
afternoon:"pärastlõunal",
evening:"õhtul",
night:"öösel"
},
wide:{
am:"AM",
pm:"PM",
midnight:"keskööl",
noon:"keskpäeval",
morning:"hommikul",
afternoon:"pärastlõunal",
evening:"õhtul",
night:"öösel"
}
};
var ordinalNumber$60=function ordinalNumber$60(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/et.js
/**
* @category Locales
* @summary Estonian locale.
* @language Estonian
* @iso-639-2 est
* @author Priit Hansen [@HansenPriit](https://github.com/priithansen)
*/
var _et={
code:"et",
formatDistance:formatDistance$60,
formatLong:formatLong$63,
formatRelative:formatRelative$61,
localize:{
ordinalNumber:ordinalNumber$60,
era:buildLocalizeFn({
values:eraValues$60,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$60,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$60,
defaultWidth:"wide",
formattingValues:monthValues$60,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$60,
defaultWidth:"wide",
formattingValues:dayValues$60,
defaultFormattingWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$60,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$47,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^\d+\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(e\.m\.a|m\.a\.j|eKr|pKr)/i,
abbreviated:/^(e\.m\.a|m\.a\.j|eKr|pKr)/i,
wide:/^(enne meie ajaarvamist|meie ajaarvamise järgi|enne Kristust|pärast Kristust)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^e/i,/^(m|p)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^K[1234]/i,
wide:/^[1234](\.)? kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jvmasond]/i,
abbreviated:/^(jaan|veebr|märts|apr|mai|juuni|juuli|aug|sept|okt|nov|dets)/i,
wide:/^(jaanuar|veebruar|märts|aprill|mai|juuni|juuli|august|september|oktoober|november|detsember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^v/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^v/i,
/^mär/i,
/^ap/i,
/^mai/i,
/^juun/i,
/^juul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[petknrl]/i,
short:/^[petknrl]/i,
abbreviated:/^(püh?|esm?|tei?|kolm?|nel?|ree?|laup?)\.?/i,
wide:/^(pühapäev|esmaspäev|teisipäev|kolmapäev|neljapäev|reede|laupäev)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^p/i,
/^e/i,
/^t/i,
/^k/i,
/^n/i,
/^r/i,
/^l/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|keskööl?|keskpäev(al)?|hommik(ul)?|pärastlõunal?|õhtul?|öö(sel)?)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^keskö/i,
noon:/^keskp/i,
morning:/hommik/i,
afternoon:/pärastlõuna/i,
evening:/õhtu/i,
night:/öö/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/eu/_lib/formatDistance.js
var formatDistanceLocale$58={
lessThanXSeconds:{
one:"segundo bat baino gutxiago",
other:"{{count}} segundo baino gutxiago"
},
xSeconds:{
one:"1 segundo",
other:"{{count}} segundo"
},
halfAMinute:"minutu erdi",
lessThanXMinutes:{
one:"minutu bat baino gutxiago",
other:"{{count}} minutu baino gutxiago"
},
xMinutes:{
one:"1 minutu",
other:"{{count}} minutu"
},
aboutXHours:{
one:"1 ordu gutxi gorabehera",
other:"{{count}} ordu gutxi gorabehera"
},
xHours:{
one:"1 ordu",
other:"{{count}} ordu"
},
xDays:{
one:"1 egun",
other:"{{count}} egun"
},
aboutXWeeks:{
one:"aste 1 inguru",
other:"{{count}} aste inguru"
},
xWeeks:{
one:"1 aste",
other:"{{count}} astean"
},
aboutXMonths:{
one:"1 hilabete gutxi gorabehera",
other:"{{count}} hilabete gutxi gorabehera"
},
xMonths:{
one:"1 hilabete",
other:"{{count}} hilabete"
},
aboutXYears:{
one:"1 urte gutxi gorabehera",
other:"{{count}} urte gutxi gorabehera"
},
xYears:{
one:"1 urte",
other:"{{count}} urte"
},
overXYears:{
one:"1 urte baino gehiago",
other:"{{count}} urte baino gehiago"
},
almostXYears:{
one:"ia 1 urte",
other:"ia {{count}} urte"
}
};
var formatDistance$59=function formatDistance$59(token,count,options){
var result;
var tokenValue=formatDistanceLocale$58[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"en "+result;else
return"duela "+result;
return result;
};
var formatLong$62={
date:buildFormatLongFn({
formats:{
full:"EEEE, y'ko' MMMM'ren' d'a' y'ren'",
long:"y'ko' MMMM'ren' d'a'",
medium:"y MMM d",
short:"yy/MM/dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'tan' {{time}}",
long:"{{date}} 'tan' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/eu/_lib/formatRelative.js
var formatRelativeLocale$60={
lastWeek:"'joan den' eeee, LT",
yesterday:"'atzo,' p",
today:"'gaur,' p",
tomorrow:"'bihar,' p",
nextWeek:"eeee, p",
other:"P"
};
var formatRelativeLocalePlural$1={
lastWeek:"'joan den' eeee, p",
yesterday:"'atzo,' p",
today:"'gaur,' p",
tomorrow:"'bihar,' p",
nextWeek:"eeee, p",
other:"P"
};
var formatRelative$60=function formatRelative$60(token,date){
if(date.getHours()!==1)return formatRelativeLocalePlural$1[token];
return formatRelativeLocale$60[token];
};
//#endregion
//#region dist/date-fns/locale/eu/_lib/localize.js
var eraValues$59={
narrow:["k.a.","k.o."],
abbreviated:["k.a.","k.o."],
wide:["kristo aurretik","kristo ondoren"]
};
var quarterValues$59={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1H",
"2H",
"3H",
"4H"],

wide:[
"1. hiruhilekoa",
"2. hiruhilekoa",
"3. hiruhilekoa",
"4. hiruhilekoa"]

};
var monthValues$59={
narrow:[
"u",
"o",
"m",
"a",
"m",
"e",
"u",
"a",
"i",
"u",
"a",
"a"],

abbreviated:[
"urt",
"ots",
"mar",
"api",
"mai",
"eka",
"uzt",
"abu",
"ira",
"urr",
"aza",
"abe"],

wide:[
"urtarrila",
"otsaila",
"martxoa",
"apirila",
"maiatza",
"ekaina",
"uztaila",
"abuztua",
"iraila",
"urria",
"azaroa",
"abendua"]

};
var dayValues$59={
narrow:[
"i",
"a",
"a",
"a",
"o",
"o",
"l"],

short:[
"ig",
"al",
"as",
"az",
"og",
"or",
"lr"],

abbreviated:[
"iga",
"ast",
"ast",
"ast",
"ost",
"ost",
"lar"],

wide:[
"igandea",
"astelehena",
"asteartea",
"asteazkena",
"osteguna",
"ostirala",
"larunbata"]

};
var dayPeriodValues$59={
narrow:{
am:"a",
pm:"p",
midnight:"ge",
noon:"eg",
morning:"goiza",
afternoon:"arratsaldea",
evening:"arratsaldea",
night:"gaua"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"gauerdia",
noon:"eguerdia",
morning:"goiza",
afternoon:"arratsaldea",
evening:"arratsaldea",
night:"gaua"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"gauerdia",
noon:"eguerdia",
morning:"goiza",
afternoon:"arratsaldea",
evening:"arratsaldea",
night:"gaua"
}
};
var formattingDayPeriodValues$46={
narrow:{
am:"a",
pm:"p",
midnight:"ge",
noon:"eg",
morning:"goizean",
afternoon:"arratsaldean",
evening:"arratsaldean",
night:"gauean"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"gauerdia",
noon:"eguerdia",
morning:"goizean",
afternoon:"arratsaldean",
evening:"arratsaldean",
night:"gauean"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"gauerdia",
noon:"eguerdia",
morning:"goizean",
afternoon:"arratsaldean",
evening:"arratsaldean",
night:"gauean"
}
};
var ordinalNumber$59=function ordinalNumber$59(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/eu.js
/**
* @category Locales
* @summary Basque locale.
* @language Basque
* @iso-639-2 eus
* @author Jacob Söderblom [@JacobSoderblom](https://github.com/JacobSoderblom)
*/
var _eu={
code:"eu",
formatDistance:formatDistance$59,
formatLong:formatLong$62,
formatRelative:formatRelative$60,
localize:{
ordinalNumber:ordinalNumber$59,
era:buildLocalizeFn({
values:eraValues$59,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$59,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$59,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$59,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$59,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$46,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(.)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(k.a.|k.o.)/i,
abbreviated:/^(k.a.|k.o.)/i,
wide:/^(kristo aurretik|kristo ondoren)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[/^k.a./i,/^k.o./i],
abbreviated:[/^(k.a.)/i,/^(k.o.)/i],
wide:[/^(kristo aurretik)/i,/^(kristo ondoren)/i]
},
defaultParseWidth:"wide"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]H/i,
wide:/^[1234](.)? hiruhilekoa/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[uomaei]/i,
abbreviated:/^(urt|ots|mar|api|mai|eka|uzt|abu|ira|urr|aza|abe)/i,
wide:/^(urtarrila|otsaila|martxoa|apirila|maiatza|ekaina|uztaila|abuztua|iraila|urria|azaroa|abendua)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^u/i,
/^o/i,
/^m/i,
/^a/i,
/^m/i,
/^e/i,
/^u/i,
/^a/i,
/^i/i,
/^u/i,
/^a/i,
/^a/i],

any:[
/^urt/i,
/^ots/i,
/^mar/i,
/^api/i,
/^mai/i,
/^eka/i,
/^uzt/i,
/^abu/i,
/^ira/i,
/^urr/i,
/^aza/i,
/^abe/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[iaol]/i,
short:/^(ig|al|as|az|og|or|lr)/i,
abbreviated:/^(iga|ast|ast|ast|ost|ost|lar)/i,
wide:/^(igandea|astelehena|asteartea|asteazkena|osteguna|ostirala|larunbata)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^i/i,
/^a/i,
/^a/i,
/^a/i,
/^o/i,
/^o/i,
/^l/i],

short:[
/^ig/i,
/^al/i,
/^as/i,
/^az/i,
/^og/i,
/^or/i,
/^lr/i],

abbreviated:[
/^iga/i,
/^ast/i,
/^ast/i,
/^ast/i,
/^ost/i,
/^ost/i,
/^lar/i],

wide:[
/^igandea/i,
/^astelehena/i,
/^asteartea/i,
/^asteazkena/i,
/^osteguna/i,
/^ostirala/i,
/^larunbata/i]

},
defaultParseWidth:"wide"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|ge|eg|((goiza|goizean)|arratsaldea|(gaua|gauean)))/i,
any:/^([ap]\.?\s?m\.?|gauerdia|eguerdia|((goiza|goizean)|arratsaldea|(gaua|gauean)))/i
},
defaultMatchWidth:"any",
parsePatterns:{
narrow:{
am:/^a/i,
pm:/^p/i,
midnight:/^ge/i,
noon:/^eg/i,
morning:/goiz/i,
afternoon:/arratsaldea/i,
evening:/arratsaldea/i,
night:/gau/i
},
any:{
am:/^a/i,
pm:/^p/i,
midnight:/^gauerdia/i,
noon:/^eguerdia/i,
morning:/goiz/i,
afternoon:/arratsaldea/i,
evening:/arratsaldea/i,
night:/gau/i
}
},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/fa-IR/_lib/formatDistance.js
var formatDistanceLocale$57={
lessThanXSeconds:{
one:"کمتر از یک ثانیه",
other:"کمتر از {{count}} ثانیه"
},
xSeconds:{
one:"1 ثانیه",
other:"{{count}} ثانیه"
},
halfAMinute:"نیم دقیقه",
lessThanXMinutes:{
one:"کمتر از یک دقیقه",
other:"کمتر از {{count}} دقیقه"
},
xMinutes:{
one:"1 دقیقه",
other:"{{count}} دقیقه"
},
aboutXHours:{
one:"حدود 1 ساعت",
other:"حدود {{count}} ساعت"
},
xHours:{
one:"1 ساعت",
other:"{{count}} ساعت"
},
xDays:{
one:"1 روز",
other:"{{count}} روز"
},
aboutXWeeks:{
one:"حدود 1 هفته",
other:"حدود {{count}} هفته"
},
xWeeks:{
one:"1 هفته",
other:"{{count}} هفته"
},
aboutXMonths:{
one:"حدود 1 ماه",
other:"حدود {{count}} ماه"
},
xMonths:{
one:"1 ماه",
other:"{{count}} ماه"
},
aboutXYears:{
one:"حدود 1 سال",
other:"حدود {{count}} سال"
},
xYears:{
one:"1 سال",
other:"{{count}} سال"
},
overXYears:{
one:"بیشتر از 1 سال",
other:"بیشتر از {{count}} سال"
},
almostXYears:{
one:"نزدیک 1 سال",
other:"نزدیک {{count}} سال"
}
};
var formatDistance$58=function formatDistance$58(token,count,options){
var result;
var tokenValue=formatDistanceLocale$57[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"در "+result;else
return result+" قبل";
return result;
};
var formatLong$61={
date:buildFormatLongFn({
formats:{
full:"EEEE do MMMM y",
long:"do MMMM y",
medium:"d MMM y",
short:"yyyy/MM/dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'در' {{time}}",
long:"{{date}} 'در' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/fa-IR/_lib/formatRelative.js
var formatRelativeLocale$59={
lastWeek:"eeee 'گذشته در' p",
yesterday:"'دیروز در' p",
today:"'امروز در' p",
tomorrow:"'فردا در' p",
nextWeek:"eeee 'در' p",
other:"P"
};
var formatRelative$59=function formatRelative$59(token,_date,_baseDate,_options){return formatRelativeLocale$59[token];};
//#endregion
//#region dist/date-fns/locale/fa-IR/_lib/localize.js
var eraValues$58={
narrow:["ق","ب"],
abbreviated:["ق.م.","ب.م."],
wide:["قبل از میلاد","بعد از میلاد"]
};
var quarterValues$58={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"س‌م1",
"س‌م2",
"س‌م3",
"س‌م4"],

wide:[
"سه‌ماهه 1",
"سه‌ماهه 2",
"سه‌ماهه 3",
"سه‌ماهه 4"]

};
var monthValues$58={
narrow:[
"ژ",
"ف",
"م",
"آ",
"م",
"ج",
"ج",
"آ",
"س",
"ا",
"ن",
"د"],

abbreviated:[
"ژانـ",
"فور",
"مارس",
"آپر",
"می",
"جون",
"جولـ",
"آگو",
"سپتـ",
"اکتـ",
"نوامـ",
"دسامـ"],

wide:[
"ژانویه",
"فوریه",
"مارس",
"آپریل",
"می",
"جون",
"جولای",
"آگوست",
"سپتامبر",
"اکتبر",
"نوامبر",
"دسامبر"]

};
var dayValues$58={
narrow:[
"ی",
"د",
"س",
"چ",
"پ",
"ج",
"ش"],

short:[
"1ش",
"2ش",
"3ش",
"4ش",
"5ش",
"ج",
"ش"],

abbreviated:[
"یکشنبه",
"دوشنبه",
"سه‌شنبه",
"چهارشنبه",
"پنجشنبه",
"جمعه",
"شنبه"],

wide:[
"یکشنبه",
"دوشنبه",
"سه‌شنبه",
"چهارشنبه",
"پنجشنبه",
"جمعه",
"شنبه"]

};
var dayPeriodValues$58={
narrow:{
am:"ق",
pm:"ب",
midnight:"ن",
noon:"ظ",
morning:"ص",
afternoon:"ب.ظ.",
evening:"ع",
night:"ش"
},
abbreviated:{
am:"ق.ظ.",
pm:"ب.ظ.",
midnight:"نیمه‌شب",
noon:"ظهر",
morning:"صبح",
afternoon:"بعدازظهر",
evening:"عصر",
night:"شب"
},
wide:{
am:"قبل‌ازظهر",
pm:"بعدازظهر",
midnight:"نیمه‌شب",
noon:"ظهر",
morning:"صبح",
afternoon:"بعدازظهر",
evening:"عصر",
night:"شب"
}
};
var formattingDayPeriodValues$45={
narrow:{
am:"ق",
pm:"ب",
midnight:"ن",
noon:"ظ",
morning:"ص",
afternoon:"ب.ظ.",
evening:"ع",
night:"ش"
},
abbreviated:{
am:"ق.ظ.",
pm:"ب.ظ.",
midnight:"نیمه‌شب",
noon:"ظهر",
morning:"صبح",
afternoon:"بعدازظهر",
evening:"عصر",
night:"شب"
},
wide:{
am:"قبل‌ازظهر",
pm:"بعدازظهر",
midnight:"نیمه‌شب",
noon:"ظهر",
morning:"صبح",
afternoon:"بعدازظهر",
evening:"عصر",
night:"شب"
}
};
var ordinalNumber$58=function ordinalNumber$58(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/fa-IR.js
/**
* @category Locales
* @summary Persian/Farsi locale (Iran).
* @language Persian
* @iso-639-2 ira
* @author Morteza Ziyae [@mort3za](https://github.com/mort3za)
*/
var _faIR={
code:"fa-IR",
formatDistance:formatDistance$58,
formatLong:formatLong$61,
formatRelative:formatRelative$59,
localize:{
ordinalNumber:ordinalNumber$58,
era:buildLocalizeFn({
values:eraValues$58,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$58,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$58,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$58,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$58,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$45,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ق|ب)/i,
abbreviated:/^(ق\.?\s?م\.?|ق\.?\s?د\.?\s?م\.?|م\.?\s?|د\.?\s?م\.?)/i,
wide:/^(قبل از میلاد|قبل از دوران مشترک|میلادی|دوران مشترک|بعد از میلاد)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^قبل/i,/^بعد/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^س‌م[1234]/i,
wide:/^سه‌ماهه [1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[جژفمآاماسند]/i,
abbreviated:/^(جنو|ژانـ|ژانویه|فوریه|فور|مارس|آوریل|آپر|مه|می|ژوئن|جون|جول|جولـ|ژوئیه|اوت|آگو|سپتمبر|سپتامبر|اکتبر|اکتوبر|نوامبر|نوامـ|دسامبر|دسامـ|دسم)/i,
wide:/^(ژانویه|جنوری|فبروری|فوریه|مارچ|مارس|آپریل|اپریل|ایپریل|آوریل|مه|می|ژوئن|جون|جولای|ژوئیه|آگست|اگست|آگوست|اوت|سپتمبر|سپتامبر|اکتبر|اکتوبر|نوامبر|نومبر|دسامبر|دسمبر)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^(ژ|ج)/i,
/^ف/i,
/^م/i,
/^(آ|ا)/i,
/^م/i,
/^(ژ|ج)/i,
/^(ج|ژ)/i,
/^(آ|ا)/i,
/^س/i,
/^ا/i,
/^ن/i,
/^د/i],

any:[
/^ژا/i,
/^ف/i,
/^ما/i,
/^آپ/i,
/^(می|مه)/i,
/^(ژوئن|جون)/i,
/^(ژوئی|جول)/i,
/^(اوت|آگ)/i,
/^س/i,
/^(اوک|اک)/i,
/^ن/i,
/^د/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[شیدسچپج]/i,
short:/^(ش|ج|1ش|2ش|3ش|4ش|5ش)/i,
abbreviated:/^(یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|جمعه|شنبه)/i,
wide:/^(یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|جمعه|شنبه)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ی/i,
/^دو/i,
/^س/i,
/^چ/i,
/^پ/i,
/^ج/i,
/^ش/i],

any:[
/^(ی|1ش|یکشنبه)/i,
/^(د|2ش|دوشنبه)/i,
/^(س|3ش|سه‌شنبه)/i,
/^(چ|4ش|چهارشنبه)/i,
/^(پ|5ش|پنجشنبه)/i,
/^(ج|جمعه)/i,
/^(ش|شنبه)/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ب|ق|ن|ظ|ص|ب.ظ.|ع|ش)/i,
abbreviated:/^(ق.ظ.|ب.ظ.|نیمه‌شب|ظهر|صبح|بعدازظهر|عصر|شب)/i,
wide:/^(قبل‌ازظهر|نیمه‌شب|ظهر|صبح|بعدازظهر|عصر|شب)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^(ق|ق.ظ.|قبل‌ازظهر)/i,
pm:/^(ب|ب.ظ.|بعدازظهر)/i,
midnight:/^(‌نیمه‌شب|ن)/i,
noon:/^(ظ|ظهر)/i,
morning:/(ص|صبح)/i,
afternoon:/(ب|ب.ظ.|بعدازظهر)/i,
evening:/(ع|عصر)/i,
night:/(ش|شب)/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:6,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/fi/_lib/formatDistance.js
function futureSeconds(text){
return text.replace(/sekuntia?/,"sekunnin");
}
function futureMinutes(text){
return text.replace(/minuuttia?/,"minuutin");
}
function futureHours(text){
return text.replace(/tuntia?/,"tunnin");
}
function futureDays(text){
return text.replace(/päivää?/,"päivän");
}
function futureWeeks(text){
return text.replace(/(viikko|viikkoa)/,"viikon");
}
function futureMonths(text){
return text.replace(/(kuukausi|kuukautta)/,"kuukauden");
}
function futureYears(text){
return text.replace(/(vuosi|vuotta)/,"vuoden");
}
var formatDistanceLocale$56={
lessThanXSeconds:{
one:"alle sekunti",
other:"alle {{count}} sekuntia",
futureTense:futureSeconds
},
xSeconds:{
one:"sekunti",
other:"{{count}} sekuntia",
futureTense:futureSeconds
},
halfAMinute:{
one:"puoli minuuttia",
other:"puoli minuuttia",
futureTense:function futureTense(_text){return"puolen minuutin";}
},
lessThanXMinutes:{
one:"alle minuutti",
other:"alle {{count}} minuuttia",
futureTense:futureMinutes
},
xMinutes:{
one:"minuutti",
other:"{{count}} minuuttia",
futureTense:futureMinutes
},
aboutXHours:{
one:"noin tunti",
other:"noin {{count}} tuntia",
futureTense:futureHours
},
xHours:{
one:"tunti",
other:"{{count}} tuntia",
futureTense:futureHours
},
xDays:{
one:"päivä",
other:"{{count}} päivää",
futureTense:futureDays
},
aboutXWeeks:{
one:"noin viikko",
other:"noin {{count}} viikkoa",
futureTense:futureWeeks
},
xWeeks:{
one:"viikko",
other:"{{count}} viikkoa",
futureTense:futureWeeks
},
aboutXMonths:{
one:"noin kuukausi",
other:"noin {{count}} kuukautta",
futureTense:futureMonths
},
xMonths:{
one:"kuukausi",
other:"{{count}} kuukautta",
futureTense:futureMonths
},
aboutXYears:{
one:"noin vuosi",
other:"noin {{count}} vuotta",
futureTense:futureYears
},
xYears:{
one:"vuosi",
other:"{{count}} vuotta",
futureTense:futureYears
},
overXYears:{
one:"yli vuosi",
other:"yli {{count}} vuotta",
futureTense:futureYears
},
almostXYears:{
one:"lähes vuosi",
other:"lähes {{count}} vuotta",
futureTense:futureYears
}
};
var formatDistance$57=function formatDistance$57(token,count,options){
var tokenValue=formatDistanceLocale$56[token];
var result=count===1?tokenValue.one:tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return tokenValue.futureTense(result)+" kuluttua";else
return result+" sitten";
return result;
};
var formatLong$60={
date:buildFormatLongFn({
formats:{
full:"eeee d. MMMM y",
long:"d. MMMM y",
medium:"d. MMM y",
short:"d.M.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH.mm.ss zzzz",
long:"HH.mm.ss z",
medium:"HH.mm.ss",
short:"HH.mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'klo' {{time}}",
long:"{{date}} 'klo' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/fi/_lib/formatRelative.js
var formatRelativeLocale$58={
lastWeek:"'viime' eeee 'klo' p",
yesterday:"'eilen klo' p",
today:"'tänään klo' p",
tomorrow:"'huomenna klo' p",
nextWeek:"'ensi' eeee 'klo' p",
other:"P"
};
var formatRelative$58=function formatRelative$58(token,_date,_baseDate,_options){return formatRelativeLocale$58[token];};
//#endregion
//#region dist/date-fns/locale/fi/_lib/localize.js
var eraValues$57={
narrow:["eaa.","jaa."],
abbreviated:["eaa.","jaa."],
wide:["ennen ajanlaskun alkua","jälkeen ajanlaskun alun"]
};
var quarterValues$57={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. kvartaali",
"2. kvartaali",
"3. kvartaali",
"4. kvartaali"]

};
var monthValues$57={
narrow:[
"T",
"H",
"M",
"H",
"T",
"K",
"H",
"E",
"S",
"L",
"M",
"J"],

abbreviated:[
"tammi",
"helmi",
"maalis",
"huhti",
"touko",
"kesä",
"heinä",
"elo",
"syys",
"loka",
"marras",
"joulu"],

wide:[
"tammikuu",
"helmikuu",
"maaliskuu",
"huhtikuu",
"toukokuu",
"kesäkuu",
"heinäkuu",
"elokuu",
"syyskuu",
"lokakuu",
"marraskuu",
"joulukuu"]

};
var formattingMonthValues$11={
narrow:monthValues$57.narrow,
abbreviated:monthValues$57.abbreviated,
wide:[
"tammikuuta",
"helmikuuta",
"maaliskuuta",
"huhtikuuta",
"toukokuuta",
"kesäkuuta",
"heinäkuuta",
"elokuuta",
"syyskuuta",
"lokakuuta",
"marraskuuta",
"joulukuuta"]

};
var dayValues$57={
narrow:[
"S",
"M",
"T",
"K",
"T",
"P",
"L"],

short:[
"su",
"ma",
"ti",
"ke",
"to",
"pe",
"la"],

abbreviated:[
"sunn.",
"maan.",
"tiis.",
"kesk.",
"torst.",
"perj.",
"la"],

wide:[
"sunnuntai",
"maanantai",
"tiistai",
"keskiviikko",
"torstai",
"perjantai",
"lauantai"]

};
var formattingDayValues$3={
narrow:dayValues$57.narrow,
short:dayValues$57.short,
abbreviated:dayValues$57.abbreviated,
wide:[
"sunnuntaina",
"maanantaina",
"tiistaina",
"keskiviikkona",
"torstaina",
"perjantaina",
"lauantaina"]

};
var dayPeriodValues$57={
narrow:{
am:"ap",
pm:"ip",
midnight:"keskiyö",
noon:"keskipäivä",
morning:"ap",
afternoon:"ip",
evening:"illalla",
night:"yöllä"
},
abbreviated:{
am:"ap",
pm:"ip",
midnight:"keskiyö",
noon:"keskipäivä",
morning:"ap",
afternoon:"ip",
evening:"illalla",
night:"yöllä"
},
wide:{
am:"ap",
pm:"ip",
midnight:"keskiyöllä",
noon:"keskipäivällä",
morning:"aamupäivällä",
afternoon:"iltapäivällä",
evening:"illalla",
night:"yöllä"
}
};
var ordinalNumber$57=function ordinalNumber$57(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/fi.js
/**
* @category Locales
* @summary Finnish locale.
* @language Finnish
* @iso-639-2 fin
* @author Pyry-Samuli Lahti [@Pyppe](https://github.com/Pyppe)
* @author Edo Rivai [@mikolajgrzyb](https://github.com/mikolajgrzyb)
* @author Samu Juvonen [@sjuvonen](https://github.com/sjuvonen)
*/
var _fi={
code:"fi",
formatDistance:formatDistance$57,
formatLong:formatLong$60,
formatRelative:formatRelative$58,
localize:{
ordinalNumber:ordinalNumber$57,
era:buildLocalizeFn({
values:eraValues$57,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$57,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$57,
defaultWidth:"wide",
formattingValues:formattingMonthValues$11,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$57,
defaultWidth:"wide",
formattingValues:formattingDayValues$3,
defaultFormattingWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$57,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(\.)/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(e|j)/i,
abbreviated:/^(eaa.|jaa.)/i,
wide:/^(ennen ajanlaskun alkua|jälkeen ajanlaskun alun)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^e/i,/^j/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234]\.? kvartaali/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[thmkeslj]/i,
abbreviated:/^(tammi|helmi|maalis|huhti|touko|kesä|heinä|elo|syys|loka|marras|joulu)/i,
wide:/^(tammikuu|helmikuu|maaliskuu|huhtikuu|toukokuu|kesäkuu|heinäkuu|elokuu|syyskuu|lokakuu|marraskuu|joulukuu)(ta)?/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^t/i,
/^h/i,
/^m/i,
/^h/i,
/^t/i,
/^k/i,
/^h/i,
/^e/i,
/^s/i,
/^l/i,
/^m/i,
/^j/i],

any:[
/^ta/i,
/^hel/i,
/^maa/i,
/^hu/i,
/^to/i,
/^k/i,
/^hei/i,
/^e/i,
/^s/i,
/^l/i,
/^mar/i,
/^j/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtkpl]/i,
short:/^(su|ma|ti|ke|to|pe|la)/i,
abbreviated:/^(sunn.|maan.|tiis.|kesk.|torst.|perj.|la)/i,
wide:/^(sunnuntai|maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai)(na)?/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^k/i,
/^t/i,
/^p/i,
/^l/i],

any:[
/^s/i,
/^m/i,
/^ti/i,
/^k/i,
/^to/i,
/^p/i,
/^l/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ap|ip|keskiyö|keskipäivä|aamupäivällä|iltapäivällä|illalla|yöllä)/i,
any:/^(ap|ip|keskiyöllä|keskipäivällä|aamupäivällä|iltapäivällä|illalla|yöllä)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ap/i,
pm:/^ip/i,
midnight:/^keskiyö/i,
noon:/^keskipäivä/i,
morning:/aamupäivällä/i,
afternoon:/iltapäivällä/i,
evening:/illalla/i,
night:/yöllä/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/fr/_lib/formatDistance.js
var formatDistanceLocale$55={
lessThanXSeconds:{
one:"moins d’une seconde",
other:"moins de {{count}} secondes"
},
xSeconds:{
one:"1 seconde",
other:"{{count}} secondes"
},
halfAMinute:"30 secondes",
lessThanXMinutes:{
one:"moins d’une minute",
other:"moins de {{count}} minutes"
},
xMinutes:{
one:"1 minute",
other:"{{count}} minutes"
},
aboutXHours:{
one:"environ 1 heure",
other:"environ {{count}} heures"
},
xHours:{
one:"1 heure",
other:"{{count}} heures"
},
xDays:{
one:"1 jour",
other:"{{count}} jours"
},
aboutXWeeks:{
one:"environ 1 semaine",
other:"environ {{count}} semaines"
},
xWeeks:{
one:"1 semaine",
other:"{{count}} semaines"
},
aboutXMonths:{
one:"environ 1 mois",
other:"environ {{count}} mois"
},
xMonths:{
one:"1 mois",
other:"{{count}} mois"
},
aboutXYears:{
one:"environ 1 an",
other:"environ {{count}} ans"
},
xYears:{
one:"1 an",
other:"{{count}} ans"
},
overXYears:{
one:"plus d’un an",
other:"plus de {{count}} ans"
},
almostXYears:{
one:"presqu’un an",
other:"presque {{count}} ans"
}
};
var formatDistance$56=function formatDistance$56(token,count,options){
var result;
var form=formatDistanceLocale$55[token];
if(typeof form==="string")result=form;else
if(count===1)result=form.one;else
result=form.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"dans "+result;else
return"il y a "+result;
return result;
};
var formatLong$59={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'à' {{time}}",
long:"{{date}} 'à' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/fr/_lib/formatRelative.js
var formatRelativeLocale$57={
lastWeek:"eeee 'dernier à' p",
yesterday:"'hier à' p",
today:"'aujourd’hui à' p",
tomorrow:"'demain à' p'",
nextWeek:"eeee 'prochain à' p",
other:"P"
};
var formatRelative$57=function formatRelative$57(token,_date,_baseDate,_options){return formatRelativeLocale$57[token];};
//#endregion
//#region dist/date-fns/locale/fr/_lib/localize.js
var eraValues$56={
narrow:["av. J.-C","ap. J.-C"],
abbreviated:["av. J.-C","ap. J.-C"],
wide:["avant Jésus-Christ","après Jésus-Christ"]
};
var quarterValues$56={
narrow:[
"T1",
"T2",
"T3",
"T4"],

abbreviated:[
"1er trim.",
"2ème trim.",
"3ème trim.",
"4ème trim."],

wide:[
"1er trimestre",
"2ème trimestre",
"3ème trimestre",
"4ème trimestre"]

};
var monthValues$56={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"janv.",
"févr.",
"mars",
"avr.",
"mai",
"juin",
"juil.",
"août",
"sept.",
"oct.",
"nov.",
"déc."],

wide:[
"janvier",
"février",
"mars",
"avril",
"mai",
"juin",
"juillet",
"août",
"septembre",
"octobre",
"novembre",
"décembre"]

};
var dayValues$56={
narrow:[
"D",
"L",
"M",
"M",
"J",
"V",
"S"],

short:[
"di",
"lu",
"ma",
"me",
"je",
"ve",
"sa"],

abbreviated:[
"dim.",
"lun.",
"mar.",
"mer.",
"jeu.",
"ven.",
"sam."],

wide:[
"dimanche",
"lundi",
"mardi",
"mercredi",
"jeudi",
"vendredi",
"samedi"]

};
var dayPeriodValues$56={
narrow:{
am:"AM",
pm:"PM",
midnight:"minuit",
noon:"midi",
morning:"mat.",
afternoon:"ap.m.",
evening:"soir",
night:"mat."
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"minuit",
noon:"midi",
morning:"matin",
afternoon:"après-midi",
evening:"soir",
night:"matin"
},
wide:{
am:"AM",
pm:"PM",
midnight:"minuit",
noon:"midi",
morning:"du matin",
afternoon:"de l’après-midi",
evening:"du soir",
night:"du matin"
}
};
var ordinalNumber$56=function ordinalNumber$56(dirtyNumber,options){
var number=Number(dirtyNumber);
var unit=options===null||options===void 0?void 0:options.unit;
if(number===0)return"0";
var feminineUnits=[
"year",
"week",
"hour",
"minute",
"second"];

var suffix;
if(number===1)suffix=unit&&feminineUnits.includes(unit)?"ère":"er";else
suffix="ème";
return number+suffix;
};
var LONG_MONTHS_TOKENS=["MMM","MMMM"];
var localize$56={
preprocessor:function preprocessor(date,parts){
if(date.getDate()===1)return parts;
if(!parts.some(function(part){return part.isToken&&LONG_MONTHS_TOKENS.includes(part.value);}))return parts;
return parts.map(function(part){return part.isToken&&part.value==="do"?{
isToken:true,
value:"d"
}:part;});
},
ordinalNumber:ordinalNumber$56,
era:buildLocalizeFn({
values:eraValues$56,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$56,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$56,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$56,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$56,
defaultWidth:"wide"
})
};
var match$56={
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(ième|ère|ème|er|e)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
abbreviated:/^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
wide:/^(avant Jésus-Christ|après Jésus-Christ)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^av/i,/^ap/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^T?[1234]/i,
abbreviated:/^[1234](er|ème|e)? trim\.?/i,
wide:/^[1234](er|ème|e)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
wide:/^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^av/i,
/^ma/i,
/^juin/i,
/^juil/i,
/^ao/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[lmjvsd]/i,
short:/^(di|lu|ma|me|je|ve|sa)/i,
abbreviated:/^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
wide:/^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^j/i,
/^v/i,
/^s/i],

any:[
/^di/i,
/^lu/i,
/^ma/i,
/^me/i,
/^je/i,
/^ve/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
any:/^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^min/i,
noon:/^mid/i,
morning:/mat/i,
afternoon:/ap/i,
evening:/soir/i,
night:/nuit/i
}},
defaultParseWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/fr.js
/**
* @category Locales
* @summary French locale.
* @language French
* @iso-639-2 fra
* @author Jean Dupouy [@izeau](https://github.com/izeau)
* @author François B [@fbonzon](https://github.com/fbonzon)
*/
var _fr={
code:"fr",
formatDistance:formatDistance$56,
formatLong:formatLong$59,
formatRelative:formatRelative$57,
localize:localize$56,
match:match$56,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/fr-CA.js
/**
* @category Locales
* @summary French locale (Canada).
* @language French
* @iso-639-2 fra
* @author Jean Dupouy [@izeau](https://github.com/izeau)
* @author François B [@fbonzon](https://github.com/fbonzon)
* @author Gabriele Petrioli [@gpetrioli](https://github.com/gpetrioli)
*/
var _frCA={
code:"fr-CA",
formatDistance:formatDistance$56,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"yy-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'à' {{time}}",
long:"{{date}} 'à' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$57,
localize:localize$56,
match:match$56,
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
var formatLong$57={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'à' {{time}}",
long:"{{date}} 'à' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/fr-CH/_lib/formatRelative.js
var formatRelativeLocale$56={
lastWeek:"eeee 'la semaine dernière à' p",
yesterday:"'hier à' p",
today:"'aujourd’hui à' p",
tomorrow:"'demain à' p'",
nextWeek:"eeee 'la semaine prochaine à' p",
other:"P"
};
var formatRelative$56=function formatRelative$56(token,_date,_baseDate,_options){return formatRelativeLocale$56[token];};
//#endregion
//#region dist/date-fns/locale/fr-CH.js
/**
* @category Locales
* @summary French locale (Switzerland).
* @language French
* @iso-639-2 fra
* @author Jean Dupouy [@izeau](https://github.com/izeau)
* @author François B [@fbonzon](https://github.com/fbonzon)
* @author Van Vuong Ngo [@vanvuongngo](https://github.com/vanvuongngo)
* @author Alex Hoeing [@dcbn](https://github.com/dcbn)
*/
var _frCH={
code:"fr-CH",
formatDistance:formatDistance$56,
formatLong:formatLong$57,
formatRelative:formatRelative$56,
localize:localize$56,
match:match$56,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/fy/_lib/formatDistance.js
var formatDistanceLocale$54={
lessThanXSeconds:{
one:"minder as 1 sekonde",
other:"minder as {{count}} sekonden"
},
xSeconds:{
one:"1 sekonde",
other:"{{count}} sekonden"
},
halfAMinute:"oardel minút",
lessThanXMinutes:{
one:"minder as 1 minút",
other:"minder as {{count}} minuten"
},
xMinutes:{
one:"1 minút",
other:"{{count}} minuten"
},
aboutXHours:{
one:"sawat 1 oere",
other:"sawat {{count}} oere"
},
xHours:{
one:"1 oere",
other:"{{count}} oere"
},
xDays:{
one:"1 dei",
other:"{{count}} dagen"
},
aboutXWeeks:{
one:"sawat 1 wike",
other:"sawat {{count}} wiken"
},
xWeeks:{
one:"1 wike",
other:"{{count}} wiken"
},
aboutXMonths:{
one:"sawat 1 moanne",
other:"sawat {{count}} moannen"
},
xMonths:{
one:"1 moanne",
other:"{{count}} moannen"
},
aboutXYears:{
one:"sawat 1 jier",
other:"sawat {{count}} jier"
},
xYears:{
one:"1 jier",
other:"{{count}} jier"
},
overXYears:{
one:"mear as 1 jier",
other:"mear as {{count}}s jier"
},
almostXYears:{
one:"hast 1 jier",
other:"hast {{count}} jier"
}
};
var formatDistance$55=function formatDistance$55(token,count,options){
var result;
var tokenValue=formatDistanceLocale$54[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"oer "+result;else
return result+" lyn";
return result;
};
var formatLong$56={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd-MM-y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'om' {{time}}",
long:"{{date}} 'om' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/fy/_lib/formatRelative.js
var formatRelativeLocale$55={
lastWeek:"'ôfrûne' eeee 'om' p",
yesterday:"'juster om' p",
today:"'hjoed om' p",
tomorrow:"'moarn om' p",
nextWeek:"eeee 'om' p",
other:"P"
};
var formatRelative$55=function formatRelative$55(token,_date,_baseDate,_options){return formatRelativeLocale$55[token];};
//#endregion
//#region dist/date-fns/locale/fy/_lib/localize.js
var eraValues$55={
narrow:["f.K.","n.K."],
abbreviated:["f.Kr.","n.Kr."],
wide:["foar Kristus","nei Kristus"]
};
var quarterValues$55={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1e fearnsjier",
"2e fearnsjier",
"3e fearnsjier",
"4e fearnsjier"]

};
var monthValues$55={
narrow:[
"j",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"jan.",
"feb.",
"mrt.",
"apr.",
"mai.",
"jun.",
"jul.",
"aug.",
"sep.",
"okt.",
"nov.",
"des."],

wide:[
"jannewaris",
"febrewaris",
"maart",
"april",
"maaie",
"juny",
"july",
"augustus",
"septimber",
"oktober",
"novimber",
"desimber"]

};
var dayValues$55={
narrow:[
"s",
"m",
"t",
"w",
"t",
"f",
"s"],

short:[
"si",
"mo",
"ti",
"wo",
"to",
"fr",
"so"],

abbreviated:[
"snein",
"moa",
"tii",
"woa",
"ton",
"fre",
"sneon"],

wide:[
"snein",
"moandei",
"tiisdei",
"woansdei",
"tongersdei",
"freed",
"sneon"]

};
var dayPeriodValues$55={
narrow:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"middei",
morning:"moarns",
afternoon:"middeis",
evening:"jûns",
night:"nachts"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"middei",
morning:"moarns",
afternoon:"middeis",
evening:"jûns",
night:"nachts"
},
wide:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"middei",
morning:"moarns",
afternoon:"middeis",
evening:"jûns",
night:"nachts"
}
};
var ordinalNumber$55=function ordinalNumber$55(dirtyNumber,_options){
return Number(dirtyNumber)+"e";
};
//#endregion
//#region dist/date-fns/locale/fy.js
/**
* @category Locales
* @summary Western Frisian locale (Netherlands).
* @language West Frisian
* @iso-639-2 fry
* @author Damon Asberg [@damon02](https://github.com/damon02)
*/
var _fy={
code:"fy",
formatDistance:formatDistance$55,
formatLong:formatLong$56,
formatRelative:formatRelative$55,
localize:{
ordinalNumber:ordinalNumber$55,
era:buildLocalizeFn({
values:eraValues$55,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$55,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$55,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$55,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$55,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)e?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^([fn]\.? ?K\.?)/,
abbreviated:/^([fn]\. ?Kr\.?)/,
wide:/^((foar|nei) Kristus)/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^f/,/^n/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^K[1234]/i,
wide:/^[1234]e fearnsjier/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan.|feb.|mrt.|apr.|mai.|jun.|jul.|aug.|sep.|okt.|nov.|des.)/i,
wide:/^(jannewaris|febrewaris|maart|april|maaie|juny|july|augustus|septimber|oktober|novimber|desimber)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^jan/i,
/^feb/i,
/^m(r|a)/i,
/^apr/i,
/^mai/i,
/^jun/i,
/^jul/i,
/^aug/i,
/^sep/i,
/^okt/i,
/^nov/i,
/^des/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtwf]/i,
short:/^(si|mo|ti|wo|to|fr|so)/i,
abbreviated:/^(snein|moa|tii|woa|ton|fre|sneon)/i,
wide:/^(snein|moandei|tiisdei|woansdei|tongersdei|freed|sneon)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^w/i,
/^t/i,
/^f/i,
/^s/i],

any:[
/^sn/i,
/^mo/i,
/^ti/i,
/^wo/i,
/^to/i,
/^fr/i,
/^sn/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|middernacht|middeis|moarns|middei|jûns|nachts)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^am/i,
pm:/^pm/i,
midnight:/^middernacht/i,
noon:/^middei/i,
morning:/moarns/i,
afternoon:/^middeis/i,
evening:/jûns/i,
night:/nachts/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/gd/_lib/formatDistance.js
var formatDistanceLocale$53={
lessThanXSeconds:{
one:"nas lugha na diog",
other:"nas lugha na {{count}} diogan"
},
xSeconds:{
one:"1 diog",
two:"2 dhiog",
twenty:"20 diog",
other:"{{count}} diogan"
},
halfAMinute:"leth mhionaid",
lessThanXMinutes:{
one:"nas lugha na mionaid",
other:"nas lugha na {{count}} mionaidean"
},
xMinutes:{
one:"1 mionaid",
two:"2 mhionaid",
twenty:"20 mionaid",
other:"{{count}} mionaidean"
},
aboutXHours:{
one:"mu uair de thìde",
other:"mu {{count}} uairean de thìde"
},
xHours:{
one:"1 uair de thìde",
two:"2 uair de thìde",
twenty:"20 uair de thìde",
other:"{{count}} uairean de thìde"
},
xDays:{
one:"1 là",
other:"{{count}} là"
},
aboutXWeeks:{
one:"mu 1 seachdain",
other:"mu {{count}} seachdainean"
},
xWeeks:{
one:"1 seachdain",
other:"{{count}} seachdainean"
},
aboutXMonths:{
one:"mu mhìos",
other:"mu {{count}} mìosan"
},
xMonths:{
one:"1 mìos",
other:"{{count}} mìosan"
},
aboutXYears:{
one:"mu bhliadhna",
other:"mu {{count}} bliadhnaichean"
},
xYears:{
one:"1 bhliadhna",
other:"{{count}} bliadhna"
},
overXYears:{
one:"còrr is bliadhna",
other:"còrr is {{count}} bliadhnaichean"
},
almostXYears:{
one:"cha mhòr bliadhna",
other:"cha mhòr {{count}} bliadhnaichean"
}
};
var formatDistance$54=function formatDistance$54(token,count,options){
var result;
var tokenValue=formatDistanceLocale$53[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===2&&!!tokenValue.two)result=tokenValue.two;else
if(count===20&&!!tokenValue.twenty)result=tokenValue.twenty;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"ann an "+result;else
return"o chionn "+result;
return result;
};
var formatLong$55={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'aig' {{time}}",
long:"{{date}} 'aig' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/gd/_lib/formatRelative.js
var formatRelativeLocale$54={
lastWeek:"'mu dheireadh' eeee 'aig' p",
yesterday:"'an-dè aig' p",
today:"'an-diugh aig' p",
tomorrow:"'a-màireach aig' p",
nextWeek:"eeee 'aig' p",
other:"P"
};
var formatRelative$54=function formatRelative$54(token,_date,_baseDate,_options){return formatRelativeLocale$54[token];};
//#endregion
//#region dist/date-fns/locale/gd/_lib/localize.js
var eraValues$54={
narrow:["R","A"],
abbreviated:["RC","AD"],
wide:["ro Chrìosta","anno domini"]
};
var quarterValues$54={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"C1",
"C2",
"C3",
"C4"],

wide:[
"a' chiad chairteal",
"an dàrna cairteal",
"an treas cairteal",
"an ceathramh cairteal"]

};
var monthValues$54={
narrow:[
"F",
"G",
"M",
"G",
"C",
"Ò",
"I",
"L",
"S",
"D",
"S",
"D"],

abbreviated:[
"Faoi",
"Gear",
"Màrt",
"Gibl",
"Cèit",
"Ògmh",
"Iuch",
"Lùn",
"Sult",
"Dàmh",
"Samh",
"Dùbh"],

wide:[
"Am Faoilleach",
"An Gearran",
"Am Màrt",
"An Giblean",
"An Cèitean",
"An t-Ògmhios",
"An t-Iuchar",
"An Lùnastal",
"An t-Sultain",
"An Dàmhair",
"An t-Samhain",
"An Dùbhlachd"]

};
var dayValues$54={
narrow:[
"D",
"L",
"M",
"C",
"A",
"H",
"S"],

short:[
"Dò",
"Lu",
"Mà",
"Ci",
"Ar",
"Ha",
"Sa"],

abbreviated:[
"Did",
"Dil",
"Dim",
"Dic",
"Dia",
"Dih",
"Dis"],

wide:[
"Didòmhnaich",
"Diluain",
"Dimàirt",
"Diciadain",
"Diardaoin",
"Dihaoine",
"Disathairne"]

};
var dayPeriodValues$54={
narrow:{
am:"m",
pm:"f",
midnight:"m.o.",
noon:"m.l.",
morning:"madainn",
afternoon:"feasgar",
evening:"feasgar",
night:"oidhche"
},
abbreviated:{
am:"M.",
pm:"F.",
midnight:"meadhan oidhche",
noon:"meadhan là",
morning:"madainn",
afternoon:"feasgar",
evening:"feasgar",
night:"oidhche"
},
wide:{
am:"m.",
pm:"f.",
midnight:"meadhan oidhche",
noon:"meadhan là",
morning:"madainn",
afternoon:"feasgar",
evening:"feasgar",
night:"oidhche"
}
};
var formattingDayPeriodValues$44={
narrow:{
am:"m",
pm:"f",
midnight:"m.o.",
noon:"m.l.",
morning:"sa mhadainn",
afternoon:"feasgar",
evening:"feasgar",
night:"air an oidhche"
},
abbreviated:{
am:"M.",
pm:"F.",
midnight:"meadhan oidhche",
noon:"meadhan là",
morning:"sa mhadainn",
afternoon:"feasgar",
evening:"feasgar",
night:"air an oidhche"
},
wide:{
am:"m.",
pm:"f.",
midnight:"meadhan oidhche",
noon:"meadhan là",
morning:"sa mhadainn",
afternoon:"feasgar",
evening:"feasgar",
night:"air an oidhche"
}
};
var ordinalNumber$54=function ordinalNumber$54(dirtyNumber){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100>20||rem100<10)switch(rem100%10){
case 1:return number+"d";
case 2:return number+"na";
}
if(rem100===12)return number+"na";
return number+"mh";
};
//#endregion
//#region dist/date-fns/locale/gd.js
/**
* @category Locales
* @summary Scottish Gaelic.
* @language Scottish Gaelic
* @iso-639-2 gla
* @author Lee Driscoll [@leedriscoll](https://github.com/leedriscoll)
*/
var _gd={
code:"gd",
formatDistance:formatDistance$54,
formatLong:formatLong$55,
formatRelative:formatRelative$54,
localize:{
ordinalNumber:ordinalNumber$54,
era:buildLocalizeFn({
values:eraValues$54,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$54,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$54,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$54,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$54,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$44,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(d|na|tr|mh)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(r|a)/i,
abbreviated:/^(r\.?\s?c\.?|r\.?\s?a\.?\s?c\.?|a\.?\s?d\.?|a\.?\s?c\.?)/i,
wide:/^(ro Chrìosta|ron aois choitchinn|anno domini|aois choitcheann)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^b/i,/^(a|c)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^c[1234]/i,
wide:/^[1234](cd|na|tr|mh)? cairteal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[fgmcòilsd]/i,
abbreviated:/^(faoi|gear|màrt|gibl|cèit|ògmh|iuch|lùn|sult|dàmh|samh|dùbh)/i,
wide:/^(am faoilleach|an gearran|am màrt|an giblean|an cèitean|an t-Ògmhios|an t-Iuchar|an lùnastal|an t-Sultain|an dàmhair|an t-Samhain|an dùbhlachd)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^f/i,
/^g/i,
/^m/i,
/^g/i,
/^c/i,
/^ò/i,
/^i/i,
/^l/i,
/^s/i,
/^d/i,
/^s/i,
/^d/i],

any:[
/^fa/i,
/^ge/i,
/^mà/i,
/^gi/i,
/^c/i,
/^ò/i,
/^i/i,
/^l/i,
/^su/i,
/^d/i,
/^sa/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dlmcahs]/i,
short:/^(dò|lu|mà|ci|ar|ha|sa)/i,
abbreviated:/^(did|dil|dim|dic|dia|dih|dis)/i,
wide:/^(didòmhnaich|diluain|dimàirt|diciadain|diardaoin|dihaoine|disathairne)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^c/i,
/^a/i,
/^h/i,
/^s/i],

any:[
/^d/i,
/^l/i,
/^m/i,
/^c/i,
/^a/i,
/^h/i,
/^s/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mi|n|(san|aig) (madainn|feasgar|feasgar|oidhche))/i,
any:/^([ap]\.?\s?m\.?|meadhan oidhche|meadhan là|(san|aig) (madainn|feasgar|feasgar|oidhche))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^m/i,
pm:/^f/i,
midnight:/^meadhan oidhche/i,
noon:/^meadhan là/i,
morning:/sa mhadainn/i,
afternoon:/feasgar/i,
evening:/feasgar/i,
night:/air an oidhche/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/gl/_lib/formatDistance.js
var formatDistanceLocale$52={
lessThanXSeconds:{
one:"menos dun segundo",
other:"menos de {{count}} segundos"
},
xSeconds:{
one:"1 segundo",
other:"{{count}} segundos"
},
halfAMinute:"medio minuto",
lessThanXMinutes:{
one:"menos dun minuto",
other:"menos de {{count}} minutos"
},
xMinutes:{
one:"1 minuto",
other:"{{count}} minutos"
},
aboutXHours:{
one:"arredor dunha hora",
other:"arredor de {{count}} horas"
},
xHours:{
one:"1 hora",
other:"{{count}} horas"
},
xDays:{
one:"1 día",
other:"{{count}} días"
},
aboutXWeeks:{
one:"arredor dunha semana",
other:"arredor de {{count}} semanas"
},
xWeeks:{
one:"1 semana",
other:"{{count}} semanas"
},
aboutXMonths:{
one:"arredor de 1 mes",
other:"arredor de {{count}} meses"
},
xMonths:{
one:"1 mes",
other:"{{count}} meses"
},
aboutXYears:{
one:"arredor dun ano",
other:"arredor de {{count}} anos"
},
xYears:{
one:"1 ano",
other:"{{count}} anos"
},
overXYears:{
one:"máis dun ano",
other:"máis de {{count}} anos"
},
almostXYears:{
one:"case un ano",
other:"case {{count}} anos"
}
};
var formatDistance$53=function formatDistance$53(token,count,options){
var result;
var tokenValue=formatDistanceLocale$52[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"en "+result;else
return"hai "+result;
return result;
};
var formatLong$54={
date:buildFormatLongFn({
formats:{
full:"EEEE, d 'de' MMMM y",
long:"d 'de' MMMM y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'ás' {{time}}",
long:"{{date}} 'ás' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/gl/_lib/formatRelative.js
var formatRelativeLocale$53={
lastWeek:"'o' eeee 'pasado á' LT",
yesterday:"'onte á' p",
today:"'hoxe á' p",
tomorrow:"'mañá á' p",
nextWeek:"eeee 'á' p",
other:"P"
};
var formatRelativeLocalePlural={
lastWeek:"'o' eeee 'pasado ás' p",
yesterday:"'onte ás' p",
today:"'hoxe ás' p",
tomorrow:"'mañá ás' p",
nextWeek:"eeee 'ás' p",
other:"P"
};
var formatRelative$53=function formatRelative$53(token,date,_baseDate,_options){
if(date.getHours()!==1)return formatRelativeLocalePlural[token];
return formatRelativeLocale$53[token];
};
//#endregion
//#region dist/date-fns/locale/gl/_lib/localize.js
var eraValues$53={
narrow:["AC","DC"],
abbreviated:["AC","DC"],
wide:["antes de cristo","despois de cristo"]
};
var quarterValues$53={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"1º trimestre",
"2º trimestre",
"3º trimestre",
"4º trimestre"]

};
var monthValues$53={
narrow:[
"e",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"xan",
"feb",
"mar",
"abr",
"mai",
"xun",
"xul",
"ago",
"set",
"out",
"nov",
"dec"],

wide:[
"xaneiro",
"febreiro",
"marzo",
"abril",
"maio",
"xuño",
"xullo",
"agosto",
"setembro",
"outubro",
"novembro",
"decembro"]

};
var dayValues$53={
narrow:[
"d",
"l",
"m",
"m",
"j",
"v",
"s"],

short:[
"do",
"lu",
"ma",
"me",
"xo",
"ve",
"sa"],

abbreviated:[
"dom",
"lun",
"mar",
"mer",
"xov",
"ven",
"sab"],

wide:[
"domingo",
"luns",
"martes",
"mércores",
"xoves",
"venres",
"sábado"]

};
var dayPeriodValues$53={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"md",
morning:"mañá",
afternoon:"tarde",
evening:"tarde",
night:"noite"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"medianoite",
noon:"mediodía",
morning:"mañá",
afternoon:"tarde",
evening:"tardiña",
night:"noite"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"medianoite",
noon:"mediodía",
morning:"mañá",
afternoon:"tarde",
evening:"tardiña",
night:"noite"
}
};
var formattingDayPeriodValues$43={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"md",
morning:"da mañá",
afternoon:"da tarde",
evening:"da tardiña",
night:"da noite"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"medianoite",
noon:"mediodía",
morning:"da mañá",
afternoon:"da tarde",
evening:"da tardiña",
night:"da noite"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"medianoite",
noon:"mediodía",
morning:"da mañá",
afternoon:"da tarde",
evening:"da tardiña",
night:"da noite"
}
};
var ordinalNumber$53=function ordinalNumber$53(dirtyNumber,_options){
return Number(dirtyNumber)+"º";
};
//#endregion
//#region dist/date-fns/locale/gl.js
/**
* @category Locales
* @summary Galician locale.
* @language Galician
* @iso-639-2 glg
* @author Alberto Doval - Cocodin Technology[@cocodinTech](https://github.com/cocodinTech)
* @author Fidel Pita [@fidelpita](https://github.com/fidelpita)
*/
var _gl={
code:"gl",
formatDistance:formatDistance$53,
formatLong:formatLong$54,
formatRelative:formatRelative$53,
localize:{
ordinalNumber:ordinalNumber$53,
era:buildLocalizeFn({
values:eraValues$53,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$53,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$53,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$53,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$53,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$43,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(º)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ac|dc|a|d)/i,
abbreviated:/^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
wide:/^(antes de cristo|antes da era com[uú]n|despois de cristo|era com[uú]n)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
any:[/^ac/i,/^dc/i],
wide:[/^(antes de cristo|antes da era com[uú]n)/i,/^(despois de cristo|era com[uú]n)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^T[1234]/i,
wide:/^[1234](º)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[xfmasond]/i,
abbreviated:/^(xan|feb|mar|abr|mai|xun|xul|ago|set|out|nov|dec)/i,
wide:/^(xaneiro|febreiro|marzo|abril|maio|xuño|xullo|agosto|setembro|outubro|novembro|decembro)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^x/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^x/i,
/^x/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^xan/i,
/^feb/i,
/^mar/i,
/^abr/i,
/^mai/i,
/^xun/i,
/^xul/i,
/^ago/i,
/^set/i,
/^out/i,
/^nov/i,
/^dec/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dlmxvs]/i,
short:/^(do|lu|ma|me|xo|ve|sa)/i,
abbreviated:/^(dom|lun|mar|mer|xov|ven|sab)/i,
wide:/^(domingo|luns|martes|m[eé]rcores|xoves|venres|s[áa]bado)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^x/i,
/^v/i,
/^s/i],

any:[
/^do/i,
/^lu/i,
/^ma/i,
/^me/i,
/^xo/i,
/^ve/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mn|md|(da|[aá]s) (mañ[aá]|tarde|noite))/i,
any:/^([ap]\.?\s?m\.?|medianoite|mediod[ií]a|(da|[aá]s) (mañ[aá]|tarde|noite))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mn/i,
noon:/^md/i,
morning:/mañ[aá]/i,
afternoon:/tarde/i,
evening:/tardiña/i,
night:/noite/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/gu/_lib/formatDistance.js
var formatDistanceLocale$51={
lessThanXSeconds:{
one:"હમણાં",
other:"​આશરે {{count}} સેકંડ"
},
xSeconds:{
one:"1 સેકંડ",
other:"{{count}} સેકંડ"
},
halfAMinute:"અડધી મિનિટ",
lessThanXMinutes:{
one:"આ મિનિટ",
other:"​આશરે {{count}} મિનિટ"
},
xMinutes:{
one:"1 મિનિટ",
other:"{{count}} મિનિટ"
},
aboutXHours:{
one:"​આશરે 1 કલાક",
other:"​આશરે {{count}} કલાક"
},
xHours:{
one:"1 કલાક",
other:"{{count}} કલાક"
},
xDays:{
one:"1 દિવસ",
other:"{{count}} દિવસ"
},
aboutXWeeks:{
one:"આશરે 1 અઠવાડિયું",
other:"આશરે {{count}} અઠવાડિયા"
},
xWeeks:{
one:"1 અઠવાડિયું",
other:"{{count}} અઠવાડિયા"
},
aboutXMonths:{
one:"આશરે 1 મહિનો",
other:"આશરે {{count}} મહિના"
},
xMonths:{
one:"1 મહિનો",
other:"{{count}} મહિના"
},
aboutXYears:{
one:"આશરે 1 વર્ષ",
other:"આશરે {{count}} વર્ષ"
},
xYears:{
one:"1 વર્ષ",
other:"{{count}} વર્ષ"
},
overXYears:{
one:"1 વર્ષથી વધુ",
other:"{{count}} વર્ષથી વધુ"
},
almostXYears:{
one:"લગભગ 1 વર્ષ",
other:"લગભગ {{count}} વર્ષ"
}
};
var formatDistance$52=function formatDistance$52(token,count,options){
var result;
var tokenValue=formatDistanceLocale$51[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"માં";else
return result+" પહેલાં";
return result;
};
var formatLong$53={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM, y",
long:"d MMMM, y",
medium:"d MMM, y",
short:"d/M/yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"hh:mm:ss a zzzz",
long:"hh:mm:ss a z",
medium:"hh:mm:ss a",
short:"hh:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/gu/_lib/formatRelative.js
var formatRelativeLocale$52={
lastWeek:"'પાછલા' eeee p",
yesterday:"'ગઈકાલે' p",
today:"'આજે' p",
tomorrow:"'આવતીકાલે' p",
nextWeek:"eeee p",
other:"P"
};
var formatRelative$52=function formatRelative$52(token,_date,_baseDate,_options){return formatRelativeLocale$52[token];};
//#endregion
//#region dist/date-fns/locale/gu/_lib/localize.js
var eraValues$52={
narrow:["ઈસપૂ","ઈસ"],
abbreviated:["ઈ.સ.પૂર્વે","ઈ.સ."],
wide:["ઈસવીસન પૂર્વે","ઈસવીસન"]
};
var quarterValues$52={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1લો ત્રિમાસ",
"2જો ત્રિમાસ",
"3જો ત્રિમાસ",
"4થો ત્રિમાસ"]

};
var monthValues$52={
narrow:[
"જા",
"ફે",
"મા",
"એ",
"મે",
"જૂ",
"જુ",
"ઓ",
"સ",
"ઓ",
"ન",
"ડિ"],

abbreviated:[
"જાન્યુ",
"ફેબ્રુ",
"માર્ચ",
"એપ્રિલ",
"મે",
"જૂન",
"જુલાઈ",
"ઑગસ્ટ",
"સપ્ટે",
"ઓક્ટો",
"નવે",
"ડિસે"],

wide:[
"જાન્યુઆરી",
"ફેબ્રુઆરી",
"માર્ચ",
"એપ્રિલ",
"મે",
"જૂન",
"જુલાઇ",
"ઓગસ્ટ",
"સપ્ટેમ્બર",
"ઓક્ટોબર",
"નવેમ્બર",
"ડિસેમ્બર"]

};
var dayValues$52={
narrow:[
"ર",
"સો",
"મં",
"બુ",
"ગુ",
"શુ",
"શ"],

short:[
"ર",
"સો",
"મં",
"બુ",
"ગુ",
"શુ",
"શ"],

abbreviated:[
"રવિ",
"સોમ",
"મંગળ",
"બુધ",
"ગુરુ",
"શુક્ર",
"શનિ"],

wide:[
"રવિવાર",
"સોમવાર",
"મંગળવાર",
"બુધવાર",
"ગુરુવાર",
"શુક્રવાર",
"શનિવાર"]

};
var dayPeriodValues$52={
narrow:{
am:"AM",
pm:"PM",
midnight:"મ.રાત્રિ",
noon:"બ.",
morning:"સવારે",
afternoon:"બપોરે",
evening:"સાંજે",
night:"રાત્રે"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"​મધ્યરાત્રિ",
noon:"બપોરે",
morning:"સવારે",
afternoon:"બપોરે",
evening:"સાંજે",
night:"રાત્રે"
},
wide:{
am:"AM",
pm:"PM",
midnight:"​મધ્યરાત્રિ",
noon:"બપોરે",
morning:"સવારે",
afternoon:"બપોરે",
evening:"સાંજે",
night:"રાત્રે"
}
};
var formattingDayPeriodValues$42={
narrow:{
am:"AM",
pm:"PM",
midnight:"મ.રાત્રિ",
noon:"બપોરે",
morning:"સવારે",
afternoon:"બપોરે",
evening:"સાંજે",
night:"રાત્રે"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"મધ્યરાત્રિ",
noon:"બપોરે",
morning:"સવારે",
afternoon:"બપોરે",
evening:"સાંજે",
night:"રાત્રે"
},
wide:{
am:"AM",
pm:"PM",
midnight:"​મધ્યરાત્રિ",
noon:"બપોરે",
morning:"સવારે",
afternoon:"બપોરે",
evening:"સાંજે",
night:"રાત્રે"
}
};
var ordinalNumber$52=function ordinalNumber$52(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/gu.js
/**
* @category Locales
* @summary Gujarati locale (India).
* @language Gujarati
* @iso-639-2 guj
* @author Manaday Mavani [@ManadayM](https://github.com/manadaym)
*/
var _gu={
code:"gu",
formatDistance:formatDistance$52,
formatLong:formatLong$53,
formatRelative:formatRelative$52,
localize:{
ordinalNumber:ordinalNumber$52,
era:buildLocalizeFn({
values:eraValues$52,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$52,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$52,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$52,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$52,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$42,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(લ|જ|થ|ઠ્ઠ|મ)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ઈસપૂ|ઈસ)/i,
abbreviated:/^(ઈ\.સ\.પૂર્વે|ઈ\.સ\.)/i,
wide:/^(ઈસવીસન\sપૂર્વે|ઈસવીસન)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^ઈસપૂ/i,/^ઈસ/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](લો|જો|થો)? ત્રિમાસ/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[જાફેમાએમેજૂજુઓસઓનડિ]/i,
abbreviated:/^(જાન્યુ|ફેબ્રુ|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઈ|ઑગસ્ટ|સપ્ટે|ઓક્ટો|નવે|ડિસે)/i,
wide:/^(જાન્યુઆરી|ફેબ્રુઆરી|માર્ચ|એપ્રિલ|મે|જૂન|જુલાઇ|ઓગસ્ટ|સપ્ટેમ્બર|ઓક્ટોબર|નવેમ્બર|ડિસેમ્બર)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^જા/i,
/^ફે/i,
/^મા/i,
/^એ/i,
/^મે/i,
/^જૂ/i,
/^જુ/i,
/^ઑગ/i,
/^સ/i,
/^ઓક્ટો/i,
/^ન/i,
/^ડિ/i],

any:[
/^જા/i,
/^ફે/i,
/^મા/i,
/^એ/i,
/^મે/i,
/^જૂ/i,
/^જુ/i,
/^ઑગ/i,
/^સ/i,
/^ઓક્ટો/i,
/^ન/i,
/^ડિ/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ર|સો|મં|બુ|ગુ|શુ|શ)/i,
short:/^(ર|સો|મં|બુ|ગુ|શુ|શ)/i,
abbreviated:/^(રવિ|સોમ|મંગળ|બુધ|ગુરુ|શુક્ર|શનિ)/i,
wide:/^(રવિવાર|સોમવાર|મંગળવાર|બુધવાર|ગુરુવાર|શુક્રવાર|શનિવાર)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ર/i,
/^સો/i,
/^મં/i,
/^બુ/i,
/^ગુ/i,
/^શુ/i,
/^શ/i],

any:[
/^ર/i,
/^સો/i,
/^મં/i,
/^બુ/i,
/^ગુ/i,
/^શુ/i,
/^શ/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|મ\.?|સ|બ|સાં|રા)/i,
any:/^(a|p|મ\.?|સ|બ|સાં|રા)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^મ\.?/i,
noon:/^બ/i,
morning:/સ/i,
afternoon:/બ/i,
evening:/સાં/i,
night:/રા/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/he/_lib/formatDistance.js
var formatDistanceLocale$50={
lessThanXSeconds:{
one:"פחות משנייה",
two:"פחות משתי שניות",
other:"פחות מ־{{count}} שניות"
},
xSeconds:{
one:"שנייה",
two:"שתי שניות",
other:"{{count}} שניות"
},
halfAMinute:"חצי דקה",
lessThanXMinutes:{
one:"פחות מדקה",
two:"פחות משתי דקות",
other:"פחות מ־{{count}} דקות"
},
xMinutes:{
one:"דקה",
two:"שתי דקות",
other:"{{count}} דקות"
},
aboutXHours:{
one:"כשעה",
two:"כשעתיים",
other:"כ־{{count}} שעות"
},
xHours:{
one:"שעה",
two:"שעתיים",
other:"{{count}} שעות"
},
xDays:{
one:"יום",
two:"יומיים",
other:"{{count}} ימים"
},
aboutXWeeks:{
one:"כשבוע",
two:"כשבועיים",
other:"כ־{{count}} שבועות"
},
xWeeks:{
one:"שבוע",
two:"שבועיים",
other:"{{count}} שבועות"
},
aboutXMonths:{
one:"כחודש",
two:"כחודשיים",
other:"כ־{{count}} חודשים"
},
xMonths:{
one:"חודש",
two:"חודשיים",
other:"{{count}} חודשים"
},
aboutXYears:{
one:"כשנה",
two:"כשנתיים",
other:"כ־{{count}} שנים"
},
xYears:{
one:"שנה",
two:"שנתיים",
other:"{{count}} שנים"
},
overXYears:{
one:"יותר משנה",
two:"יותר משנתיים",
other:"יותר מ־{{count}} שנים"
},
almostXYears:{
one:"כמעט שנה",
two:"כמעט שנתיים",
other:"כמעט {{count}} שנים"
}
};
var formatDistance$51=function formatDistance$51(token,count,options){
if(token==="xDays"&&options!==null&&options!==void 0&&options.addSuffix&&count<=2){
if(options.comparison&&options.comparison>0)return count===1?"מחר":"מחרתיים";
return count===1?"אתמול":"שלשום";
}
var result;
var tokenValue=formatDistanceLocale$50[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===2)result=tokenValue.two;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"בעוד "+result;else
return"לפני "+result;
return result;
};
var formatLong$52={
date:buildFormatLongFn({
formats:{
full:"EEEE, d בMMMM y",
long:"d בMMMM y",
medium:"d בMMM y",
short:"d.M.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'בשעה' {{time}}",
long:"{{date}} 'בשעה' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/he/_lib/formatRelative.js
var formatRelativeLocale$51={
lastWeek:"eeee 'שעבר בשעה' p",
yesterday:"'אתמול בשעה' p",
today:"'היום בשעה' p",
tomorrow:"'מחר בשעה' p",
nextWeek:"eeee 'בשעה' p",
other:"P"
};
var formatRelative$51=function formatRelative$51(token,_date,_baseDate,_options){return formatRelativeLocale$51[token];};
//#endregion
//#region dist/date-fns/locale/he/_lib/localize.js
var eraValues$51={
narrow:["לפנה״ס","לספירה"],
abbreviated:["לפנה״ס","לספירה"],
wide:["לפני הספירה","לספירה"]
};
var quarterValues$51={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"רבעון 1",
"רבעון 2",
"רבעון 3",
"רבעון 4"]

};
var monthValues$51={
narrow:[
"1",
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"10",
"11",
"12"],

abbreviated:[
"ינו׳",
"פבר׳",
"מרץ",
"אפר׳",
"מאי",
"יוני",
"יולי",
"אוג׳",
"ספט׳",
"אוק׳",
"נוב׳",
"דצמ׳"],

wide:[
"ינואר",
"פברואר",
"מרץ",
"אפריל",
"מאי",
"יוני",
"יולי",
"אוגוסט",
"ספטמבר",
"אוקטובר",
"נובמבר",
"דצמבר"]

};
var dayValues$51={
narrow:[
"א׳",
"ב׳",
"ג׳",
"ד׳",
"ה׳",
"ו׳",
"ש׳"],

short:[
"א׳",
"ב׳",
"ג׳",
"ד׳",
"ה׳",
"ו׳",
"ש׳"],

abbreviated:[
"יום א׳",
"יום ב׳",
"יום ג׳",
"יום ד׳",
"יום ה׳",
"יום ו׳",
"שבת"],

wide:[
"יום ראשון",
"יום שני",
"יום שלישי",
"יום רביעי",
"יום חמישי",
"יום שישי",
"יום שבת"]

};
var dayPeriodValues$51={
narrow:{
am:"לפנה״צ",
pm:"אחה״צ",
midnight:"חצות",
noon:"צהריים",
morning:"בוקר",
afternoon:"אחר הצהריים",
evening:"ערב",
night:"לילה"
},
abbreviated:{
am:"לפנה״צ",
pm:"אחה״צ",
midnight:"חצות",
noon:"צהריים",
morning:"בוקר",
afternoon:"אחר הצהריים",
evening:"ערב",
night:"לילה"
},
wide:{
am:"לפנה״צ",
pm:"אחה״צ",
midnight:"חצות",
noon:"צהריים",
morning:"בוקר",
afternoon:"אחר הצהריים",
evening:"ערב",
night:"לילה"
}
};
var formattingDayPeriodValues$41={
narrow:{
am:"לפנה״צ",
pm:"אחה״צ",
midnight:"חצות",
noon:"צהריים",
morning:"בבוקר",
afternoon:"בצהריים",
evening:"בערב",
night:"בלילה"
},
abbreviated:{
am:"לפנה״צ",
pm:"אחה״צ",
midnight:"חצות",
noon:"צהריים",
morning:"בבוקר",
afternoon:"אחר הצהריים",
evening:"בערב",
night:"בלילה"
},
wide:{
am:"לפנה״צ",
pm:"אחה״צ",
midnight:"חצות",
noon:"צהריים",
morning:"בבוקר",
afternoon:"אחר הצהריים",
evening:"בערב",
night:"בלילה"
}
};
var ordinalNumber$51=function ordinalNumber$51(dirtyNumber,options){
var number=Number(dirtyNumber);
if(number<=0||number>10)return String(number);
var unit=String(options===null||options===void 0?void 0:options.unit);
var isFemale=[
"year",
"hour",
"minute",
"second"].
indexOf(unit)>=0;
var male=[
"ראשון",
"שני",
"שלישי",
"רביעי",
"חמישי",
"שישי",
"שביעי",
"שמיני",
"תשיעי",
"עשירי"];

var female=[
"ראשונה",
"שנייה",
"שלישית",
"רביעית",
"חמישית",
"שישית",
"שביעית",
"שמינית",
"תשיעית",
"עשירית"];

var index=number-1;
return isFemale?female[index]:male[index];
};
var localize$51={
ordinalNumber:ordinalNumber$51,
era:buildLocalizeFn({
values:eraValues$51,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$51,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$51,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$51,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$51,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$41,
defaultFormattingWidth:"wide"
})
};
//#endregion
//#region dist/date-fns/locale/he/_lib/match.js
var matchOrdinalNumberPattern$51=/^(\d+|(ראשון|שני|שלישי|רביעי|חמישי|שישי|שביעי|שמיני|תשיעי|עשירי|ראשונה|שנייה|שלישית|רביעית|חמישית|שישית|שביעית|שמינית|תשיעית|עשירית))/i;
var parseOrdinalNumberPattern$51=/^(\d+|רא|שנ|של|רב|ח|שי|שב|שמ|ת|ע)/i;
var matchEraPatterns$51={
narrow:/^ל(ספירה|פנה״ס)/i,
abbreviated:/^ל(ספירה|פנה״ס)/i,
wide:/^ל(פני ה)?ספירה/i
};
var parseEraPatterns$51={any:[/^לפ/i,/^לס/i]};
var matchQuarterPatterns$51={
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^רבעון [1234]/i
};
var parseQuarterPatterns$51={any:[
/1/i,
/2/i,
/3/i,
/4/i]
};
var matchMonthPatterns$51={
narrow:/^\d+/i,
abbreviated:/^(ינו|פבר|מרץ|אפר|מאי|יוני|יולי|אוג|ספט|אוק|נוב|דצמ)׳?/i,
wide:/^(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)/i
};
var parseMonthPatterns$51={
narrow:[
/^1$/i,
/^2/i,
/^3/i,
/^4/i,
/^5/i,
/^6/i,
/^7/i,
/^8/i,
/^9/i,
/^10/i,
/^11/i,
/^12/i],

any:[
/^ינ/i,
/^פ/i,
/^מר/i,
/^אפ/i,
/^מא/i,
/^יונ/i,
/^יול/i,
/^אוג/i,
/^ס/i,
/^אוק/i,
/^נ/i,
/^ד/i]

};
var matchDayPatterns$51={
narrow:/^[אבגדהוש]׳/i,
short:/^[אבגדהוש]׳/i,
abbreviated:/^(שבת|יום (א|ב|ג|ד|ה|ו)׳)/i,
wide:/^יום (ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/i
};
var parseDayPatterns$51={
abbreviated:[
/א׳$/i,
/ב׳$/i,
/ג׳$/i,
/ד׳$/i,
/ה׳$/i,
/ו׳$/i,
/^ש/i],

wide:[
/ן$/i,
/ני$/i,
/לישי$/i,
/עי$/i,
/מישי$/i,
/שישי$/i,
/ת$/i],

any:[
/^א/i,
/^ב/i,
/^ג/i,
/^ד/i,
/^ה/i,
/^ו/i,
/^ש/i]

};
var matchDayPeriodPatterns$51={any:/^(אחר ה|ב)?(חצות|צהריים|בוקר|ערב|לילה|אחה״צ|לפנה״צ)/i};
var parseDayPeriodPatterns$51={any:{
am:/^לפ/i,
pm:/^אחה/i,
midnight:/^ח/i,
noon:/^צ/i,
morning:/בוקר/i,
afternoon:/בצ|אחר/i,
evening:/ערב/i,
night:/לילה/i
}};
var ordinalName=[
"רא",
"שנ",
"של",
"רב",
"ח",
"שי",
"שב",
"שמ",
"ת",
"ע"];

//#endregion
//#region dist/date-fns/locale/he.js
/**
* @category Locales
* @summary Hebrew locale.
* @language Hebrew
* @iso-639-2 heb
* @author Nir Lahad [@nirlah](https://github.com/nirlah)
*/
var _he={
code:"he",
formatDistance:formatDistance$51,
formatLong:formatLong$52,
formatRelative:formatRelative$51,
localize:localize$51,
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:matchOrdinalNumberPattern$51,
parsePattern:parseOrdinalNumberPattern$51,
valueCallback:function valueCallback(value){
var number=parseInt(value,10);
return isNaN(number)?ordinalName.indexOf(value)+1:number;
}
}),
era:buildMatchFn({
matchPatterns:matchEraPatterns$51,
defaultMatchWidth:"wide",
parsePatterns:parseEraPatterns$51,
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:matchQuarterPatterns$51,
defaultMatchWidth:"wide",
parsePatterns:parseQuarterPatterns$51,
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:matchMonthPatterns$51,
defaultMatchWidth:"wide",
parsePatterns:parseMonthPatterns$51,
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:matchDayPatterns$51,
defaultMatchWidth:"wide",
parsePatterns:parseDayPatterns$51,
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:matchDayPeriodPatterns$51,
defaultMatchWidth:"any",
parsePatterns:parseDayPeriodPatterns$51,
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/hi/_lib/localize.js
var numberValues={
locale:{
1:"१",
2:"२",
3:"३",
4:"४",
5:"५",
6:"६",
7:"७",
8:"८",
9:"९",
0:"०"
},
number:{
"१":"1",
"२":"2",
"३":"3",
"४":"4",
"५":"5",
"६":"6",
"७":"7",
"८":"8",
"९":"9",
"०":"0"
}
};
var eraValues$50={
narrow:["ईसा-पूर्व","ईस्वी"],
abbreviated:["ईसा-पूर्व","ईस्वी"],
wide:["ईसा-पूर्व","ईसवी सन"]
};
var quarterValues$50={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ति1",
"ति2",
"ति3",
"ति4"],

wide:[
"पहली तिमाही",
"दूसरी तिमाही",
"तीसरी तिमाही",
"चौथी तिमाही"]

};
var monthValues$50={
narrow:[
"ज",
"फ़",
"मा",
"अ",
"मई",
"जू",
"जु",
"अग",
"सि",
"अक्टू",
"न",
"दि"],

abbreviated:[
"जन",
"फ़र",
"मार्च",
"अप्रैल",
"मई",
"जून",
"जुल",
"अग",
"सित",
"अक्टू",
"नव",
"दिस"],

wide:[
"जनवरी",
"फ़रवरी",
"मार्च",
"अप्रैल",
"मई",
"जून",
"जुलाई",
"अगस्त",
"सितंबर",
"अक्टूबर",
"नवंबर",
"दिसंबर"]

};
var dayValues$50={
narrow:[
"र",
"सो",
"मं",
"बु",
"गु",
"शु",
"श"],

short:[
"र",
"सो",
"मं",
"बु",
"गु",
"शु",
"श"],

abbreviated:[
"रवि",
"सोम",
"मंगल",
"बुध",
"गुरु",
"शुक्र",
"शनि"],

wide:[
"रविवार",
"सोमवार",
"मंगलवार",
"बुधवार",
"गुरुवार",
"शुक्रवार",
"शनिवार"]

};
var dayPeriodValues$50={
narrow:{
am:"पूर्वाह्न",
pm:"अपराह्न",
midnight:"मध्यरात्रि",
noon:"दोपहर",
morning:"सुबह",
afternoon:"दोपहर",
evening:"शाम",
night:"रात"
},
abbreviated:{
am:"पूर्वाह्न",
pm:"अपराह्न",
midnight:"मध्यरात्रि",
noon:"दोपहर",
morning:"सुबह",
afternoon:"दोपहर",
evening:"शाम",
night:"रात"
},
wide:{
am:"पूर्वाह्न",
pm:"अपराह्न",
midnight:"मध्यरात्रि",
noon:"दोपहर",
morning:"सुबह",
afternoon:"दोपहर",
evening:"शाम",
night:"रात"
}
};
var formattingDayPeriodValues$40={
narrow:{
am:"पूर्वाह्न",
pm:"अपराह्न",
midnight:"मध्यरात्रि",
noon:"दोपहर",
morning:"सुबह",
afternoon:"दोपहर",
evening:"शाम",
night:"रात"
},
abbreviated:{
am:"पूर्वाह्न",
pm:"अपराह्न",
midnight:"मध्यरात्रि",
noon:"दोपहर",
morning:"सुबह",
afternoon:"दोपहर",
evening:"शाम",
night:"रात"
},
wide:{
am:"पूर्वाह्न",
pm:"अपराह्न",
midnight:"मध्यरात्रि",
noon:"दोपहर",
morning:"सुबह",
afternoon:"दोपहर",
evening:"शाम",
night:"रात"
}
};
var ordinalNumber$50=function ordinalNumber$50(dirtyNumber,_options){
return numberToLocale(Number(dirtyNumber));
};
function localeToNumber(locale){
var enNumber=locale.toString().replace(/[१२३४५६७८९०]/g,function(match){
return numberValues.number[match];
});
return Number(enNumber);
}
function numberToLocale(enNumber){
return enNumber.toString().replace(/\d/g,function(match){
return numberValues.locale[match];
});
}
var localize$50={
ordinalNumber:ordinalNumber$50,
era:buildLocalizeFn({
values:eraValues$50,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$50,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$50,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$50,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$50,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$40,
defaultFormattingWidth:"wide"
})
};
//#endregion
//#region dist/date-fns/locale/hi/_lib/formatDistance.js
var formatDistanceLocale$49={
lessThanXSeconds:{
one:"१ सेकंड से कम",
other:"{{count}} सेकंड से कम"
},
xSeconds:{
one:"१ सेकंड",
other:"{{count}} सेकंड"
},
halfAMinute:"आधा मिनट",
lessThanXMinutes:{
one:"१ मिनट से कम",
other:"{{count}} मिनट से कम"
},
xMinutes:{
one:"१ मिनट",
other:"{{count}} मिनट"
},
aboutXHours:{
one:"लगभग १ घंटा",
other:"लगभग {{count}} घंटे"
},
xHours:{
one:"१ घंटा",
other:"{{count}} घंटे"
},
xDays:{
one:"१ दिन",
other:"{{count}} दिन"
},
aboutXWeeks:{
one:"लगभग १ सप्ताह",
other:"लगभग {{count}} सप्ताह"
},
xWeeks:{
one:"१ सप्ताह",
other:"{{count}} सप्ताह"
},
aboutXMonths:{
one:"लगभग १ महीना",
other:"लगभग {{count}} महीने"
},
xMonths:{
one:"१ महीना",
other:"{{count}} महीने"
},
aboutXYears:{
one:"लगभग १ वर्ष",
other:"लगभग {{count}} वर्ष"
},
xYears:{
one:"१ वर्ष",
other:"{{count}} वर्ष"
},
overXYears:{
one:"१ वर्ष से अधिक",
other:"{{count}} वर्ष से अधिक"
},
almostXYears:{
one:"लगभग १ वर्ष",
other:"लगभग {{count}} वर्ष"
}
};
var formatDistance$50=function formatDistance$50(token,count,options){
var result;
var tokenValue=formatDistanceLocale$49[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",numberToLocale(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"मे ";else
return result+" पहले";
return result;
};
var formatLong$51={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM, y",
long:"do MMMM, y",
medium:"d MMM, y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'को' {{time}}",
long:"{{date}} 'को' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/hi/_lib/formatRelative.js
var formatRelativeLocale$50={
lastWeek:"'पिछले' eeee p",
yesterday:"'कल' p",
today:"'आज' p",
tomorrow:"'कल' p",
nextWeek:"eeee 'को' p",
other:"P"
};
var formatRelative$50=function formatRelative$50(token,_date,_baseDate,_options){return formatRelativeLocale$50[token];};
//#endregion
//#region dist/date-fns/locale/hi.js
/**
* @category Locales
* @summary Hindi locale (India).
* @language Hindi
* @iso-639-2 hin
* @author Mukesh Mandiwal [@mukeshmandiwal](https://github.com/mukeshmandiwal)
*/
var _hi={
code:"hi",
formatDistance:formatDistance$50,
formatLong:formatLong$51,
formatRelative:formatRelative$50,
localize:localize$50,
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^[०१२३४५६७८९]+/i,
parsePattern:/^[०१२३४५६७८९]+/i,
valueCallback:localeToNumber
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ईसा-पूर्व|ईस्वी)/i,
abbreviated:/^(ईसा\.?\s?पूर्व\.?|ईसा\.?)/i,
wide:/^(ईसा-पूर्व|ईसवी पूर्व|ईसवी सन|ईसवी)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^b/i,/^(a|c)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ति[1234]/i,
wide:/^[1234](पहली|दूसरी|तीसरी|चौथी)? तिमाही/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[जफ़माअप्मईजूनजुअगसिअक्तनदि]/i,
abbreviated:/^(जन|फ़र|मार्च|अप्|मई|जून|जुल|अग|सित|अक्तू|नव|दिस)/i,
wide:/^(जनवरी|फ़रवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्तूबर|नवंबर|दिसंबर)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ज/i,
/^फ़/i,
/^मा/i,
/^अप्/i,
/^मई/i,
/^जू/i,
/^जु/i,
/^अग/i,
/^सि/i,
/^अक्तू/i,
/^न/i,
/^दि/i],

any:[
/^जन/i,
/^फ़/i,
/^मा/i,
/^अप्/i,
/^मई/i,
/^जू/i,
/^जु/i,
/^अग/i,
/^सि/i,
/^अक्तू/i,
/^नव/i,
/^दिस/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[रविसोममंगलबुधगुरुशुक्रशनि]/i,
short:/^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
abbreviated:/^(रवि|सोम|मंगल|बुध|गुरु|शुक्र|शनि)/i,
wide:/^(रविवार|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^रवि/i,
/^सोम/i,
/^मंगल/i,
/^बुध/i,
/^गुरु/i,
/^शुक्र/i,
/^शनि/i],

any:[
/^रवि/i,
/^सोम/i,
/^मंगल/i,
/^बुध/i,
/^गुरु/i,
/^शुक्र/i,
/^शनि/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(पू|अ|म|द.\?|सु|दो|शा|रा)/i,
any:/^(पूर्वाह्न|अपराह्न|म|द.\?|सु|दो|शा|रा)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^पूर्वाह्न/i,
pm:/^अपराह्न/i,
midnight:/^मध्य/i,
noon:/^दो/i,
morning:/सु/i,
afternoon:/दो/i,
evening:/शा/i,
night:/रा/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/hr/_lib/formatDistance.js
var formatDistanceLocale$48={
lessThanXSeconds:{
one:{
standalone:"manje od 1 sekunde",
withPrepositionAgo:"manje od 1 sekunde",
withPrepositionIn:"manje od 1 sekundu"
},
dual:"manje od {{count}} sekunde",
other:"manje od {{count}} sekundi"
},
xSeconds:{
one:{
standalone:"1 sekunda",
withPrepositionAgo:"1 sekunde",
withPrepositionIn:"1 sekundu"
},
dual:"{{count}} sekunde",
other:"{{count}} sekundi"
},
halfAMinute:"pola minute",
lessThanXMinutes:{
one:{
standalone:"manje od 1 minute",
withPrepositionAgo:"manje od 1 minute",
withPrepositionIn:"manje od 1 minutu"
},
dual:"manje od {{count}} minute",
other:"manje od {{count}} minuta"
},
xMinutes:{
one:{
standalone:"1 minuta",
withPrepositionAgo:"1 minute",
withPrepositionIn:"1 minutu"
},
dual:"{{count}} minute",
other:"{{count}} minuta"
},
aboutXHours:{
one:{
standalone:"oko 1 sat",
withPrepositionAgo:"oko 1 sat",
withPrepositionIn:"oko 1 sat"
},
dual:"oko {{count}} sata",
other:"oko {{count}} sati"
},
xHours:{
one:{
standalone:"1 sat",
withPrepositionAgo:"1 sat",
withPrepositionIn:"1 sat"
},
dual:"{{count}} sata",
other:"{{count}} sati"
},
xDays:{
one:{
standalone:"1 dan",
withPrepositionAgo:"1 dan",
withPrepositionIn:"1 dan"
},
dual:"{{count}} dana",
other:"{{count}} dana"
},
aboutXWeeks:{
one:{
standalone:"oko 1 tjedan",
withPrepositionAgo:"oko 1 tjedan",
withPrepositionIn:"oko 1 tjedan"
},
dual:"oko {{count}} tjedna",
other:"oko {{count}} tjedana"
},
xWeeks:{
one:{
standalone:"1 tjedan",
withPrepositionAgo:"1 tjedan",
withPrepositionIn:"1 tjedan"
},
dual:"{{count}} tjedna",
other:"{{count}} tjedana"
},
aboutXMonths:{
one:{
standalone:"oko 1 mjesec",
withPrepositionAgo:"oko 1 mjesec",
withPrepositionIn:"oko 1 mjesec"
},
dual:"oko {{count}} mjeseca",
other:"oko {{count}} mjeseci"
},
xMonths:{
one:{
standalone:"1 mjesec",
withPrepositionAgo:"1 mjesec",
withPrepositionIn:"1 mjesec"
},
dual:"{{count}} mjeseca",
other:"{{count}} mjeseci"
},
aboutXYears:{
one:{
standalone:"oko 1 godinu",
withPrepositionAgo:"oko 1 godinu",
withPrepositionIn:"oko 1 godinu"
},
dual:"oko {{count}} godine",
other:"oko {{count}} godina"
},
xYears:{
one:{
standalone:"1 godina",
withPrepositionAgo:"1 godine",
withPrepositionIn:"1 godinu"
},
dual:"{{count}} godine",
other:"{{count}} godina"
},
overXYears:{
one:{
standalone:"preko 1 godinu",
withPrepositionAgo:"preko 1 godinu",
withPrepositionIn:"preko 1 godinu"
},
dual:"preko {{count}} godine",
other:"preko {{count}} godina"
},
almostXYears:{
one:{
standalone:"gotovo 1 godinu",
withPrepositionAgo:"gotovo 1 godinu",
withPrepositionIn:"gotovo 1 godinu"
},
dual:"gotovo {{count}} godine",
other:"gotovo {{count}} godina"
}
};
var formatDistance$49=function formatDistance$49(token,count,options){
var result;
var tokenValue=formatDistanceLocale$48[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1){if(options!==null&&options!==void 0&&options.addSuffix){if(options.comparison&&options.comparison>0)result=tokenValue.one.withPrepositionIn;else
result=tokenValue.one.withPrepositionAgo;}else
result=tokenValue.one.standalone;}else
if(count%10>1&&count%10<5&&String(count).substr(-2,1)!=="1")result=tokenValue.dual.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"za "+result;else
return"prije "+result;
return result;
};
var formatLong$50={
date:buildFormatLongFn({
formats:{
full:"EEEE, d. MMMM y.",
long:"d. MMMM y.",
medium:"d. MMM y.",
short:"dd. MM. y."
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss (zzzz)",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'u' {{time}}",
long:"{{date}} 'u' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/hr/_lib/formatRelative.js
var formatRelativeLocale$49={
lastWeek:function lastWeek(date){
switch(date.getDay()){
case 0:return"'prošlu nedjelju u' p";
case 3:return"'prošlu srijedu u' p";
case 6:return"'prošlu subotu u' p";
default:return"'prošli' EEEE 'u' p";
}
},
yesterday:"'jučer u' p",
today:"'danas u' p",
tomorrow:"'sutra u' p",
nextWeek:function nextWeek(date){
switch(date.getDay()){
case 0:return"'iduću nedjelju u' p";
case 3:return"'iduću srijedu u' p";
case 6:return"'iduću subotu u' p";
default:return"'prošli' EEEE 'u' p";
}
},
other:"P"
};
var formatRelative$49=function formatRelative$49(token,date,_baseDate,_options){
var format=formatRelativeLocale$49[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/hr/_lib/localize.js
var eraValues$49={
narrow:["pr.n.e.","AD"],
abbreviated:["pr. Kr.","po. Kr."],
wide:["Prije Krista","Poslije Krista"]
};
var quarterValues$49={
narrow:[
"1.",
"2.",
"3.",
"4."],

abbreviated:[
"1. kv.",
"2. kv.",
"3. kv.",
"4. kv."],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$49={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"sij",
"velj",
"ožu",
"tra",
"svi",
"lip",
"srp",
"kol",
"ruj",
"lis",
"stu",
"pro"],

wide:[
"siječanj",
"veljača",
"ožujak",
"travanj",
"svibanj",
"lipanj",
"srpanj",
"kolovoz",
"rujan",
"listopad",
"studeni",
"prosinac"]

};
var formattingMonthValues$10={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"sij",
"velj",
"ožu",
"tra",
"svi",
"lip",
"srp",
"kol",
"ruj",
"lis",
"stu",
"pro"],

wide:[
"siječnja",
"veljače",
"ožujka",
"travnja",
"svibnja",
"lipnja",
"srpnja",
"kolovoza",
"rujna",
"listopada",
"studenog",
"prosinca"]

};
var dayValues$49={
narrow:[
"N",
"P",
"U",
"S",
"Č",
"P",
"S"],

short:[
"ned",
"pon",
"uto",
"sri",
"čet",
"pet",
"sub"],

abbreviated:[
"ned",
"pon",
"uto",
"sri",
"čet",
"pet",
"sub"],

wide:[
"nedjelja",
"ponedjeljak",
"utorak",
"srijeda",
"četvrtak",
"petak",
"subota"]

};
var formattingDayPeriodValues$39={
narrow:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutro",
afternoon:"popodne",
evening:"navečer",
night:"noću"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutro",
afternoon:"popodne",
evening:"navečer",
night:"noću"
},
wide:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutro",
afternoon:"poslije podne",
evening:"navečer",
night:"noću"
}
};
var dayPeriodValues$49={
narrow:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutro",
afternoon:"popodne",
evening:"navečer",
night:"noću"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutro",
afternoon:"popodne",
evening:"navečer",
night:"noću"
},
wide:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutro",
afternoon:"poslije podne",
evening:"navečer",
night:"noću"
}
};
var ordinalNumber$49=function ordinalNumber$49(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/hr.js
/**
* @category Locales
* @summary Croatian locale.
* @language Croatian
* @iso-639-2 hrv
* @author Matija Marohnić [@silvenon](https://github.com/silvenon)
* @author Manico [@manico](https://github.com/manico)
* @author Ivan Jeržabek [@jerzabek](https://github.com/jerzabek)
*/
var _hr={
code:"hr",
formatDistance:formatDistance$49,
formatLong:formatLong$50,
formatRelative:formatRelative$49,
localize:{
ordinalNumber:ordinalNumber$49,
era:buildLocalizeFn({
values:eraValues$49,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$49,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$49,
defaultWidth:"wide",
formattingValues:formattingMonthValues$10,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$49,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$49,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$39,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(pr\.n\.e\.|AD)/i,
abbreviated:/^(pr\.\s?Kr\.|po\.\s?Kr\.)/i,
wide:/^(Prije Krista|prije nove ere|Poslije Krista|nova era)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^pr/i,/^(po|nova)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]\.\s?kv\.?/i,
wide:/^[1234]\. kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(10|11|12|[123456789])\./i,
abbreviated:/^(sij|velj|(ožu|ozu)|tra|svi|lip|srp|kol|ruj|lis|stu|pro)/i,
wide:/^((siječanj|siječnja|sijecanj|sijecnja)|(veljača|veljače|veljaca|veljace)|(ožujak|ožujka|ozujak|ozujka)|(travanj|travnja)|(svibanj|svibnja)|(lipanj|lipnja)|(srpanj|srpnja)|(kolovoz|kolovoza)|(rujan|rujna)|(listopad|listopada)|(studeni|studenog)|(prosinac|prosinca))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/1/i,
/2/i,
/3/i,
/4/i,
/5/i,
/6/i,
/7/i,
/8/i,
/9/i,
/10/i,
/11/i,
/12/i],

abbreviated:[
/^sij/i,
/^velj/i,
/^(ožu|ozu)/i,
/^tra/i,
/^svi/i,
/^lip/i,
/^srp/i,
/^kol/i,
/^ruj/i,
/^lis/i,
/^stu/i,
/^pro/i],

wide:[
/^sij/i,
/^velj/i,
/^(ožu|ozu)/i,
/^tra/i,
/^svi/i,
/^lip/i,
/^srp/i,
/^kol/i,
/^ruj/i,
/^lis/i,
/^stu/i,
/^pro/i]

},
defaultParseWidth:"wide"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[npusčc]/i,
short:/^(ned|pon|uto|sri|(čet|cet)|pet|sub)/i,
abbreviated:/^(ned|pon|uto|sri|(čet|cet)|pet|sub)/i,
wide:/^(nedjelja|ponedjeljak|utorak|srijeda|(četvrtak|cetvrtak)|petak|subota)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^w/i,
/^t/i,
/^f/i,
/^s/i],

any:[
/^su/i,
/^m/i,
/^tu/i,
/^w/i,
/^th/i,
/^f/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|ponoc|ponoć|(po)?podne|navecer|navečer|noću|poslije podne|ujutro)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^pono/i,
noon:/^pod/i,
morning:/jutro/i,
afternoon:/(poslije\s|po)+podne/i,
evening:/(navece|naveče)/i,
night:/(nocu|noću)/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ht/_lib/formatDistance.js
var formatDistanceLocale$47={
lessThanXSeconds:{
one:"mwens pase yon segond",
other:"mwens pase {{count}} segond"
},
xSeconds:{
one:"1 segond",
other:"{{count}} segond"
},
halfAMinute:"30 segond",
lessThanXMinutes:{
one:"mwens pase yon minit",
other:"mwens pase {{count}} minit"
},
xMinutes:{
one:"1 minit",
other:"{{count}} minit"
},
aboutXHours:{
one:"anviwon inè",
other:"anviwon {{count}} è"
},
xHours:{
one:"1 lè",
other:"{{count}} lè"
},
xDays:{
one:"1 jou",
other:"{{count}} jou"
},
aboutXWeeks:{
one:"anviwon 1 semèn",
other:"anviwon {{count}} semèn"
},
xWeeks:{
one:"1 semèn",
other:"{{count}} semèn"
},
aboutXMonths:{
one:"anviwon 1 mwa",
other:"anviwon {{count}} mwa"
},
xMonths:{
one:"1 mwa",
other:"{{count}} mwa"
},
aboutXYears:{
one:"anviwon 1 an",
other:"anviwon {{count}} an"
},
xYears:{
one:"1 an",
other:"{{count}} an"
},
overXYears:{
one:"plis pase 1 an",
other:"plis pase {{count}} an"
},
almostXYears:{
one:"prèske 1 an",
other:"prèske {{count}} an"
}
};
var formatDistance$48=function formatDistance$48(token,count,options){
var result;
var tokenValue=formatDistanceLocale$47[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"nan "+result;else
return"sa fè "+result;
return result;
};
var formatLong$49={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'nan lè' {{time}}",
long:"{{date}} 'nan lè' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ht/_lib/formatRelative.js
var formatRelativeLocale$48={
lastWeek:"eeee 'pase nan lè' p",
yesterday:"'yè nan lè' p",
today:"'jodi a' p",
tomorrow:"'demen nan lè' p'",
nextWeek:"eeee 'pwochen nan lè' p",
other:"P"
};
var formatRelative$48=function formatRelative$48(token,_date,_baseDate,_options){return formatRelativeLocale$48[token];};
//#endregion
//#region dist/date-fns/locale/ht/_lib/localize.js
var eraValues$48={
narrow:["av. J.-K","ap. J.-K"],
abbreviated:["av. J.-K","ap. J.-K"],
wide:["anvan Jezi Kris","apre Jezi Kris"]
};
var quarterValues$48={
narrow:[
"T1",
"T2",
"T3",
"T4"],

abbreviated:[
"1ye trim.",
"2yèm trim.",
"3yèm trim.",
"4yèm trim."],

wide:[
"1ye trimès",
"2yèm trimès",
"3yèm trimès",
"4yèm trimès"]

};
var monthValues$48={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"O",
"S",
"O",
"N",
"D"],

abbreviated:[
"janv.",
"fevr.",
"mas",
"avr.",
"me",
"jen",
"jiyè",
"out",
"sept.",
"okt.",
"nov.",
"des."],

wide:[
"janvye",
"fevrye",
"mas",
"avril",
"me",
"jen",
"jiyè",
"out",
"septanm",
"oktòb",
"novanm",
"desanm"]

};
var dayValues$48={
narrow:[
"D",
"L",
"M",
"M",
"J",
"V",
"S"],

short:[
"di",
"le",
"ma",
"mè",
"je",
"va",
"sa"],

abbreviated:[
"dim.",
"len.",
"mad.",
"mèk.",
"jed.",
"van.",
"sam."],

wide:[
"dimanch",
"lendi",
"madi",
"mèkredi",
"jedi",
"vandredi",
"samdi"]

};
var dayPeriodValues$48={
narrow:{
am:"AM",
pm:"PM",
midnight:"minwit",
noon:"midi",
morning:"mat.",
afternoon:"ap.m.",
evening:"swa",
night:"mat."
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"minwit",
noon:"midi",
morning:"maten",
afternoon:"aprèmidi",
evening:"swa",
night:"maten"
},
wide:{
am:"AM",
pm:"PM",
midnight:"minwit",
noon:"midi",
morning:"nan maten",
afternoon:"nan aprèmidi",
evening:"nan aswè",
night:"nan maten"
}
};
var ordinalNumber$48=function ordinalNumber$48(dirtyNumber,_options){
var number=Number(dirtyNumber);
if(number===0)return String(number);
return number+(number===1?"ye":"yèm");
};
//#endregion
//#region dist/date-fns/locale/ht.js
/**
* @category Locales
* @summary Haitian Creole locale.
* @language Haitian Creole
* @iso-639-2 hat
* @author Rubens Mariuzzo [@rmariuzzo](https://github.com/rmariuzzo)
* @author Watson Marcelain [@watsongm24](https://github.com/watsongm24)
*/
var _ht={
code:"ht",
formatDistance:formatDistance$48,
formatLong:formatLong$49,
formatRelative:formatRelative$48,
localize:{
ordinalNumber:ordinalNumber$48,
era:buildLocalizeFn({
values:eraValues$48,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$48,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$48,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$48,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$48,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(ye|yèm)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(av\.J\.K|ap\.J\.K|ap\.J\.-K)/i,
abbreviated:/^(av\.J\.-K|av\.J-K|apr\.J\.-K|apr\.J-K|ap\.J-K)/i,
wide:/^(avan Jezi Kris|apre Jezi Kris)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^av/i,/^ap/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^t[1234]/i,
wide:/^[1234](ye|yèm)? trimès/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(janv|fevr|mas|avr|me|jen|jiyè|out|sept|okt|nov|des)\.?/i,
wide:/^(janvye|fevrye|mas|avril|me|jen|jiyè|out|septanm|oktòb|novanm|desanm)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^o/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^ma/i,
/^av/i,
/^me/i,
/^je/i,
/^ji/i,
/^ou/i,
/^s/i,
/^ok/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[lmjvsd]/i,
short:/^(di|le|ma|me|je|va|sa)/i,
abbreviated:/^(dim|len|mad|mèk|jed|van|sam)\.?/i,
wide:/^(dimanch|lendi|madi|mèkredi|jedi|vandredi|samdi)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^j/i,
/^v/i,
/^s/i],

any:[
/^di/i,
/^le/i,
/^ma/i,
/^mè/i,
/^je/i,
/^va/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|minwit|midi|mat\.?|ap\.?m\.?|swa)/i,
any:/^([ap]\.?\s?m\.?|nan maten|nan aprèmidi|nan aswè)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^min/i,
noon:/^mid/i,
morning:/mat/i,
afternoon:/ap/i,
evening:/sw/i,
night:/nwit/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/hu/_lib/formatDistance.js
var translations$1={
about:"körülbelül",
over:"több mint",
almost:"majdnem",
lessthan:"kevesebb mint"
};
var withoutSuffixes={
xseconds:" másodperc",
halfaminute:"fél perc",
xminutes:" perc",
xhours:" óra",
xdays:" nap",
xweeks:" hét",
xmonths:" hónap",
xyears:" év"
};
var withSuffixes={
xseconds:{
"-1":" másodperccel ezelőtt",
1:" másodperc múlva",
0:" másodperce"
},
halfaminute:{
"-1":"fél perccel ezelőtt",
1:"fél perc múlva",
0:"fél perce"
},
xminutes:{
"-1":" perccel ezelőtt",
1:" perc múlva",
0:" perce"
},
xhours:{
"-1":" órával ezelőtt",
1:" óra múlva",
0:" órája"
},
xdays:{
"-1":" nappal ezelőtt",
1:" nap múlva",
0:" napja"
},
xweeks:{
"-1":" héttel ezelőtt",
1:" hét múlva",
0:" hete"
},
xmonths:{
"-1":" hónappal ezelőtt",
1:" hónap múlva",
0:" hónapja"
},
xyears:{
"-1":" évvel ezelőtt",
1:" év múlva",
0:" éve"
}
};
var formatDistance$47=function formatDistance$47(token,count,options){
var adverb=token.match(/about|over|almost|lessthan/i);
var unit=adverb?token.replace(adverb[0],""):token;
var addSuffix=(options===null||options===void 0?void 0:options.addSuffix)===true;
var key=unit.toLowerCase();
var comparison=(options===null||options===void 0?void 0:options.comparison)||0;
var translated=addSuffix?withSuffixes[key][comparison]:withoutSuffixes[key];
var result=key==="halfaminute"?translated:count+translated;
if(adverb)result=translations$1[adverb[0].toLowerCase()]+" "+result;
return result;
};
var formatLong$48={
date:buildFormatLongFn({
formats:{
full:"y. MMMM d., EEEE",
long:"y. MMMM d.",
medium:"y. MMM d.",
short:"y. MM. dd."
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/hu/_lib/formatRelative.js
var accusativeWeekdays$4=[
"vasárnap",
"hétfőn",
"kedden",
"szerdán",
"csütörtökön",
"pénteken",
"szombaton"];

function week(isFuture){
return function(date){
var weekday=accusativeWeekdays$4[date.getDay()];
return"".concat(isFuture?"":"'múlt' ","'").concat(weekday,"' p'-kor'");
};
}
var formatRelativeLocale$47={
lastWeek:week(false),
yesterday:"'tegnap' p'-kor'",
today:"'ma' p'-kor'",
tomorrow:"'holnap' p'-kor'",
nextWeek:week(true),
other:"P"
};
var formatRelative$47=function formatRelative$47(token,date){
var format=formatRelativeLocale$47[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/hu/_lib/localize.js
var eraValues$47={
narrow:["ie.","isz."],
abbreviated:["i. e.","i. sz."],
wide:["Krisztus előtt","időszámításunk szerint"]
};
var quarterValues$47={
narrow:[
"1.",
"2.",
"3.",
"4."],

abbreviated:[
"1. n.év",
"2. n.év",
"3. n.év",
"4. n.év"],

wide:[
"1. negyedév",
"2. negyedév",
"3. negyedév",
"4. negyedév"]

};
var formattingQuarterValues$3={
narrow:[
"I.",
"II.",
"III.",
"IV."],

abbreviated:[
"I. n.év",
"II. n.év",
"III. n.év",
"IV. n.év"],

wide:[
"I. negyedév",
"II. negyedév",
"III. negyedév",
"IV. negyedév"]

};
var monthValues$47={
narrow:[
"J",
"F",
"M",
"Á",
"M",
"J",
"J",
"A",
"Sz",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"febr.",
"márc.",
"ápr.",
"máj.",
"jún.",
"júl.",
"aug.",
"szept.",
"okt.",
"nov.",
"dec."],

wide:[
"január",
"február",
"március",
"április",
"május",
"június",
"július",
"augusztus",
"szeptember",
"október",
"november",
"december"]

};
var dayValues$47={
narrow:[
"V",
"H",
"K",
"Sz",
"Cs",
"P",
"Sz"],

short:[
"V",
"H",
"K",
"Sze",
"Cs",
"P",
"Szo"],

abbreviated:[
"V",
"H",
"K",
"Sze",
"Cs",
"P",
"Szo"],

wide:[
"vasárnap",
"hétfő",
"kedd",
"szerda",
"csütörtök",
"péntek",
"szombat"]

};
var dayPeriodValues$47={
narrow:{
am:"de.",
pm:"du.",
midnight:"éjfél",
noon:"dél",
morning:"reggel",
afternoon:"du.",
evening:"este",
night:"éjjel"
},
abbreviated:{
am:"de.",
pm:"du.",
midnight:"éjfél",
noon:"dél",
morning:"reggel",
afternoon:"du.",
evening:"este",
night:"éjjel"
},
wide:{
am:"de.",
pm:"du.",
midnight:"éjfél",
noon:"dél",
morning:"reggel",
afternoon:"délután",
evening:"este",
night:"éjjel"
}
};
var ordinalNumber$47=function ordinalNumber$47(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/hu.js
/**
* @category Locales
* @summary Hungarian locale.
* @language Hungarian
* @iso-639-2 hun
* @author Pavlo Shpak [@pshpak](https://github.com/pshpak)
* @author Eduardo Pardo [@eduardopsll](https://github.com/eduardopsll)
* @author Zoltan Szepesi [@twodcube](https://github.com/twodcube)
*/
var _hu={
code:"hu",
formatDistance:formatDistance$47,
formatLong:formatLong$48,
formatRelative:formatRelative$47,
localize:{
ordinalNumber:ordinalNumber$47,
era:buildLocalizeFn({
values:eraValues$47,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$47,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;},
formattingValues:formattingQuarterValues$3,
defaultFormattingWidth:"wide"
}),
month:buildLocalizeFn({
values:monthValues$47,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$47,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$47,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\.?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ie\.|isz\.)/i,
abbreviated:/^(i\.\s?e\.?|b?\s?c\s?e|i\.\s?sz\.?)/i,
wide:/^(Krisztus előtt|időszámításunk előtt|időszámításunk szerint|i\. sz\.)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[/ie/i,/isz/i],
abbreviated:[/^(i\.?\s?e\.?|b\s?ce)/i,/^(i\.?\s?sz\.?|c\s?e)/i],
any:[/előtt/i,/(szerint|i. sz.)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]\.?/i,
abbreviated:/^[1234]?\.?\s?n\.év/i,
wide:/^([1234]|I|II|III|IV)?\.?\s?negyedév/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1|I$/i,
/2|II$/i,
/3|III/i,
/4|IV/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmaásond]|sz/i,
abbreviated:/^(jan\.?|febr\.?|márc\.?|ápr\.?|máj\.?|jún\.?|júl\.?|aug\.?|szept\.?|okt\.?|nov\.?|dec\.?)/i,
wide:/^(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a|á/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s|sz/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^már/i,
/^áp/i,
/^máj/i,
/^jún/i,
/^júl/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^([vhkpc]|sz|cs|sz)/i,
short:/^([vhkp]|sze|cs|szo)/i,
abbreviated:/^([vhkp]|sze|cs|szo)/i,
wide:/^(vasárnap|hétfő|kedd|szerda|csütörtök|péntek|szombat)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^v/i,
/^h/i,
/^k/i,
/^sz/i,
/^c/i,
/^p/i,
/^sz/i],

any:[
/^v/i,
/^h/i,
/^k/i,
/^sze/i,
/^c/i,
/^p/i,
/^szo/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^((de|du)\.?|éjfél|délután|dél|reggel|este|éjjel)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^de\.?/i,
pm:/^du\.?/i,
midnight:/^éjf/i,
noon:/^dé/i,
morning:/reg/i,
afternoon:/^délu\.?/i,
evening:/es/i,
night:/éjj/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/hy/_lib/formatDistance.js
var formatDistanceLocale$46={
lessThanXSeconds:{
one:"ավելի քիչ քան 1 վայրկյան",
other:"ավելի քիչ քան {{count}} վայրկյան"
},
xSeconds:{
one:"1 վայրկյան",
other:"{{count}} վայրկյան"
},
halfAMinute:"կես րոպե",
lessThanXMinutes:{
one:"ավելի քիչ քան 1 րոպե",
other:"ավելի քիչ քան {{count}} րոպե"
},
xMinutes:{
one:"1 րոպե",
other:"{{count}} րոպե"
},
aboutXHours:{
one:"մոտ 1 ժամ",
other:"մոտ {{count}} ժամ"
},
xHours:{
one:"1 ժամ",
other:"{{count}} ժամ"
},
xDays:{
one:"1 օր",
other:"{{count}} օր"
},
aboutXWeeks:{
one:"մոտ 1 շաբաթ",
other:"մոտ {{count}} շաբաթ"
},
xWeeks:{
one:"1 շաբաթ",
other:"{{count}} շաբաթ"
},
aboutXMonths:{
one:"մոտ 1 ամիս",
other:"մոտ {{count}} ամիս"
},
xMonths:{
one:"1 ամիս",
other:"{{count}} ամիս"
},
aboutXYears:{
one:"մոտ 1 տարի",
other:"մոտ {{count}} տարի"
},
xYears:{
one:"1 տարի",
other:"{{count}} տարի"
},
overXYears:{
one:"ավելի քան 1 տարի",
other:"ավելի քան {{count}} տարի"
},
almostXYears:{
one:"համարյա 1 տարի",
other:"համարյա {{count}} տարի"
}
};
var formatDistance$46=function formatDistance$46(token,count,options){
var result;
var tokenValue=formatDistanceLocale$46[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" հետո";else
return result+" առաջ";
return result;
};
var formatLong$47={
date:buildFormatLongFn({
formats:{
full:"d MMMM, y, EEEE",
long:"d MMMM, y",
medium:"d MMM, y",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'ժ․'{{time}}",
long:"{{date}} 'ժ․'{{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/hy/_lib/formatRelative.js
var formatRelativeLocale$46={
lastWeek:"'նախորդ' eeee p'֊ին'",
yesterday:"'երեկ' p'֊ին'",
today:"'այսօր' p'֊ին'",
tomorrow:"'վաղը' p'֊ին'",
nextWeek:"'հաջորդ' eeee p'֊ին'",
other:"P"
};
var formatRelative$46=function formatRelative$46(token,_date,_baseDate,_options){return formatRelativeLocale$46[token];};
//#endregion
//#region dist/date-fns/locale/hy/_lib/localize.js
var eraValues$46={
narrow:["Ք","Մ"],
abbreviated:["ՔԱ","ՄԹ"],
wide:["Քրիստոսից առաջ","Մեր թվարկության"]
};
var quarterValues$46={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Ք1",
"Ք2",
"Ք3",
"Ք4"],

wide:[
"1֊ին քառորդ",
"2֊րդ քառորդ",
"3֊րդ քառորդ",
"4֊րդ քառորդ"]

};
var monthValues$46={
narrow:[
"Հ",
"Փ",
"Մ",
"Ա",
"Մ",
"Հ",
"Հ",
"Օ",
"Ս",
"Հ",
"Ն",
"Դ"],

abbreviated:[
"հուն",
"փետ",
"մար",
"ապր",
"մայ",
"հուն",
"հուլ",
"օգս",
"սեպ",
"հոկ",
"նոյ",
"դեկ"],

wide:[
"հունվար",
"փետրվար",
"մարտ",
"ապրիլ",
"մայիս",
"հունիս",
"հուլիս",
"օգոստոս",
"սեպտեմբեր",
"հոկտեմբեր",
"նոյեմբեր",
"դեկտեմբեր"]

};
var dayValues$46={
narrow:[
"Կ",
"Ե",
"Ե",
"Չ",
"Հ",
"Ո",
"Շ"],

short:[
"կր",
"եր",
"եք",
"չք",
"հգ",
"ուր",
"շբ"],

abbreviated:[
"կիր",
"երկ",
"երք",
"չոր",
"հնգ",
"ուրբ",
"շաբ"],

wide:[
"կիրակի",
"երկուշաբթի",
"երեքշաբթի",
"չորեքշաբթի",
"հինգշաբթի",
"ուրբաթ",
"շաբաթ"]

};
var dayPeriodValues$46={
narrow:{
am:"a",
pm:"p",
midnight:"կեսգշ",
noon:"կեսօր",
morning:"առավոտ",
afternoon:"ցերեկ",
evening:"երեկո",
night:"գիշեր"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"կեսգիշեր",
noon:"կեսօր",
morning:"առավոտ",
afternoon:"ցերեկ",
evening:"երեկո",
night:"գիշեր"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"կեսգիշեր",
noon:"կեսօր",
morning:"առավոտ",
afternoon:"ցերեկ",
evening:"երեկո",
night:"գիշեր"
}
};
var formattingDayPeriodValues$38={
narrow:{
am:"a",
pm:"p",
midnight:"կեսգշ",
noon:"կեսօր",
morning:"առավոտը",
afternoon:"ցերեկը",
evening:"երեկոյան",
night:"գիշերը"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"կեսգիշերին",
noon:"կեսօրին",
morning:"առավոտը",
afternoon:"ցերեկը",
evening:"երեկոյան",
night:"գիշերը"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"կեսգիշերին",
noon:"կեսօրին",
morning:"առավոտը",
afternoon:"ցերեկը",
evening:"երեկոյան",
night:"գիշերը"
}
};
var ordinalNumber$46=function ordinalNumber$46(dirtyNumber,_options){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100<10){
if(rem100%10===1)return number+"֊ին";
}
return number+"֊րդ";
};
//#endregion
//#region dist/date-fns/locale/hy.js
/**
* @category Locales
* @summary Armenian locale
* @language Armenian
* @iso-639-2 arm
* @author Alex Igityan [@alexigityan](https://github.com/alexigityan)
*/
var _hy={
code:"hy",
formatDistance:formatDistance$46,
formatLong:formatLong$47,
formatRelative:formatRelative$46,
localize:{
ordinalNumber:ordinalNumber$46,
era:buildLocalizeFn({
values:eraValues$46,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$46,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$46,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$46,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$46,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$38,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)((-|֊)?(ին|րդ))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(Ք|Մ)/i,
abbreviated:/^(Ք\.?\s?Ա\.?|Մ\.?\s?Թ\.?\s?Ա\.?|Մ\.?\s?Թ\.?|Ք\.?\s?Հ\.?)/i,
wide:/^(քրիստոսից առաջ|մեր թվարկությունից առաջ|մեր թվարկության|քրիստոսից հետո)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^ք/i,/^մ/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ք[1234]/i,
wide:/^[1234]((-|֊)?(ին|րդ)) քառորդ/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[հփմաօսնդ]/i,
abbreviated:/^(հուն|փետ|մար|ապր|մայ|հուն|հուլ|օգս|սեպ|հոկ|նոյ|դեկ)/i,
wide:/^(հունվար|փետրվար|մարտ|ապրիլ|մայիս|հունիս|հուլիս|օգոստոս|սեպտեմբեր|հոկտեմբեր|նոյեմբեր|դեկտեմբեր)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^հ/i,
/^փ/i,
/^մ/i,
/^ա/i,
/^մ/i,
/^հ/i,
/^հ/i,
/^օ/i,
/^ս/i,
/^հ/i,
/^ն/i,
/^դ/i],

any:[
/^հու/i,
/^փ/i,
/^մար/i,
/^ա/i,
/^մայ/i,
/^հուն/i,
/^հուլ/i,
/^օ/i,
/^ս/i,
/^հոկ/i,
/^ն/i,
/^դ/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[եչհոշկ]/i,
short:/^(կր|եր|եք|չք|հգ|ուր|շբ)/i,
abbreviated:/^(կիր|երկ|երք|չոր|հնգ|ուրբ|շաբ)/i,
wide:/^(կիրակի|երկուշաբթի|երեքշաբթի|չորեքշաբթի|հինգշաբթի|ուրբաթ|շաբաթ)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^կ/i,
/^ե/i,
/^ե/i,
/^չ/i,
/^հ/i,
/^(ո|Ո)/,
/^շ/i],

short:[
/^կ/i,
/^եր/i,
/^եք/i,
/^չ/i,
/^հ/i,
/^(ո|Ո)/,
/^շ/i],

abbreviated:[
/^կ/i,
/^երկ/i,
/^երք/i,
/^չ/i,
/^հ/i,
/^(ո|Ո)/,
/^շ/i],

wide:[
/^կ/i,
/^երկ/i,
/^երե/i,
/^չ/i,
/^հ/i,
/^(ո|Ո)/,
/^շ/i]

},
defaultParseWidth:"wide"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^([ap]|կեսգշ|կեսօր|(առավոտը?|ցերեկը?|երեկո(յան)?|գիշերը?))/i,
any:/^([ap]\.?\s?m\.?|կեսգիշեր(ին)?|կեսօր(ին)?|(առավոտը?|ցերեկը?|երեկո(յան)?|գիշերը?))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/կեսգիշեր/i,
noon:/կեսօր/i,
morning:/առավոտ/i,
afternoon:/ցերեկ/i,
evening:/երեկո/i,
night:/գիշեր/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/id/_lib/formatDistance.js
var formatDistanceLocale$45={
lessThanXSeconds:{
one:"kurang dari 1 detik",
other:"kurang dari {{count}} detik"
},
xSeconds:{
one:"1 detik",
other:"{{count}} detik"
},
halfAMinute:"setengah menit",
lessThanXMinutes:{
one:"kurang dari 1 menit",
other:"kurang dari {{count}} menit"
},
xMinutes:{
one:"1 menit",
other:"{{count}} menit"
},
aboutXHours:{
one:"sekitar 1 jam",
other:"sekitar {{count}} jam"
},
xHours:{
one:"1 jam",
other:"{{count}} jam"
},
xDays:{
one:"1 hari",
other:"{{count}} hari"
},
aboutXWeeks:{
one:"sekitar 1 minggu",
other:"sekitar {{count}} minggu"
},
xWeeks:{
one:"1 minggu",
other:"{{count}} minggu"
},
aboutXMonths:{
one:"sekitar 1 bulan",
other:"sekitar {{count}} bulan"
},
xMonths:{
one:"1 bulan",
other:"{{count}} bulan"
},
aboutXYears:{
one:"sekitar 1 tahun",
other:"sekitar {{count}} tahun"
},
xYears:{
one:"1 tahun",
other:"{{count}} tahun"
},
overXYears:{
one:"lebih dari 1 tahun",
other:"lebih dari {{count}} tahun"
},
almostXYears:{
one:"hampir 1 tahun",
other:"hampir {{count}} tahun"
}
};
var formatDistance$45=function formatDistance$45(token,count,options){
var result;
var tokenValue=formatDistanceLocale$45[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"dalam waktu "+result;else
return result+" yang lalu";
return result;
};
var formatLong$46={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"d/M/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH.mm.ss",
long:"HH.mm.ss",
medium:"HH.mm",
short:"HH.mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'pukul' {{time}}",
long:"{{date}} 'pukul' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/id/_lib/formatRelative.js
var formatRelativeLocale$45={
lastWeek:"eeee 'lalu pukul' p",
yesterday:"'Kemarin pukul' p",
today:"'Hari ini pukul' p",
tomorrow:"'Besok pukul' p",
nextWeek:"eeee 'pukul' p",
other:"P"
};
var formatRelative$45=function formatRelative$45(token,_date,_baseDate,_options){return formatRelativeLocale$45[token];};
//#endregion
//#region dist/date-fns/locale/id/_lib/localize.js
var eraValues$45={
narrow:["SM","M"],
abbreviated:["SM","M"],
wide:["Sebelum Masehi","Masehi"]
};
var quarterValues$45={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"Kuartal ke-1",
"Kuartal ke-2",
"Kuartal ke-3",
"Kuartal ke-4"]

};
var monthValues$45={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Feb",
"Mar",
"Apr",
"Mei",
"Jun",
"Jul",
"Agt",
"Sep",
"Okt",
"Nov",
"Des"],

wide:[
"Januari",
"Februari",
"Maret",
"April",
"Mei",
"Juni",
"Juli",
"Agustus",
"September",
"Oktober",
"November",
"Desember"]

};
var dayValues$45={
narrow:[
"M",
"S",
"S",
"R",
"K",
"J",
"S"],

short:[
"Min",
"Sen",
"Sel",
"Rab",
"Kam",
"Jum",
"Sab"],

abbreviated:[
"Min",
"Sen",
"Sel",
"Rab",
"Kam",
"Jum",
"Sab"],

wide:[
"Minggu",
"Senin",
"Selasa",
"Rabu",
"Kamis",
"Jumat",
"Sabtu"]

};
var dayPeriodValues$45={
narrow:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"siang",
evening:"sore",
night:"malam"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"siang",
evening:"sore",
night:"malam"
},
wide:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"siang",
evening:"sore",
night:"malam"
}
};
var formattingDayPeriodValues$37={
narrow:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"siang",
evening:"sore",
night:"malam"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"siang",
evening:"sore",
night:"malam"
},
wide:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"siang",
evening:"sore",
night:"malam"
}
};
var ordinalNumber$45=function ordinalNumber$45(dirtyNumber,_options){
return"ke-"+Number(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/id.js
/**
* @category Locales
* @summary Indonesian locale.
* @language Indonesian
* @iso-639-2 ind
* @author Rahmat Budiharso [@rbudiharso](https://github.com/rbudiharso)
* @author Benget Nata [@bentinata](https://github.com/bentinata)
* @author Budi Irawan [@deerawan](https://github.com/deerawan)
* @author Try Ajitiono [@imballinst](https://github.com/imballinst)
*/
var _id={
code:"id",
formatDistance:formatDistance$45,
formatLong:formatLong$46,
formatRelative:formatRelative$45,
localize:{
ordinalNumber:ordinalNumber$45,
era:buildLocalizeFn({
values:eraValues$45,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$45,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$45,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$45,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$45,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$37,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^ke-(\d+)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(sm|m)/i,
abbreviated:/^(s\.?\s?m\.?|s\.?\s?e\.?\s?u\.?|m\.?|e\.?\s?u\.?)/i,
wide:/^(sebelum masehi|sebelum era umum|masehi|era umum)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^s/i,/^(m|e)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^K-?\s[1234]/i,
wide:/^Kuartal ke-?\s?[1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mar|apr|mei|jun|jul|agt|sep|okt|nov|des)/i,
wide:/^(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^ma/i,
/^ap/i,
/^me/i,
/^jun/i,
/^jul/i,
/^ag/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[srkjm]/i,
short:/^(min|sen|sel|rab|kam|jum|sab)/i,
abbreviated:/^(min|sen|sel|rab|kam|jum|sab)/i,
wide:/^(minggu|senin|selasa|rabu|kamis|jumat|sabtu)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^m/i,
/^s/i,
/^s/i,
/^r/i,
/^k/i,
/^j/i,
/^s/i],

any:[
/^m/i,
/^sen/i,
/^sel/i,
/^r/i,
/^k/i,
/^j/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|tengah m|tengah h|(di(\swaktu)?) (pagi|siang|sore|malam))/i,
any:/^([ap]\.?\s?m\.?|tengah malam|tengah hari|(di(\swaktu)?) (pagi|siang|sore|malam))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^pm/i,
midnight:/^tengah m/i,
noon:/^tengah h/i,
morning:/pagi/i,
afternoon:/siang/i,
evening:/sore/i,
night:/malam/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/is/_lib/formatDistance.js
var formatDistanceLocale$44={
lessThanXSeconds:{
one:"minna en 1 sekúnda",
other:"minna en {{count}} sekúndur"
},
xSeconds:{
one:"1 sekúnda",
other:"{{count}} sekúndur"
},
halfAMinute:"hálf mínúta",
lessThanXMinutes:{
one:"minna en 1 mínúta",
other:"minna en {{count}} mínútur"
},
xMinutes:{
one:"1 mínúta",
other:"{{count}} mínútur"
},
aboutXHours:{
one:"u.þ.b. 1 klukkustund",
other:"u.þ.b. {{count}} klukkustundir"
},
xHours:{
one:"1 klukkustund",
other:"{{count}} klukkustundir"
},
xDays:{
one:"1 dagur",
other:"{{count}} dagar"
},
aboutXWeeks:{
one:"um viku",
other:"um {{count}} vikur"
},
xWeeks:{
one:"1 viku",
other:"{{count}} vikur"
},
aboutXMonths:{
one:"u.þ.b. 1 mánuður",
other:"u.þ.b. {{count}} mánuðir"
},
xMonths:{
one:"1 mánuður",
other:"{{count}} mánuðir"
},
aboutXYears:{
one:"u.þ.b. 1 ár",
other:"u.þ.b. {{count}} ár"
},
xYears:{
one:"1 ár",
other:"{{count}} ár"
},
overXYears:{
one:"meira en 1 ár",
other:"meira en {{count}} ár"
},
almostXYears:{
one:"næstum 1 ár",
other:"næstum {{count}} ár"
}
};
var formatDistance$44=function formatDistance$44(token,count,options){
var result;
var tokenValue=formatDistanceLocale$44[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"í "+result;else
return result+" síðan";
return result;
};
var formatLong$45={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y",
long:"do MMMM y",
medium:"do MMM y",
short:"d.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"'kl'. HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'kl.' {{time}}",
long:"{{date}} 'kl.' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/is/_lib/formatRelative.js
var formatRelativeLocale$44={
lastWeek:"'síðasta' dddd 'kl.' p",
yesterday:"'í gær kl.' p",
today:"'í dag kl.' p",
tomorrow:"'á morgun kl.' p",
nextWeek:"dddd 'kl.' p",
other:"P"
};
var formatRelative$44=function formatRelative$44(token,_date,_baseDate,_options){return formatRelativeLocale$44[token];};
//#endregion
//#region dist/date-fns/locale/is/_lib/localize.js
var eraValues$44={
narrow:["f.Kr.","e.Kr."],
abbreviated:["f.Kr.","e.Kr."],
wide:["fyrir Krist","eftir Krist"]
};
var quarterValues$44={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1F",
"2F",
"3F",
"4F"],

wide:[
"1. fjórðungur",
"2. fjórðungur",
"3. fjórðungur",
"4. fjórðungur"]

};
var monthValues$44={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"Á",
"S",
"Ó",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mars",
"apríl",
"maí",
"júní",
"júlí",
"ágúst",
"sept.",
"okt.",
"nóv.",
"des."],

wide:[
"janúar",
"febrúar",
"mars",
"apríl",
"maí",
"júní",
"júlí",
"ágúst",
"september",
"október",
"nóvember",
"desember"]

};
var dayValues$44={
narrow:[
"S",
"M",
"Þ",
"M",
"F",
"F",
"L"],

short:[
"Su",
"Má",
"Þr",
"Mi",
"Fi",
"Fö",
"La"],

abbreviated:[
"sun.",
"mán.",
"þri.",
"mið.",
"fim.",
"fös.",
"lau."],

wide:[
"sunnudagur",
"mánudagur",
"þriðjudagur",
"miðvikudagur",
"fimmtudagur",
"föstudagur",
"laugardagur"]

};
var dayPeriodValues$44={
narrow:{
am:"f",
pm:"e",
midnight:"miðnætti",
noon:"hádegi",
morning:"morgunn",
afternoon:"síðdegi",
evening:"kvöld",
night:"nótt"
},
abbreviated:{
am:"f.h.",
pm:"e.h.",
midnight:"miðnætti",
noon:"hádegi",
morning:"morgunn",
afternoon:"síðdegi",
evening:"kvöld",
night:"nótt"
},
wide:{
am:"fyrir hádegi",
pm:"eftir hádegi",
midnight:"miðnætti",
noon:"hádegi",
morning:"morgunn",
afternoon:"síðdegi",
evening:"kvöld",
night:"nótt"
}
};
var formattingDayPeriodValues$36={
narrow:{
am:"f",
pm:"e",
midnight:"á miðnætti",
noon:"á hádegi",
morning:"að morgni",
afternoon:"síðdegis",
evening:"um kvöld",
night:"um nótt"
},
abbreviated:{
am:"f.h.",
pm:"e.h.",
midnight:"á miðnætti",
noon:"á hádegi",
morning:"að morgni",
afternoon:"síðdegis",
evening:"um kvöld",
night:"um nótt"
},
wide:{
am:"fyrir hádegi",
pm:"eftir hádegi",
midnight:"á miðnætti",
noon:"á hádegi",
morning:"að morgni",
afternoon:"síðdegis",
evening:"um kvöld",
night:"um nótt"
}
};
var ordinalNumber$44=function ordinalNumber$44(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/is.js
/**
* @category Locales
* @summary Icelandic locale.
* @language Icelandic
* @iso-639-2 isl
* @author Derek Blank [@derekblank](https://github.com/derekblank)
* @author Arnór Ýmir [@lamayg](https://github.com/lamayg)
*/
var _is={
code:"is",
formatDistance:formatDistance$44,
formatLong:formatLong$45,
formatRelative:formatRelative$44,
localize:{
ordinalNumber:ordinalNumber$44,
era:buildLocalizeFn({
values:eraValues$44,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$44,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$44,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$44,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$44,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$36,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(\.)?/i,
parsePattern:/\d+(\.)?/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(f\.Kr\.|e\.Kr\.)/i,
abbreviated:/^(f\.Kr\.|e\.Kr\.)/i,
wide:/^(fyrir Krist|eftir Krist)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(f\.Kr\.)/i,/^(e\.Kr\.)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]\.?/i,
abbreviated:/^q[1234]\.?/i,
wide:/^[1234]\.? fjórðungur/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1\.?/i,
/2\.?/i,
/3\.?/i,
/4\.?/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmásónd]/i,
abbreviated:/^(jan\.|feb\.|mars\.|apríl\.|maí|júní|júlí|águst|sep\.|oct\.|nov\.|dec\.)/i,
wide:/^(januar|febrúar|mars|apríl|maí|júní|júlí|águst|september|október|nóvember|desember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^á/i,
/^s/i,
/^ó/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^maí/i,
/^jún/i,
/^júl/i,
/^áu/i,
/^s/i,
/^ó/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtwf]/i,
short:/^(su|má|þr|mi|fi|fö|la)/i,
abbreviated:/^(sun|mán|þri|mið|fim|fös|lau)\.?/i,
wide:/^(sunnudagur|mánudagur|þriðjudagur|miðvikudagur|fimmtudagur|föstudagur|laugardagur)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^þ/i,
/^m/i,
/^f/i,
/^f/i,
/^l/i],

any:[
/^su/i,
/^má/i,
/^þr/i,
/^mi/i,
/^fi/i,
/^fö/i,
/^la/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(f|e|síðdegis|(á|að|um) (morgni|kvöld|nótt|miðnætti))/i,
any:/^(fyrir hádegi|eftir hádegi|[ef]\.?h\.?|síðdegis|morgunn|(á|að|um) (morgni|kvöld|nótt|miðnætti))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^f/i,
pm:/^e/i,
midnight:/^mi/i,
noon:/^há/i,
morning:/morgunn/i,
afternoon:/síðdegi/i,
evening:/kvöld/i,
night:/nótt/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/it/_lib/formatDistance.js
var formatDistanceLocale$43={
lessThanXSeconds:{
one:"meno di un secondo",
other:"meno di {{count}} secondi"
},
xSeconds:{
one:"un secondo",
other:"{{count}} secondi"
},
halfAMinute:"alcuni secondi",
lessThanXMinutes:{
one:"meno di un minuto",
other:"meno di {{count}} minuti"
},
xMinutes:{
one:"un minuto",
other:"{{count}} minuti"
},
aboutXHours:{
one:"circa un'ora",
other:"circa {{count}} ore"
},
xHours:{
one:"un'ora",
other:"{{count}} ore"
},
xDays:{
one:"un giorno",
other:"{{count}} giorni"
},
aboutXWeeks:{
one:"circa una settimana",
other:"circa {{count}} settimane"
},
xWeeks:{
one:"una settimana",
other:"{{count}} settimane"
},
aboutXMonths:{
one:"circa un mese",
other:"circa {{count}} mesi"
},
xMonths:{
one:"un mese",
other:"{{count}} mesi"
},
aboutXYears:{
one:"circa un anno",
other:"circa {{count}} anni"
},
xYears:{
one:"un anno",
other:"{{count}} anni"
},
overXYears:{
one:"più di un anno",
other:"più di {{count}} anni"
},
almostXYears:{
one:"quasi un anno",
other:"quasi {{count}} anni"
}
};
var formatDistance$43=function formatDistance$43(token,count,options){
var result;
var tokenValue=formatDistanceLocale$43[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"tra "+result;else
return result+" fa";
return result;
};
var formatLong$44={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/it/_lib/formatRelative.js
var weekdays$2=[
"domenica",
"lunedì",
"martedì",
"mercoledì",
"giovedì",
"venerdì",
"sabato"];

function lastWeek$5(day){
switch(day){
case 0:return"'domenica scorsa alle' p";
default:return"'"+weekdays$2[day]+" scorso alle' p";
}
}
function thisWeek$5(day){
return"'"+weekdays$2[day]+" alle' p";
}
function nextWeek$5(day){
switch(day){
case 0:return"'domenica prossima alle' p";
default:return"'"+weekdays$2[day]+" prossimo alle' p";
}
}
var formatRelativeLocale$43={
lastWeek:function lastWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$5(day);else
return lastWeek$5(day);
},
yesterday:"'ieri alle' p",
today:"'oggi alle' p",
tomorrow:"'domani alle' p",
nextWeek:function nextWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$5(day);else
return nextWeek$5(day);
},
other:"P"
};
var formatRelative$43=function formatRelative$43(token,date,baseDate,options){
var format=formatRelativeLocale$43[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/it/_lib/localize.js
var eraValues$43={
narrow:["aC","dC"],
abbreviated:["a.C.","d.C."],
wide:["avanti Cristo","dopo Cristo"]
};
var quarterValues$43={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"1º trimestre",
"2º trimestre",
"3º trimestre",
"4º trimestre"]

};
var monthValues$43={
narrow:[
"G",
"F",
"M",
"A",
"M",
"G",
"L",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"gen",
"feb",
"mar",
"apr",
"mag",
"giu",
"lug",
"ago",
"set",
"ott",
"nov",
"dic"],

wide:[
"gennaio",
"febbraio",
"marzo",
"aprile",
"maggio",
"giugno",
"luglio",
"agosto",
"settembre",
"ottobre",
"novembre",
"dicembre"]

};
var dayValues$43={
narrow:[
"D",
"L",
"M",
"M",
"G",
"V",
"S"],

short:[
"dom",
"lun",
"mar",
"mer",
"gio",
"ven",
"sab"],

abbreviated:[
"dom",
"lun",
"mar",
"mer",
"gio",
"ven",
"sab"],

wide:[
"domenica",
"lunedì",
"martedì",
"mercoledì",
"giovedì",
"venerdì",
"sabato"]

};
var dayPeriodValues$43={
narrow:{
am:"m.",
pm:"p.",
midnight:"mezzanotte",
noon:"mezzogiorno",
morning:"mattina",
afternoon:"pomeriggio",
evening:"sera",
night:"notte"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"mezzanotte",
noon:"mezzogiorno",
morning:"mattina",
afternoon:"pomeriggio",
evening:"sera",
night:"notte"
},
wide:{
am:"AM",
pm:"PM",
midnight:"mezzanotte",
noon:"mezzogiorno",
morning:"mattina",
afternoon:"pomeriggio",
evening:"sera",
night:"notte"
}
};
var formattingDayPeriodValues$35={
narrow:{
am:"m.",
pm:"p.",
midnight:"mezzanotte",
noon:"mezzogiorno",
morning:"di mattina",
afternoon:"del pomeriggio",
evening:"di sera",
night:"di notte"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"mezzanotte",
noon:"mezzogiorno",
morning:"di mattina",
afternoon:"del pomeriggio",
evening:"di sera",
night:"di notte"
},
wide:{
am:"AM",
pm:"PM",
midnight:"mezzanotte",
noon:"mezzogiorno",
morning:"di mattina",
afternoon:"del pomeriggio",
evening:"di sera",
night:"di notte"
}
};
var ordinalNumber$43=function ordinalNumber$43(dirtyNumber,_options){
var number=Number(dirtyNumber);
return String(number);
};
var localize$43={
ordinalNumber:ordinalNumber$43,
era:buildLocalizeFn({
values:eraValues$43,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$43,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$43,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$43,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$43,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$35,
defaultFormattingWidth:"wide"
})
};
var match$43={
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(º)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(aC|dC)/i,
abbreviated:/^(a\.?\s?C\.?|a\.?\s?e\.?\s?v\.?|d\.?\s?C\.?|e\.?\s?v\.?)/i,
wide:/^(avanti Cristo|avanti Era Volgare|dopo Cristo|Era Volgare)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^a/i,/^(d|e)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^t[1234]/i,
wide:/^[1234](º)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[gfmalsond]/i,
abbreviated:/^(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/i,
wide:/^(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^g/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^g/i,
/^l/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ge/i,
/^f/i,
/^mar/i,
/^ap/i,
/^mag/i,
/^gi/i,
/^l/i,
/^ag/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dlmgvs]/i,
short:/^(do|lu|ma|me|gi|ve|sa)/i,
abbreviated:/^(dom|lun|mar|mer|gio|ven|sab)/i,
wide:/^(domenica|luned[i|ì]|marted[i|ì]|mercoled[i|ì]|gioved[i|ì]|venerd[i|ì]|sabato)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^g/i,
/^v/i,
/^s/i],

any:[
/^d/i,
/^l/i,
/^ma/i,
/^me/i,
/^g/i,
/^v/i,
/^s/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|m\.|p|mezzanotte|mezzogiorno|(di|del) (mattina|pomeriggio|sera|notte))/i,
any:/^([ap]\.?\s?m\.?|mezzanotte|mezzogiorno|(di|del) (mattina|pomeriggio|sera|notte))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mezza/i,
noon:/^mezzo/i,
morning:/mattina/i,
afternoon:/pomeriggio/i,
evening:/sera/i,
night:/notte/i
}},
defaultParseWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/it.js
/**
* @category Locales
* @summary Italian locale.
* @language Italian
* @iso-639-2 ita
* @author Alberto Restifo [@albertorestifo](https://github.com/albertorestifo)
* @author Giovanni Polimeni [@giofilo](https://github.com/giofilo)
* @author Vincenzo Carrese [@vin-car](https://github.com/vin-car)
*/
var _it={
code:"it",
formatDistance:formatDistance$43,
formatLong:formatLong$44,
formatRelative:formatRelative$43,
localize:localize$43,
match:match$43,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/it-CH.js
/**
* @category Locales
* @summary Italian locale (Switzerland).
* @language Italian
* @iso-639-2 ita
* @author Mike Peyer [@maic66](https://github.com/maic66)
*/
var _itCH={
code:"it-CH",
formatDistance:formatDistance$43,
formatLong:{
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
},
formatRelative:formatRelative$43,
localize:localize$43,
match:match$43,
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/ja/_lib/formatDistance.js
var formatDistanceLocale$42={
lessThanXSeconds:{
one:"1秒未満",
other:"{{count}}秒未満",
oneWithSuffix:"約1秒",
otherWithSuffix:"約{{count}}秒"
},
xSeconds:{
one:"1秒",
other:"{{count}}秒"
},
halfAMinute:"30秒",
lessThanXMinutes:{
one:"1分未満",
other:"{{count}}分未満",
oneWithSuffix:"約1分",
otherWithSuffix:"約{{count}}分"
},
xMinutes:{
one:"1分",
other:"{{count}}分"
},
aboutXHours:{
one:"約1時間",
other:"約{{count}}時間"
},
xHours:{
one:"1時間",
other:"{{count}}時間"
},
xDays:{
one:"1日",
other:"{{count}}日"
},
aboutXWeeks:{
one:"約1週間",
other:"約{{count}}週間"
},
xWeeks:{
one:"1週間",
other:"{{count}}週間"
},
aboutXMonths:{
one:"約1か月",
other:"約{{count}}か月"
},
xMonths:{
one:"1か月",
other:"{{count}}か月"
},
aboutXYears:{
one:"約1年",
other:"約{{count}}年"
},
xYears:{
one:"1年",
other:"{{count}}年"
},
overXYears:{
one:"1年以上",
other:"{{count}}年以上"
},
almostXYears:{
one:"1年近く",
other:"{{count}}年近く"
}
};
var formatDistance$42=function formatDistance$42(token,count,options){
options=options||{};
var result;
var tokenValue=formatDistanceLocale$42[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1){if(options.addSuffix&&tokenValue.oneWithSuffix)result=tokenValue.oneWithSuffix;else
result=tokenValue.one;}else
if(options.addSuffix&&tokenValue.otherWithSuffix)result=tokenValue.otherWithSuffix.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options.addSuffix)if(options.comparison&&options.comparison>0)return result+"後";else
return result+"前";
return result;
};
var formatLong$42={
date:buildFormatLongFn({
formats:{
full:"y年M月d日EEEE",
long:"y年M月d日",
medium:"y/MM/dd",
short:"y/MM/dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H時mm分ss秒 zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ja/_lib/formatRelative.js
var formatRelativeLocale$42={
lastWeek:"先週のeeeeのp",
yesterday:"昨日のp",
today:"今日のp",
tomorrow:"明日のp",
nextWeek:"翌週のeeeeのp",
other:"P"
};
var formatRelative$42=function formatRelative$42(token,_date,_baseDate,_options){
return formatRelativeLocale$42[token];
};
//#endregion
//#region dist/date-fns/locale/ja/_lib/localize.js
var eraValues$42={
narrow:["BC","AC"],
abbreviated:["紀元前","西暦"],
wide:["紀元前","西暦"]
};
var quarterValues$42={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"第1四半期",
"第2四半期",
"第3四半期",
"第4四半期"]

};
var monthValues$42={
narrow:[
"1",
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"10",
"11",
"12"],

abbreviated:[
"1月",
"2月",
"3月",
"4月",
"5月",
"6月",
"7月",
"8月",
"9月",
"10月",
"11月",
"12月"],

wide:[
"1月",
"2月",
"3月",
"4月",
"5月",
"6月",
"7月",
"8月",
"9月",
"10月",
"11月",
"12月"]

};
var dayValues$42={
narrow:[
"日",
"月",
"火",
"水",
"木",
"金",
"土"],

short:[
"日",
"月",
"火",
"水",
"木",
"金",
"土"],

abbreviated:[
"日",
"月",
"火",
"水",
"木",
"金",
"土"],

wide:[
"日曜日",
"月曜日",
"火曜日",
"水曜日",
"木曜日",
"金曜日",
"土曜日"]

};
var dayPeriodValues$42={
narrow:{
am:"午前",
pm:"午後",
midnight:"深夜",
noon:"正午",
morning:"朝",
afternoon:"午後",
evening:"夜",
night:"深夜"
},
abbreviated:{
am:"午前",
pm:"午後",
midnight:"深夜",
noon:"正午",
morning:"朝",
afternoon:"午後",
evening:"夜",
night:"深夜"
},
wide:{
am:"午前",
pm:"午後",
midnight:"深夜",
noon:"正午",
morning:"朝",
afternoon:"午後",
evening:"夜",
night:"深夜"
}
};
var formattingDayPeriodValues$34={
narrow:{
am:"午前",
pm:"午後",
midnight:"深夜",
noon:"正午",
morning:"朝",
afternoon:"午後",
evening:"夜",
night:"深夜"
},
abbreviated:{
am:"午前",
pm:"午後",
midnight:"深夜",
noon:"正午",
morning:"朝",
afternoon:"午後",
evening:"夜",
night:"深夜"
},
wide:{
am:"午前",
pm:"午後",
midnight:"深夜",
noon:"正午",
morning:"朝",
afternoon:"午後",
evening:"夜",
night:"深夜"
}
};
var ordinalNumber$42=function ordinalNumber$42(dirtyNumber,options){
var number=Number(dirtyNumber);
switch(String(options===null||options===void 0?void 0:options.unit)){
case"year":return"".concat(number,"\u5E74");
case"quarter":return"\u7B2C".concat(number,"\u56DB\u534A\u671F");
case"month":return"".concat(number,"\u6708");
case"week":return"\u7B2C".concat(number,"\u9031");
case"date":return"".concat(number,"\u65E5");
case"hour":return"".concat(number,"\u6642");
case"minute":return"".concat(number,"\u5206");
case"second":return"".concat(number,"\u79D2");
default:return"".concat(number);
}
};
//#endregion
//#region dist/date-fns/locale/ja.js
/**
* @category Locales
* @summary Japanese locale.
* @language Japanese
* @iso-639-2 jpn
* @author Thomas Eilmsteiner [@DeMuu](https://github.com/DeMuu)
* @author Yamagishi Kazutoshi [@ykzts](https://github.com/ykzts)
* @author Luca Ban [@mesqueeb](https://github.com/mesqueeb)
* @author Terrence Lam [@skyuplam](https://github.com/skyuplam)
* @author Taiki IKeda [@so99ynoodles](https://github.com/so99ynoodles)
*/
var _ja={
code:"ja",
formatDistance:formatDistance$42,
formatLong:formatLong$42,
formatRelative:formatRelative$42,
localize:{
ordinalNumber:ordinalNumber$42,
era:buildLocalizeFn({
values:eraValues$42,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$42,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return Number(quarter)-1;}
}),
month:buildLocalizeFn({
values:monthValues$42,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$42,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$42,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$34,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^第?\d+(年|四半期|月|週|日|時|分|秒)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(B\.?C\.?|A\.?D\.?)/i,
abbreviated:/^(紀元[前後]|西暦)/i,
wide:/^(紀元[前後]|西暦)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[/^B/i,/^A/i],
any:[/^(紀元前)/i,/^(西暦|紀元後)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^Q[1234]/i,
wide:/^第[1234一二三四１２３４]四半期/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|一|１)/i,
/(2|二|２)/i,
/(3|三|３)/i,
/(4|四|４)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^([123456789]|1[012])/,
abbreviated:/^([123456789]|1[012])月/i,
wide:/^([123456789]|1[012])月/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^1\D/,
/^2/,
/^3/,
/^4/,
/^5/,
/^6/,
/^7/,
/^8/,
/^9/,
/^10/,
/^11/,
/^12/]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[日月火水木金土]/,
short:/^[日月火水木金土]/,
abbreviated:/^[日月火水木金土]/,
wide:/^[日月火水木金土]曜日/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^日/,
/^月/,
/^火/,
/^水/,
/^木/,
/^金/,
/^土/]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(AM|PM|午前|午後|正午|深夜|真夜中|夜|朝)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^(A|午前)/i,
pm:/^(P|午後)/i,
midnight:/^深夜|真夜中/i,
noon:/^正午/i,
morning:/^朝/i,
afternoon:/^午後/i,
evening:/^夜/i,
night:/^深夜/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ja-Hira/_lib/formatDistance.js
var formatDistanceLocale$41={
lessThanXSeconds:{
one:"1びょうみまん",
other:"{{count}}びょうみまん",
oneWithSuffix:"やく1びょう",
otherWithSuffix:"やく{{count}}びょう"
},
xSeconds:{
one:"1びょう",
other:"{{count}}びょう"
},
halfAMinute:"30びょう",
lessThanXMinutes:{
one:"1ぷんみまん",
other:"{{count}}ふんみまん",
oneWithSuffix:"やく1ぷん",
otherWithSuffix:"やく{{count}}ふん"
},
xMinutes:{
one:"1ぷん",
other:"{{count}}ふん"
},
aboutXHours:{
one:"やく1じかん",
other:"やく{{count}}じかん"
},
xHours:{
one:"1じかん",
other:"{{count}}じかん"
},
xDays:{
one:"1にち",
other:"{{count}}にち"
},
aboutXWeeks:{
one:"やく1しゅうかん",
other:"やく{{count}}しゅうかん"
},
xWeeks:{
one:"1しゅうかん",
other:"{{count}}しゅうかん"
},
aboutXMonths:{
one:"やく1かげつ",
other:"やく{{count}}かげつ"
},
xMonths:{
one:"1かげつ",
other:"{{count}}かげつ"
},
aboutXYears:{
one:"やく1ねん",
other:"やく{{count}}ねん"
},
xYears:{
one:"1ねん",
other:"{{count}}ねん"
},
overXYears:{
one:"1ねんいじょう",
other:"{{count}}ねんいじょう"
},
almostXYears:{
one:"1ねんちかく",
other:"{{count}}ねんちかく"
}
};
var formatDistance$41=function formatDistance$41(token,count,options){
options=options||{};
var result;
var tokenValue=formatDistanceLocale$41[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1){if(options.addSuffix&&tokenValue.oneWithSuffix)result=tokenValue.oneWithSuffix;else
result=tokenValue.one;}else
if(options.addSuffix&&tokenValue.otherWithSuffix)result=tokenValue.otherWithSuffix.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options.addSuffix)if(options.comparison&&options.comparison>0)return result+"あと";else
return result+"まえ";
return result;
};
var formatLong$41={
date:buildFormatLongFn({
formats:{
full:"yねんMがつdにちEEEE",
long:"yねんMがつdにち",
medium:"y/MM/dd",
short:"y/MM/dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"Hじmmふんssびょう zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ja-Hira/_lib/formatRelative.js
var formatRelativeLocale$41={
lastWeek:"せんしゅうのeeeeのp",
yesterday:"きのうのp",
today:"きょうのp",
tomorrow:"あしたのp",
nextWeek:"よくしゅうのeeeeのp",
other:"P"
};
var formatRelative$41=function formatRelative$41(token,_date,_baseDate,_options){
return formatRelativeLocale$41[token];
};
//#endregion
//#region dist/date-fns/locale/ja-Hira/_lib/localize.js
var eraValues$41={
narrow:["BC","AC"],
abbreviated:["きげんぜん","せいれき"],
wide:["きげんぜん","せいれき"]
};
var quarterValues$41={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"だい1しはんき",
"だい2しはんき",
"だい3しはんき",
"だい4しはんき"]

};
var monthValues$41={
narrow:[
"1",
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"10",
"11",
"12"],

abbreviated:[
"1がつ",
"2がつ",
"3がつ",
"4がつ",
"5がつ",
"6がつ",
"7がつ",
"8がつ",
"9がつ",
"10がつ",
"11がつ",
"12がつ"],

wide:[
"1がつ",
"2がつ",
"3がつ",
"4がつ",
"5がつ",
"6がつ",
"7がつ",
"8がつ",
"9がつ",
"10がつ",
"11がつ",
"12がつ"]

};
var dayValues$41={
narrow:[
"にち",
"げつ",
"か",
"すい",
"もく",
"きん",
"ど"],

short:[
"にち",
"げつ",
"か",
"すい",
"もく",
"きん",
"ど"],

abbreviated:[
"にち",
"げつ",
"か",
"すい",
"もく",
"きん",
"ど"],

wide:[
"にちようび",
"げつようび",
"かようび",
"すいようび",
"もくようび",
"きんようび",
"どようび"]

};
var dayPeriodValues$41={
narrow:{
am:"ごぜん",
pm:"ごご",
midnight:"しんや",
noon:"しょうご",
morning:"あさ",
afternoon:"ごご",
evening:"よる",
night:"しんや"
},
abbreviated:{
am:"ごぜん",
pm:"ごご",
midnight:"しんや",
noon:"しょうご",
morning:"あさ",
afternoon:"ごご",
evening:"よる",
night:"しんや"
},
wide:{
am:"ごぜん",
pm:"ごご",
midnight:"しんや",
noon:"しょうご",
morning:"あさ",
afternoon:"ごご",
evening:"よる",
night:"しんや"
}
};
var formattingDayPeriodValues$33={
narrow:{
am:"ごぜん",
pm:"ごご",
midnight:"しんや",
noon:"しょうご",
morning:"あさ",
afternoon:"ごご",
evening:"よる",
night:"しんや"
},
abbreviated:{
am:"ごぜん",
pm:"ごご",
midnight:"しんや",
noon:"しょうご",
morning:"あさ",
afternoon:"ごご",
evening:"よる",
night:"しんや"
},
wide:{
am:"ごぜん",
pm:"ごご",
midnight:"しんや",
noon:"しょうご",
morning:"あさ",
afternoon:"ごご",
evening:"よる",
night:"しんや"
}
};
var ordinalNumber$41=function ordinalNumber$41(dirtyNumber,options){
var number=Number(dirtyNumber);
switch(String(options===null||options===void 0?void 0:options.unit)){
case"year":return"".concat(number,"\u306D\u3093");
case"quarter":return"\u3060\u3044".concat(number,"\u3057\u306F\u3093\u304D");
case"month":return"".concat(number,"\u304C\u3064");
case"week":return"\u3060\u3044".concat(number,"\u3057\u3085\u3046");
case"date":return"".concat(number,"\u306B\u3061");
case"hour":return"".concat(number,"\u3058");
case"minute":return"".concat(number,"\u3075\u3093");
case"second":return"".concat(number,"\u3073\u3087\u3046");
default:return"".concat(number);
}
};
//#endregion
//#region dist/date-fns/locale/ja-Hira.js
/**
* @category Locales
* @summary Japanese (Hiragana) locale.
* @language Japanese (Hiragana)
* @iso-639-2 jpn
* @author Eri Hiramatsu [@Eritutteo](https://github.com/Eritutteo)
*/
var _jaHira={
code:"ja-Hira",
formatDistance:formatDistance$41,
formatLong:formatLong$41,
formatRelative:formatRelative$41,
localize:{
ordinalNumber:ordinalNumber$41,
era:buildLocalizeFn({
values:eraValues$41,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$41,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return Number(quarter)-1;}
}),
month:buildLocalizeFn({
values:monthValues$41,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$41,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$41,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$33,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^だ?い?\d+(ねん|しはんき|がつ|しゅう|にち|じ|ふん|びょう)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(B\.?C\.?|A\.?D\.?)/i,
abbreviated:/^(きげん[前後]|せいれき)/i,
wide:/^(きげん[前後]|せいれき)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[/^B/i,/^A/i],
any:[/^(きげんぜん)/i,/^(せいれき|きげんご)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^Q[1234]/i,
wide:/^だい[1234一二三四１２３４]しはんき/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|一|１)/i,
/(2|二|２)/i,
/(3|三|３)/i,
/(4|四|４)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^([123456789]|1[012])/,
abbreviated:/^([123456789]|1[012])がつ/i,
wide:/^([123456789]|1[012])がつ/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^1\D/,
/^2/,
/^3/,
/^4/,
/^5/,
/^6/,
/^7/,
/^8/,
/^9/,
/^10/,
/^11/,
/^12/]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(にち|げつ|か|すい|もく|きん|ど)/,
short:/^(にち|げつ|か|すい|もく|きん|ど)/,
abbreviated:/^(にち|げつ|か|すい|もく|きん|ど)/,
wide:/^(にち|げつ|か|すい|もく|きん|ど)ようび/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^にち/,
/^げつ/,
/^か/,
/^すい/,
/^もく/,
/^きん/,
/^ど/]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(AM|PM|ごぜん|ごご|しょうご|しんや|まよなか|よる|あさ)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^(A|ごぜん)/i,
pm:/^(P|ごご)/i,
midnight:/^しんや|まよなか/i,
noon:/^しょうご/i,
morning:/^あさ/i,
afternoon:/^ごご/i,
evening:/^よる/i,
night:/^しんや/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ka/_lib/formatDistance.js
var formatDistanceLocale$40={
lessThanXSeconds:{
past:"{{count}} წამზე ნაკლები ხნის წინ",
present:"{{count}} წამზე ნაკლები",
future:"{{count}} წამზე ნაკლებში"
},
xSeconds:{
past:"{{count}} წამის წინ",
present:"{{count}} წამი",
future:"{{count}} წამში"
},
halfAMinute:{
past:"ნახევარი წუთის წინ",
present:"ნახევარი წუთი",
future:"ნახევარი წუთში"
},
lessThanXMinutes:{
past:"{{count}} წუთზე ნაკლები ხნის წინ",
present:"{{count}} წუთზე ნაკლები",
future:"{{count}} წუთზე ნაკლებში"
},
xMinutes:{
past:"{{count}} წუთის წინ",
present:"{{count}} წუთი",
future:"{{count}} წუთში"
},
aboutXHours:{
past:"დაახლოებით {{count}} საათის წინ",
present:"დაახლოებით {{count}} საათი",
future:"დაახლოებით {{count}} საათში"
},
xHours:{
past:"{{count}} საათის წინ",
present:"{{count}} საათი",
future:"{{count}} საათში"
},
xDays:{
past:"{{count}} დღის წინ",
present:"{{count}} დღე",
future:"{{count}} დღეში"
},
aboutXWeeks:{
past:"დაახლოებით {{count}} კვირას წინ",
present:"დაახლოებით {{count}} კვირა",
future:"დაახლოებით {{count}} კვირაში"
},
xWeeks:{
past:"{{count}} კვირას კვირა",
present:"{{count}} კვირა",
future:"{{count}} კვირაში"
},
aboutXMonths:{
past:"დაახლოებით {{count}} თვის წინ",
present:"დაახლოებით {{count}} თვე",
future:"დაახლოებით {{count}} თვეში"
},
xMonths:{
past:"{{count}} თვის წინ",
present:"{{count}} თვე",
future:"{{count}} თვეში"
},
aboutXYears:{
past:"დაახლოებით {{count}} წლის წინ",
present:"დაახლოებით {{count}} წელი",
future:"დაახლოებით {{count}} წელში"
},
xYears:{
past:"{{count}} წლის წინ",
present:"{{count}} წელი",
future:"{{count}} წელში"
},
overXYears:{
past:"{{count}} წელზე მეტი ხნის წინ",
present:"{{count}} წელზე მეტი",
future:"{{count}} წელზე მეტი ხნის შემდეგ"
},
almostXYears:{
past:"თითქმის {{count}} წლის წინ",
present:"თითქმის {{count}} წელი",
future:"თითქმის {{count}} წელში"
}
};
var formatDistance$40=function formatDistance$40(token,count,options){
var result;
var tokenValue=formatDistanceLocale$40[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(options!==null&&options!==void 0&&options.addSuffix&&options.comparison&&options.comparison>0)result=tokenValue.future.replace("{{count}}",String(count));else
if(options!==null&&options!==void 0&&options.addSuffix)result=tokenValue.past.replace("{{count}}",String(count));else
result=tokenValue.present.replace("{{count}}",String(count));
return result;
};
var formatLong$40={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM, y",
long:"do, MMMM, y",
medium:"d, MMM, y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}'-ზე'",
long:"{{date}} {{time}}'-ზე'",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ka/_lib/formatRelative.js
var formatRelativeLocale$40={
lastWeek:"'წინა' eeee p'-ზე'",
yesterday:"'გუშინ' p'-ზე'",
today:"'დღეს' p'-ზე'",
tomorrow:"'ხვალ' p'-ზე'",
nextWeek:"'შემდეგი' eeee p'-ზე'",
other:"P"
};
var formatRelative$40=function formatRelative$40(token,_date,_baseDate,_options){return formatRelativeLocale$40[token];};
//#endregion
//#region dist/date-fns/locale/ka/_lib/localize.js
var eraValues$40={
narrow:["ჩ.წ-მდე","ჩ.წ"],
abbreviated:["ჩვ.წ-მდე","ჩვ.წ"],
wide:["ჩვენს წელთაღრიცხვამდე","ჩვენი წელთაღრიცხვით"]
};
var quarterValues$40={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-ლი კვ",
"2-ე კვ",
"3-ე კვ",
"4-ე კვ"],

wide:[
"1-ლი კვარტალი",
"2-ე კვარტალი",
"3-ე კვარტალი",
"4-ე კვარტალი"]

};
var monthValues$40={
narrow:[
"ია",
"თე",
"მა",
"აპ",
"მს",
"ვნ",
"ვლ",
"აგ",
"სე",
"ოქ",
"ნო",
"დე"],

abbreviated:[
"იან",
"თებ",
"მარ",
"აპრ",
"მაი",
"ივნ",
"ივლ",
"აგვ",
"სექ",
"ოქტ",
"ნოე",
"დეკ"],

wide:[
"იანვარი",
"თებერვალი",
"მარტი",
"აპრილი",
"მაისი",
"ივნისი",
"ივლისი",
"აგვისტო",
"სექტემბერი",
"ოქტომბერი",
"ნოემბერი",
"დეკემბერი"]

};
var dayValues$40={
narrow:[
"კვ",
"ორ",
"სა",
"ოთ",
"ხუ",
"პა",
"შა"],

short:[
"კვი",
"ორშ",
"სამ",
"ოთხ",
"ხუთ",
"პარ",
"შაბ"],

abbreviated:[
"კვი",
"ორშ",
"სამ",
"ოთხ",
"ხუთ",
"პარ",
"შაბ"],

wide:[
"კვირა",
"ორშაბათი",
"სამშაბათი",
"ოთხშაბათი",
"ხუთშაბათი",
"პარასკევი",
"შაბათი"]

};
var dayPeriodValues$40={
narrow:{
am:"a",
pm:"p",
midnight:"შუაღამე",
noon:"შუადღე",
morning:"დილა",
afternoon:"საღამო",
evening:"საღამო",
night:"ღამე"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"შუაღამე",
noon:"შუადღე",
morning:"დილა",
afternoon:"საღამო",
evening:"საღამო",
night:"ღამე"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"შუაღამე",
noon:"შუადღე",
morning:"დილა",
afternoon:"საღამო",
evening:"საღამო",
night:"ღამე"
}
};
var formattingDayPeriodValues$32={
narrow:{
am:"a",
pm:"p",
midnight:"შუაღამით",
noon:"შუადღისას",
morning:"დილით",
afternoon:"ნაშუადღევს",
evening:"საღამოს",
night:"ღამით"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"შუაღამით",
noon:"შუადღისას",
morning:"დილით",
afternoon:"ნაშუადღევს",
evening:"საღამოს",
night:"ღამით"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"შუაღამით",
noon:"შუადღისას",
morning:"დილით",
afternoon:"ნაშუადღევს",
evening:"საღამოს",
night:"ღამით"
}
};
var ordinalNumber$40=function ordinalNumber$40(dirtyNumber){
var number=Number(dirtyNumber);
if(number===1)return number+"-ლი";
return number+"-ე";
};
//#endregion
//#region dist/date-fns/locale/ka.js
/**
* @category Locales
* @summary Georgian locale.
* @language Georgian
* @iso-639-2 geo
* @author Lado Lomidze [@Landish](https://github.com/Landish)
* @author Nick Shvelidze [@shvelo](https://github.com/shvelo)
*/
var _ka={
code:"ka",
formatDistance:formatDistance$40,
formatLong:formatLong$40,
formatRelative:formatRelative$40,
localize:{
ordinalNumber:ordinalNumber$40,
era:buildLocalizeFn({
values:eraValues$40,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$40,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$40,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$40,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$40,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$32,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-ლი|-ე)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ჩვ?\.წ)/i,
abbreviated:/^(ჩვ?\.წ)/i,
wide:/^(ჩვენს წელთაღრიცხვამდე|ქრისტეშობამდე|ჩვენი წელთაღრიცხვით|ქრისტეშობიდან)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(ჩვენს წელთაღრიცხვამდე|ქრისტეშობამდე)/i,/^(ჩვენი წელთაღრიცხვით|ქრისტეშობიდან)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]-(ლი|ე)? კვ/i,
wide:/^[1234]-(ლი|ე)? კვარტალი/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{any:/^(ია|თე|მა|აპ|მს|ვნ|ვლ|აგ|სე|ოქ|ნო|დე)/i},
defaultMatchWidth:"any",
parsePatterns:{any:[
/^ია/i,
/^თ/i,
/^მარ/i,
/^აპ/i,
/^მაი/i,
/^ი?ვნ/i,
/^ი?ვლ/i,
/^აგ/i,
/^ს/i,
/^ო/i,
/^ნ/i,
/^დ/i]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(კვ|ორ|სა|ოთ|ხუ|პა|შა)/i,
short:/^(კვი|ორშ|სამ|ოთხ|ხუთ|პარ|შაბ)/i,
wide:/^(კვირა|ორშაბათი|სამშაბათი|ოთხშაბათი|ხუთშაბათი|პარასკევი|შაბათი)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^კვ/i,
/^ორ/i,
/^სა/i,
/^ოთ/i,
/^ხუ/i,
/^პა/i,
/^შა/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^([ap]\.?\s?m\.?|შუაღ|დილ)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^შუაღ/i,
noon:/^შუადღ/i,
morning:/^დილ/i,
afternoon:/ნაშუადღევს/i,
evening:/საღამო/i,
night:/ღამ/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/kk/_lib/formatDistance.js
var formatDistanceLocale$39={
lessThanXSeconds:{
regular:{
one:"1 секундтан аз",
singularNominative:"{{count}} секундтан аз",
singularGenitive:"{{count}} секундтан аз",
pluralGenitive:"{{count}} секундтан аз"
},
future:{
one:"бір секундтан кейін",
singularNominative:"{{count}} секундтан кейін",
singularGenitive:"{{count}} секундтан кейін",
pluralGenitive:"{{count}} секундтан кейін"
}
},
xSeconds:{
regular:{
singularNominative:"{{count}} секунд",
singularGenitive:"{{count}} секунд",
pluralGenitive:"{{count}} секунд"
},
past:{
singularNominative:"{{count}} секунд бұрын",
singularGenitive:"{{count}} секунд бұрын",
pluralGenitive:"{{count}} секунд бұрын"
},
future:{
singularNominative:"{{count}} секундтан кейін",
singularGenitive:"{{count}} секундтан кейін",
pluralGenitive:"{{count}} секундтан кейін"
}
},
halfAMinute:function halfAMinute(options){
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"жарты минут ішінде";else
return"жарты минут бұрын";
return"жарты минут";
},
lessThanXMinutes:{
regular:{
one:"1 минуттан аз",
singularNominative:"{{count}} минуттан аз",
singularGenitive:"{{count}} минуттан аз",
pluralGenitive:"{{count}} минуттан аз"
},
future:{
one:"минуттан кем ",
singularNominative:"{{count}} минуттан кем",
singularGenitive:"{{count}} минуттан кем",
pluralGenitive:"{{count}} минуттан кем"
}
},
xMinutes:{
regular:{
singularNominative:"{{count}} минут",
singularGenitive:"{{count}} минут",
pluralGenitive:"{{count}} минут"
},
past:{
singularNominative:"{{count}} минут бұрын",
singularGenitive:"{{count}} минут бұрын",
pluralGenitive:"{{count}} минут бұрын"
},
future:{
singularNominative:"{{count}} минуттан кейін",
singularGenitive:"{{count}} минуттан кейін",
pluralGenitive:"{{count}} минуттан кейін"
}
},
aboutXHours:{
regular:{
singularNominative:"шамамен {{count}} сағат",
singularGenitive:"шамамен {{count}} сағат",
pluralGenitive:"шамамен {{count}} сағат"
},
future:{
singularNominative:"шамамен {{count}} сағаттан кейін",
singularGenitive:"шамамен {{count}} сағаттан кейін",
pluralGenitive:"шамамен {{count}} сағаттан кейін"
}
},
xHours:{regular:{
singularNominative:"{{count}} сағат",
singularGenitive:"{{count}} сағат",
pluralGenitive:"{{count}} сағат"
}},
xDays:{
regular:{
singularNominative:"{{count}} күн",
singularGenitive:"{{count}} күн",
pluralGenitive:"{{count}} күн"
},
future:{
singularNominative:"{{count}} күннен кейін",
singularGenitive:"{{count}} күннен кейін",
pluralGenitive:"{{count}} күннен кейін"
}
},
aboutXWeeks:{
type:"weeks",
one:"шамамен 1 апта",
other:"шамамен {{count}} апта"
},
xWeeks:{
type:"weeks",
one:"1 апта",
other:"{{count}} апта"
},
aboutXMonths:{
regular:{
singularNominative:"шамамен {{count}} ай",
singularGenitive:"шамамен {{count}} ай",
pluralGenitive:"шамамен {{count}} ай"
},
future:{
singularNominative:"шамамен {{count}} айдан кейін",
singularGenitive:"шамамен {{count}} айдан кейін",
pluralGenitive:"шамамен {{count}} айдан кейін"
}
},
xMonths:{regular:{
singularNominative:"{{count}} ай",
singularGenitive:"{{count}} ай",
pluralGenitive:"{{count}} ай"
}},
aboutXYears:{
regular:{
singularNominative:"шамамен {{count}} жыл",
singularGenitive:"шамамен {{count}} жыл",
pluralGenitive:"шамамен {{count}} жыл"
},
future:{
singularNominative:"шамамен {{count}} жылдан кейін",
singularGenitive:"шамамен {{count}} жылдан кейін",
pluralGenitive:"шамамен {{count}} жылдан кейін"
}
},
xYears:{
regular:{
singularNominative:"{{count}} жыл",
singularGenitive:"{{count}} жыл",
pluralGenitive:"{{count}} жыл"
},
future:{
singularNominative:"{{count}} жылдан кейін",
singularGenitive:"{{count}} жылдан кейін",
pluralGenitive:"{{count}} жылдан кейін"
}
},
overXYears:{
regular:{
singularNominative:"{{count}} жылдан астам",
singularGenitive:"{{count}} жылдан астам",
pluralGenitive:"{{count}} жылдан астам"
},
future:{
singularNominative:"{{count}} жылдан астам",
singularGenitive:"{{count}} жылдан астам",
pluralGenitive:"{{count}} жылдан астам"
}
},
almostXYears:{
regular:{
singularNominative:"{{count}} жылға жақын",
singularGenitive:"{{count}} жылға жақын",
pluralGenitive:"{{count}} жылға жақын"
},
future:{
singularNominative:"{{count}} жылдан кейін",
singularGenitive:"{{count}} жылдан кейін",
pluralGenitive:"{{count}} жылдан кейін"
}
}
};
function declension$4(scheme,count){
if(scheme.one&&count===1)return scheme.one;
var rem10=count%10;
var rem100=count%100;
if(rem10===1&&rem100!==11)return scheme.singularNominative.replace("{{count}}",String(count));else
if(rem10>=2&&rem10<=4&&(rem100<10||rem100>20))return scheme.singularGenitive.replace("{{count}}",String(count));else
return scheme.pluralGenitive.replace("{{count}}",String(count));
}
var formatDistance$39=function formatDistance$39(token,count,options){
var tokenValue=formatDistanceLocale$39[token];
if(typeof tokenValue==="function")return tokenValue(options);
if(tokenValue.type==="weeks")return count===1?tokenValue.one:tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix){if(options.comparison&&options.comparison>0){if(tokenValue.future)return declension$4(tokenValue.future,count);else
return declension$4(tokenValue.regular,count)+" кейін";}else
if(tokenValue.past)return declension$4(tokenValue.past,count);else
return declension$4(tokenValue.regular,count)+" бұрын";}else
return declension$4(tokenValue.regular,count);
};
var formatLong$39={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y 'ж.'",
long:"do MMMM y 'ж.'",
medium:"d MMM y 'ж.'",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}}, {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/kk/_lib/formatRelative.js
var accusativeWeekdays$3=[
"жексенбіде",
"дүйсенбіде",
"сейсенбіде",
"сәрсенбіде",
"бейсенбіде",
"жұмада",
"сенбіде"];

function lastWeek$4(day){
return"'өткен "+accusativeWeekdays$3[day]+" сағат' p'-де'";
}
function thisWeek$4(day){
return"'"+accusativeWeekdays$3[day]+" сағат' p'-де'";
}
function nextWeek$4(day){
return"'келесі "+accusativeWeekdays$3[day]+" сағат' p'-де'";
}
var formatRelativeLocale$39={
lastWeek:function lastWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$4(day);else
return lastWeek$4(day);
},
yesterday:"'кеше сағат' p'-де'",
today:"'бүгін сағат' p'-де'",
tomorrow:"'ертең сағат' p'-де'",
nextWeek:function nextWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$4(day);else
return nextWeek$4(day);
},
other:"P"
};
var formatRelative$39=function formatRelative$39(token,date,baseDate,options){
var format=formatRelativeLocale$39[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/kk/_lib/localize.js
var eraValues$39={
narrow:["б.з.д.","б.з."],
abbreviated:["б.з.д.","б.з."],
wide:["біздің заманымызға дейін","біздің заманымыз"]
};
var quarterValues$39={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-ші тоқ.",
"2-ші тоқ.",
"3-ші тоқ.",
"4-ші тоқ."],

wide:[
"1-ші тоқсан",
"2-ші тоқсан",
"3-ші тоқсан",
"4-ші тоқсан"]

};
var monthValues$39={
narrow:[
"Қ",
"А",
"Н",
"С",
"М",
"М",
"Ш",
"Т",
"Қ",
"Қ",
"Қ",
"Ж"],

abbreviated:[
"қаң",
"ақп",
"нау",
"сәу",
"мам",
"мау",
"шіл",
"там",
"қыр",
"қаз",
"қар",
"жел"],

wide:[
"қаңтар",
"ақпан",
"наурыз",
"сәуір",
"мамыр",
"маусым",
"шілде",
"тамыз",
"қыркүйек",
"қазан",
"қараша",
"желтоқсан"]

};
var formattingMonthValues$9={
narrow:[
"Қ",
"А",
"Н",
"С",
"М",
"М",
"Ш",
"Т",
"Қ",
"Қ",
"Қ",
"Ж"],

abbreviated:[
"қаң",
"ақп",
"нау",
"сәу",
"мам",
"мау",
"шіл",
"там",
"қыр",
"қаз",
"қар",
"жел"],

wide:[
"қаңтар",
"ақпан",
"наурыз",
"сәуір",
"мамыр",
"маусым",
"шілде",
"тамыз",
"қыркүйек",
"қазан",
"қараша",
"желтоқсан"]

};
var dayValues$39={
narrow:[
"Ж",
"Д",
"С",
"С",
"Б",
"Ж",
"С"],

short:[
"жс",
"дс",
"сс",
"ср",
"бс",
"жм",
"сб"],

abbreviated:[
"жс",
"дс",
"сс",
"ср",
"бс",
"жм",
"сб"],

wide:[
"жексенбі",
"дүйсенбі",
"сейсенбі",
"сәрсенбі",
"бейсенбі",
"жұма",
"сенбі"]

};
var dayPeriodValues$39={
narrow:{
am:"ТД",
pm:"ТК",
midnight:"түн ортасы",
noon:"түс",
morning:"таң",
afternoon:"күндіз",
evening:"кеш",
night:"түн"
},
wide:{
am:"ТД",
pm:"ТК",
midnight:"түн ортасы",
noon:"түс",
morning:"таң",
afternoon:"күндіз",
evening:"кеш",
night:"түн"
}
};
var formattingDayPeriodValues$31={
narrow:{
am:"ТД",
pm:"ТК",
midnight:"түн ортасында",
noon:"түс",
morning:"таң",
afternoon:"күн",
evening:"кеш",
night:"түн"
},
wide:{
am:"ТД",
pm:"ТК",
midnight:"түн ортасында",
noon:"түсте",
morning:"таңертең",
afternoon:"күндіз",
evening:"кеште",
night:"түнде"
}
};
var suffixes={
0:"-ші",
1:"-ші",
2:"-ші",
3:"-ші",
4:"-ші",
5:"-ші",
6:"-шы",
7:"-ші",
8:"-ші",
9:"-шы",
10:"-шы",
20:"-шы",
30:"-шы",
40:"-шы",
50:"-ші",
60:"-шы",
70:"-ші",
80:"-ші",
90:"-шы",
100:"-ші"
};
var ordinalNumber$39=function ordinalNumber$39(dirtyNumber,_options){
var number=Number(dirtyNumber);
var mod10=number%10;
var b=number>=100?100:null;
return number+(suffixes[number]||suffixes[mod10]||b&&suffixes[b]||"");
};
//#endregion
//#region dist/date-fns/locale/kk.js
/**
* @category Locales
* @summary Kazakh locale.
* @language Kazakh
* @iso-639-2 kaz
* @author Nikita Bayev [@drugoi](https://github.com/drugoi)
*/
var _kk={
code:"kk",
formatDistance:formatDistance$39,
formatLong:formatLong$39,
formatRelative:formatRelative$39,
localize:{
ordinalNumber:ordinalNumber$39,
era:buildLocalizeFn({
values:eraValues$39,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$39,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$39,
defaultWidth:"wide",
formattingValues:formattingMonthValues$9,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$39,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$39,
defaultWidth:"any",
formattingValues:formattingDayPeriodValues$31,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?(ші|шы))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((б )?з\.?\s?д\.?)/i,
abbreviated:/^((б )?з\.?\s?д\.?)/i,
wide:/^(біздің заманымызға дейін|біздің заманымыз|біздің заманымыздан)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^б/i,/^з/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?ші)? тоқ.?/i,
wide:/^[1234](-?ші)? тоқсан/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(қ|а|н|с|м|мау|ш|т|қыр|қаз|қар|ж)/i,
abbreviated:/^(қаң|ақп|нау|сәу|мам|мау|шіл|там|қыр|қаз|қар|жел)/i,
wide:/^(қаңтар|ақпан|наурыз|сәуір|мамыр|маусым|шілде|тамыз|қыркүйек|қазан|қараша|желтоқсан)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^қ/i,
/^а/i,
/^н/i,
/^с/i,
/^м/i,
/^м/i,
/^ш/i,
/^т/i,
/^қ/i,
/^қ/i,
/^қ/i,
/^ж/i],

abbreviated:[
/^қаң/i,
/^ақп/i,
/^нау/i,
/^сәу/i,
/^мам/i,
/^мау/i,
/^шіл/i,
/^там/i,
/^қыр/i,
/^қаз/i,
/^қар/i,
/^жел/i],

any:[
/^қ/i,
/^а/i,
/^н/i,
/^с/i,
/^м/i,
/^м/i,
/^ш/i,
/^т/i,
/^қ/i,
/^қ/i,
/^қ/i,
/^ж/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ж|д|с|с|б|ж|с)/i,
short:/^(жс|дс|сс|ср|бс|жм|сб)/i,
wide:/^(жексенбі|дүйсенбі|сейсенбі|сәрсенбі|бейсенбі|жұма|сенбі)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ж/i,
/^д/i,
/^с/i,
/^с/i,
/^б/i,
/^ж/i,
/^с/i],

short:[
/^жс/i,
/^дс/i,
/^сс/i,
/^ср/i,
/^бс/i,
/^жм/i,
/^сб/i],

any:[
/^ж[ек]/i,
/^д[үй]/i,
/^сe[й]/i,
/^сә[р]/i,
/^б[ей]/i,
/^ж[ұм]/i,
/^се[н]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i,
wide:/^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i,
any:/^Т\.?\s?[ДК]\.?|түн ортасында|((түсте|таңертең|таңда|таңертең|таңмен|таң|күндіз|күн|кеште|кеш|түнде|түн)\.?)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^ТД/i,
pm:/^ТК/i,
midnight:/^түн орта/i,
noon:/^күндіз/i,
morning:/таң/i,
afternoon:/түс/i,
evening:/кеш/i,
night:/түн/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/km/_lib/formatDistance.js
var formatDistanceLocale$38={
lessThanXSeconds:"តិចជាង {{count}} វិនាទី",
xSeconds:"{{count}} វិនាទី",
halfAMinute:"កន្លះនាទី",
lessThanXMinutes:"តិចជាង {{count}} នាទី",
xMinutes:"{{count}} នាទី",
aboutXHours:"ប្រហែល {{count}} ម៉ោង",
xHours:"{{count}} ម៉ោង",
xDays:"{{count}} ថ្ងៃ",
aboutXWeeks:"ប្រហែល {{count}} សប្តាហ៍",
xWeeks:"{{count}} សប្តាហ៍",
aboutXMonths:"ប្រហែល {{count}} ខែ",
xMonths:"{{count}} ខែ",
aboutXYears:"ប្រហែល {{count}} ឆ្នាំ",
xYears:"{{count}} ឆ្នាំ",
overXYears:"ជាង {{count}} ឆ្នាំ",
almostXYears:"ជិត {{count}} ឆ្នាំ"
};
var formatDistance$38=function formatDistance$38(token,count,options){
var result=formatDistanceLocale$38[token];
if(typeof count==="number")result=result.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"ក្នុងរយៈពេល "+result;else
return result+"មុន";
return result;
};
var formatLong$38={
date:buildFormatLongFn({
formats:{
full:"EEEE do MMMM y",
long:"do MMMM y",
medium:"d MMM y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a",
long:"h:mm:ss a",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'ម៉ោង' {{time}}",
long:"{{date}} 'ម៉ោង' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/km/_lib/formatRelative.js
var formatRelativeLocale$38={
lastWeek:"'ថ្ងៃ'eeee'ស​ប្តា​ហ៍​មុនម៉ោង' p",
yesterday:"'ម្សិលមិញនៅម៉ោង' p",
today:"'ថ្ងៃនេះម៉ោង' p",
tomorrow:"'ថ្ងៃស្អែកម៉ោង' p",
nextWeek:"'ថ្ងៃ'eeee'ស​ប្តា​ហ៍​ក្រោយម៉ោង' p",
other:"P"
};
var formatRelative$38=function formatRelative$38(token,_date,_baseDate,_options){return formatRelativeLocale$38[token];};
//#endregion
//#region dist/date-fns/locale/km/_lib/localize.js
var eraValues$38={
narrow:["ម.គស","គស"],
abbreviated:["មុនគ.ស","គ.ស"],
wide:["មុនគ្រិស្តសករាជ","នៃគ្រិស្តសករាជ"]
};
var quarterValues$38={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"ត្រីមាសទី 1",
"ត្រីមាសទី 2",
"ត្រីមាសទី 3",
"ត្រីមាសទី 4"]

};
var monthValues$38={
narrow:[
"ម.ក",
"ក.ម",
"មិ",
"ម.ស",
"ឧ.ស",
"ម.ថ",
"ក.ដ",
"សី",
"កញ",
"តុ",
"វិ",
"ធ"],

abbreviated:[
"មករា",
"កុម្ភៈ",
"មីនា",
"មេសា",
"ឧសភា",
"មិថុនា",
"កក្កដា",
"សីហា",
"កញ្ញា",
"តុលា",
"វិច្ឆិកា",
"ធ្នូ"],

wide:[
"មករា",
"កុម្ភៈ",
"មីនា",
"មេសា",
"ឧសភា",
"មិថុនា",
"កក្កដា",
"សីហា",
"កញ្ញា",
"តុលា",
"វិច្ឆិកា",
"ធ្នូ"]

};
var dayValues$38={
narrow:[
"អា",
"ច",
"អ",
"ព",
"ព្រ",
"សុ",
"ស"],

short:[
"អា",
"ច",
"អ",
"ព",
"ព្រ",
"សុ",
"ស"],

abbreviated:[
"អា",
"ច",
"អ",
"ព",
"ព្រ",
"សុ",
"ស"],

wide:[
"អាទិត្យ",
"ចន្ទ",
"អង្គារ",
"ពុធ",
"ព្រហស្បតិ៍",
"សុក្រ",
"សៅរ៍"]

};
var dayPeriodValues$38={
narrow:{
am:"ព្រឹក",
pm:"ល្ងាច",
midnight:"​ពេលកណ្ដាលអធ្រាត្រ",
noon:"ពេលថ្ងៃត្រង់",
morning:"ពេលព្រឹក",
afternoon:"ពេលរសៀល",
evening:"ពេលល្ងាច",
night:"ពេលយប់"
},
abbreviated:{
am:"ព្រឹក",
pm:"ល្ងាច",
midnight:"​ពេលកណ្ដាលអធ្រាត្រ",
noon:"ពេលថ្ងៃត្រង់",
morning:"ពេលព្រឹក",
afternoon:"ពេលរសៀល",
evening:"ពេលល្ងាច",
night:"ពេលយប់"
},
wide:{
am:"ព្រឹក",
pm:"ល្ងាច",
midnight:"​ពេលកណ្ដាលអធ្រាត្រ",
noon:"ពេលថ្ងៃត្រង់",
morning:"ពេលព្រឹក",
afternoon:"ពេលរសៀល",
evening:"ពេលល្ងាច",
night:"ពេលយប់"
}
};
var formattingDayPeriodValues$30={
narrow:{
am:"ព្រឹក",
pm:"ល្ងាច",
midnight:"​ពេលកណ្ដាលអធ្រាត្រ",
noon:"ពេលថ្ងៃត្រង់",
morning:"ពេលព្រឹក",
afternoon:"ពេលរសៀល",
evening:"ពេលល្ងាច",
night:"ពេលយប់"
},
abbreviated:{
am:"ព្រឹក",
pm:"ល្ងាច",
midnight:"​ពេលកណ្ដាលអធ្រាត្រ",
noon:"ពេលថ្ងៃត្រង់",
morning:"ពេលព្រឹក",
afternoon:"ពេលរសៀល",
evening:"ពេលល្ងាច",
night:"ពេលយប់"
},
wide:{
am:"ព្រឹក",
pm:"ល្ងាច",
midnight:"​ពេលកណ្ដាលអធ្រាត្រ",
noon:"ពេលថ្ងៃត្រង់",
morning:"ពេលព្រឹក",
afternoon:"ពេលរសៀល",
evening:"ពេលល្ងាច",
night:"ពេលយប់"
}
};
var ordinalNumber$38=function ordinalNumber$38(dirtyNumber,_){
return Number(dirtyNumber).toString();
};
//#endregion
//#region dist/date-fns/locale/km.js
/**
* @category Locales
* @summary Khmer locale (Cambodian).
* @language Khmer
* @iso-639-2 khm
* @author Seanghay Yath [@seanghay](https://github.com/seanghay)
*/
var _km={
code:"km",
formatDistance:formatDistance$38,
formatLong:formatLong$38,
formatRelative:formatRelative$38,
localize:{
ordinalNumber:ordinalNumber$38,
era:buildLocalizeFn({
values:eraValues$38,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$38,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$38,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$38,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$38,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$30,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ម\.)?គស/i,
abbreviated:/^(មុន)?គ\.ស/i,
wide:/^(មុន|នៃ)គ្រិស្តសករាជ/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(ម|មុន)គ\.?ស/i,/^(នៃ)?គ\.?ស/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^(ត្រីមាស)(ទី)?\s?[1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(ម\.ក|ក\.ម|មិ|ម\.ស|ឧ\.ស|ម\.ថ|ក\.ដ|សី|កញ|តុ|វិ|ធ)/i,
abbreviated:/^(មករា|កុម្ភៈ|មីនា|មេសា|ឧសភា|មិថុនា|កក្កដា|សីហា|កញ្ញា|តុលា|វិច្ឆិកា|ធ្នូ)/i,
wide:/^(មករា|កុម្ភៈ|មីនា|មេសា|ឧសភា|មិថុនា|កក្កដា|សីហា|កញ្ញា|តុលា|វិច្ឆិកា|ធ្នូ)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ម\.ក/i,
/^ក\.ម/i,
/^មិ/i,
/^ម\.ស/i,
/^ឧ\.ស/i,
/^ម\.ថ/i,
/^ក\.ដ/i,
/^សី/i,
/^កញ/i,
/^តុ/i,
/^វិ/i,
/^ធ/i],

any:[
/^មក/i,
/^កុ/i,
/^មីន/i,
/^មេ/i,
/^ឧស/i,
/^មិថ/i,
/^កក/i,
/^សី/i,
/^កញ/i,
/^តុ/i,
/^វិច/i,
/^ធ/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(អា|ច|អ|ព|ព្រ|សុ|ស)/i,
short:/^(អា|ច|អ|ព|ព្រ|សុ|ស)/i,
abbreviated:/^(អា|ច|អ|ព|ព្រ|សុ|ស)/i,
wide:/^(អាទិត្យ|ចន្ទ|អង្គារ|ពុធ|ព្រហស្បតិ៍|សុក្រ|សៅរ៍)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^អា/i,
/^ច/i,
/^អ/i,
/^ព/i,
/^ព្រ/i,
/^សុ/i,
/^ស/i],

any:[
/^អា/i,
/^ច/i,
/^អ/i,
/^ព/i,
/^ព្រ/i,
/^សុ/i,
/^សៅ/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ព្រឹក|ល្ងាច|ពេលព្រឹក|ពេលថ្ងៃត្រង់|ពេលល្ងាច|ពេលរសៀល|ពេលយប់|ពេលកណ្ដាលអធ្រាត្រ)/i,
any:/^(ព្រឹក|ល្ងាច|ពេលព្រឹក|ពេលថ្ងៃត្រង់|ពេលល្ងាច|ពេលរសៀល|ពេលយប់|ពេលកណ្ដាលអធ្រាត្រ)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ព្រឹក/i,
pm:/^ល្ងាច/i,
midnight:/^ពេលកណ្ដាលអធ្រាត្រ/i,
noon:/^ពេលថ្ងៃត្រង់/i,
morning:/ពេលព្រឹក/i,
afternoon:/ពេលរសៀល/i,
evening:/ពេលល្ងាច/i,
night:/ពេលយប់/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/kn/_lib/formatDistance.js
var formatDistanceLocale$37={
lessThanXSeconds:{
one:{
default:"1 ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
future:"1 ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
past:"1 ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ"
},
other:{
default:"{{count}} ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
future:"{{count}} ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ",
past:"{{count}} ಸೆಕೆಂಡ್‌ಗಿಂತ ಕಡಿಮೆ"
}
},
xSeconds:{
one:{
default:"1 ಸೆಕೆಂಡ್",
future:"1 ಸೆಕೆಂಡ್‌ನಲ್ಲಿ",
past:"1 ಸೆಕೆಂಡ್ ಹಿಂದೆ"
},
other:{
default:"{{count}} ಸೆಕೆಂಡುಗಳು",
future:"{{count}} ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ",
past:"{{count}} ಸೆಕೆಂಡ್ ಹಿಂದೆ"
}
},
halfAMinute:{other:{
default:"ಅರ್ಧ ನಿಮಿಷ",
future:"ಅರ್ಧ ನಿಮಿಷದಲ್ಲಿ",
past:"ಅರ್ಧ ನಿಮಿಷದ ಹಿಂದೆ"
}},
lessThanXMinutes:{
one:{
default:"1 ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
future:"1 ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
past:"1 ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ"
},
other:{
default:"{{count}} ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
future:"{{count}} ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ",
past:"{{count}} ನಿಮಿಷಕ್ಕಿಂತ ಕಡಿಮೆ"
}
},
xMinutes:{
one:{
default:"1 ನಿಮಿಷ",
future:"1 ನಿಮಿಷದಲ್ಲಿ",
past:"1 ನಿಮಿಷದ ಹಿಂದೆ"
},
other:{
default:"{{count}} ನಿಮಿಷಗಳು",
future:"{{count}} ನಿಮಿಷಗಳಲ್ಲಿ",
past:"{{count}} ನಿಮಿಷಗಳ ಹಿಂದೆ"
}
},
aboutXHours:{
one:{
default:"ಸುಮಾರು 1 ಗಂಟೆ",
future:"ಸುಮಾರು 1 ಗಂಟೆಯಲ್ಲಿ",
past:"ಸುಮಾರು 1 ಗಂಟೆ ಹಿಂದೆ"
},
other:{
default:"ಸುಮಾರು {{count}} ಗಂಟೆಗಳು",
future:"ಸುಮಾರು {{count}} ಗಂಟೆಗಳಲ್ಲಿ",
past:"ಸುಮಾರು {{count}} ಗಂಟೆಗಳ ಹಿಂದೆ"
}
},
xHours:{
one:{
default:"1 ಗಂಟೆ",
future:"1 ಗಂಟೆಯಲ್ಲಿ",
past:"1 ಗಂಟೆ ಹಿಂದೆ"
},
other:{
default:"{{count}} ಗಂಟೆಗಳು",
future:"{{count}} ಗಂಟೆಗಳಲ್ಲಿ",
past:"{{count}} ಗಂಟೆಗಳ ಹಿಂದೆ"
}
},
xDays:{
one:{
default:"1 ದಿನ",
future:"1 ದಿನದಲ್ಲಿ",
past:"1 ದಿನದ ಹಿಂದೆ"
},
other:{
default:"{{count}} ದಿನಗಳು",
future:"{{count}} ದಿನಗಳಲ್ಲಿ",
past:"{{count}} ದಿನಗಳ ಹಿಂದೆ"
}
},
aboutXMonths:{
one:{
default:"ಸುಮಾರು 1 ತಿಂಗಳು",
future:"ಸುಮಾರು 1 ತಿಂಗಳಲ್ಲಿ",
past:"ಸುಮಾರು 1 ತಿಂಗಳ ಹಿಂದೆ"
},
other:{
default:"ಸುಮಾರು {{count}} ತಿಂಗಳು",
future:"ಸುಮಾರು {{count}} ತಿಂಗಳುಗಳಲ್ಲಿ",
past:"ಸುಮಾರು {{count}} ತಿಂಗಳುಗಳ ಹಿಂದೆ"
}
},
xMonths:{
one:{
default:"1 ತಿಂಗಳು",
future:"1 ತಿಂಗಳಲ್ಲಿ",
past:"1 ತಿಂಗಳ ಹಿಂದೆ"
},
other:{
default:"{{count}} ತಿಂಗಳು",
future:"{{count}} ತಿಂಗಳುಗಳಲ್ಲಿ",
past:"{{count}} ತಿಂಗಳುಗಳ ಹಿಂದೆ"
}
},
aboutXYears:{
one:{
default:"ಸುಮಾರು 1 ವರ್ಷ",
future:"ಸುಮಾರು 1 ವರ್ಷದಲ್ಲಿ",
past:"ಸುಮಾರು 1 ವರ್ಷದ ಹಿಂದೆ"
},
other:{
default:"ಸುಮಾರು {{count}} ವರ್ಷಗಳು",
future:"ಸುಮಾರು {{count}} ವರ್ಷಗಳಲ್ಲಿ",
past:"ಸುಮಾರು {{count}} ವರ್ಷಗಳ ಹಿಂದೆ"
}
},
xYears:{
one:{
default:"1 ವರ್ಷ",
future:"1 ವರ್ಷದಲ್ಲಿ",
past:"1 ವರ್ಷದ ಹಿಂದೆ"
},
other:{
default:"{{count}} ವರ್ಷಗಳು",
future:"{{count}} ವರ್ಷಗಳಲ್ಲಿ",
past:"{{count}} ವರ್ಷಗಳ ಹಿಂದೆ"
}
},
overXYears:{
one:{
default:"1 ವರ್ಷದ ಮೇಲೆ",
future:"1 ವರ್ಷದ ಮೇಲೆ",
past:"1 ವರ್ಷದ ಮೇಲೆ"
},
other:{
default:"{{count}} ವರ್ಷಗಳ ಮೇಲೆ",
future:"{{count}} ವರ್ಷಗಳ ಮೇಲೆ",
past:"{{count}} ವರ್ಷಗಳ ಮೇಲೆ"
}
},
almostXYears:{
one:{
default:"ಬಹುತೇಕ 1 ವರ್ಷದಲ್ಲಿ",
future:"ಬಹುತೇಕ 1 ವರ್ಷದಲ್ಲಿ",
past:"ಬಹುತೇಕ 1 ವರ್ಷದಲ್ಲಿ"
},
other:{
default:"ಬಹುತೇಕ {{count}} ವರ್ಷಗಳಲ್ಲಿ",
future:"ಬಹುತೇಕ {{count}} ವರ್ಷಗಳಲ್ಲಿ",
past:"ಬಹುತೇಕ {{count}} ವರ್ಷಗಳಲ್ಲಿ"
}
}
};
function getResultByTense(parentToken,options){
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return parentToken.future;else
return parentToken.past;
return parentToken.default;
}
var formatDistance$37=function formatDistance$37(token,count,options){
var result;
var tokenValue=formatDistanceLocale$37[token];
if(tokenValue.one&&count===1)result=getResultByTense(tokenValue.one,options);else
result=getResultByTense(tokenValue.other,options);
return result.replace("{{count}}",String(count));
};
var formatLong$37={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM d, y",
long:"MMMM d, y",
medium:"MMM d, y",
short:"d/M/yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"hh:mm:ss a zzzz",
long:"hh:mm:ss a z",
medium:"hh:mm:ss a",
short:"hh:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/kn/_lib/formatRelative.js
var formatRelativeLocale$37={
lastWeek:"'ಕಳೆದ' eeee p 'ಕ್ಕೆ'",
yesterday:"'ನಿನ್ನೆ' p 'ಕ್ಕೆ'",
today:"'ಇಂದು' p 'ಕ್ಕೆ'",
tomorrow:"'ನಾಳೆ' p 'ಕ್ಕೆ'",
nextWeek:"eeee p 'ಕ್ಕೆ'",
other:"P"
};
var formatRelative$37=function formatRelative$37(token,_date,_baseDate,_options){return formatRelativeLocale$37[token];};
//#endregion
//#region dist/date-fns/locale/kn/_lib/localize.js
var eraValues$37={
narrow:["ಕ್ರಿ.ಪೂ","ಕ್ರಿ.ಶ"],
abbreviated:["ಕ್ರಿ.ಪೂ","ಕ್ರಿ.ಶ"],
wide:["ಕ್ರಿಸ್ತ ಪೂರ್ವ","ಕ್ರಿಸ್ತ ಶಕ"]
};
var quarterValues$37={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"ತ್ರೈ 1",
"ತ್ರೈ 2",
"ತ್ರೈ 3",
"ತ್ರೈ 4"],

wide:[
"1ನೇ ತ್ರೈಮಾಸಿಕ",
"2ನೇ ತ್ರೈಮಾಸಿಕ",
"3ನೇ ತ್ರೈಮಾಸಿಕ",
"4ನೇ ತ್ರೈಮಾಸಿಕ"]

};
var monthValues$37={
narrow:[
"ಜ",
"ಫೆ",
"ಮಾ",
"ಏ",
"ಮೇ",
"ಜೂ",
"ಜು",
"ಆ",
"ಸೆ",
"ಅ",
"ನ",
"ಡಿ"],

abbreviated:[
"ಜನ",
"ಫೆಬ್ರ",
"ಮಾರ್ಚ್",
"ಏಪ್ರಿ",
"ಮೇ",
"ಜೂನ್",
"ಜುಲೈ",
"ಆಗ",
"ಸೆಪ್ಟೆಂ",
"ಅಕ್ಟೋ",
"ನವೆಂ",
"ಡಿಸೆಂ"],

wide:[
"ಜನವರಿ",
"ಫೆಬ್ರವರಿ",
"ಮಾರ್ಚ್",
"ಏಪ್ರಿಲ್",
"ಮೇ",
"ಜೂನ್",
"ಜುಲೈ",
"ಆಗಸ್ಟ್",
"ಸೆಪ್ಟೆಂಬರ್",
"ಅಕ್ಟೋಬರ್",
"ನವೆಂಬರ್",
"ಡಿಸೆಂಬರ್"]

};
var dayValues$37={
narrow:[
"ಭಾ",
"ಸೋ",
"ಮಂ",
"ಬು",
"ಗು",
"ಶು",
"ಶ"],

short:[
"ಭಾನು",
"ಸೋಮ",
"ಮಂಗಳ",
"ಬುಧ",
"ಗುರು",
"ಶುಕ್ರ",
"ಶನಿ"],

abbreviated:[
"ಭಾನು",
"ಸೋಮ",
"ಮಂಗಳ",
"ಬುಧ",
"ಗುರು",
"ಶುಕ್ರ",
"ಶನಿ"],

wide:[
"ಭಾನುವಾರ",
"ಸೋಮವಾರ",
"ಮಂಗಳವಾರ",
"ಬುಧವಾರ",
"ಗುರುವಾರ",
"ಶುಕ್ರವಾರ",
"ಶನಿವಾರ"]

};
var dayPeriodValues$37={
narrow:{
am:"ಪೂರ್ವಾಹ್ನ",
pm:"ಅಪರಾಹ್ನ",
midnight:"ಮಧ್ಯರಾತ್ರಿ",
noon:"ಮಧ್ಯಾಹ್ನ",
morning:"ಬೆಳಗ್ಗೆ",
afternoon:"ಮಧ್ಯಾಹ್ನ",
evening:"ಸಂಜೆ",
night:"ರಾತ್ರಿ"
},
abbreviated:{
am:"ಪೂರ್ವಾಹ್ನ",
pm:"ಅಪರಾಹ್ನ",
midnight:"ಮಧ್ಯರಾತ್ರಿ",
noon:"ಮಧ್ಯಾನ್ಹ",
morning:"ಬೆಳಗ್ಗೆ",
afternoon:"ಮಧ್ಯಾನ್ಹ",
evening:"ಸಂಜೆ",
night:"ರಾತ್ರಿ"
},
wide:{
am:"ಪೂರ್ವಾಹ್ನ",
pm:"ಅಪರಾಹ್ನ",
midnight:"ಮಧ್ಯರಾತ್ರಿ",
noon:"ಮಧ್ಯಾನ್ಹ",
morning:"ಬೆಳಗ್ಗೆ",
afternoon:"ಮಧ್ಯಾನ್ಹ",
evening:"ಸಂಜೆ",
night:"ರಾತ್ರಿ"
}
};
var formattingDayPeriodValues$29={
narrow:{
am:"ಪೂ",
pm:"ಅ",
midnight:"ಮಧ್ಯರಾತ್ರಿ",
noon:"ಮಧ್ಯಾನ್ಹ",
morning:"ಬೆಳಗ್ಗೆ",
afternoon:"ಮಧ್ಯಾನ್ಹ",
evening:"ಸಂಜೆ",
night:"ರಾತ್ರಿ"
},
abbreviated:{
am:"ಪೂರ್ವಾಹ್ನ",
pm:"ಅಪರಾಹ್ನ",
midnight:"ಮಧ್ಯ ರಾತ್ರಿ",
noon:"ಮಧ್ಯಾನ್ಹ",
morning:"ಬೆಳಗ್ಗೆ",
afternoon:"ಮಧ್ಯಾನ್ಹ",
evening:"ಸಂಜೆ",
night:"ರಾತ್ರಿ"
},
wide:{
am:"ಪೂರ್ವಾಹ್ನ",
pm:"ಅಪರಾಹ್ನ",
midnight:"ಮಧ್ಯ ರಾತ್ರಿ",
noon:"ಮಧ್ಯಾನ್ಹ",
morning:"ಬೆಳಗ್ಗೆ",
afternoon:"ಮಧ್ಯಾನ್ಹ",
evening:"ಸಂಜೆ",
night:"ರಾತ್ರಿ"
}
};
var ordinalNumber$37=function ordinalNumber$37(dirtyNumber,_options){
return Number(dirtyNumber)+"ನೇ";
};
//#endregion
//#region dist/date-fns/locale/kn.js
/**
* @category Locales
* @summary Kannada locale (India).
* @language Kannada
* @iso-639-2 kan
* @author Manjunatha Gouli [@developergouli](https://github.com/developergouli)
*/
var _kn={
code:"kn",
formatDistance:formatDistance$37,
formatLong:formatLong$37,
formatRelative:formatRelative$37,
localize:{
ordinalNumber:ordinalNumber$37,
era:buildLocalizeFn({
values:eraValues$37,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$37,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$37,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$37,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$37,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$29,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(ನೇ|ನೆ)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ಕ್ರಿ.ಪೂ|ಕ್ರಿ.ಶ)/i,
abbreviated:/^(ಕ್ರಿ\.?\s?ಪೂ\.?|ಕ್ರಿ\.?\s?ಶ\.?|ಪ್ರ\.?\s?ಶ\.?)/i,
wide:/^(ಕ್ರಿಸ್ತ ಪೂರ್ವ|ಕ್ರಿಸ್ತ ಶಕ|ಪ್ರಸಕ್ತ ಶಕ)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^ಪೂ/i,/^(ಶ|ಪ್ರ)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^ತ್ರೈ[1234]|ತ್ರೈ [1234]| [1234]ತ್ರೈ/i,
wide:/^[1234](ನೇ)? ತ್ರೈಮಾಸಿಕ/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(ಜೂ|ಜು|ಜ|ಫೆ|ಮಾ|ಏ|ಮೇ|ಆ|ಸೆ|ಅ|ನ|ಡಿ)/i,
abbreviated:/^(ಜನ|ಫೆಬ್ರ|ಮಾರ್ಚ್|ಏಪ್ರಿ|ಮೇ|ಜೂನ್|ಜುಲೈ|ಆಗ|ಸೆಪ್ಟೆಂ|ಅಕ್ಟೋ|ನವೆಂ|ಡಿಸೆಂ)/i,
wide:/^(ಜನವರಿ|ಫೆಬ್ರವರಿ|ಮಾರ್ಚ್|ಏಪ್ರಿಲ್|ಮೇ|ಜೂನ್|ಜುಲೈ|ಆಗಸ್ಟ್|ಸೆಪ್ಟೆಂಬರ್|ಅಕ್ಟೋಬರ್|ನವೆಂಬರ್|ಡಿಸೆಂಬರ್)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ಜ$/i,
/^ಫೆ/i,
/^ಮಾ/i,
/^ಏ/i,
/^ಮೇ/i,
/^ಜೂ/i,
/^ಜು$/i,
/^ಆ/i,
/^ಸೆ/i,
/^ಅ/i,
/^ನ/i,
/^ಡಿ/i],

any:[
/^ಜನ/i,
/^ಫೆ/i,
/^ಮಾ/i,
/^ಏ/i,
/^ಮೇ/i,
/^ಜೂನ್/i,
/^ಜುಲೈ/i,
/^ಆ/i,
/^ಸೆ/i,
/^ಅ/i,
/^ನ/i,
/^ಡಿ/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ಭಾ|ಸೋ|ಮ|ಬು|ಗು|ಶು|ಶ)/i,
short:/^(ಭಾನು|ಸೋಮ|ಮಂಗಳ|ಬುಧ|ಗುರು|ಶುಕ್ರ|ಶನಿ)/i,
abbreviated:/^(ಭಾನು|ಸೋಮ|ಮಂಗಳ|ಬುಧ|ಗುರು|ಶುಕ್ರ|ಶನಿ)/i,
wide:/^(ಭಾನುವಾರ|ಸೋಮವಾರ|ಮಂಗಳವಾರ|ಬುಧವಾರ|ಗುರುವಾರ|ಶುಕ್ರವಾರ|ಶನಿವಾರ)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ಭಾ/i,
/^ಸೋ/i,
/^ಮ/i,
/^ಬು/i,
/^ಗು/i,
/^ಶು/i,
/^ಶ/i],

any:[
/^ಭಾ/i,
/^ಸೋ/i,
/^ಮ/i,
/^ಬು/i,
/^ಗು/i,
/^ಶು/i,
/^ಶ/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ಪೂ|ಅ|ಮಧ್ಯರಾತ್ರಿ|ಮಧ್ಯಾನ್ಹ|ಬೆಳಗ್ಗೆ|ಸಂಜೆ|ರಾತ್ರಿ)/i,
any:/^(ಪೂರ್ವಾಹ್ನ|ಅಪರಾಹ್ನ|ಮಧ್ಯರಾತ್ರಿ|ಮಧ್ಯಾನ್ಹ|ಬೆಳಗ್ಗೆ|ಸಂಜೆ|ರಾತ್ರಿ)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ಪೂ/i,
pm:/^ಅ/i,
midnight:/ಮಧ್ಯರಾತ್ರಿ/i,
noon:/ಮಧ್ಯಾನ್ಹ/i,
morning:/ಬೆಳಗ್ಗೆ/i,
afternoon:/ಮಧ್ಯಾನ್ಹ/i,
evening:/ಸಂಜೆ/i,
night:/ರಾತ್ರಿ/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ko/_lib/formatDistance.js
var formatDistanceLocale$36={
lessThanXSeconds:{
one:"1초 미만",
other:"{{count}}초 미만"
},
xSeconds:{
one:"1초",
other:"{{count}}초"
},
halfAMinute:"30초",
lessThanXMinutes:{
one:"1분 미만",
other:"{{count}}분 미만"
},
xMinutes:{
one:"1분",
other:"{{count}}분"
},
aboutXHours:{
one:"약 1시간",
other:"약 {{count}}시간"
},
xHours:{
one:"1시간",
other:"{{count}}시간"
},
xDays:{
one:"1일",
other:"{{count}}일"
},
aboutXWeeks:{
one:"약 1주",
other:"약 {{count}}주"
},
xWeeks:{
one:"1주",
other:"{{count}}주"
},
aboutXMonths:{
one:"약 1개월",
other:"약 {{count}}개월"
},
xMonths:{
one:"1개월",
other:"{{count}}개월"
},
aboutXYears:{
one:"약 1년",
other:"약 {{count}}년"
},
xYears:{
one:"1년",
other:"{{count}}년"
},
overXYears:{
one:"1년 이상",
other:"{{count}}년 이상"
},
almostXYears:{
one:"거의 1년",
other:"거의 {{count}}년"
}
};
var formatDistance$36=function formatDistance$36(token,count,options){
var result;
var tokenValue=formatDistanceLocale$36[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" 후";else
return result+" 전";
return result;
};
var formatLong$36={
date:buildFormatLongFn({
formats:{
full:"y년 M월 d일 EEEE",
long:"y년 M월 d일",
medium:"y.MM.dd",
short:"y.MM.dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"a H시 mm분 ss초 zzzz",
long:"a H:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ko/_lib/formatRelative.js
var formatRelativeLocale$36={
lastWeek:"'지난' eeee p",
yesterday:"'어제' p",
today:"'오늘' p",
tomorrow:"'내일' p",
nextWeek:"'다음' eeee p",
other:"P"
};
var formatRelative$36=function formatRelative$36(token,_date,_baseDate,_options){return formatRelativeLocale$36[token];};
//#endregion
//#region dist/date-fns/locale/ko/_lib/localize.js
var eraValues$36={
narrow:["BC","AD"],
abbreviated:["BC","AD"],
wide:["기원전","서기"]
};
var quarterValues$36={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1분기",
"2분기",
"3분기",
"4분기"]

};
var monthValues$36={
narrow:[
"1",
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"10",
"11",
"12"],

abbreviated:[
"1월",
"2월",
"3월",
"4월",
"5월",
"6월",
"7월",
"8월",
"9월",
"10월",
"11월",
"12월"],

wide:[
"1월",
"2월",
"3월",
"4월",
"5월",
"6월",
"7월",
"8월",
"9월",
"10월",
"11월",
"12월"]

};
var dayValues$36={
narrow:[
"일",
"월",
"화",
"수",
"목",
"금",
"토"],

short:[
"일",
"월",
"화",
"수",
"목",
"금",
"토"],

abbreviated:[
"일",
"월",
"화",
"수",
"목",
"금",
"토"],

wide:[
"일요일",
"월요일",
"화요일",
"수요일",
"목요일",
"금요일",
"토요일"]

};
var dayPeriodValues$36={
narrow:{
am:"오전",
pm:"오후",
midnight:"자정",
noon:"정오",
morning:"아침",
afternoon:"오후",
evening:"저녁",
night:"밤"
},
abbreviated:{
am:"오전",
pm:"오후",
midnight:"자정",
noon:"정오",
morning:"아침",
afternoon:"오후",
evening:"저녁",
night:"밤"
},
wide:{
am:"오전",
pm:"오후",
midnight:"자정",
noon:"정오",
morning:"아침",
afternoon:"오후",
evening:"저녁",
night:"밤"
}
};
var formattingDayPeriodValues$28={
narrow:{
am:"오전",
pm:"오후",
midnight:"자정",
noon:"정오",
morning:"아침",
afternoon:"오후",
evening:"저녁",
night:"밤"
},
abbreviated:{
am:"오전",
pm:"오후",
midnight:"자정",
noon:"정오",
morning:"아침",
afternoon:"오후",
evening:"저녁",
night:"밤"
},
wide:{
am:"오전",
pm:"오후",
midnight:"자정",
noon:"정오",
morning:"아침",
afternoon:"오후",
evening:"저녁",
night:"밤"
}
};
var ordinalNumber$36=function ordinalNumber$36(dirtyNumber,options){
var number=Number(dirtyNumber);
switch(String(options===null||options===void 0?void 0:options.unit)){
case"minute":
case"second":return String(number);
case"date":return number+"일";
default:return number+"번째";
}
};
//#endregion
//#region dist/date-fns/locale/ko.js
/**
* @category Locales
* @summary Korean locale.
* @language Korean
* @iso-639-2 kor
* @author Hong Chulju [@angdev](https://github.com/angdev)
* @author Lee Seoyoen [@iamssen](https://github.com/iamssen)
* @author Taiki IKeda [@so99ynoodles](https://github.com/so99ynoodles)
*/
var _ko={
code:"ko",
formatDistance:formatDistance$36,
formatLong:formatLong$36,
formatRelative:formatRelative$36,
localize:{
ordinalNumber:ordinalNumber$36,
era:buildLocalizeFn({
values:eraValues$36,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$36,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$36,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$36,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$36,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$28,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(일|번째)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
wide:/^(기원전|서기)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(bc|기원전)/i,/^(ad|서기)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234]사?분기/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(1[012]|[123456789])/,
abbreviated:/^(1[012]|[123456789])월/i,
wide:/^(1[012]|[123456789])월/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^1월?$/,
/^2/,
/^3/,
/^4/,
/^5/,
/^6/,
/^7/,
/^8/,
/^9/,
/^10/,
/^11/,
/^12/]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[일월화수목금토]/,
short:/^[일월화수목금토]/,
abbreviated:/^[일월화수목금토]/,
wide:/^[일월화수목금토]요일/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^일/,
/^월/,
/^화/,
/^수/,
/^목/,
/^금/,
/^토/]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|오전|오후|자정|정오|아침|저녁|밤)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^(am|오전)/i,
pm:/^(pm|오후)/i,
midnight:/^자정/i,
noon:/^정오/i,
morning:/^아침/i,
afternoon:/^오후/i,
evening:/^저녁/i,
night:/^밤/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/lb/_lib/formatDistance.js
var formatDistanceLocale$35={
lessThanXSeconds:{
standalone:{
one:"manner wéi eng Sekonn",
other:"manner wéi {{count}} Sekonnen"
},
withPreposition:{
one:"manner wéi enger Sekonn",
other:"manner wéi {{count}} Sekonnen"
}
},
xSeconds:{
standalone:{
one:"eng Sekonn",
other:"{{count}} Sekonnen"
},
withPreposition:{
one:"enger Sekonn",
other:"{{count}} Sekonnen"
}
},
halfAMinute:{
standalone:"eng hallef Minutt",
withPreposition:"enger hallwer Minutt"
},
lessThanXMinutes:{
standalone:{
one:"manner wéi eng Minutt",
other:"manner wéi {{count}} Minutten"
},
withPreposition:{
one:"manner wéi enger Minutt",
other:"manner wéi {{count}} Minutten"
}
},
xMinutes:{
standalone:{
one:"eng Minutt",
other:"{{count}} Minutten"
},
withPreposition:{
one:"enger Minutt",
other:"{{count}} Minutten"
}
},
aboutXHours:{
standalone:{
one:"ongeféier eng Stonn",
other:"ongeféier {{count}} Stonnen"
},
withPreposition:{
one:"ongeféier enger Stonn",
other:"ongeféier {{count}} Stonnen"
}
},
xHours:{
standalone:{
one:"eng Stonn",
other:"{{count}} Stonnen"
},
withPreposition:{
one:"enger Stonn",
other:"{{count}} Stonnen"
}
},
xDays:{
standalone:{
one:"een Dag",
other:"{{count}} Deeg"
},
withPreposition:{
one:"engem Dag",
other:"{{count}} Deeg"
}
},
aboutXWeeks:{
standalone:{
one:"ongeféier eng Woch",
other:"ongeféier {{count}} Wochen"
},
withPreposition:{
one:"ongeféier enger Woche",
other:"ongeféier {{count}} Wochen"
}
},
xWeeks:{
standalone:{
one:"eng Woch",
other:"{{count}} Wochen"
},
withPreposition:{
one:"enger Woch",
other:"{{count}} Wochen"
}
},
aboutXMonths:{
standalone:{
one:"ongeféier ee Mount",
other:"ongeféier {{count}} Méint"
},
withPreposition:{
one:"ongeféier engem Mount",
other:"ongeféier {{count}} Méint"
}
},
xMonths:{
standalone:{
one:"ee Mount",
other:"{{count}} Méint"
},
withPreposition:{
one:"engem Mount",
other:"{{count}} Méint"
}
},
aboutXYears:{
standalone:{
one:"ongeféier ee Joer",
other:"ongeféier {{count}} Joer"
},
withPreposition:{
one:"ongeféier engem Joer",
other:"ongeféier {{count}} Joer"
}
},
xYears:{
standalone:{
one:"ee Joer",
other:"{{count}} Joer"
},
withPreposition:{
one:"engem Joer",
other:"{{count}} Joer"
}
},
overXYears:{
standalone:{
one:"méi wéi ee Joer",
other:"méi wéi {{count}} Joer"
},
withPreposition:{
one:"méi wéi engem Joer",
other:"méi wéi {{count}} Joer"
}
},
almostXYears:{
standalone:{
one:"bal ee Joer",
other:"bal {{count}} Joer"
},
withPreposition:{
one:"bal engem Joer",
other:"bal {{count}} Joer"
}
}
};
var EXCEPTION_CONSONANTS=[
"d",
"h",
"n",
"t",
"z"];

var VOWELS=[
"a,",
"e",
"i",
"o",
"u"];

var DIGITS_SPOKEN_N_NEEDED=[
0,
1,
2,
3,
8,
9];

var FIRST_TWO_DIGITS_SPOKEN_NO_N_NEEDED=[
40,
50,
60,
70];

function isFinalNNeeded(nextWords){
var firstLetter=nextWords.charAt(0).toLowerCase();
if(VOWELS.indexOf(firstLetter)!=-1||EXCEPTION_CONSONANTS.indexOf(firstLetter)!=-1)return true;
var firstWord=nextWords.split(" ")[0];
var number=parseInt(firstWord);
if(!isNaN(number)&&DIGITS_SPOKEN_N_NEEDED.indexOf(number%10)!=-1&&FIRST_TWO_DIGITS_SPOKEN_NO_N_NEEDED.indexOf(parseInt(firstWord.substring(0,2)))==-1)return true;
return false;
}
var formatDistance$35=function formatDistance$35(token,count,options){
var result;
var tokenValue=formatDistanceLocale$35[token];
var usageGroup=options!==null&&options!==void 0&&options.addSuffix?tokenValue.withPreposition:tokenValue.standalone;
if(typeof usageGroup==="string")result=usageGroup;else
if(count===1)result=usageGroup.one;else
result=usageGroup.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"a"+(isFinalNNeeded(result)?"n":"")+" "+result;else
return"viru"+(isFinalNNeeded(result)?"n":"")+" "+result;
return result;
};
var formatLong$35={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y",
long:"do MMMM y",
medium:"do MMM y",
short:"dd.MM.yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'um' {{time}}",
long:"{{date}} 'um' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/lb/_lib/formatRelative.js
var formatRelativeLocale$35={
lastWeek:function lastWeek(date){
var day=date.getDay();
var result="'läschte";
if(day===2||day===4)result+="n";
result+="' eeee 'um' p";
return result;
},
yesterday:"'gëschter um' p",
today:"'haut um' p",
tomorrow:"'moien um' p",
nextWeek:"eeee 'um' p",
other:"P"
};
var formatRelative$35=function formatRelative$35(token,date,_baseDate,_options){
var format=formatRelativeLocale$35[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/lb/_lib/localize.js
var eraValues$35={
narrow:["v.Chr.","n.Chr."],
abbreviated:["v.Chr.","n.Chr."],
wide:["viru Christus","no Christus"]
};
var quarterValues$35={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. Quartal",
"2. Quartal",
"3. Quartal",
"4. Quartal"]

};
var monthValues$35={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Feb",
"Mäe",
"Abr",
"Mee",
"Jun",
"Jul",
"Aug",
"Sep",
"Okt",
"Nov",
"Dez"],

wide:[
"Januar",
"Februar",
"Mäerz",
"Abrëll",
"Mee",
"Juni",
"Juli",
"August",
"September",
"Oktober",
"November",
"Dezember"]

};
var dayValues$35={
narrow:[
"S",
"M",
"D",
"M",
"D",
"F",
"S"],

short:[
"So",
"Mé",
"Dë",
"Më",
"Do",
"Fr",
"Sa"],

abbreviated:[
"So.",
"Mé.",
"Dë.",
"Më.",
"Do.",
"Fr.",
"Sa."],

wide:[
"Sonndeg",
"Méindeg",
"Dënschdeg",
"Mëttwoch",
"Donneschdeg",
"Freideg",
"Samschdeg"]

};
var dayPeriodValues$35={
narrow:{
am:"mo.",
pm:"nomë.",
midnight:"Mëtternuecht",
noon:"Mëtteg",
morning:"Moien",
afternoon:"Nomëtteg",
evening:"Owend",
night:"Nuecht"
},
abbreviated:{
am:"moies",
pm:"nomëttes",
midnight:"Mëtternuecht",
noon:"Mëtteg",
morning:"Moien",
afternoon:"Nomëtteg",
evening:"Owend",
night:"Nuecht"
},
wide:{
am:"moies",
pm:"nomëttes",
midnight:"Mëtternuecht",
noon:"Mëtteg",
morning:"Moien",
afternoon:"Nomëtteg",
evening:"Owend",
night:"Nuecht"
}
};
var formattingDayPeriodValues$27={
narrow:{
am:"mo.",
pm:"nom.",
midnight:"Mëtternuecht",
noon:"mëttes",
morning:"moies",
afternoon:"nomëttes",
evening:"owes",
night:"nuets"
},
abbreviated:{
am:"moies",
pm:"nomëttes",
midnight:"Mëtternuecht",
noon:"mëttes",
morning:"moies",
afternoon:"nomëttes",
evening:"owes",
night:"nuets"
},
wide:{
am:"moies",
pm:"nomëttes",
midnight:"Mëtternuecht",
noon:"mëttes",
morning:"moies",
afternoon:"nomëttes",
evening:"owes",
night:"nuets"
}
};
var ordinalNumber$35=function ordinalNumber$35(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/lb.js
/**
* @category Locales
* @summary Luxembourgish locale.
* @language Luxembourgish
* @iso-639-2 ltz
* @author Daniel Waxweiler [@dwaxweiler](https://github.com/dwaxweiler)
*/
var _lb={
code:"lb",
formatDistance:formatDistance$35,
formatLong:formatLong$35,
formatRelative:formatRelative$35,
localize:{
ordinalNumber:ordinalNumber$35,
era:buildLocalizeFn({
values:eraValues$35,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$35,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$35,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$35,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$35,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$27,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(\.)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
abbreviated:/^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
wide:/^(viru Christus|virun eiser Zäitrechnung|no Christus|eiser Zäitrechnung)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^v/i,/^n/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](\.)? Quartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mäe|abr|mee|jun|jul|aug|sep|okt|nov|dez)/i,
wide:/^(januar|februar|mäerz|abrëll|mee|juni|juli|august|september|oktober|november|dezember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mä/i,
/^ab/i,
/^me/i,
/^jun/i,
/^jul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smdf]/i,
short:/^(so|mé|dë|më|do|fr|sa)/i,
abbreviated:/^(son?|méi?|dën?|mët?|don?|fre?|sam?)\.?/i,
wide:/^(sonndeg|méindeg|dënschdeg|mëttwoch|donneschdeg|freideg|samschdeg)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^so/i,
/^mé/i,
/^dë/i,
/^më/i,
/^do/i,
/^f/i,
/^sa/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(mo\.?|nomë\.?|Mëtternuecht|mëttes|moies|nomëttes|owes|nuets)/i,
abbreviated:/^(moi\.?|nomët\.?|Mëtternuecht|mëttes|moies|nomëttes|owes|nuets)/i,
wide:/^(moies|nomëttes|Mëtternuecht|mëttes|moies|nomëttes|owes|nuets)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^m/i,
pm:/^n/i,
midnight:/^Mëtter/i,
noon:/^mëttes/i,
morning:/moies/i,
afternoon:/nomëttes/i,
evening:/owes/i,
night:/nuets/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/lt/_lib/formatDistance.js
var translations={
xseconds_other:"sekundė_sekundžių_sekundes",
xminutes_one:"minutė_minutės_minutę",
xminutes_other:"minutės_minučių_minutes",
xhours_one:"valanda_valandos_valandą",
xhours_other:"valandos_valandų_valandas",
xdays_one:"diena_dienos_dieną",
xdays_other:"dienos_dienų_dienas",
xweeks_one:"savaitė_savaitės_savaitę",
xweeks_other:"savaitės_savaičių_savaites",
xmonths_one:"mėnuo_mėnesio_mėnesį",
xmonths_other:"mėnesiai_mėnesių_mėnesius",
xyears_one:"metai_metų_metus",
xyears_other:"metai_metų_metus",
about:"apie",
over:"daugiau nei",
almost:"beveik",
lessthan:"mažiau nei"
};
var translateSeconds=function translateSeconds(_number,addSuffix,_key,isFuture){
if(!addSuffix)return"kelios sekundės";else
return isFuture?"kelių sekundžių":"kelias sekundes";
};
var translateSingular=function translateSingular(_number,addSuffix,key,isFuture){
return!addSuffix?forms(key)[0]:isFuture?forms(key)[1]:forms(key)[2];
};
var translate=function translate(number,addSuffix,key,isFuture){
var result=number+" ";
if(number===1)return result+translateSingular(number,addSuffix,key,isFuture);else
if(!addSuffix)return result+(special(number)?forms(key)[1]:forms(key)[0]);else
if(isFuture)return result+forms(key)[1];else
return result+(special(number)?forms(key)[1]:forms(key)[2]);
};
function special(number){
return number%10===0||number>10&&number<20;
}
function forms(key){
return translations[key].split("_");
}
var formatDistanceLocale$34={
lessThanXSeconds:{
one:translateSeconds,
other:translate
},
xSeconds:{
one:translateSeconds,
other:translate
},
halfAMinute:"pusė minutės",
lessThanXMinutes:{
one:translateSingular,
other:translate
},
xMinutes:{
one:translateSingular,
other:translate
},
aboutXHours:{
one:translateSingular,
other:translate
},
xHours:{
one:translateSingular,
other:translate
},
xDays:{
one:translateSingular,
other:translate
},
aboutXWeeks:{
one:translateSingular,
other:translate
},
xWeeks:{
one:translateSingular,
other:translate
},
aboutXMonths:{
one:translateSingular,
other:translate
},
xMonths:{
one:translateSingular,
other:translate
},
aboutXYears:{
one:translateSingular,
other:translate
},
xYears:{
one:translateSingular,
other:translate
},
overXYears:{
one:translateSingular,
other:translate
},
almostXYears:{
one:translateSingular,
other:translate
}
};
var formatDistance$34=function formatDistance$34(token,count,options){
var adverb=token.match(/about|over|almost|lessthan/i);
var unit=adverb?token.replace(adverb[0],""):token;
var isFuture=(options===null||options===void 0?void 0:options.comparison)!==void 0&&options.comparison>0;
var result;
var tokenValue=formatDistanceLocale$34[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one(count,(options===null||options===void 0?void 0:options.addSuffix)===true,unit.toLowerCase()+"_one",isFuture);else
result=tokenValue.other(count,(options===null||options===void 0?void 0:options.addSuffix)===true,unit.toLowerCase()+"_other",isFuture);
if(adverb)result=translations[adverb[0].toLowerCase()]+" "+result;
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"po "+result;else
return"prieš "+result;
return result;
};
var formatLong$34={
date:buildFormatLongFn({
formats:{
full:"y 'm'. MMMM d 'd'., EEEE",
long:"y 'm'. MMMM d 'd'.",
medium:"y-MM-dd",
short:"y-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/lt/_lib/formatRelative.js
var formatRelativeLocale$34={
lastWeek:"'Praėjusį' eeee p",
yesterday:"'Vakar' p",
today:"'Šiandien' p",
tomorrow:"'Rytoj' p",
nextWeek:"eeee p",
other:"P"
};
var formatRelative$34=function formatRelative$34(token,_date,_baseDate,_options){return formatRelativeLocale$34[token];};
//#endregion
//#region dist/date-fns/locale/lt/_lib/localize.js
var eraValues$34={
narrow:["pr. Kr.","po Kr."],
abbreviated:["pr. Kr.","po Kr."],
wide:["prieš Kristų","po Kristaus"]
};
var quarterValues$34={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"I ketv.",
"II ketv.",
"III ketv.",
"IV ketv."],

wide:[
"I ketvirtis",
"II ketvirtis",
"III ketvirtis",
"IV ketvirtis"]

};
var formattingQuarterValues$2={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"I k.",
"II k.",
"III k.",
"IV k."],

wide:[
"I ketvirtis",
"II ketvirtis",
"III ketvirtis",
"IV ketvirtis"]

};
var monthValues$34={
narrow:[
"S",
"V",
"K",
"B",
"G",
"B",
"L",
"R",
"R",
"S",
"L",
"G"],

abbreviated:[
"saus.",
"vas.",
"kov.",
"bal.",
"geg.",
"birž.",
"liep.",
"rugp.",
"rugs.",
"spal.",
"lapkr.",
"gruod."],

wide:[
"sausis",
"vasaris",
"kovas",
"balandis",
"gegužė",
"birželis",
"liepa",
"rugpjūtis",
"rugsėjis",
"spalis",
"lapkritis",
"gruodis"]

};
var formattingMonthValues$8={
narrow:[
"S",
"V",
"K",
"B",
"G",
"B",
"L",
"R",
"R",
"S",
"L",
"G"],

abbreviated:[
"saus.",
"vas.",
"kov.",
"bal.",
"geg.",
"birž.",
"liep.",
"rugp.",
"rugs.",
"spal.",
"lapkr.",
"gruod."],

wide:[
"sausio",
"vasario",
"kovo",
"balandžio",
"gegužės",
"birželio",
"liepos",
"rugpjūčio",
"rugsėjo",
"spalio",
"lapkričio",
"gruodžio"]

};
var dayValues$34={
narrow:[
"S",
"P",
"A",
"T",
"K",
"P",
"Š"],

short:[
"Sk",
"Pr",
"An",
"Tr",
"Kt",
"Pn",
"Št"],

abbreviated:[
"sk",
"pr",
"an",
"tr",
"kt",
"pn",
"št"],

wide:[
"sekmadienis",
"pirmadienis",
"antradienis",
"trečiadienis",
"ketvirtadienis",
"penktadienis",
"šeštadienis"]

};
var formattingDayValues$2={
narrow:[
"S",
"P",
"A",
"T",
"K",
"P",
"Š"],

short:[
"Sk",
"Pr",
"An",
"Tr",
"Kt",
"Pn",
"Št"],

abbreviated:[
"sk",
"pr",
"an",
"tr",
"kt",
"pn",
"št"],

wide:[
"sekmadienį",
"pirmadienį",
"antradienį",
"trečiadienį",
"ketvirtadienį",
"penktadienį",
"šeštadienį"]

};
var dayPeriodValues$34={
narrow:{
am:"pr. p.",
pm:"pop.",
midnight:"vidurnaktis",
noon:"vidurdienis",
morning:"rytas",
afternoon:"diena",
evening:"vakaras",
night:"naktis"
},
abbreviated:{
am:"priešpiet",
pm:"popiet",
midnight:"vidurnaktis",
noon:"vidurdienis",
morning:"rytas",
afternoon:"diena",
evening:"vakaras",
night:"naktis"
},
wide:{
am:"priešpiet",
pm:"popiet",
midnight:"vidurnaktis",
noon:"vidurdienis",
morning:"rytas",
afternoon:"diena",
evening:"vakaras",
night:"naktis"
}
};
var formattingDayPeriodValues$26={
narrow:{
am:"pr. p.",
pm:"pop.",
midnight:"vidurnaktis",
noon:"perpiet",
morning:"rytas",
afternoon:"popietė",
evening:"vakaras",
night:"naktis"
},
abbreviated:{
am:"priešpiet",
pm:"popiet",
midnight:"vidurnaktis",
noon:"perpiet",
morning:"rytas",
afternoon:"popietė",
evening:"vakaras",
night:"naktis"
},
wide:{
am:"priešpiet",
pm:"popiet",
midnight:"vidurnaktis",
noon:"perpiet",
morning:"rytas",
afternoon:"popietė",
evening:"vakaras",
night:"naktis"
}
};
var ordinalNumber$34=function ordinalNumber$34(dirtyNumber,_options){
return Number(dirtyNumber)+"-oji";
};
//#endregion
//#region dist/date-fns/locale/lt.js
/**
* @category Locales
* @summary Lithuanian locale.
* @language Lithuanian
* @iso-639-2 lit
* @author Pavlo Shpak [@pshpak](https://github.com/pshpak)
* @author Eduardo Pardo [@eduardopsll](https://github.com/eduardopsll)
*/
var _lt={
code:"lt",
formatDistance:formatDistance$34,
formatLong:formatLong$34,
formatRelative:formatRelative$34,
localize:{
ordinalNumber:ordinalNumber$34,
era:buildLocalizeFn({
values:eraValues$34,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$34,
defaultWidth:"wide",
formattingValues:formattingQuarterValues$2,
defaultFormattingWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$34,
defaultWidth:"wide",
formattingValues:formattingMonthValues$8,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$34,
defaultWidth:"wide",
formattingValues:formattingDayValues$2,
defaultFormattingWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$34,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$26,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-oji)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^p(r|o)\.?\s?(kr\.?|me)/i,
abbreviated:/^(pr\.\s?(kr\.|m\.\s?e\.)|po\s?kr\.|mūsų eroje)/i,
wide:/^(prieš Kristų|prieš mūsų erą|po Kristaus|mūsų eroje)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
wide:[/prieš/i,/(po|mūsų)/i],
any:[/^pr/i,/^(po|m)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^([1234])/i,
abbreviated:/^(I|II|III|IV)\s?ketv?\.?/i,
wide:/^(I|II|III|IV)\s?ketvirtis/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/1/i,
/2/i,
/3/i,
/4/i],

any:[
/I$/i,
/II$/i,
/III/i,
/IV/i]

},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[svkbglr]/i,
abbreviated:/^(saus\.|vas\.|kov\.|bal\.|geg\.|birž\.|liep\.|rugp\.|rugs\.|spal\.|lapkr\.|gruod\.)/i,
wide:/^(sausi(s|o)|vasari(s|o)|kov(a|o)s|balandž?i(s|o)|gegužės?|birželi(s|o)|liep(a|os)|rugpjū(t|č)i(s|o)|rugsėj(is|o)|spali(s|o)|lapkri(t|č)i(s|o)|gruodž?i(s|o))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^v/i,
/^k/i,
/^b/i,
/^g/i,
/^b/i,
/^l/i,
/^r/i,
/^r/i,
/^s/i,
/^l/i,
/^g/i],

any:[
/^saus/i,
/^vas/i,
/^kov/i,
/^bal/i,
/^geg/i,
/^birž/i,
/^liep/i,
/^rugp/i,
/^rugs/i,
/^spal/i,
/^lapkr/i,
/^gruod/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[spatkš]/i,
short:/^(sk|pr|an|tr|kt|pn|št)/i,
abbreviated:/^(sk|pr|an|tr|kt|pn|št)/i,
wide:/^(sekmadien(is|į)|pirmadien(is|į)|antradien(is|į)|trečiadien(is|į)|ketvirtadien(is|į)|penktadien(is|į)|šeštadien(is|į))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^p/i,
/^a/i,
/^t/i,
/^k/i,
/^p/i,
/^š/i],

wide:[
/^se/i,
/^pi/i,
/^an/i,
/^tr/i,
/^ke/i,
/^pe/i,
/^še/i],

any:[
/^sk/i,
/^pr/i,
/^an/i,
/^tr/i,
/^kt/i,
/^pn/i,
/^št/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(pr.\s?p.|pop.|vidurnaktis|(vidurdienis|perpiet)|rytas|(diena|popietė)|vakaras|naktis)/i,
any:/^(priešpiet|popiet$|vidurnaktis|(vidurdienis|perpiet)|rytas|(diena|popietė)|vakaras|naktis)/i
},
defaultMatchWidth:"any",
parsePatterns:{
narrow:{
am:/^pr/i,
pm:/^pop./i,
midnight:/^vidurnaktis/i,
noon:/^(vidurdienis|perp)/i,
morning:/rytas/i,
afternoon:/(die|popietė)/i,
evening:/vakaras/i,
night:/naktis/i
},
any:{
am:/^pr/i,
pm:/^popiet$/i,
midnight:/^vidurnaktis/i,
noon:/^(vidurdienis|perp)/i,
morning:/rytas/i,
afternoon:/(die|popietė)/i,
evening:/vakaras/i,
night:/naktis/i
}
},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/lv/_lib/formatDistance.js
function buildLocalizeTokenFn$2(schema){
return function(count,options){
if(count===1){if(options!==null&&options!==void 0&&options.addSuffix)return schema.one[0].replace("{{time}}",schema.one[2]);else
return schema.one[0].replace("{{time}}",schema.one[1]);}else
{
var rem=count%10===1&&count%100!==11;
if(options!==null&&options!==void 0&&options.addSuffix)return schema.other[0].replace("{{time}}",rem?schema.other[3]:schema.other[4]).replace("{{count}}",String(count));else
return schema.other[0].replace("{{time}}",rem?schema.other[1]:schema.other[2]).replace("{{count}}",String(count));
}
};
}
var formatDistanceLocale$33={
lessThanXSeconds:buildLocalizeTokenFn$2({
one:[
"mazāk par {{time}}",
"sekundi",
"sekundi"],

other:[
"mazāk nekā {{count}} {{time}}",
"sekunde",
"sekundes",
"sekundes",
"sekundēm"]

}),
xSeconds:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"sekunde",
"sekundes"],

other:[
"{{count}} {{time}}",
"sekunde",
"sekundes",
"sekundes",
"sekundēm"]

}),
halfAMinute:function halfAMinute(_count,options){
if(options!==null&&options!==void 0&&options.addSuffix)return"pusminūtes";else
return"pusminūte";
},
lessThanXMinutes:buildLocalizeTokenFn$2({
one:[
"mazāk par {{time}}",
"minūti",
"minūti"],

other:[
"mazāk nekā {{count}} {{time}}",
"minūte",
"minūtes",
"minūtes",
"minūtēm"]

}),
xMinutes:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"minūte",
"minūtes"],

other:[
"{{count}} {{time}}",
"minūte",
"minūtes",
"minūtes",
"minūtēm"]

}),
aboutXHours:buildLocalizeTokenFn$2({
one:[
"apmēram 1 {{time}}",
"stunda",
"stundas"],

other:[
"apmēram {{count}} {{time}}",
"stunda",
"stundas",
"stundas",
"stundām"]

}),
xHours:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"stunda",
"stundas"],

other:[
"{{count}} {{time}}",
"stunda",
"stundas",
"stundas",
"stundām"]

}),
xDays:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"diena",
"dienas"],

other:[
"{{count}} {{time}}",
"diena",
"dienas",
"dienas",
"dienām"]

}),
aboutXWeeks:buildLocalizeTokenFn$2({
one:[
"apmēram 1 {{time}}",
"nedēļa",
"nedēļas"],

other:[
"apmēram {{count}} {{time}}",
"nedēļa",
"nedēļu",
"nedēļas",
"nedēļām"]

}),
xWeeks:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"nedēļa",
"nedēļas"],

other:[
"{{count}} {{time}}",
"nedēļa",
"nedēļu",
"nedēļas",
"nedēļām"]

}),
aboutXMonths:buildLocalizeTokenFn$2({
one:[
"apmēram 1 {{time}}",
"mēnesis",
"mēneša"],

other:[
"apmēram {{count}} {{time}}",
"mēnesis",
"mēneši",
"mēneša",
"mēnešiem"]

}),
xMonths:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"mēnesis",
"mēneša"],

other:[
"{{count}} {{time}}",
"mēnesis",
"mēneši",
"mēneša",
"mēnešiem"]

}),
aboutXYears:buildLocalizeTokenFn$2({
one:[
"apmēram 1 {{time}}",
"gads",
"gada"],

other:[
"apmēram {{count}} {{time}}",
"gads",
"gadi",
"gada",
"gadiem"]

}),
xYears:buildLocalizeTokenFn$2({
one:[
"1 {{time}}",
"gads",
"gada"],

other:[
"{{count}} {{time}}",
"gads",
"gadi",
"gada",
"gadiem"]

}),
overXYears:buildLocalizeTokenFn$2({
one:[
"ilgāk par 1 {{time}}",
"gadu",
"gadu"],

other:[
"vairāk nekā {{count}} {{time}}",
"gads",
"gadi",
"gada",
"gadiem"]

}),
almostXYears:buildLocalizeTokenFn$2({
one:[
"gandrīz 1 {{time}}",
"gads",
"gada"],

other:[
"vairāk nekā {{count}} {{time}}",
"gads",
"gadi",
"gada",
"gadiem"]

})
};
var formatDistance$33=function formatDistance$33(token,count,options){
var result=formatDistanceLocale$33[token](count,options);
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"pēc "+result;else
return"pirms "+result;
return result;
};
var formatLong$33={
date:buildFormatLongFn({
formats:{
full:"EEEE, y. 'gada' d. MMMM",
long:"y. 'gada' d. MMMM",
medium:"dd.MM.y.",
short:"dd.MM.y."
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'plkst.' {{time}}",
long:"{{date}} 'plkst.' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/lv/_lib/formatRelative.js
var weekdays$1=[
"svētdienā",
"pirmdienā",
"otrdienā",
"trešdienā",
"ceturtdienā",
"piektdienā",
"sestdienā"];

var formatRelativeLocale$33={
lastWeek:function lastWeek(date,baseDate,options){
if(isSameWeek(date,baseDate,options))return"eeee 'plkst.' p";
return"'Pagājušā "+weekdays$1[date.getDay()]+" plkst.' p";
},
yesterday:"'Vakar plkst.' p",
today:"'Šodien plkst.' p",
tomorrow:"'Rīt plkst.' p",
nextWeek:function nextWeek(date,baseDate,options){
if(isSameWeek(date,baseDate,options))return"eeee 'plkst.' p";
return"'Nākamajā "+weekdays$1[date.getDay()]+" plkst.' p";
},
other:"P"
};
var formatRelative$33=function formatRelative$33(token,date,baseDate,options){
var format=formatRelativeLocale$33[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/lv/_lib/localize.js
var eraValues$33={
narrow:["p.m.ē","m.ē"],
abbreviated:["p. m. ē.","m. ē."],
wide:["pirms mūsu ēras","mūsu ērā"]
};
var quarterValues$33={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1. cet.",
"2. cet.",
"3. cet.",
"4. cet."],

wide:[
"pirmais ceturksnis",
"otrais ceturksnis",
"trešais ceturksnis",
"ceturtais ceturksnis"]

};
var formattingQuarterValues$1={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1. cet.",
"2. cet.",
"3. cet.",
"4. cet."],

wide:[
"pirmajā ceturksnī",
"otrajā ceturksnī",
"trešajā ceturksnī",
"ceturtajā ceturksnī"]

};
var monthValues$33={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"janv.",
"febr.",
"marts",
"apr.",
"maijs",
"jūn.",
"jūl.",
"aug.",
"sept.",
"okt.",
"nov.",
"dec."],

wide:[
"janvāris",
"februāris",
"marts",
"aprīlis",
"maijs",
"jūnijs",
"jūlijs",
"augusts",
"septembris",
"oktobris",
"novembris",
"decembris"]

};
var formattingMonthValues$7={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"janv.",
"febr.",
"martā",
"apr.",
"maijs",
"jūn.",
"jūl.",
"aug.",
"sept.",
"okt.",
"nov.",
"dec."],

wide:[
"janvārī",
"februārī",
"martā",
"aprīlī",
"maijā",
"jūnijā",
"jūlijā",
"augustā",
"septembrī",
"oktobrī",
"novembrī",
"decembrī"]

};
var dayValues$33={
narrow:[
"S",
"P",
"O",
"T",
"C",
"P",
"S"],

short:[
"Sv",
"P",
"O",
"T",
"C",
"Pk",
"S"],

abbreviated:[
"svētd.",
"pirmd.",
"otrd.",
"trešd.",
"ceturtd.",
"piektd.",
"sestd."],

wide:[
"svētdiena",
"pirmdiena",
"otrdiena",
"trešdiena",
"ceturtdiena",
"piektdiena",
"sestdiena"]

};
var formattingDayValues$1={
narrow:[
"S",
"P",
"O",
"T",
"C",
"P",
"S"],

short:[
"Sv",
"P",
"O",
"T",
"C",
"Pk",
"S"],

abbreviated:[
"svētd.",
"pirmd.",
"otrd.",
"trešd.",
"ceturtd.",
"piektd.",
"sestd."],

wide:[
"svētdienā",
"pirmdienā",
"otrdienā",
"trešdienā",
"ceturtdienā",
"piektdienā",
"sestdienā"]

};
var dayPeriodValues$33={
narrow:{
am:"am",
pm:"pm",
midnight:"pusn.",
noon:"pusd.",
morning:"rīts",
afternoon:"diena",
evening:"vakars",
night:"nakts"
},
abbreviated:{
am:"am",
pm:"pm",
midnight:"pusn.",
noon:"pusd.",
morning:"rīts",
afternoon:"pēcpusd.",
evening:"vakars",
night:"nakts"
},
wide:{
am:"am",
pm:"pm",
midnight:"pusnakts",
noon:"pusdienlaiks",
morning:"rīts",
afternoon:"pēcpusdiena",
evening:"vakars",
night:"nakts"
}
};
var formattingDayPeriodValues$25={
narrow:{
am:"am",
pm:"pm",
midnight:"pusn.",
noon:"pusd.",
morning:"rītā",
afternoon:"dienā",
evening:"vakarā",
night:"naktī"
},
abbreviated:{
am:"am",
pm:"pm",
midnight:"pusn.",
noon:"pusd.",
morning:"rītā",
afternoon:"pēcpusd.",
evening:"vakarā",
night:"naktī"
},
wide:{
am:"am",
pm:"pm",
midnight:"pusnaktī",
noon:"pusdienlaikā",
morning:"rītā",
afternoon:"pēcpusdienā",
evening:"vakarā",
night:"naktī"
}
};
var ordinalNumber$33=function ordinalNumber$33(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/lv.js
/**
* @category Locales
* @summary Latvian locale (Latvia).
* @language Latvian
* @iso-639-2 lav
* @author Rūdolfs Puķītis [@prudolfs](https://github.com/prudolfs)
*/
var _lv={
code:"lv",
formatDistance:formatDistance$33,
formatLong:formatLong$33,
formatRelative:formatRelative$33,
localize:{
ordinalNumber:ordinalNumber$33,
era:buildLocalizeFn({
values:eraValues$33,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$33,
defaultWidth:"wide",
formattingValues:formattingQuarterValues$1,
defaultFormattingWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$33,
defaultWidth:"wide",
formattingValues:formattingMonthValues$7,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$33,
defaultWidth:"wide",
formattingValues:formattingDayValues$1,
defaultFormattingWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$33,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$25,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(p\.m\.ē|m\.ē)/i,
abbreviated:/^(p\. m\. ē\.|m\. ē\.)/i,
wide:/^(pirms mūsu ēras|mūsu ērā)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^p/i,/^m/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](\. cet\.)/i,
wide:/^(pirma(is|jā)|otra(is|jā)|treša(is|jā)|ceturta(is|jā)) ceturksn(is|ī)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^1/i,
/^2/i,
/^3/i,
/^4/i],

abbreviated:[
/^1/i,
/^2/i,
/^3/i,
/^4/i],

wide:[
/^p/i,
/^o/i,
/^t/i,
/^c/i]

},
defaultParseWidth:"wide",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(janv\.|febr\.|marts|apr\.|maijs|jūn\.|jūl\.|aug\.|sept\.|okt\.|nov\.|dec\.)/i,
wide:/^(janvār(is|ī)|februār(is|ī)|mart[sā]|aprīl(is|ī)|maij[sā]|jūnij[sā]|jūlij[sā]|august[sā]|septembr(is|ī)|oktobr(is|ī)|novembr(is|ī)|decembr(is|ī))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^mai/i,
/^jūn/i,
/^jūl/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[spotc]/i,
short:/^(sv|pi|o|t|c|pk|s)/i,
abbreviated:/^(svētd\.|pirmd\.|otrd.\|trešd\.|ceturtd\.|piektd\.|sestd\.)/i,
wide:/^(svētdien(a|ā)|pirmdien(a|ā)|otrdien(a|ā)|trešdien(a|ā)|ceturtdien(a|ā)|piektdien(a|ā)|sestdien(a|ā))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^p/i,
/^o/i,
/^t/i,
/^c/i,
/^p/i,
/^s/i],

any:[
/^sv/i,
/^pi/i,
/^o/i,
/^t/i,
/^c/i,
/^p/i,
/^se/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(am|pm|pusn\.|pusd\.|rīt(s|ā)|dien(a|ā)|vakar(s|ā)|nakt(s|ī))/,
abbreviated:/^(am|pm|pusn\.|pusd\.|rīt(s|ā)|pēcpusd\.|vakar(s|ā)|nakt(s|ī))/,
wide:/^(am|pm|pusnakt(s|ī)|pusdienlaik(s|ā)|rīt(s|ā)|pēcpusdien(a|ā)|vakar(s|ā)|nakt(s|ī))/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^am/i,
pm:/^pm/i,
midnight:/^pusn/i,
noon:/^pusd/i,
morning:/^r/i,
afternoon:/^(d|pēc)/i,
evening:/^v/i,
night:/^n/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/mk/_lib/formatDistance.js
var formatDistanceLocale$32={
lessThanXSeconds:{
one:"помалку од секунда",
other:"помалку од {{count}} секунди"
},
xSeconds:{
one:"1 секунда",
other:"{{count}} секунди"
},
halfAMinute:"половина минута",
lessThanXMinutes:{
one:"помалку од минута",
other:"помалку од {{count}} минути"
},
xMinutes:{
one:"1 минута",
other:"{{count}} минути"
},
aboutXHours:{
one:"околу 1 час",
other:"околу {{count}} часа"
},
xHours:{
one:"1 час",
other:"{{count}} часа"
},
xDays:{
one:"1 ден",
other:"{{count}} дена"
},
aboutXWeeks:{
one:"околу 1 недела",
other:"околу {{count}} месеци"
},
xWeeks:{
one:"1 недела",
other:"{{count}} недели"
},
aboutXMonths:{
one:"околу 1 месец",
other:"околу {{count}} недели"
},
xMonths:{
one:"1 месец",
other:"{{count}} месеци"
},
aboutXYears:{
one:"околу 1 година",
other:"околу {{count}} години"
},
xYears:{
one:"1 година",
other:"{{count}} години"
},
overXYears:{
one:"повеќе од 1 година",
other:"повеќе од {{count}} години"
},
almostXYears:{
one:"безмалку 1 година",
other:"безмалку {{count}} години"
}
};
var formatDistance$32=function formatDistance$32(token,count,options){
var result;
var tokenValue=formatDistanceLocale$32[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"за "+result;else
return"пред "+result;
return result;
};
var formatLong$32={
date:buildFormatLongFn({
formats:{
full:"EEEE, dd MMMM yyyy",
long:"dd MMMM yyyy",
medium:"dd MMM yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}} {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/mk/_lib/formatRelative.js
var weekdays=[
"недела",
"понеделник",
"вторник",
"среда",
"четврток",
"петок",
"сабота"];

function lastWeek$3(day){
var weekday=weekdays[day];
switch(day){
case 0:
case 3:
case 6:return"'минатата "+weekday+" во' p";
case 1:
case 2:
case 4:
case 5:return"'минатиот "+weekday+" во' p";
}
}
function thisWeek$3(day){
var weekday=weekdays[day];
switch(day){
case 0:
case 3:
case 6:return"'ова "+weekday+" вo' p";
case 1:
case 2:
case 4:
case 5:return"'овој "+weekday+" вo' p";
}
}
function nextWeek$3(day){
var weekday=weekdays[day];
switch(day){
case 0:
case 3:
case 6:return"'следната "+weekday+" вo' p";
case 1:
case 2:
case 4:
case 5:return"'следниот "+weekday+" вo' p";
}
}
var formatRelativeLocale$32={
lastWeek:function lastWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$3(day);else
return lastWeek$3(day);
},
yesterday:"'вчера во' p",
today:"'денес во' p",
tomorrow:"'утре во' p",
nextWeek:function nextWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$3(day);else
return nextWeek$3(day);
},
other:"P"
};
var formatRelative$32=function formatRelative$32(token,date,baseDate,options){
var format=formatRelativeLocale$32[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/mk/_lib/localize.js
var eraValues$32={
narrow:["пр.н.е.","н.е."],
abbreviated:["пред н. е.","н. е."],
wide:["пред нашата ера","нашата ера"]
};
var quarterValues$32={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-ви кв.",
"2-ри кв.",
"3-ти кв.",
"4-ти кв."],

wide:[
"1-ви квартал",
"2-ри квартал",
"3-ти квартал",
"4-ти квартал"]

};
var monthValues$32={
abbreviated:[
"јан",
"фев",
"мар",
"апр",
"мај",
"јун",
"јул",
"авг",
"септ",
"окт",
"ноем",
"дек"],

wide:[
"јануари",
"февруари",
"март",
"април",
"мај",
"јуни",
"јули",
"август",
"септември",
"октомври",
"ноември",
"декември"]

};
var dayValues$32={
narrow:[
"Н",
"П",
"В",
"С",
"Ч",
"П",
"С"],

short:[
"не",
"по",
"вт",
"ср",
"че",
"пе",
"са"],

abbreviated:[
"нед",
"пон",
"вто",
"сре",
"чет",
"пет",
"саб"],

wide:[
"недела",
"понеделник",
"вторник",
"среда",
"четврток",
"петок",
"сабота"]

};
var dayPeriodValues$32={wide:{
am:"претпладне",
pm:"попладне",
midnight:"полноќ",
noon:"напладне",
morning:"наутро",
afternoon:"попладне",
evening:"навечер",
night:"ноќе"
}};
var ordinalNumber$32=function ordinalNumber$32(dirtyNumber,_options){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100>20||rem100<10)switch(rem100%10){
case 1:return number+"-ви";
case 2:return number+"-ри";
case 7:
case 8:return number+"-ми";
}
return number+"-ти";
};
//#endregion
//#region dist/date-fns/locale/mk.js
/**
* @category Locales
* @summary Macedonian locale.
* @language Macedonian
* @iso-639-2 mkd
* @author Petar Vlahu [@vlahupetar](https://github.com/vlahupetar)
* @author Altrim Beqiri [@altrim](https://github.com/altrim)
*/
var _mk={
code:"mk",
formatDistance:formatDistance$32,
formatLong:formatLong$32,
formatRelative:formatRelative$32,
localize:{
ordinalNumber:ordinalNumber$32,
era:buildLocalizeFn({
values:eraValues$32,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$32,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$32,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$32,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$32,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?[врмт][и])?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((пр)?н\.?\s?е\.?)/i,
abbreviated:/^((пр)?н\.?\s?е\.?)/i,
wide:/^(пред нашата ера|нашата ера)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^п/i,/^н/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?[врт]?и?)? кв.?/i,
wide:/^[1234](-?[врт]?и?)? квартал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
abbreviated:/^(јан|фев|мар|апр|мај|јун|јул|авг|сеп|окт|ноем|дек)/i,
wide:/^(јануари|февруари|март|април|мај|јуни|јули|август|септември|октомври|ноември|декември)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^ја/i,
/^Ф/i,
/^мар/i,
/^ап/i,
/^мај/i,
/^јун/i,
/^јул/i,
/^ав/i,
/^се/i,
/^окт/i,
/^но/i,
/^де/i]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[нпвсч]/i,
short:/^(не|по|вт|ср|че|пе|са)/i,
abbreviated:/^(нед|пон|вто|сре|чет|пет|саб)/i,
wide:/^(недела|понеделник|вторник|среда|четврток|петок|сабота)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^н/i,
/^п/i,
/^в/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i],

any:[
/^н[ед]/i,
/^п[он]/i,
/^вт/i,
/^ср/i,
/^ч[ет]/i,
/^п[ет]/i,
/^с[аб]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(претп|попл|полноќ|утро|пладне|вечер|ноќ)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/претпладне/i,
pm:/попладне/i,
midnight:/полноќ/i,
noon:/напладне/i,
morning:/наутро/i,
afternoon:/попладне/i,
evening:/навечер/i,
night:/ноќе/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/mn/_lib/formatDistance.js
var formatDistanceLocale$31={
lessThanXSeconds:{
one:"секунд хүрэхгүй",
other:"{{count}} секунд хүрэхгүй"
},
xSeconds:{
one:"1 секунд",
other:"{{count}} секунд"
},
halfAMinute:"хагас минут",
lessThanXMinutes:{
one:"минут хүрэхгүй",
other:"{{count}} минут хүрэхгүй"
},
xMinutes:{
one:"1 минут",
other:"{{count}} минут"
},
aboutXHours:{
one:"ойролцоогоор 1 цаг",
other:"ойролцоогоор {{count}} цаг"
},
xHours:{
one:"1 цаг",
other:"{{count}} цаг"
},
xDays:{
one:"1 өдөр",
other:"{{count}} өдөр"
},
aboutXWeeks:{
one:"ойролцоогоор 1 долоо хоног",
other:"ойролцоогоор {{count}} долоо хоног"
},
xWeeks:{
one:"1 долоо хоног",
other:"{{count}} долоо хоног"
},
aboutXMonths:{
one:"ойролцоогоор 1 сар",
other:"ойролцоогоор {{count}} сар"
},
xMonths:{
one:"1 сар",
other:"{{count}} сар"
},
aboutXYears:{
one:"ойролцоогоор 1 жил",
other:"ойролцоогоор {{count}} жил"
},
xYears:{
one:"1 жил",
other:"{{count}} жил"
},
overXYears:{
one:"1 жил гаран",
other:"{{count}} жил гаран"
},
almostXYears:{
one:"бараг 1 жил",
other:"бараг {{count}} жил"
}
};
var formatDistance$31=function formatDistance$31(token,count,options){
var result;
var tokenValue=formatDistanceLocale$31[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix){
/**
		* Append genitive case
		*/
var words=result.split(" ");
var lastword=words.pop();
result=words.join(" ");
switch(lastword){
case"секунд":
result+=" секундийн";
break;
case"минут":
result+=" минутын";
break;
case"цаг":
result+=" цагийн";
break;
case"өдөр":
result+=" өдрийн";
break;
case"сар":
result+=" сарын";
break;
case"жил":
result+=" жилийн";
break;
case"хоног":
result+=" хоногийн";
break;
case"гаран":
result+=" гараны";
break;
case"хүрэхгүй":
result+=" хүрэхгүй хугацааны";
break;
default:result+=lastword+"-н";
}
if(options.comparison&&options.comparison>0)return result+" дараа";else
return result+" өмнө";
}
return result;
};
var formatLong$31={
date:buildFormatLongFn({
formats:{
full:"y 'оны' MMMM'ын' d, EEEE 'гараг'",
long:"y 'оны' MMMM'ын' d",
medium:"y 'оны' MMM'ын' d",
short:"y.MM.dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/mn/_lib/formatRelative.js
var formatRelativeLocale$31={
lastWeek:"'өнгөрсөн' eeee 'гарагийн' p 'цагт'",
yesterday:"'өчигдөр' p 'цагт'",
today:"'өнөөдөр' p 'цагт'",
tomorrow:"'маргааш' p 'цагт'",
nextWeek:"'ирэх' eeee 'гарагийн' p 'цагт'",
other:"P"
};
var formatRelative$31=function formatRelative$31(token,_date,_baseDate,_options){return formatRelativeLocale$31[token];};
//#endregion
//#region dist/date-fns/locale/mn/_lib/localize.js
var eraValues$31={
narrow:["НТӨ","НТ"],
abbreviated:["НТӨ","НТ"],
wide:["нийтийн тооллын өмнөх","нийтийн тооллын"]
};
var quarterValues$31={
narrow:[
"I",
"II",
"III",
"IV"],

abbreviated:[
"I улирал",
"II улирал",
"III улирал",
"IV улирал"],

wide:[
"1-р улирал",
"2-р улирал",
"3-р улирал",
"4-р улирал"]

};
var monthValues$31={
narrow:[
"I",
"II",
"III",
"IV",
"V",
"VI",
"VII",
"VIII",
"IX",
"X",
"XI",
"XII"],

abbreviated:[
"1-р сар",
"2-р сар",
"3-р сар",
"4-р сар",
"5-р сар",
"6-р сар",
"7-р сар",
"8-р сар",
"9-р сар",
"10-р сар",
"11-р сар",
"12-р сар"],

wide:[
"Нэгдүгээр сар",
"Хоёрдугаар сар",
"Гуравдугаар сар",
"Дөрөвдүгээр сар",
"Тавдугаар сар",
"Зургаадугаар сар",
"Долоодугаар сар",
"Наймдугаар сар",
"Есдүгээр сар",
"Аравдугаар сар",
"Арваннэгдүгээр сар",
"Арван хоёрдугаар сар"]

};
var formattingMonthValues$6={
narrow:[
"I",
"II",
"III",
"IV",
"V",
"VI",
"VII",
"VIII",
"IX",
"X",
"XI",
"XII"],

abbreviated:[
"1-р сар",
"2-р сар",
"3-р сар",
"4-р сар",
"5-р сар",
"6-р сар",
"7-р сар",
"8-р сар",
"9-р сар",
"10-р сар",
"11-р сар",
"12-р сар"],

wide:[
"нэгдүгээр сар",
"хоёрдугаар сар",
"гуравдугаар сар",
"дөрөвдүгээр сар",
"тавдугаар сар",
"зургаадугаар сар",
"долоодугаар сар",
"наймдугаар сар",
"есдүгээр сар",
"аравдугаар сар",
"арваннэгдүгээр сар",
"арван хоёрдугаар сар"]

};
var dayValues$31={
narrow:[
"Н",
"Д",
"М",
"Л",
"П",
"Б",
"Б"],

short:[
"Ня",
"Да",
"Мя",
"Лх",
"Пү",
"Ба",
"Бя"],

abbreviated:[
"Ням",
"Дав",
"Мяг",
"Лха",
"Пүр",
"Баа",
"Бям"],

wide:[
"Ням",
"Даваа",
"Мягмар",
"Лхагва",
"Пүрэв",
"Баасан",
"Бямба"]

};
var formattingDayValues={
narrow:[
"Н",
"Д",
"М",
"Л",
"П",
"Б",
"Б"],

short:[
"Ня",
"Да",
"Мя",
"Лх",
"Пү",
"Ба",
"Бя"],

abbreviated:[
"Ням",
"Дав",
"Мяг",
"Лха",
"Пүр",
"Баа",
"Бям"],

wide:[
"ням",
"даваа",
"мягмар",
"лхагва",
"пүрэв",
"баасан",
"бямба"]

};
var dayPeriodValues$31={
narrow:{
am:"ү.ө.",
pm:"ү.х.",
midnight:"шөнө дунд",
noon:"үд дунд",
morning:"өглөө",
afternoon:"өдөр",
evening:"орой",
night:"шөнө"
},
abbreviated:{
am:"ү.ө.",
pm:"ү.х.",
midnight:"шөнө дунд",
noon:"үд дунд",
morning:"өглөө",
afternoon:"өдөр",
evening:"орой",
night:"шөнө"
},
wide:{
am:"ү.ө.",
pm:"ү.х.",
midnight:"шөнө дунд",
noon:"үд дунд",
morning:"өглөө",
afternoon:"өдөр",
evening:"орой",
night:"шөнө"
}
};
var ordinalNumber$31=function ordinalNumber$31(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/mn.js
/**
* @category Locales
* @summary Mongolian locale.
* @language Mongolian
* @iso-639-2 mon
* @author Bilguun Ochirbat [@bilguun0203](https://github.com/bilguun0203)
*/
var _mn={
code:"mn",
formatDistance:formatDistance$31,
formatLong:formatLong$31,
formatRelative:formatRelative$31,
localize:{
ordinalNumber:ordinalNumber$31,
era:buildLocalizeFn({
values:eraValues$31,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$31,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$31,
defaultWidth:"wide",
formattingValues:formattingMonthValues$6,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$31,
defaultWidth:"wide",
formattingValues:formattingDayValues,
defaultFormattingWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$31,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/\d+/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(нтө|нт)/i,
abbreviated:/^(нтө|нт)/i,
wide:/^(нийтийн тооллын өмнө|нийтийн тооллын)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(нтө|нийтийн тооллын өмнө)/i,/^(нт|нийтийн тооллын)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^(iv|iii|ii|i)/i,
abbreviated:/^(iv|iii|ii|i) улирал/i,
wide:/^[1-4]-р улирал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^(i(\s|$)|1)/i,
/^(ii(\s|$)|2)/i,
/^(iii(\s|$)|3)/i,
/^(iv(\s|$)|4)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)/i,
abbreviated:/^(1-р сар|2-р сар|3-р сар|4-р сар|5-р сар|6-р сар|7-р сар|8-р сар|9-р сар|10-р сар|11-р сар|12-р сар)/i,
wide:/^(нэгдүгээр сар|хоёрдугаар сар|гуравдугаар сар|дөрөвдүгээр сар|тавдугаар сар|зургаадугаар сар|долоодугаар сар|наймдугаар сар|есдүгээр сар|аравдугаар сар|арван нэгдүгээр сар|арван хоёрдугаар сар)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^i$/i,
/^ii$/i,
/^iii$/i,
/^iv$/i,
/^v$/i,
/^vi$/i,
/^vii$/i,
/^viii$/i,
/^ix$/i,
/^x$/i,
/^xi$/i,
/^xii$/i],

any:[
/^(1|нэгдүгээр)/i,
/^(2|хоёрдугаар)/i,
/^(3|гуравдугаар)/i,
/^(4|дөрөвдүгээр)/i,
/^(5|тавдугаар)/i,
/^(6|зургаадугаар)/i,
/^(7|долоодугаар)/i,
/^(8|наймдугаар)/i,
/^(9|есдүгээр)/i,
/^(10|аравдугаар)/i,
/^(11|арван нэгдүгээр)/i,
/^(12|арван хоёрдугаар)/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[ндмлпбб]/i,
short:/^(ня|да|мя|лх|пү|ба|бя)/i,
abbreviated:/^(ням|дав|мяг|лха|пүр|баа|бям)/i,
wide:/^(ням|даваа|мягмар|лхагва|пүрэв|баасан|бямба)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^н/i,
/^д/i,
/^м/i,
/^л/i,
/^п/i,
/^б/i,
/^б/i],

any:[
/^ня/i,
/^да/i,
/^мя/i,
/^лх/i,
/^пү/i,
/^ба/i,
/^бя/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ү\.ө\.|ү\.х\.|шөнө дунд|үд дунд|өглөө|өдөр|орой|шөнө)/i,
any:/^(ү\.ө\.|ү\.х\.|шөнө дунд|үд дунд|өглөө|өдөр|орой|шөнө)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ү\.ө\./i,
pm:/^ү\.х\./i,
midnight:/^шөнө дунд/i,
noon:/^үд дунд/i,
morning:/өглөө/i,
afternoon:/өдөр/i,
evening:/орой/i,
night:/шөнө/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ms/_lib/formatDistance.js
var formatDistanceLocale$30={
lessThanXSeconds:{
one:"kurang dari 1 saat",
other:"kurang dari {{count}} saat"
},
xSeconds:{
one:"1 saat",
other:"{{count}} saat"
},
halfAMinute:"setengah minit",
lessThanXMinutes:{
one:"kurang dari 1 minit",
other:"kurang dari {{count}} minit"
},
xMinutes:{
one:"1 minit",
other:"{{count}} minit"
},
aboutXHours:{
one:"sekitar 1 jam",
other:"sekitar {{count}} jam"
},
xHours:{
one:"1 jam",
other:"{{count}} jam"
},
xDays:{
one:"1 hari",
other:"{{count}} hari"
},
aboutXWeeks:{
one:"sekitar 1 minggu",
other:"sekitar {{count}} minggu"
},
xWeeks:{
one:"1 minggu",
other:"{{count}} minggu"
},
aboutXMonths:{
one:"sekitar 1 bulan",
other:"sekitar {{count}} bulan"
},
xMonths:{
one:"1 bulan",
other:"{{count}} bulan"
},
aboutXYears:{
one:"sekitar 1 tahun",
other:"sekitar {{count}} tahun"
},
xYears:{
one:"1 tahun",
other:"{{count}} tahun"
},
overXYears:{
one:"lebih dari 1 tahun",
other:"lebih dari {{count}} tahun"
},
almostXYears:{
one:"hampir 1 tahun",
other:"hampir {{count}} tahun"
}
};
var formatDistance$30=function formatDistance$30(token,count,options){
var result;
var tokenValue=formatDistanceLocale$30[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"dalam masa "+result;else
return result+" yang lalu";
return result;
};
var formatLong$30={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"d/M/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH.mm.ss",
long:"HH.mm.ss",
medium:"HH.mm",
short:"HH.mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'pukul' {{time}}",
long:"{{date}} 'pukul' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ms/_lib/formatRelative.js
var formatRelativeLocale$30={
lastWeek:"eeee 'lepas pada jam' p",
yesterday:"'Semalam pada jam' p",
today:"'Hari ini pada jam' p",
tomorrow:"'Esok pada jam' p",
nextWeek:"eeee 'pada jam' p",
other:"P"
};
var formatRelative$30=function formatRelative$30(token,_date,_baseDate,_options){return formatRelativeLocale$30[token];};
//#endregion
//#region dist/date-fns/locale/ms/_lib/localize.js
var eraValues$30={
narrow:["SM","M"],
abbreviated:["SM","M"],
wide:["Sebelum Masihi","Masihi"]
};
var quarterValues$30={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"S1",
"S2",
"S3",
"S4"],

wide:[
"Suku pertama",
"Suku kedua",
"Suku ketiga",
"Suku keempat"]

};
var monthValues$30={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"O",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Feb",
"Mac",
"Apr",
"Mei",
"Jun",
"Jul",
"Ogo",
"Sep",
"Okt",
"Nov",
"Dis"],

wide:[
"Januari",
"Februari",
"Mac",
"April",
"Mei",
"Jun",
"Julai",
"Ogos",
"September",
"Oktober",
"November",
"Disember"]

};
var dayValues$30={
narrow:[
"A",
"I",
"S",
"R",
"K",
"J",
"S"],

short:[
"Ahd",
"Isn",
"Sel",
"Rab",
"Kha",
"Jum",
"Sab"],

abbreviated:[
"Ahd",
"Isn",
"Sel",
"Rab",
"Kha",
"Jum",
"Sab"],

wide:[
"Ahad",
"Isnin",
"Selasa",
"Rabu",
"Khamis",
"Jumaat",
"Sabtu"]

};
var dayPeriodValues$30={
narrow:{
am:"am",
pm:"pm",
midnight:"tgh malam",
noon:"tgh hari",
morning:"pagi",
afternoon:"tengah hari",
evening:"petang",
night:"malam"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"tengah hari",
evening:"petang",
night:"malam"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"tengah hari",
evening:"petang",
night:"malam"
}
};
var formattingDayPeriodValues$24={
narrow:{
am:"am",
pm:"pm",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"tengah hari",
evening:"petang",
night:"malam"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"tengah hari",
evening:"petang",
night:"malam"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"tengah malam",
noon:"tengah hari",
morning:"pagi",
afternoon:"tengah hari",
evening:"petang",
night:"malam"
}
};
var ordinalNumber$30=function ordinalNumber$30(dirtyNumber,_options){
return"ke-"+Number(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ms.js
/**
* @category Locales
* @summary Malay locale.
* @language Malay
* @iso-639-2 msa
* @author Ruban Selvarajah [@Zyten](https://github.com/Zyten)
*/
var _ms={
code:"ms",
formatDistance:formatDistance$30,
formatLong:formatLong$30,
formatRelative:formatRelative$30,
localize:{
ordinalNumber:ordinalNumber$30,
era:buildLocalizeFn({
values:eraValues$30,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$30,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$30,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$30,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$30,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$24,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^ke-(\d+)?/i,
parsePattern:/petama|\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(sm|m)/i,
abbreviated:/^(s\.?\s?m\.?|m\.?)/i,
wide:/^(sebelum masihi|masihi)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^s/i,/^(m)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^S[1234]/i,
wide:/Suku (pertama|kedua|ketiga|keempat)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/pertama|1/i,
/kedua|2/i,
/ketiga|3/i,
/keempat|4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mac|apr|mei|jun|jul|ogo|sep|okt|nov|dis)/i,
wide:/^(januari|februari|mac|april|mei|jun|julai|ogos|september|oktober|november|disember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^o/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^ma/i,
/^ap/i,
/^me/i,
/^jun/i,
/^jul/i,
/^og/i,
/^s/i,
/^ok/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[aisrkj]/i,
short:/^(ahd|isn|sel|rab|kha|jum|sab)/i,
abbreviated:/^(ahd|isn|sel|rab|kha|jum|sab)/i,
wide:/^(ahad|isnin|selasa|rabu|khamis|jumaat|sabtu)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^a/i,
/^i/i,
/^s/i,
/^r/i,
/^k/i,
/^j/i,
/^s/i],

any:[
/^a/i,
/^i/i,
/^se/i,
/^r/i,
/^k/i,
/^j/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(am|pm|tengah malam|tengah hari|pagi|petang|malam)/i,
any:/^([ap]\.?\s?m\.?|tengah malam|tengah hari|pagi|petang|malam)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^pm/i,
midnight:/^tengah m/i,
noon:/^tengah h/i,
morning:/pa/i,
afternoon:/tengah h/i,
evening:/pe/i,
night:/m/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/mt/_lib/formatDistance.js
var formatDistanceLocale$29={
lessThanXSeconds:{
one:"inqas minn sekonda",
other:"inqas minn {{count}} sekondi"
},
xSeconds:{
one:"sekonda",
other:"{{count}} sekondi"
},
halfAMinute:"nofs minuta",
lessThanXMinutes:{
one:"inqas minn minuta",
other:"inqas minn {{count}} minuti"
},
xMinutes:{
one:"minuta",
other:"{{count}} minuti"
},
aboutXHours:{
one:"madwar siegħa",
other:"madwar {{count}} siegħat"
},
xHours:{
one:"siegħa",
other:"{{count}} siegħat"
},
xDays:{
one:"ġurnata",
other:"{{count}} ġranet"
},
aboutXWeeks:{
one:"madwar ġimgħa",
other:"madwar {{count}} ġimgħat"
},
xWeeks:{
one:"ġimgħa",
other:"{{count}} ġimgħat"
},
aboutXMonths:{
one:"madwar xahar",
other:"madwar {{count}} xhur"
},
xMonths:{
one:"xahar",
other:"{{count}} xhur"
},
aboutXYears:{
one:"madwar sena",
two:"madwar sentejn",
other:"madwar {{count}} snin"
},
xYears:{
one:"sena",
two:"sentejn",
other:"{{count}} snin"
},
overXYears:{
one:"aktar minn sena",
two:"aktar minn sentejn",
other:"aktar minn {{count}} snin"
},
almostXYears:{
one:"kważi sena",
two:"kważi sentejn",
other:"kważi {{count}} snin"
}
};
var formatDistance$29=function formatDistance$29(token,count,options){
var result;
var tokenValue=formatDistanceLocale$29[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
if(count===2&&tokenValue.two)result=tokenValue.two;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"f'"+result;else
return result+" ilu";
return result;
};
var formatLong$29={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/mt/_lib/formatRelative.js
var formatRelativeLocale$29={
lastWeek:"eeee 'li għadda' 'fil-'p",
yesterday:"'Il-bieraħ fil-'p",
today:"'Illum fil-'p",
tomorrow:"'Għada fil-'p",
nextWeek:"eeee 'fil-'p",
other:"P"
};
var formatRelative$29=function formatRelative$29(token,_date,_baseDate,_options){return formatRelativeLocale$29[token];};
//#endregion
//#region dist/date-fns/locale/mt/_lib/localize.js
var eraValues$29={
narrow:["Q","W"],
abbreviated:["QK","WK"],
wide:["qabel Kristu","wara Kristu"]
};
var quarterValues$29={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1. kwart",
"2. kwart",
"3. kwart",
"4. kwart"]

};
var monthValues$29={
narrow:[
"J",
"F",
"M",
"A",
"M",
"Ġ",
"L",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Jan",
"Fra",
"Mar",
"Apr",
"Mej",
"Ġun",
"Lul",
"Aww",
"Set",
"Ott",
"Nov",
"Diċ"],

wide:[
"Jannar",
"Frar",
"Marzu",
"April",
"Mejju",
"Ġunju",
"Lulju",
"Awwissu",
"Settembru",
"Ottubru",
"Novembru",
"Diċembru"]

};
var dayValues$29={
narrow:[
"Ħ",
"T",
"T",
"E",
"Ħ",
"Ġ",
"S"],

short:[
"Ħa",
"Tn",
"Tl",
"Er",
"Ħa",
"Ġi",
"Si"],

abbreviated:[
"Ħad",
"Tne",
"Tli",
"Erb",
"Ħam",
"Ġim",
"Sib"],

wide:[
"Il-Ħadd",
"It-Tnejn",
"It-Tlieta",
"L-Erbgħa",
"Il-Ħamis",
"Il-Ġimgħa",
"Is-Sibt"]

};
var dayPeriodValues$29={
narrow:{
am:"a",
pm:"p",
midnight:"nofsillejl",
noon:"nofsinhar",
morning:"għodwa",
afternoon:"wara nofsinhar",
evening:"filgħaxija",
night:"lejl"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"nofsillejl",
noon:"nofsinhar",
morning:"għodwa",
afternoon:"wara nofsinhar",
evening:"filgħaxija",
night:"lejl"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"nofsillejl",
noon:"nofsinhar",
morning:"għodwa",
afternoon:"wara nofsinhar",
evening:"filgħaxija",
night:"lejl"
}
};
var formattingDayPeriodValues$23={
narrow:{
am:"a",
pm:"p",
midnight:"f'nofsillejl",
noon:"f'nofsinhar",
morning:"filgħodu",
afternoon:"wara nofsinhar",
evening:"filgħaxija",
night:"billejl"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"f'nofsillejl",
noon:"f'nofsinhar",
morning:"filgħodu",
afternoon:"wara nofsinhar",
evening:"filgħaxija",
night:"billejl"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"f'nofsillejl",
noon:"f'nofsinhar",
morning:"filgħodu",
afternoon:"wara nofsinhar",
evening:"filgħaxija",
night:"billejl"
}
};
var ordinalNumber$29=function ordinalNumber$29(dirtyNumber,_options){
return Number(dirtyNumber)+"º";
};
//#endregion
//#region dist/date-fns/locale/mt.js
/**
* @category Locales
* @summary Maltese locale.
* @language Maltese
* @iso-639-2 mlt
* @author Andras Matzon [@amatzon](@link https://github.com/amatzon)
* @author Bryan Borg [@bryanMt](@link https://github.com/bryanMt)
*/
var _mt={
code:"mt",
formatDistance:formatDistance$29,
formatLong:formatLong$29,
formatRelative:formatRelative$29,
localize:{
ordinalNumber:ordinalNumber$29,
era:buildLocalizeFn({
values:eraValues$29,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$29,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$29,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$29,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$29,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$23,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(º)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(q|w)/i,
abbreviated:/^(q\.?\s?k\.?|b\.?\s?c\.?\s?e\.?|w\.?\s?k\.?)/i,
wide:/^(qabel kristu|before common era|wara kristu|common era)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(q|b)/i,/^(w|c)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^k[1234]/i,
wide:/^[1234](\.)? kwart/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmaglsond]/i,
abbreviated:/^(jan|fra|mar|apr|mej|ġun|lul|aww|set|ott|nov|diċ)/i,
wide:/^(jannar|frar|marzu|april|mejju|ġunju|lulju|awwissu|settembru|ottubru|novembru|diċembru)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^ġ/i,
/^l/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^mej/i,
/^ġ/i,
/^l/i,
/^aw/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[ħteġs]/i,
short:/^(ħa|tn|tl|er|ħa|ġi|si)/i,
abbreviated:/^(ħad|tne|tli|erb|ħam|ġim|sib)/i,
wide:/^(il-ħadd|it-tnejn|it-tlieta|l-erbgħa|il-ħamis|il-ġimgħa|is-sibt)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ħ/i,
/^t/i,
/^t/i,
/^e/i,
/^ħ/i,
/^ġ/i,
/^s/i],

any:[
/^(il-)?ħad/i,
/^(it-)?tn/i,
/^(it-)?tl/i,
/^(l-)?er/i,
/^(il-)?ham/i,
/^(il-)?ġi/i,
/^(is-)?si/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|f'nofsillejl|f'nofsinhar|(ta') (għodwa|wara nofsinhar|filgħaxija|lejl))/i,
any:/^([ap]\.?\s?m\.?|f'nofsillejl|f'nofsinhar|(ta') (għodwa|wara nofsinhar|filgħaxija|lejl))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^f'nofsillejl/i,
noon:/^f'nofsinhar/i,
morning:/għodwa/i,
afternoon:/wara(\s.*)nofsinhar/i,
evening:/filgħaxija/i,
night:/lejl/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/nb/_lib/formatDistance.js
var formatDistanceLocale$28={
lessThanXSeconds:{
one:"mindre enn ett sekund",
other:"mindre enn {{count}} sekunder"
},
xSeconds:{
one:"ett sekund",
other:"{{count}} sekunder"
},
halfAMinute:"et halvt minutt",
lessThanXMinutes:{
one:"mindre enn ett minutt",
other:"mindre enn {{count}} minutter"
},
xMinutes:{
one:"ett minutt",
other:"{{count}} minutter"
},
aboutXHours:{
one:"omtrent en time",
other:"omtrent {{count}} timer"
},
xHours:{
one:"en time",
other:"{{count}} timer"
},
xDays:{
one:"en dag",
other:"{{count}} dager"
},
aboutXWeeks:{
one:"omtrent en uke",
other:"omtrent {{count}} uker"
},
xWeeks:{
one:"en uke",
other:"{{count}} uker"
},
aboutXMonths:{
one:"omtrent en måned",
other:"omtrent {{count}} måneder"
},
xMonths:{
one:"en måned",
other:"{{count}} måneder"
},
aboutXYears:{
one:"omtrent ett år",
other:"omtrent {{count}} år"
},
xYears:{
one:"ett år",
other:"{{count}} år"
},
overXYears:{
one:"over ett år",
other:"over {{count}} år"
},
almostXYears:{
one:"nesten ett år",
other:"nesten {{count}} år"
}
};
var formatDistance$28=function formatDistance$28(token,count,options){
var result;
var tokenValue=formatDistanceLocale$28[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"om "+result;else
return result+" siden";
return result;
};
var formatLong$28={
date:buildFormatLongFn({
formats:{
full:"EEEE d. MMMM y",
long:"d. MMMM y",
medium:"d. MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"'kl'. HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'kl.' {{time}}",
long:"{{date}} 'kl.' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/nb/_lib/formatRelative.js
var formatRelativeLocale$28={
lastWeek:"'forrige' eeee 'kl.' p",
yesterday:"'i går kl.' p",
today:"'i dag kl.' p",
tomorrow:"'i morgen kl.' p",
nextWeek:"EEEE 'kl.' p",
other:"P"
};
var formatRelative$28=function formatRelative$28(token,_date,_baseDate,_options){return formatRelativeLocale$28[token];};
//#endregion
//#region dist/date-fns/locale/nb/_lib/localize.js
var eraValues$28={
narrow:["f.Kr.","e.Kr."],
abbreviated:["f.Kr.","e.Kr."],
wide:["før Kristus","etter Kristus"]
};
var quarterValues$28={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$28={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mars",
"apr.",
"mai",
"juni",
"juli",
"aug.",
"sep.",
"okt.",
"nov.",
"des."],

wide:[
"januar",
"februar",
"mars",
"april",
"mai",
"juni",
"juli",
"august",
"september",
"oktober",
"november",
"desember"]

};
var dayValues$28={
narrow:[
"S",
"M",
"T",
"O",
"T",
"F",
"L"],

short:[
"sø",
"ma",
"ti",
"on",
"to",
"fr",
"lø"],

abbreviated:[
"søn",
"man",
"tir",
"ons",
"tor",
"fre",
"lør"],

wide:[
"søndag",
"mandag",
"tirsdag",
"onsdag",
"torsdag",
"fredag",
"lørdag"]

};
var dayPeriodValues$28={
narrow:{
am:"a",
pm:"p",
midnight:"midnatt",
noon:"middag",
morning:"på morg.",
afternoon:"på etterm.",
evening:"på kvelden",
night:"på natten"
},
abbreviated:{
am:"a.m.",
pm:"p.m.",
midnight:"midnatt",
noon:"middag",
morning:"på morg.",
afternoon:"på etterm.",
evening:"på kvelden",
night:"på natten"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"midnatt",
noon:"middag",
morning:"på morgenen",
afternoon:"på ettermiddagen",
evening:"på kvelden",
night:"på natten"
}
};
var ordinalNumber$28=function ordinalNumber$28(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/nb.js
/**
* @category Locales
* @summary Norwegian Bokmål locale.
* @language Norwegian Bokmål
* @iso-639-2 nob
* @author Hans-Kristian Koren [@Hanse](https://github.com/Hanse)
* @author Mikolaj Grzyb [@mikolajgrzyb](https://github.com/mikolajgrzyb)
* @author Dag Stuan [@dagstuan](https://github.com/dagstuan)
*/
var _nb={
code:"nb",
formatDistance:formatDistance$28,
formatLong:formatLong$28,
formatRelative:formatRelative$28,
localize:{
ordinalNumber:ordinalNumber$28,
era:buildLocalizeFn({
values:eraValues$28,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$28,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$28,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$28,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$28,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\.?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
abbreviated:/^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
wide:/^(før Kristus|før vår tid|etter Kristus|vår tid)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^f/i,/^e/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](\.)? kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
wide:/^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^mai/i,
/^jun/i,
/^jul/i,
/^aug/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtofl]/i,
short:/^(sø|ma|ti|on|to|fr|lø)/i,
abbreviated:/^(søn|man|tir|ons|tor|fre|lør)/i,
wide:/^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^s/i,
/^m/i,
/^ti/i,
/^o/i,
/^to/i,
/^f/i,
/^l/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten)|[ap])/i,
any:/^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a(\.?\s?m\.?)?$/i,
pm:/^p(\.?\s?m\.?)?$/i,
midnight:/^midn/i,
noon:/^midd/i,
morning:/morgen/i,
afternoon:/ettermiddag/i,
evening:/kveld/i,
night:/natt/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/nl/_lib/formatDistance.js
var formatDistanceLocale$27={
lessThanXSeconds:{
one:"minder dan een seconde",
other:"minder dan {{count}} seconden"
},
xSeconds:{
one:"1 seconde",
other:"{{count}} seconden"
},
halfAMinute:"een halve minuut",
lessThanXMinutes:{
one:"minder dan een minuut",
other:"minder dan {{count}} minuten"
},
xMinutes:{
one:"een minuut",
other:"{{count}} minuten"
},
aboutXHours:{
one:"ongeveer 1 uur",
other:"ongeveer {{count}} uur"
},
xHours:{
one:"1 uur",
other:"{{count}} uur"
},
xDays:{
one:"1 dag",
other:"{{count}} dagen"
},
aboutXWeeks:{
one:"ongeveer 1 week",
other:"ongeveer {{count}} weken"
},
xWeeks:{
one:"1 week",
other:"{{count}} weken"
},
aboutXMonths:{
one:"ongeveer 1 maand",
other:"ongeveer {{count}} maanden"
},
xMonths:{
one:"1 maand",
other:"{{count}} maanden"
},
aboutXYears:{
one:"ongeveer 1 jaar",
other:"ongeveer {{count}} jaar"
},
xYears:{
one:"1 jaar",
other:"{{count}} jaar"
},
overXYears:{
one:"meer dan 1 jaar",
other:"meer dan {{count}} jaar"
},
almostXYears:{
one:"bijna 1 jaar",
other:"bijna {{count}} jaar"
}
};
var formatDistance$27=function formatDistance$27(token,count,options){
var result;
var tokenValue=formatDistanceLocale$27[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"over "+result;else
return result+" geleden";
return result;
};
var formatLong$27={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd-MM-y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'om' {{time}}",
long:"{{date}} 'om' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/nl/_lib/formatRelative.js
var formatRelativeLocale$27={
lastWeek:"'afgelopen' eeee 'om' p",
yesterday:"'gisteren om' p",
today:"'vandaag om' p",
tomorrow:"'morgen om' p",
nextWeek:"eeee 'om' p",
other:"P"
};
var formatRelative$27=function formatRelative$27(token,_date,_baseDate,_options){return formatRelativeLocale$27[token];};
//#endregion
//#region dist/date-fns/locale/nl/_lib/localize.js
var eraValues$27={
narrow:["v.C.","n.C."],
abbreviated:["v.Chr.","n.Chr."],
wide:["voor Christus","na Christus"]
};
var quarterValues$27={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1e kwartaal",
"2e kwartaal",
"3e kwartaal",
"4e kwartaal"]

};
var monthValues$27={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mrt.",
"apr.",
"mei",
"jun.",
"jul.",
"aug.",
"sep.",
"okt.",
"nov.",
"dec."],

wide:[
"januari",
"februari",
"maart",
"april",
"mei",
"juni",
"juli",
"augustus",
"september",
"oktober",
"november",
"december"]

};
var dayValues$27={
narrow:[
"Z",
"M",
"D",
"W",
"D",
"V",
"Z"],

short:[
"zo",
"ma",
"di",
"wo",
"do",
"vr",
"za"],

abbreviated:[
"zon",
"maa",
"din",
"woe",
"don",
"vri",
"zat"],

wide:[
"zondag",
"maandag",
"dinsdag",
"woensdag",
"donderdag",
"vrijdag",
"zaterdag"]

};
var dayPeriodValues$27={
narrow:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"het middaguur",
morning:"'s ochtends",
afternoon:"'s middags",
evening:"'s avonds",
night:"'s nachts"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"het middaguur",
morning:"'s ochtends",
afternoon:"'s middags",
evening:"'s avonds",
night:"'s nachts"
},
wide:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"het middaguur",
morning:"'s ochtends",
afternoon:"'s middags",
evening:"'s avonds",
night:"'s nachts"
}
};
var ordinalNumber$27=function ordinalNumber$27(dirtyNumber,_options){
return Number(dirtyNumber)+"e";
};
//#endregion
//#region dist/date-fns/locale/nl.js
/**
* @category Locales
* @summary Dutch locale.
* @language Dutch
* @iso-639-2 nld
* @author Jorik Tangelder [@jtangelder](https://github.com/jtangelder)
* @author Ruben Stolk [@rubenstolk](https://github.com/rubenstolk)
* @author Lode Vanhove [@bitcrumb](https://github.com/bitcrumb)
* @author Edo Rivai [@edorivai](https://github.com/edorivai)
* @author Niels Keurentjes [@curry684](https://github.com/curry684)
* @author Stefan Vermaas [@stefanvermaas](https://github.com/stefanvermaas)
*/
var _nl={
code:"nl",
formatDistance:formatDistance$27,
formatLong:formatLong$27,
formatRelative:formatRelative$27,
localize:{
ordinalNumber:ordinalNumber$27,
era:buildLocalizeFn({
values:eraValues$27,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$27,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$27,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$27,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$27,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)e?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^([vn]\.? ?C\.?)/,
abbreviated:/^([vn]\. ?Chr\.?)/,
wide:/^((voor|na) Christus)/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^v/,/^n/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^K[1234]/i,
wide:/^[1234]e kwartaal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan.|feb.|mrt.|apr.|mei|jun.|jul.|aug.|sep.|okt.|nov.|dec.)/i,
wide:/^(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^jan/i,
/^feb/i,
/^m(r|a)/i,
/^apr/i,
/^mei/i,
/^jun/i,
/^jul/i,
/^aug/i,
/^sep/i,
/^okt/i,
/^nov/i,
/^dec/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[zmdwv]/i,
short:/^(zo|ma|di|wo|do|vr|za)/i,
abbreviated:/^(zon|maa|din|woe|don|vri|zat)/i,
wide:/^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^z/i,
/^m/i,
/^d/i,
/^w/i,
/^d/i,
/^v/i,
/^z/i],

any:[
/^zo/i,
/^ma/i,
/^di/i,
/^wo/i,
/^do/i,
/^vr/i,
/^za/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|middernacht|het middaguur|'s (ochtends|middags|avonds|nachts))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^am/i,
pm:/^pm/i,
midnight:/^middernacht/i,
noon:/^het middaguur/i,
morning:/ochtend/i,
afternoon:/middag/i,
evening:/avond/i,
night:/nacht/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/nl-BE/_lib/formatDistance.js
var formatDistanceLocale$26={
lessThanXSeconds:{
one:"minder dan een seconde",
other:"minder dan {{count}} seconden"
},
xSeconds:{
one:"1 seconde",
other:"{{count}} seconden"
},
halfAMinute:"een halve minuut",
lessThanXMinutes:{
one:"minder dan een minuut",
other:"minder dan {{count}} minuten"
},
xMinutes:{
one:"een minuut",
other:"{{count}} minuten"
},
aboutXHours:{
one:"ongeveer 1 uur",
other:"ongeveer {{count}} uur"
},
xHours:{
one:"1 uur",
other:"{{count}} uur"
},
xDays:{
one:"1 dag",
other:"{{count}} dagen"
},
aboutXWeeks:{
one:"ongeveer 1 week",
other:"ongeveer {{count}} weken"
},
xWeeks:{
one:"1 week",
other:"{{count}} weken"
},
aboutXMonths:{
one:"ongeveer 1 maand",
other:"ongeveer {{count}} maanden"
},
xMonths:{
one:"1 maand",
other:"{{count}} maanden"
},
aboutXYears:{
one:"ongeveer 1 jaar",
other:"ongeveer {{count}} jaar"
},
xYears:{
one:"1 jaar",
other:"{{count}} jaar"
},
overXYears:{
one:"meer dan 1 jaar",
other:"meer dan {{count}} jaar"
},
almostXYears:{
one:"bijna 1 jaar",
other:"bijna {{count}} jaar"
}
};
var formatDistance$26=function formatDistance$26(token,count,options){
var result;
var tokenValue=formatDistanceLocale$26[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"over "+result;else
return result+" geleden";
return result;
};
var formatLong$26={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'om' {{time}}",
long:"{{date}} 'om' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/nl-BE/_lib/formatRelative.js
var formatRelativeLocale$26={
lastWeek:"'vorige' eeee 'om' p",
yesterday:"'gisteren om' p",
today:"'vandaag om' p",
tomorrow:"'morgen om' p",
nextWeek:"eeee 'om' p",
other:"P"
};
var formatRelative$26=function formatRelative$26(token,_date,_baseDate,_options){return formatRelativeLocale$26[token];};
//#endregion
//#region dist/date-fns/locale/nl-BE/_lib/localize.js
var eraValues$26={
narrow:["v.C.","n.C."],
abbreviated:["v.Chr.","n.Chr."],
wide:["voor Christus","na Christus"]
};
var quarterValues$26={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"K1",
"K2",
"K3",
"K4"],

wide:[
"1e kwartaal",
"2e kwartaal",
"3e kwartaal",
"4e kwartaal"]

};
var monthValues$26={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mrt.",
"apr.",
"mei",
"jun.",
"jul.",
"aug.",
"sep.",
"okt.",
"nov.",
"dec."],

wide:[
"januari",
"februari",
"maart",
"april",
"mei",
"juni",
"juli",
"augustus",
"september",
"oktober",
"november",
"december"]

};
var dayValues$26={
narrow:[
"Z",
"M",
"D",
"W",
"D",
"V",
"Z"],

short:[
"zo",
"ma",
"di",
"wo",
"do",
"vr",
"za"],

abbreviated:[
"zon",
"maa",
"din",
"woe",
"don",
"vri",
"zat"],

wide:[
"zondag",
"maandag",
"dinsdag",
"woensdag",
"donderdag",
"vrijdag",
"zaterdag"]

};
var dayPeriodValues$26={
narrow:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"het middag",
morning:"'s ochtends",
afternoon:"'s namiddags",
evening:"'s avonds",
night:"'s nachts"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"het middag",
morning:"'s ochtends",
afternoon:"'s namiddags",
evening:"'s avonds",
night:"'s nachts"
},
wide:{
am:"AM",
pm:"PM",
midnight:"middernacht",
noon:"het middag",
morning:"'s ochtends",
afternoon:"'s namiddags",
evening:"'s avonds",
night:"'s nachts"
}
};
var ordinalNumber$26=function ordinalNumber$26(dirtyNumber,_options){
return Number(dirtyNumber)+"e";
};
//#endregion
//#region dist/date-fns/locale/nl-BE.js
/**
* @category Locales
* @summary Dutch locale.
* @language Dutch
* @iso-639-2 nld
* @author Jorik Tangelder [@jtangelder](https://github.com/jtangelder)
* @author Ruben Stolk [@rubenstolk](https://github.com/rubenstolk)
* @author Lode Vanhove [@bitcrumb](https://github.com/bitcrumb)
* @author Alex Hoeing [@dcbn](https://github.com/dcbn)
*/
var _nlBE={
code:"nl-BE",
formatDistance:formatDistance$26,
formatLong:formatLong$26,
formatRelative:formatRelative$26,
localize:{
ordinalNumber:ordinalNumber$26,
era:buildLocalizeFn({
values:eraValues$26,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$26,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$26,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$26,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$26,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)e?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^([vn]\.? ?C\.?)/,
abbreviated:/^([vn]\. ?Chr\.?)/,
wide:/^((voor|na) Christus)/
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^v/,/^n/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^K[1234]/i,
wide:/^[1234]e kwartaal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan.|feb.|mrt.|apr.|mei|jun.|jul.|aug.|sep.|okt.|nov.|dec.)/i,
wide:/^(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^jan/i,
/^feb/i,
/^m(r|a)/i,
/^apr/i,
/^mei/i,
/^jun/i,
/^jul/i,
/^aug/i,
/^sep/i,
/^okt/i,
/^nov/i,
/^dec/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[zmdwv]/i,
short:/^(zo|ma|di|wo|do|vr|za)/i,
abbreviated:/^(zon|maa|din|woe|don|vri|zat)/i,
wide:/^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^z/i,
/^m/i,
/^d/i,
/^w/i,
/^d/i,
/^v/i,
/^z/i],

any:[
/^zo/i,
/^ma/i,
/^di/i,
/^wo/i,
/^do/i,
/^vr/i,
/^za/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|middernacht|het middaguur|'s (ochtends|middags|avonds|nachts))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^am/i,
pm:/^pm/i,
midnight:/^middernacht/i,
noon:/^het middaguur/i,
morning:/ochtend/i,
afternoon:/middag/i,
evening:/avond/i,
night:/nacht/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/nn/_lib/formatDistance.js
var formatDistanceLocale$25={
lessThanXSeconds:{
one:"mindre enn eitt sekund",
other:"mindre enn {{count}} sekund"
},
xSeconds:{
one:"eitt sekund",
other:"{{count}} sekund"
},
halfAMinute:"eit halvt minutt",
lessThanXMinutes:{
one:"mindre enn eitt minutt",
other:"mindre enn {{count}} minutt"
},
xMinutes:{
one:"eitt minutt",
other:"{{count}} minutt"
},
aboutXHours:{
one:"omtrent ein time",
other:"omtrent {{count}} timar"
},
xHours:{
one:"ein time",
other:"{{count}} timar"
},
xDays:{
one:"ein dag",
other:"{{count}} dagar"
},
aboutXWeeks:{
one:"omtrent ei veke",
other:"omtrent {{count}} veker"
},
xWeeks:{
one:"ei veke",
other:"{{count}} veker"
},
aboutXMonths:{
one:"omtrent ein månad",
other:"omtrent {{count}} månader"
},
xMonths:{
one:"ein månad",
other:"{{count}} månader"
},
aboutXYears:{
one:"omtrent eitt år",
other:"omtrent {{count}} år"
},
xYears:{
one:"eitt år",
other:"{{count}} år"
},
overXYears:{
one:"over eitt år",
other:"over {{count}} år"
},
almostXYears:{
one:"nesten eitt år",
other:"nesten {{count}} år"
}
};
var wordMapping$1=[
"null",
"ein",
"to",
"tre",
"fire",
"fem",
"seks",
"sju",
"åtte",
"ni",
"ti",
"elleve",
"tolv"];

var formatDistance$25=function formatDistance$25(token,count,options){
var result;
var tokenValue=formatDistanceLocale$25[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count<13?wordMapping$1[count]:String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"om "+result;else
return result+" sidan";
return result;
};
var formatLong$25={
date:buildFormatLongFn({
formats:{
full:"EEEE d. MMMM y",
long:"d. MMMM y",
medium:"d. MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"'kl'. HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'kl.' {{time}}",
long:"{{date}} 'kl.' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/nn/_lib/formatRelative.js
var formatRelativeLocale$25={
lastWeek:"'førre' eeee 'kl.' p",
yesterday:"'i går kl.' p",
today:"'i dag kl.' p",
tomorrow:"'i morgon kl.' p",
nextWeek:"EEEE 'kl.' p",
other:"P"
};
var formatRelative$25=function formatRelative$25(token,_date,_baseDate,_options){return formatRelativeLocale$25[token];};
//#endregion
//#region dist/date-fns/locale/nn/_lib/localize.js
var eraValues$25={
narrow:["f.Kr.","e.Kr."],
abbreviated:["f.Kr.","e.Kr."],
wide:["før Kristus","etter Kristus"]
};
var quarterValues$25={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$25={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mars",
"apr.",
"mai",
"juni",
"juli",
"aug.",
"sep.",
"okt.",
"nov.",
"des."],

wide:[
"januar",
"februar",
"mars",
"april",
"mai",
"juni",
"juli",
"august",
"september",
"oktober",
"november",
"desember"]

};
var dayValues$25={
narrow:[
"S",
"M",
"T",
"O",
"T",
"F",
"L"],

short:[
"su",
"må",
"ty",
"on",
"to",
"fr",
"lau"],

abbreviated:[
"sun",
"mån",
"tys",
"ons",
"tor",
"fre",
"laur"],

wide:[
"sundag",
"måndag",
"tysdag",
"onsdag",
"torsdag",
"fredag",
"laurdag"]

};
var dayPeriodValues$25={
narrow:{
am:"a",
pm:"p",
midnight:"midnatt",
noon:"middag",
morning:"på morg.",
afternoon:"på etterm.",
evening:"på kvelden",
night:"på natta"
},
abbreviated:{
am:"a.m.",
pm:"p.m.",
midnight:"midnatt",
noon:"middag",
morning:"på morg.",
afternoon:"på etterm.",
evening:"på kvelden",
night:"på natta"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"midnatt",
noon:"middag",
morning:"på morgonen",
afternoon:"på ettermiddagen",
evening:"på kvelden",
night:"på natta"
}
};
var ordinalNumber$25=function ordinalNumber$25(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/nn.js
/**
* @category Locales
* @summary Norwegian Nynorsk locale.
* @language Norwegian Nynorsk
* @iso-639-2 nno
* @author Mats Byrkjeland [@draperunner](https://github.com/draperunner)
*/
var _nn={
code:"nn",
formatDistance:formatDistance$25,
formatLong:formatLong$25,
formatRelative:formatRelative$25,
localize:{
ordinalNumber:ordinalNumber$25,
era:buildLocalizeFn({
values:eraValues$25,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$25,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$25,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$25,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$25,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\.?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
abbreviated:/^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
wide:/^(før Kristus|før vår tid|etter Kristus|vår tid)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^f/i,/^e/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](\.)? kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
wide:/^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^mai/i,
/^jun/i,
/^jul/i,
/^aug/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtofl]/i,
short:/^(su|må|ty|on|to|fr|la)/i,
abbreviated:/^(sun|mån|tys|ons|tor|fre|laur)/i,
wide:/^(sundag|måndag|tysdag|onsdag|torsdag|fredag|laurdag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^s/i,
/^m/i,
/^ty/i,
/^o/i,
/^to/i,
/^f/i,
/^l/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(midnatt|middag|(på) (morgonen|ettermiddagen|kvelden|natta)|[ap])/i,
any:/^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgonen|ettermiddagen|kvelden|natta))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a(\.?\s?m\.?)?$/i,
pm:/^p(\.?\s?m\.?)?$/i,
midnight:/^midn/i,
noon:/^midd/i,
morning:/morgon/i,
afternoon:/ettermiddag/i,
evening:/kveld/i,
night:/natt/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/oc/_lib/formatDistance.js
var formatDistanceLocale$24={
lessThanXSeconds:{
one:"mens d’una segonda",
other:"mens de {{count}} segondas"
},
xSeconds:{
one:"1 segonda",
other:"{{count}} segondas"
},
halfAMinute:"30 segondas",
lessThanXMinutes:{
one:"mens d’una minuta",
other:"mens de {{count}} minutas"
},
xMinutes:{
one:"1 minuta",
other:"{{count}} minutas"
},
aboutXHours:{
one:"environ 1 ora",
other:"environ {{count}} oras"
},
xHours:{
one:"1 ora",
other:"{{count}} oras"
},
xDays:{
one:"1 jorn",
other:"{{count}} jorns"
},
aboutXWeeks:{
one:"environ 1 setmana",
other:"environ {{count}} setmanas"
},
xWeeks:{
one:"1 setmana",
other:"{{count}} setmanas"
},
aboutXMonths:{
one:"environ 1 mes",
other:"environ {{count}} meses"
},
xMonths:{
one:"1 mes",
other:"{{count}} meses"
},
aboutXYears:{
one:"environ 1 an",
other:"environ {{count}} ans"
},
xYears:{
one:"1 an",
other:"{{count}} ans"
},
overXYears:{
one:"mai d’un an",
other:"mai de {{count}} ans"
},
almostXYears:{
one:"gaireben un an",
other:"gaireben {{count}} ans"
}
};
var formatDistance$24=function formatDistance$24(token,count,options){
var result;
var tokenValue=formatDistanceLocale$24[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"d’aquí "+result;else
return"fa "+result;
return result;
};
var formatLong$24={
date:buildFormatLongFn({
formats:{
full:"EEEE d 'de' MMMM y",
long:"d 'de' MMMM y",
medium:"d MMM y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'a' {{time}}",
long:"{{date}} 'a' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/oc/_lib/formatRelative.js
var formatRelativeLocale$24={
lastWeek:"eeee 'passat a' p",
yesterday:"'ièr a' p",
today:"'uèi a' p",
tomorrow:"'deman a' p",
nextWeek:"eeee 'a' p",
other:"P"
};
var formatRelative$24=function formatRelative$24(token,_date,_baseDate,_options){return formatRelativeLocale$24[token];};
//#endregion
//#region dist/date-fns/locale/oc/_lib/localize.js
var eraValues$24={
narrow:["ab. J.C.","apr. J.C."],
abbreviated:["ab. J.C.","apr. J.C."],
wide:["abans Jèsus-Crist","après Jèsus-Crist"]
};
var quarterValues$24={
narrow:[
"T1",
"T2",
"T3",
"T4"],

abbreviated:[
"1èr trim.",
"2nd trim.",
"3en trim.",
"4en trim."],

wide:[
"1èr trimèstre",
"2nd trimèstre",
"3en trimèstre",
"4en trimèstre"]

};
var monthValues$24={
narrow:[
"GN",
"FB",
"MÇ",
"AB",
"MA",
"JN",
"JL",
"AG",
"ST",
"OC",
"NV",
"DC"],

abbreviated:[
"gen.",
"febr.",
"març",
"abr.",
"mai",
"junh",
"jul.",
"ag.",
"set.",
"oct.",
"nov.",
"dec."],

wide:[
"genièr",
"febrièr",
"març",
"abril",
"mai",
"junh",
"julhet",
"agost",
"setembre",
"octòbre",
"novembre",
"decembre"]

};
var dayValues$24={
narrow:[
"dg.",
"dl.",
"dm.",
"dc.",
"dj.",
"dv.",
"ds."],

short:[
"dg.",
"dl.",
"dm.",
"dc.",
"dj.",
"dv.",
"ds."],

abbreviated:[
"dg.",
"dl.",
"dm.",
"dc.",
"dj.",
"dv.",
"ds."],

wide:[
"dimenge",
"diluns",
"dimars",
"dimècres",
"dijòus",
"divendres",
"dissabte"]

};
var dayPeriodValues$24={
narrow:{
am:"am",
pm:"pm",
midnight:"mièjanuèch",
noon:"miègjorn",
morning:"matin",
afternoon:"aprèp-miègjorn",
evening:"vèspre",
night:"nuèch"
},
abbreviated:{
am:"a.m.",
pm:"p.m.",
midnight:"mièjanuèch",
noon:"miègjorn",
morning:"matin",
afternoon:"aprèp-miègjorn",
evening:"vèspre",
night:"nuèch"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"mièjanuèch",
noon:"miègjorn",
morning:"matin",
afternoon:"aprèp-miègjorn",
evening:"vèspre",
night:"nuèch"
}
};
var formattingDayPeriodValues$22={
narrow:{
am:"am",
pm:"pm",
midnight:"mièjanuèch",
noon:"miègjorn",
morning:"del matin",
afternoon:"de l’aprèp-miègjorn",
evening:"del ser",
night:"de la nuèch"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"mièjanuèch",
noon:"miègjorn",
morning:"del matin",
afternoon:"de l’aprèp-miègjorn",
evening:"del ser",
night:"de la nuèch"
},
wide:{
am:"ante meridiem",
pm:"post meridiem",
midnight:"mièjanuèch",
noon:"miègjorn",
morning:"del matin",
afternoon:"de l’aprèp-miègjorn",
evening:"del ser",
night:"de la nuèch"
}
};
var ordinalNumber$24=function ordinalNumber$24(dirtyNumber,options){
var number=Number(dirtyNumber);
var unit=options===null||options===void 0?void 0:options.unit;
var ordinal;
switch(number){
case 1:
ordinal="èr";
break;
case 2:
ordinal="nd";
break;
default:ordinal="en";
}
if(unit==="year"||unit==="week"||unit==="hour"||unit==="minute"||unit==="second")ordinal+="a";
return number+ordinal;
};
//#endregion
//#region dist/date-fns/locale/oc.js
/**
* @category Locales
* @summary Occitan locale.
* @language Occitan
* @iso-639-2 oci
* @author Quentin PAGÈS
*/
var _oc={
code:"oc",
formatDistance:formatDistance$24,
formatLong:formatLong$24,
formatRelative:formatRelative$24,
localize:{
ordinalNumber:ordinalNumber$24,
era:buildLocalizeFn({
values:eraValues$24,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$24,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$24,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$24,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$24,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$22,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(èr|nd|en)?[a]?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ab\.J\.C|apr\.J\.C|apr\.J\.-C)/i,
abbreviated:/^(ab\.J\.-C|ab\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
wide:/^(abans Jèsus-Crist|après Jèsus-Crist)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^ab/i,/^ap/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^T[1234]/i,
abbreviated:/^[1234](èr|nd|en)? trim\.?/i,
wide:/^[1234](èr|nd|en)? trimèstre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(GN|FB|MÇ|AB|MA|JN|JL|AG|ST|OC|NV|DC)/i,
abbreviated:/^(gen|febr|març|abr|mai|junh|jul|ag|set|oct|nov|dec)\.?/i,
wide:/^(genièr|febrièr|març|abril|mai|junh|julhet|agost|setembre|octòbre|novembre|decembre)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^g/i,
/^f/i,
/^ma[r?]|MÇ/i,
/^ab/i,
/^ma[i?]/i,
/^ju[n?]|JN/i,
/^ju[l?]|JL/i,
/^ag/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]
},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^d[glmcjvs]\.?/i,
short:/^d[glmcjvs]\.?/i,
abbreviated:/^d[glmcjvs]\.?/i,
wide:/^(dimenge|diluns|dimars|dimècres|dijòus|divendres|dissabte)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^dg/i,
/^dl/i,
/^dm/i,
/^dc/i,
/^dj/i,
/^dv/i,
/^ds/i],

short:[
/^dg/i,
/^dl/i,
/^dm/i,
/^dc/i,
/^dj/i,
/^dv/i,
/^ds/i],

abbreviated:[
/^dg/i,
/^dl/i,
/^dm/i,
/^dc/i,
/^dj/i,
/^dv/i,
/^ds/i],

any:[
/^dg|dime/i,
/^dl|dil/i,
/^dm|dima/i,
/^dc|dimè/i,
/^dj|dij/i,
/^dv|div/i,
/^ds|dis/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/(^(a\.?m|p\.?m))|(ante meridiem|post meridiem)|((del |de la |de l’)(matin|aprèp-miègjorn|vèspre|ser|nuèch))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/(^a)|ante meridiem/i,
pm:/(^p)|post meridiem/i,
midnight:/^mièj/i,
noon:/^mièg/i,
morning:/matin/i,
afternoon:/aprèp-miègjorn/i,
evening:/vèspre|ser/i,
night:/nuèch/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/pl/_lib/formatDistance.js
var formatDistanceLocale$23={
lessThanXSeconds:{
one:{
regular:"mniej niż sekunda",
past:"mniej niż sekundę",
future:"mniej niż sekundę"
},
twoFour:"mniej niż {{count}} sekundy",
other:"mniej niż {{count}} sekund"
},
xSeconds:{
one:{
regular:"sekunda",
past:"sekundę",
future:"sekundę"
},
twoFour:"{{count}} sekundy",
other:"{{count}} sekund"
},
halfAMinute:{
one:"pół minuty",
twoFour:"pół minuty",
other:"pół minuty"
},
lessThanXMinutes:{
one:{
regular:"mniej niż minuta",
past:"mniej niż minutę",
future:"mniej niż minutę"
},
twoFour:"mniej niż {{count}} minuty",
other:"mniej niż {{count}} minut"
},
xMinutes:{
one:{
regular:"minuta",
past:"minutę",
future:"minutę"
},
twoFour:"{{count}} minuty",
other:"{{count}} minut"
},
aboutXHours:{
one:{
regular:"około godziny",
past:"około godziny",
future:"około godzinę"
},
twoFour:"około {{count}} godziny",
other:"około {{count}} godzin"
},
xHours:{
one:{
regular:"godzina",
past:"godzinę",
future:"godzinę"
},
twoFour:"{{count}} godziny",
other:"{{count}} godzin"
},
xDays:{
one:{
regular:"dzień",
past:"dzień",
future:"1 dzień"
},
twoFour:"{{count}} dni",
other:"{{count}} dni"
},
aboutXWeeks:{
one:"około tygodnia",
twoFour:"około {{count}} tygodni",
other:"około {{count}} tygodni"
},
xWeeks:{
one:"tydzień",
twoFour:"{{count}} tygodnie",
other:"{{count}} tygodni"
},
aboutXMonths:{
one:"około miesiąc",
twoFour:"około {{count}} miesiące",
other:"około {{count}} miesięcy"
},
xMonths:{
one:"miesiąc",
twoFour:"{{count}} miesiące",
other:"{{count}} miesięcy"
},
aboutXYears:{
one:"około rok",
twoFour:"około {{count}} lata",
other:"około {{count}} lat"
},
xYears:{
one:"rok",
twoFour:"{{count}} lata",
other:"{{count}} lat"
},
overXYears:{
one:"ponad rok",
twoFour:"ponad {{count}} lata",
other:"ponad {{count}} lat"
},
almostXYears:{
one:"prawie rok",
twoFour:"prawie {{count}} lata",
other:"prawie {{count}} lat"
}
};
function declensionGroup$1(scheme,count){
if(count===1)return scheme.one;
var rem100=count%100;
if(rem100<=20&&rem100>10)return scheme.other;
var rem10=rem100%10;
if(rem10>=2&&rem10<=4)return scheme.twoFour;
return scheme.other;
}
function declension$3(scheme,count,time){
var group=declensionGroup$1(scheme,count);
return(typeof group==="string"?group:group[time]).replace("{{count}}",String(count));
}
var formatDistance$23=function formatDistance$23(token,count,options){
var scheme=formatDistanceLocale$23[token];
if(!(options!==null&&options!==void 0&&options.addSuffix))return declension$3(scheme,count,"regular");
if(options.comparison&&options.comparison>0)return"za "+declension$3(scheme,count,"future");else
return declension$3(scheme,count,"past")+" temu";
};
var formatLong$23={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y",
long:"do MMMM y",
medium:"do MMM y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/pl/_lib/formatRelative.js
var adjectivesLastWeek={
masculine:"ostatni",
feminine:"ostatnia"
};
var adjectivesThisWeek={
masculine:"ten",
feminine:"ta"
};
var adjectivesNextWeek={
masculine:"następny",
feminine:"następna"
};
var dayGrammaticalGender={
0:"feminine",
1:"masculine",
2:"masculine",
3:"feminine",
4:"masculine",
5:"masculine",
6:"feminine"
};
function dayAndTimeWithAdjective(token,date,baseDate,options){
var adjectives;
if(isSameWeek(date,baseDate,options))adjectives=adjectivesThisWeek;else
if(token==="lastWeek")adjectives=adjectivesLastWeek;else
if(token==="nextWeek")adjectives=adjectivesNextWeek;else
throw new Error("Cannot determine adjectives for token ".concat(token));
var grammaticalGender=dayGrammaticalGender[date.getDay()];
return"'".concat(adjectives[grammaticalGender],"' eeee 'o' p");
}
var formatRelativeLocale$23={
lastWeek:dayAndTimeWithAdjective,
yesterday:"'wczoraj o' p",
today:"'dzisiaj o' p",
tomorrow:"'jutro o' p",
nextWeek:dayAndTimeWithAdjective,
other:"P"
};
var formatRelative$23=function formatRelative$23(token,date,baseDate,options){
var format=formatRelativeLocale$23[token];
if(typeof format==="function")return format(token,date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/pl/_lib/localize.js
var eraValues$23={
narrow:["p.n.e.","n.e."],
abbreviated:["p.n.e.","n.e."],
wide:["przed naszą erą","naszej ery"]
};
var quarterValues$23={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"I kw.",
"II kw.",
"III kw.",
"IV kw."],

wide:[
"I kwartał",
"II kwartał",
"III kwartał",
"IV kwartał"]

};
var monthValues$23={
narrow:[
"S",
"L",
"M",
"K",
"M",
"C",
"L",
"S",
"W",
"P",
"L",
"G"],

abbreviated:[
"sty",
"lut",
"mar",
"kwi",
"maj",
"cze",
"lip",
"sie",
"wrz",
"paź",
"lis",
"gru"],

wide:[
"styczeń",
"luty",
"marzec",
"kwiecień",
"maj",
"czerwiec",
"lipiec",
"sierpień",
"wrzesień",
"październik",
"listopad",
"grudzień"]

};
var monthFormattingValues={
narrow:[
"s",
"l",
"m",
"k",
"m",
"c",
"l",
"s",
"w",
"p",
"l",
"g"],

abbreviated:[
"sty",
"lut",
"mar",
"kwi",
"maj",
"cze",
"lip",
"sie",
"wrz",
"paź",
"lis",
"gru"],

wide:[
"stycznia",
"lutego",
"marca",
"kwietnia",
"maja",
"czerwca",
"lipca",
"sierpnia",
"września",
"października",
"listopada",
"grudnia"]

};
var dayValues$23={
narrow:[
"N",
"P",
"W",
"Ś",
"C",
"P",
"S"],

short:[
"nie",
"pon",
"wto",
"śro",
"czw",
"pią",
"sob"],

abbreviated:[
"niedz.",
"pon.",
"wt.",
"śr.",
"czw.",
"pt.",
"sob."],

wide:[
"niedziela",
"poniedziałek",
"wtorek",
"środa",
"czwartek",
"piątek",
"sobota"]

};
var dayFormattingValues={
narrow:[
"n",
"p",
"w",
"ś",
"c",
"p",
"s"],

short:[
"nie",
"pon",
"wto",
"śro",
"czw",
"pią",
"sob"],

abbreviated:[
"niedz.",
"pon.",
"wt.",
"śr.",
"czw.",
"pt.",
"sob."],

wide:[
"niedziela",
"poniedziałek",
"wtorek",
"środa",
"czwartek",
"piątek",
"sobota"]

};
var dayPeriodValues$23={
narrow:{
am:"a",
pm:"p",
midnight:"półn.",
noon:"poł",
morning:"rano",
afternoon:"popoł.",
evening:"wiecz.",
night:"noc"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"północ",
noon:"południe",
morning:"rano",
afternoon:"popołudnie",
evening:"wieczór",
night:"noc"
},
wide:{
am:"AM",
pm:"PM",
midnight:"północ",
noon:"południe",
morning:"rano",
afternoon:"popołudnie",
evening:"wieczór",
night:"noc"
}
};
var dayPeriodFormattingValues={
narrow:{
am:"a",
pm:"p",
midnight:"o półn.",
noon:"w poł.",
morning:"rano",
afternoon:"po poł.",
evening:"wiecz.",
night:"w nocy"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"o północy",
noon:"w południe",
morning:"rano",
afternoon:"po południu",
evening:"wieczorem",
night:"w nocy"
},
wide:{
am:"AM",
pm:"PM",
midnight:"o północy",
noon:"w południe",
morning:"rano",
afternoon:"po południu",
evening:"wieczorem",
night:"w nocy"
}
};
var ordinalNumber$23=function ordinalNumber$23(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/pl.js
/**
* @category Locales
* @summary Polish locale.
* @language Polish
* @iso-639-2 pol
* @author Mateusz Derks [@ertrzyiks](https://github.com/ertrzyiks)
* @author Just RAG [@justrag](https://github.com/justrag)
* @author Mikolaj Grzyb [@mikolajgrzyb](https://github.com/mikolajgrzyb)
* @author Mateusz Tokarski [@mutisz](https://github.com/mutisz)
*/
var _pl={
code:"pl",
formatDistance:formatDistance$23,
formatLong:formatLong$23,
formatRelative:formatRelative$23,
localize:{
ordinalNumber:ordinalNumber$23,
era:buildLocalizeFn({
values:eraValues$23,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$23,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$23,
defaultWidth:"wide",
formattingValues:monthFormattingValues,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$23,
defaultWidth:"wide",
formattingValues:dayFormattingValues,
defaultFormattingWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$23,
defaultWidth:"wide",
formattingValues:dayPeriodFormattingValues,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(p\.?\s*n\.?\s*e\.?\s*|n\.?\s*e\.?\s*)/i,
abbreviated:/^(p\.?\s*n\.?\s*e\.?\s*|n\.?\s*e\.?\s*)/i,
wide:/^(przed\s*nasz(ą|a)\s*er(ą|a)|naszej\s*ery)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^p/i,/^n/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^(I|II|III|IV)\s*kw\.?/i,
wide:/^(I|II|III|IV)\s*kwarta(ł|l)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/1/i,
/2/i,
/3/i,
/4/i],

any:[
/^I kw/i,
/^II kw/i,
/^III kw/i,
/^IV kw/i]

},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[slmkcwpg]/i,
abbreviated:/^(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|pa(ź|z)|lis|gru)/i,
wide:/^(stycznia|stycze(ń|n)|lutego|luty|marca|marzec|kwietnia|kwiecie(ń|n)|maja|maj|czerwca|czerwiec|lipca|lipiec|sierpnia|sierpie(ń|n)|wrze(ś|s)nia|wrzesie(ń|n)|pa(ź|z)dziernika|pa(ź|z)dziernik|listopada|listopad|grudnia|grudzie(ń|n))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^l/i,
/^m/i,
/^k/i,
/^m/i,
/^c/i,
/^l/i,
/^s/i,
/^w/i,
/^p/i,
/^l/i,
/^g/i],

any:[
/^st/i,
/^lu/i,
/^mar/i,
/^k/i,
/^maj/i,
/^c/i,
/^lip/i,
/^si/i,
/^w/i,
/^p/i,
/^lis/i,
/^g/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[npwścs]/i,
short:/^(nie|pon|wto|(ś|s)ro|czw|pi(ą|a)|sob)/i,
abbreviated:/^(niedz|pon|wt|(ś|s)r|czw|pt|sob)\.?/i,
wide:/^(niedziela|poniedzia(ł|l)ek|wtorek|(ś|s)roda|czwartek|pi(ą|a)tek|sobota)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^n/i,
/^p/i,
/^w/i,
/^ś/i,
/^c/i,
/^p/i,
/^s/i],

abbreviated:[
/^n/i,
/^po/i,
/^w/i,
/^(ś|s)r/i,
/^c/i,
/^pt/i,
/^so/i],

any:[
/^n/i,
/^po/i,
/^w/i,
/^(ś|s)r/i,
/^c/i,
/^pi/i,
/^so/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(^a$|^p$|pó(ł|l)n\.?|o\s*pó(ł|l)n\.?|po(ł|l)\.?|w\s*po(ł|l)\.?|po\s*po(ł|l)\.?|rano|wiecz\.?|noc|w\s*nocy)/i,
any:/^(am|pm|pó(ł|l)noc|o\s*pó(ł|l)nocy|po(ł|l)udnie|w\s*po(ł|l)udnie|popo(ł|l)udnie|po\s*po(ł|l)udniu|rano|wieczór|wieczorem|noc|w\s*nocy)/i
},
defaultMatchWidth:"any",
parsePatterns:{
narrow:{
am:/^a$/i,
pm:/^p$/i,
midnight:/pó(ł|l)n/i,
noon:/po(ł|l)/i,
morning:/rano/i,
afternoon:/po\s*po(ł|l)/i,
evening:/wiecz/i,
night:/noc/i
},
any:{
am:/^am/i,
pm:/^pm/i,
midnight:/pó(ł|l)n/i,
noon:/po(ł|l)/i,
morning:/rano/i,
afternoon:/po\s*po(ł|l)/i,
evening:/wiecz/i,
night:/noc/i
}
},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/pt/_lib/formatDistance.js
var formatDistanceLocale$22={
lessThanXSeconds:{
one:"menos de um segundo",
other:"menos de {{count}} segundos"
},
xSeconds:{
one:"1 segundo",
other:"{{count}} segundos"
},
halfAMinute:"meio minuto",
lessThanXMinutes:{
one:"menos de um minuto",
other:"menos de {{count}} minutos"
},
xMinutes:{
one:"1 minuto",
other:"{{count}} minutos"
},
aboutXHours:{
one:"aproximadamente 1 hora",
other:"aproximadamente {{count}} horas"
},
xHours:{
one:"1 hora",
other:"{{count}} horas"
},
xDays:{
one:"1 dia",
other:"{{count}} dias"
},
aboutXWeeks:{
one:"aproximadamente 1 semana",
other:"aproximadamente {{count}} semanas"
},
xWeeks:{
one:"1 semana",
other:"{{count}} semanas"
},
aboutXMonths:{
one:"aproximadamente 1 mês",
other:"aproximadamente {{count}} meses"
},
xMonths:{
one:"1 mês",
other:"{{count}} meses"
},
aboutXYears:{
one:"aproximadamente 1 ano",
other:"aproximadamente {{count}} anos"
},
xYears:{
one:"1 ano",
other:"{{count}} anos"
},
overXYears:{
one:"mais de 1 ano",
other:"mais de {{count}} anos"
},
almostXYears:{
one:"quase 1 ano",
other:"quase {{count}} anos"
}
};
var formatDistance$22=function formatDistance$22(token,count,options){
var result;
var tokenValue=formatDistanceLocale$22[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"daqui a "+result;else
return"há "+result;
return result;
};
var formatLong$22={
date:buildFormatLongFn({
formats:{
full:"EEEE, d 'de' MMMM 'de' y",
long:"d 'de' MMMM 'de' y",
medium:"d 'de' MMM 'de' y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'às' {{time}}",
long:"{{date}} 'às' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/pt/_lib/formatRelative.js
var formatRelativeLocale$22={
lastWeek:function lastWeek(date){
var weekday=date.getDay();
return"'"+(weekday===0||weekday===6?"último":"última")+"' eeee 'às' p";
},
yesterday:"'ontem às' p",
today:"'hoje às' p",
tomorrow:"'amanhã às' p",
nextWeek:"eeee 'às' p",
other:"P"
};
var formatRelative$22=function formatRelative$22(token,date,_baseDate,_options){
var format=formatRelativeLocale$22[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/pt/_lib/localize.js
var eraValues$22={
narrow:["aC","dC"],
abbreviated:["a.C.","d.C."],
wide:["antes de Cristo","depois de Cristo"]
};
var quarterValues$22={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"1º trimestre",
"2º trimestre",
"3º trimestre",
"4º trimestre"]

};
var monthValues$22={
narrow:[
"j",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"jan",
"fev",
"mar",
"abr",
"mai",
"jun",
"jul",
"ago",
"set",
"out",
"nov",
"dez"],

wide:[
"janeiro",
"fevereiro",
"março",
"abril",
"maio",
"junho",
"julho",
"agosto",
"setembro",
"outubro",
"novembro",
"dezembro"]

};
var dayValues$22={
narrow:[
"d",
"s",
"t",
"q",
"q",
"s",
"s"],

short:[
"dom",
"seg",
"ter",
"qua",
"qui",
"sex",
"sáb"],

abbreviated:[
"dom",
"seg",
"ter",
"qua",
"qui",
"sex",
"sáb"],

wide:[
"domingo",
"segunda-feira",
"terça-feira",
"quarta-feira",
"quinta-feira",
"sexta-feira",
"sábado"]

};
var dayPeriodValues$22={
narrow:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"manhã",
afternoon:"tarde",
evening:"noite",
night:"madrugada"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"manhã",
afternoon:"tarde",
evening:"noite",
night:"madrugada"
},
wide:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"manhã",
afternoon:"tarde",
evening:"noite",
night:"madrugada"
}
};
var formattingDayPeriodValues$21={
narrow:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"da manhã",
afternoon:"da tarde",
evening:"da noite",
night:"da madrugada"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"da manhã",
afternoon:"da tarde",
evening:"da noite",
night:"da madrugada"
},
wide:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"da manhã",
afternoon:"da tarde",
evening:"da noite",
night:"da madrugada"
}
};
var ordinalNumber$22=function ordinalNumber$22(dirtyNumber,_options){
return Number(dirtyNumber)+"º";
};
//#endregion
//#region dist/date-fns/locale/pt.js
/**
* @category Locales
* @summary Portuguese locale.
* @language Portuguese
* @iso-639-2 por
* @author Dário Freire [@dfreire](https://github.com/dfreire)
* @author Adrián de la Rosa [@adrm](https://github.com/adrm)
*/
var _pt={
code:"pt",
formatDistance:formatDistance$22,
formatLong:formatLong$22,
formatRelative:formatRelative$22,
localize:{
ordinalNumber:ordinalNumber$22,
era:buildLocalizeFn({
values:eraValues$22,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$22,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$22,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$22,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$22,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$21,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(º|ª)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ac|dc|a|d)/i,
abbreviated:/^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
wide:/^(antes de cristo|antes da era comum|depois de cristo|era comum)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
any:[/^ac/i,/^dc/i],
wide:[/^(antes de cristo|antes da era comum)/i,/^(depois de cristo|era comum)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^T[1234]/i,
wide:/^[1234](º|ª)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
wide:/^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ab/i,
/^mai/i,
/^jun/i,
/^jul/i,
/^ag/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dstq]/i,
short:/^(dom|seg|ter|qua|qui|sex|s[áa]b)/i,
abbreviated:/^(dom|seg|ter|qua|qui|sex|s[áa]b)/i,
wide:/^(domingo|segunda-?\s?feira|terça-?\s?feira|quarta-?\s?feira|quinta-?\s?feira|sexta-?\s?feira|s[áa]bado)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^s/i,
/^t/i,
/^q/i,
/^q/i,
/^s/i,
/^s/i],

any:[
/^d/i,
/^seg/i,
/^t/i,
/^qua/i,
/^qui/i,
/^sex/i,
/^s[áa]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|meia-?\s?noite|meio-?\s?dia|(da) (manh[ãa]|tarde|noite|madrugada))/i,
any:/^([ap]\.?\s?m\.?|meia-?\s?noite|meio-?\s?dia|(da) (manh[ãa]|tarde|noite|madrugada))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^meia/i,
noon:/^meio/i,
morning:/manh[ãa]/i,
afternoon:/tarde/i,
evening:/noite/i,
night:/madrugada/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/pt-BR/_lib/formatDistance.js
var formatDistanceLocale$21={
lessThanXSeconds:{
one:"menos de um segundo",
other:"menos de {{count}} segundos"
},
xSeconds:{
one:"1 segundo",
other:"{{count}} segundos"
},
halfAMinute:"meio minuto",
lessThanXMinutes:{
one:"menos de um minuto",
other:"menos de {{count}} minutos"
},
xMinutes:{
one:"1 minuto",
other:"{{count}} minutos"
},
aboutXHours:{
one:"cerca de 1 hora",
other:"cerca de {{count}} horas"
},
xHours:{
one:"1 hora",
other:"{{count}} horas"
},
xDays:{
one:"1 dia",
other:"{{count}} dias"
},
aboutXWeeks:{
one:"cerca de 1 semana",
other:"cerca de {{count}} semanas"
},
xWeeks:{
one:"1 semana",
other:"{{count}} semanas"
},
aboutXMonths:{
one:"cerca de 1 mês",
other:"cerca de {{count}} meses"
},
xMonths:{
one:"1 mês",
other:"{{count}} meses"
},
aboutXYears:{
one:"cerca de 1 ano",
other:"cerca de {{count}} anos"
},
xYears:{
one:"1 ano",
other:"{{count}} anos"
},
overXYears:{
one:"mais de 1 ano",
other:"mais de {{count}} anos"
},
almostXYears:{
one:"quase 1 ano",
other:"quase {{count}} anos"
}
};
var formatDistance$21=function formatDistance$21(token,count,options){
var result;
var tokenValue=formatDistanceLocale$21[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"em "+result;else
return"há "+result;
return result;
};
var formatLong$21={
date:buildFormatLongFn({
formats:{
full:"EEEE, d 'de' MMMM 'de' y",
long:"d 'de' MMMM 'de' y",
medium:"d MMM y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'às' {{time}}",
long:"{{date}} 'às' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/pt-BR/_lib/formatRelative.js
var formatRelativeLocale$21={
lastWeek:function lastWeek(date){
var weekday=date.getDay();
return"'"+(weekday===0||weekday===6?"último":"última")+"' eeee 'às' p";
},
yesterday:"'ontem às' p",
today:"'hoje às' p",
tomorrow:"'amanhã às' p",
nextWeek:"eeee 'às' p",
other:"P"
};
var formatRelative$21=function formatRelative$21(token,date,_baseDate,_options){
var format=formatRelativeLocale$21[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/pt-BR/_lib/localize.js
var eraValues$21={
narrow:["AC","DC"],
abbreviated:["AC","DC"],
wide:["antes de cristo","depois de cristo"]
};
var quarterValues$21={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"1º trimestre",
"2º trimestre",
"3º trimestre",
"4º trimestre"]

};
var monthValues$21={
narrow:[
"j",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"jan",
"fev",
"mar",
"abr",
"mai",
"jun",
"jul",
"ago",
"set",
"out",
"nov",
"dez"],

wide:[
"janeiro",
"fevereiro",
"março",
"abril",
"maio",
"junho",
"julho",
"agosto",
"setembro",
"outubro",
"novembro",
"dezembro"]

};
var dayValues$21={
narrow:[
"D",
"S",
"T",
"Q",
"Q",
"S",
"S"],

short:[
"dom",
"seg",
"ter",
"qua",
"qui",
"sex",
"sab"],

abbreviated:[
"domingo",
"segunda",
"terça",
"quarta",
"quinta",
"sexta",
"sábado"],

wide:[
"domingo",
"segunda-feira",
"terça-feira",
"quarta-feira",
"quinta-feira",
"sexta-feira",
"sábado"]

};
var dayPeriodValues$21={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"md",
morning:"manhã",
afternoon:"tarde",
evening:"tarde",
night:"noite"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"manhã",
afternoon:"tarde",
evening:"tarde",
night:"noite"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"meia-noite",
noon:"meio-dia",
morning:"manhã",
afternoon:"tarde",
evening:"tarde",
night:"noite"
}
};
var formattingDayPeriodValues$20={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"md",
morning:"da manhã",
afternoon:"da tarde",
evening:"da tarde",
night:"da noite"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"meia-noite",
noon:"meio-dia",
morning:"da manhã",
afternoon:"da tarde",
evening:"da tarde",
night:"da noite"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"meia-noite",
noon:"meio-dia",
morning:"da manhã",
afternoon:"da tarde",
evening:"da tarde",
night:"da noite"
}
};
var ordinalNumber$21=function ordinalNumber$21(dirtyNumber,options){
var number=Number(dirtyNumber);
if((options===null||options===void 0?void 0:options.unit)==="week")return number+"ª";
return number+"º";
};
//#endregion
//#region dist/date-fns/locale/pt-BR.js
/**
* @category Locales
* @summary Portuguese locale (Brazil).
* @language Portuguese
* @iso-639-2 por
* @author Lucas Duailibe [@duailibe](https://github.com/duailibe)
* @author Yago Carballo [@yagocarballo](https://github.com/YagoCarballo)
*/
var _ptBR={
code:"pt-BR",
formatDistance:formatDistance$21,
formatLong:formatLong$21,
formatRelative:formatRelative$21,
localize:{
ordinalNumber:ordinalNumber$21,
era:buildLocalizeFn({
values:eraValues$21,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$21,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$21,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$21,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$21,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$20,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)[ºªo]?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ac|dc|a|d)/i,
abbreviated:/^(a\.?\s?c\.?|d\.?\s?c\.?)/i,
wide:/^(antes de cristo|depois de cristo)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
any:[/^ac/i,/^dc/i],
wide:[/^antes de cristo/i,/^depois de cristo/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^T[1234]/i,
wide:/^[1234](º)? trimestre/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmajsond]/i,
abbreviated:/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
wide:/^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^fev/i,
/^mar/i,
/^abr/i,
/^mai/i,
/^jun/i,
/^jul/i,
/^ago/i,
/^set/i,
/^out/i,
/^nov/i,
/^dez/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(dom|[23456]ª?|s[aá]b)/i,
short:/^(dom|[23456]ª?|s[aá]b)/i,
abbreviated:/^(dom|seg|ter|qua|qui|sex|s[aá]b)/i,
wide:/^(domingo|(segunda|ter[cç]a|quarta|quinta|sexta)([- ]feira)?|s[aá]bado)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
short:[
/^d/i,
/^2/i,
/^3/i,
/^4/i,
/^5/i,
/^6/i,
/^s[aá]/i],

narrow:[
/^d/i,
/^2/i,
/^3/i,
/^4/i,
/^5/i,
/^6/i,
/^s[aá]/i],

any:[
/^d/i,
/^seg/i,
/^t/i,
/^qua/i,
/^qui/i,
/^sex/i,
/^s[aá]b/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mn|md|(da) (manhã|tarde|noite))/i,
any:/^([ap]\.?\s?m\.?|meia[-\s]noite|meio[-\s]dia|(da) (manhã|tarde|noite))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mn|^meia[-\s]noite/i,
noon:/^md|^meio[-\s]dia/i,
morning:/manhã/i,
afternoon:/tarde/i,
evening:/tarde/i,
night:/noite/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ro/_lib/formatDistance.js
var formatDistanceLocale$20={
lessThanXSeconds:{
one:"mai puțin de o secundă",
other:"mai puțin de {{count}} secunde"
},
xSeconds:{
one:"1 secundă",
other:"{{count}} secunde"
},
halfAMinute:"jumătate de minut",
lessThanXMinutes:{
one:"mai puțin de un minut",
other:"mai puțin de {{count}} minute"
},
xMinutes:{
one:"1 minut",
other:"{{count}} minute"
},
aboutXHours:{
one:"circa 1 oră",
other:"circa {{count}} ore"
},
xHours:{
one:"1 oră",
other:"{{count}} ore"
},
xDays:{
one:"1 zi",
other:"{{count}} zile"
},
aboutXWeeks:{
one:"circa o săptămână",
other:"circa {{count}} săptămâni"
},
xWeeks:{
one:"1 săptămână",
other:"{{count}} săptămâni"
},
aboutXMonths:{
one:"circa 1 lună",
other:"circa {{count}} luni"
},
xMonths:{
one:"1 lună",
other:"{{count}} luni"
},
aboutXYears:{
one:"circa 1 an",
other:"circa {{count}} ani"
},
xYears:{
one:"1 an",
other:"{{count}} ani"
},
overXYears:{
one:"peste 1 an",
other:"peste {{count}} ani"
},
almostXYears:{
one:"aproape 1 an",
other:"aproape {{count}} ani"
}
};
var formatDistance$20=function formatDistance$20(token,count,options){
var result;
var tokenValue=formatDistanceLocale$20[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"în "+result;else
return result+" în urmă";
return result;
};
var formatLong$20={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM yyyy",
long:"d MMMM yyyy",
medium:"d MMM yyyy",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'la' {{time}}",
long:"{{date}} 'la' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ro/_lib/formatRelative.js
var formatRelativeLocale$20={
lastWeek:"eeee 'trecută la' p",
yesterday:"'ieri la' p",
today:"'astăzi la' p",
tomorrow:"'mâine la' p",
nextWeek:"eeee 'viitoare la' p",
other:"P"
};
var formatRelative$20=function formatRelative$20(token,_date,_baseDate,_options){return formatRelativeLocale$20[token];};
//#endregion
//#region dist/date-fns/locale/ro/_lib/localize.js
var eraValues$20={
narrow:["Î","D"],
abbreviated:["Î.d.C.","D.C."],
wide:["Înainte de Cristos","După Cristos"]
};
var quarterValues$20={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"T1",
"T2",
"T3",
"T4"],

wide:[
"primul trimestru",
"al doilea trimestru",
"al treilea trimestru",
"al patrulea trimestru"]

};
var monthValues$20={
narrow:[
"I",
"F",
"M",
"A",
"M",
"I",
"I",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"ian",
"feb",
"mar",
"apr",
"mai",
"iun",
"iul",
"aug",
"sep",
"oct",
"noi",
"dec"],

wide:[
"ianuarie",
"februarie",
"martie",
"aprilie",
"mai",
"iunie",
"iulie",
"august",
"septembrie",
"octombrie",
"noiembrie",
"decembrie"]

};
var dayValues$20={
narrow:[
"d",
"l",
"m",
"m",
"j",
"v",
"s"],

short:[
"du",
"lu",
"ma",
"mi",
"jo",
"vi",
"sâ"],

abbreviated:[
"dum",
"lun",
"mar",
"mie",
"joi",
"vin",
"sâm"],

wide:[
"duminică",
"luni",
"marți",
"miercuri",
"joi",
"vineri",
"sâmbătă"]

};
var dayPeriodValues$20={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"ami",
morning:"dim",
afternoon:"da",
evening:"s",
night:"n"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"miezul nopții",
noon:"amiază",
morning:"dimineață",
afternoon:"după-amiază",
evening:"seară",
night:"noapte"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"miezul nopții",
noon:"amiază",
morning:"dimineață",
afternoon:"după-amiază",
evening:"seară",
night:"noapte"
}
};
var formattingDayPeriodValues$19={
narrow:{
am:"a",
pm:"p",
midnight:"mn",
noon:"amiază",
morning:"dimineață",
afternoon:"după-amiază",
evening:"seară",
night:"noapte"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"miezul nopții",
noon:"amiază",
morning:"dimineață",
afternoon:"după-amiază",
evening:"seară",
night:"noapte"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"miezul nopții",
noon:"amiază",
morning:"dimineață",
afternoon:"după-amiază",
evening:"seară",
night:"noapte"
}
};
var ordinalNumber$20=function ordinalNumber$20(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ro.js
/**
* @category Locales
* @summary Romanian locale.
* @language Romanian
* @iso-639-2 ron
* @author Sergiu Munteanu [@jsergiu](https://github.com/jsergiu)
* @author Adrian Ocneanu [@aocneanu](https://github.com/aocneanu)
* @author Mihai Ocneanu [@gandesc](https://github.com/gandesc)
*/
var _ro={
code:"ro",
formatDistance:formatDistance$20,
formatLong:formatLong$20,
formatRelative:formatRelative$20,
localize:{
ordinalNumber:ordinalNumber$20,
era:buildLocalizeFn({
values:eraValues$20,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$20,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$20,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$20,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$20,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$19,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(Î|D)/i,
abbreviated:/^(Î\.?\s?d\.?\s?C\.?|Î\.?\s?e\.?\s?n\.?|D\.?\s?C\.?|e\.?\s?n\.?)/i,
wide:/^(Înainte de Cristos|Înaintea erei noastre|După Cristos|Era noastră)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
any:[/^ÎC/i,/^DC/i],
wide:[/^(Înainte de Cristos|Înaintea erei noastre)/i,/^(După Cristos|Era noastră)/i]
},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^T[1234]/i,
wide:/^trimestrul [1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[ifmaasond]/i,
abbreviated:/^(ian|feb|mar|apr|mai|iun|iul|aug|sep|oct|noi|dec)/i,
wide:/^(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^i/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^i/i,
/^i/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ia/i,
/^f/i,
/^mar/i,
/^ap/i,
/^mai/i,
/^iun/i,
/^iul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dlmjvs]/i,
short:/^(d|l|ma|mi|j|v|s)/i,
abbreviated:/^(dum|lun|mar|mie|jo|vi|sâ)/i,
wide:/^(duminica|luni|marţi|miercuri|joi|vineri|sâmbătă)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^l/i,
/^m/i,
/^m/i,
/^j/i,
/^v/i,
/^s/i],

any:[
/^d/i,
/^l/i,
/^ma/i,
/^mi/i,
/^j/i,
/^v/i,
/^s/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|mn|a|(dimineaţa|după-amiaza|seara|noaptea))/i,
any:/^([ap]\.?\s?m\.?|miezul nopții|amiaza|(dimineaţa|după-amiaza|seara|noaptea))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^mn/i,
noon:/amiaza/i,
morning:/dimineaţa/i,
afternoon:/după-amiaza/i,
evening:/seara/i,
night:/noaptea/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ru/_lib/formatDistance.js
function declension$2(scheme,count){
if(scheme.one!==void 0&&count===1)return scheme.one;
var rem10=count%10;
var rem100=count%100;
if(rem10===1&&rem100!==11)return scheme.singularNominative.replace("{{count}}",String(count));else
if(rem10>=2&&rem10<=4&&(rem100<10||rem100>20))return scheme.singularGenitive.replace("{{count}}",String(count));else
return scheme.pluralGenitive.replace("{{count}}",String(count));
}
function buildLocalizeTokenFn$1(scheme){
return function(count,options){
if(options!==null&&options!==void 0&&options.addSuffix){if(options.comparison&&options.comparison>0){if(scheme.future)return declension$2(scheme.future,count);else
return"через "+declension$2(scheme.regular,count);}else
if(scheme.past)return declension$2(scheme.past,count);else
return declension$2(scheme.regular,count)+" назад";}else
return declension$2(scheme.regular,count);
};
}
var formatDistanceLocale$19={
lessThanXSeconds:buildLocalizeTokenFn$1({
regular:{
one:"меньше секунды",
singularNominative:"меньше {{count}} секунды",
singularGenitive:"меньше {{count}} секунд",
pluralGenitive:"меньше {{count}} секунд"
},
future:{
one:"меньше, чем через секунду",
singularNominative:"меньше, чем через {{count}} секунду",
singularGenitive:"меньше, чем через {{count}} секунды",
pluralGenitive:"меньше, чем через {{count}} секунд"
}
}),
xSeconds:buildLocalizeTokenFn$1({
regular:{
singularNominative:"{{count}} секунда",
singularGenitive:"{{count}} секунды",
pluralGenitive:"{{count}} секунд"
},
past:{
singularNominative:"{{count}} секунду назад",
singularGenitive:"{{count}} секунды назад",
pluralGenitive:"{{count}} секунд назад"
},
future:{
singularNominative:"через {{count}} секунду",
singularGenitive:"через {{count}} секунды",
pluralGenitive:"через {{count}} секунд"
}
}),
halfAMinute:function halfAMinute(_count,options){
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"через полминуты";else
return"полминуты назад";
return"полминуты";
},
lessThanXMinutes:buildLocalizeTokenFn$1({
regular:{
one:"меньше минуты",
singularNominative:"меньше {{count}} минуты",
singularGenitive:"меньше {{count}} минут",
pluralGenitive:"меньше {{count}} минут"
},
future:{
one:"меньше, чем через минуту",
singularNominative:"меньше, чем через {{count}} минуту",
singularGenitive:"меньше, чем через {{count}} минуты",
pluralGenitive:"меньше, чем через {{count}} минут"
}
}),
xMinutes:buildLocalizeTokenFn$1({
regular:{
singularNominative:"{{count}} минута",
singularGenitive:"{{count}} минуты",
pluralGenitive:"{{count}} минут"
},
past:{
singularNominative:"{{count}} минуту назад",
singularGenitive:"{{count}} минуты назад",
pluralGenitive:"{{count}} минут назад"
},
future:{
singularNominative:"через {{count}} минуту",
singularGenitive:"через {{count}} минуты",
pluralGenitive:"через {{count}} минут"
}
}),
aboutXHours:buildLocalizeTokenFn$1({
regular:{
singularNominative:"около {{count}} часа",
singularGenitive:"около {{count}} часов",
pluralGenitive:"около {{count}} часов"
},
future:{
singularNominative:"приблизительно через {{count}} час",
singularGenitive:"приблизительно через {{count}} часа",
pluralGenitive:"приблизительно через {{count}} часов"
}
}),
xHours:buildLocalizeTokenFn$1({regular:{
singularNominative:"{{count}} час",
singularGenitive:"{{count}} часа",
pluralGenitive:"{{count}} часов"
}}),
xDays:buildLocalizeTokenFn$1({regular:{
singularNominative:"{{count}} день",
singularGenitive:"{{count}} дня",
pluralGenitive:"{{count}} дней"
}}),
aboutXWeeks:buildLocalizeTokenFn$1({
regular:{
singularNominative:"около {{count}} недели",
singularGenitive:"около {{count}} недель",
pluralGenitive:"около {{count}} недель"
},
future:{
singularNominative:"приблизительно через {{count}} неделю",
singularGenitive:"приблизительно через {{count}} недели",
pluralGenitive:"приблизительно через {{count}} недель"
}
}),
xWeeks:buildLocalizeTokenFn$1({regular:{
singularNominative:"{{count}} неделя",
singularGenitive:"{{count}} недели",
pluralGenitive:"{{count}} недель"
}}),
aboutXMonths:buildLocalizeTokenFn$1({
regular:{
singularNominative:"около {{count}} месяца",
singularGenitive:"около {{count}} месяцев",
pluralGenitive:"около {{count}} месяцев"
},
future:{
singularNominative:"приблизительно через {{count}} месяц",
singularGenitive:"приблизительно через {{count}} месяца",
pluralGenitive:"приблизительно через {{count}} месяцев"
}
}),
xMonths:buildLocalizeTokenFn$1({regular:{
singularNominative:"{{count}} месяц",
singularGenitive:"{{count}} месяца",
pluralGenitive:"{{count}} месяцев"
}}),
aboutXYears:buildLocalizeTokenFn$1({
regular:{
singularNominative:"около {{count}} года",
singularGenitive:"около {{count}} лет",
pluralGenitive:"около {{count}} лет"
},
future:{
singularNominative:"приблизительно через {{count}} год",
singularGenitive:"приблизительно через {{count}} года",
pluralGenitive:"приблизительно через {{count}} лет"
}
}),
xYears:buildLocalizeTokenFn$1({regular:{
singularNominative:"{{count}} год",
singularGenitive:"{{count}} года",
pluralGenitive:"{{count}} лет"
}}),
overXYears:buildLocalizeTokenFn$1({
regular:{
singularNominative:"больше {{count}} года",
singularGenitive:"больше {{count}} лет",
pluralGenitive:"больше {{count}} лет"
},
future:{
singularNominative:"больше, чем через {{count}} год",
singularGenitive:"больше, чем через {{count}} года",
pluralGenitive:"больше, чем через {{count}} лет"
}
}),
almostXYears:buildLocalizeTokenFn$1({
regular:{
singularNominative:"почти {{count}} год",
singularGenitive:"почти {{count}} года",
pluralGenitive:"почти {{count}} лет"
},
future:{
singularNominative:"почти через {{count}} год",
singularGenitive:"почти через {{count}} года",
pluralGenitive:"почти через {{count}} лет"
}
})
};
var formatDistance$19=function formatDistance$19(token,count,options){
return formatDistanceLocale$19[token](count,options);
};
var formatLong$19={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM y 'г.'",
long:"d MMMM y 'г.'",
medium:"d MMM y 'г.'",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}}, {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/ru/_lib/formatRelative.js
var accusativeWeekdays$2=[
"воскресенье",
"понедельник",
"вторник",
"среду",
"четверг",
"пятницу",
"субботу"];

function lastWeek$2(day){
var weekday=accusativeWeekdays$2[day];
switch(day){
case 0:return"'в прошлое "+weekday+" в' p";
case 1:
case 2:
case 4:return"'в прошлый "+weekday+" в' p";
case 3:
case 5:
case 6:return"'в прошлую "+weekday+" в' p";
}
}
function thisWeek$2(day){
var weekday=accusativeWeekdays$2[day];
if(day===2)return"'во "+weekday+" в' p";else
return"'в "+weekday+" в' p";
}
function nextWeek$2(day){
var weekday=accusativeWeekdays$2[day];
switch(day){
case 0:return"'в следующее "+weekday+" в' p";
case 1:
case 2:
case 4:return"'в следующий "+weekday+" в' p";
case 3:
case 5:
case 6:return"'в следующую "+weekday+" в' p";
}
}
var formatRelativeLocale$19={
lastWeek:function lastWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$2(day);else
return lastWeek$2(day);
},
yesterday:"'вчера в' p",
today:"'сегодня в' p",
tomorrow:"'завтра в' p",
nextWeek:function nextWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$2(day);else
return nextWeek$2(day);
},
other:"P"
};
var formatRelative$19=function formatRelative$19(token,date,baseDate,options){
var format=formatRelativeLocale$19[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/ru/_lib/localize.js
var eraValues$19={
narrow:["до н.э.","н.э."],
abbreviated:["до н. э.","н. э."],
wide:["до нашей эры","нашей эры"]
};
var quarterValues$19={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-й кв.",
"2-й кв.",
"3-й кв.",
"4-й кв."],

wide:[
"1-й квартал",
"2-й квартал",
"3-й квартал",
"4-й квартал"]

};
var monthValues$19={
narrow:[
"Я",
"Ф",
"М",
"А",
"М",
"И",
"И",
"А",
"С",
"О",
"Н",
"Д"],

abbreviated:[
"янв.",
"фев.",
"март",
"апр.",
"май",
"июнь",
"июль",
"авг.",
"сент.",
"окт.",
"нояб.",
"дек."],

wide:[
"январь",
"февраль",
"март",
"апрель",
"май",
"июнь",
"июль",
"август",
"сентябрь",
"октябрь",
"ноябрь",
"декабрь"]

};
var formattingMonthValues$5={
narrow:[
"Я",
"Ф",
"М",
"А",
"М",
"И",
"И",
"А",
"С",
"О",
"Н",
"Д"],

abbreviated:[
"янв.",
"фев.",
"мар.",
"апр.",
"мая",
"июн.",
"июл.",
"авг.",
"сент.",
"окт.",
"нояб.",
"дек."],

wide:[
"января",
"февраля",
"марта",
"апреля",
"мая",
"июня",
"июля",
"августа",
"сентября",
"октября",
"ноября",
"декабря"]

};
var dayValues$19={
narrow:[
"В",
"П",
"В",
"С",
"Ч",
"П",
"С"],

short:[
"вс",
"пн",
"вт",
"ср",
"чт",
"пт",
"сб"],

abbreviated:[
"вск",
"пнд",
"втр",
"срд",
"чтв",
"птн",
"суб"],

wide:[
"воскресенье",
"понедельник",
"вторник",
"среда",
"четверг",
"пятница",
"суббота"]

};
var dayPeriodValues$19={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"полн.",
noon:"полд.",
morning:"утро",
afternoon:"день",
evening:"веч.",
night:"ночь"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"полн.",
noon:"полд.",
morning:"утро",
afternoon:"день",
evening:"веч.",
night:"ночь"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"полночь",
noon:"полдень",
morning:"утро",
afternoon:"день",
evening:"вечер",
night:"ночь"
}
};
var formattingDayPeriodValues$18={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"полн.",
noon:"полд.",
morning:"утра",
afternoon:"дня",
evening:"веч.",
night:"ночи"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"полн.",
noon:"полд.",
morning:"утра",
afternoon:"дня",
evening:"веч.",
night:"ночи"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"полночь",
noon:"полдень",
morning:"утра",
afternoon:"дня",
evening:"вечера",
night:"ночи"
}
};
var ordinalNumber$19=function ordinalNumber$19(dirtyNumber,options){
var number=Number(dirtyNumber);
var unit=options===null||options===void 0?void 0:options.unit;
var suffix;
if(unit==="date")suffix="-е";else
if(unit==="week"||unit==="minute"||unit==="second")suffix="-я";else
suffix="-й";
return number+suffix;
};
//#endregion
//#region dist/date-fns/locale/ru.js
/**
* @category Locales
* @summary Russian locale.
* @language Russian
* @iso-639-2 rus
* @author Sasha Koss [@kossnocorp](https://github.com/kossnocorp)
* @author Lesha Koss [@leshakoss](https://github.com/leshakoss)
*/
var _ru={
code:"ru",
formatDistance:formatDistance$19,
formatLong:formatLong$19,
formatRelative:formatRelative$19,
localize:{
ordinalNumber:ordinalNumber$19,
era:buildLocalizeFn({
values:eraValues$19,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$19,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$19,
defaultWidth:"wide",
formattingValues:formattingMonthValues$5,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$19,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$19,
defaultWidth:"any",
formattingValues:formattingDayPeriodValues$18,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?(е|я|й|ое|ье|ая|ья|ый|ой|ий|ый))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((до )?н\.?\s?э\.?)/i,
abbreviated:/^((до )?н\.?\s?э\.?)/i,
wide:/^(до нашей эры|нашей эры|наша эра)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^д/i,/^н/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?[ыои]?й?)? кв.?/i,
wide:/^[1234](-?[ыои]?й?)? квартал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[яфмаисонд]/i,
abbreviated:/^(янв|фев|март?|апр|ма[йя]|июн[ья]?|июл[ья]?|авг|сент?|окт|нояб?|дек)\.?/i,
wide:/^(январ[ья]|феврал[ья]|марта?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|августа?|сентябр[ья]|октябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^я/i,
/^ф/i,
/^м/i,
/^а/i,
/^м/i,
/^и/i,
/^и/i,
/^а/i,
/^с/i,
/^о/i,
/^н/i,
/^я/i],

any:[
/^я/i,
/^ф/i,
/^мар/i,
/^ап/i,
/^ма[йя]/i,
/^июн/i,
/^июл/i,
/^ав/i,
/^с/i,
/^о/i,
/^н/i,
/^д/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[впсч]/i,
short:/^(вс|во|пн|по|вт|ср|чт|че|пт|пя|сб|су)\.?/i,
abbreviated:/^(вск|вос|пнд|пон|втр|вто|срд|сре|чтв|чет|птн|пят|суб).?/i,
wide:/^(воскресень[ея]|понедельника?|вторника?|сред[аы]|четверга?|пятниц[аы]|суббот[аы])/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^в/i,
/^п/i,
/^в/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i],

any:[
/^в[ос]/i,
/^п[он]/i,
/^в/i,
/^ср/i,
/^ч/i,
/^п[ят]/i,
/^с[уб]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
abbreviated:/^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
wide:/^([дп]п|полночь|полдень|утр[оа]|день|дня|вечера?|ноч[ьи])/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^дп/i,
pm:/^пп/i,
midnight:/^полн/i,
noon:/^полд/i,
morning:/^у/i,
afternoon:/^д[ен]/i,
evening:/^в/i,
night:/^н/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/se/_lib/formatDistance.js
var formatDistanceLocale$18={
lessThanXSeconds:{
one:"unnit go ovtta sekundda",
other:"unnit go {{count}} sekundda"
},
xSeconds:{
one:"sekundda",
other:"{{count}} sekundda"
},
halfAMinute:"bealle minuhta",
lessThanXMinutes:{
one:"unnit go bealle minuhta",
other:"unnit go {{count}} minuhta"
},
xMinutes:{
one:"minuhta",
other:"{{count}} minuhta"
},
aboutXHours:{
one:"sullii ovtta diimmu",
other:"sullii {{count}} diimmu"
},
xHours:{
one:"diimmu",
other:"{{count}} diimmu"
},
xDays:{
one:"beaivvi",
other:"{{count}} beaivvi"
},
aboutXWeeks:{
one:"sullii ovtta vahku",
other:"sullii {{count}} vahku"
},
xWeeks:{
one:"vahku",
other:"{{count}} vahku"
},
aboutXMonths:{
one:"sullii ovtta mánu",
other:"sullii {{count}} mánu"
},
xMonths:{
one:"mánu",
other:"{{count}} mánu"
},
aboutXYears:{
one:"sullii ovtta jagi",
other:"sullii {{count}} jagi"
},
xYears:{
one:"jagi",
other:"{{count}} jagi"
},
overXYears:{
one:"guhkit go jagi",
other:"guhkit go {{count}} jagi"
},
almostXYears:{
one:"measta jagi",
other:"measta {{count}} jagi"
}
};
var formatDistance$18=function formatDistance$18(token,count,options){
var result;
var tokenValue=formatDistanceLocale$18[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"geahčen "+result;else
return result+" áigi";
return result;
};
var formatLong$18={
date:buildFormatLongFn({
formats:{
full:"EEEE MMMM d. 'b.' y",
long:"MMMM d. 'b.' y",
medium:"MMM d. 'b.' y",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"'dii.' HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'dii.' {{time}}",
long:"{{date}} 'dii.' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/se/_lib/formatRelative.js
var formatRelativeLocale$18={
lastWeek:"'ovddit' eeee 'dii.' p",
yesterday:"'ikte dii.' p",
today:"'odne dii.' p",
tomorrow:"'ihtin dii.' p",
nextWeek:"EEEE 'dii.' p",
other:"P"
};
var formatRelative$18=function formatRelative$18(token,_date,_baseDate,_options){return formatRelativeLocale$18[token];};
//#endregion
//#region dist/date-fns/locale/se/_lib/localize.js
var eraValues$18={
narrow:["o.Kr.","m.Kr."],
abbreviated:["o.Kr.","m.Kr."],
wide:["ovdal Kristusa","maŋŋel Kristusa"]
};
var quarterValues$18={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. kvartála",
"2. kvartála",
"3. kvartála",
"4. kvartála"]

};
var monthValues$18={
narrow:[
"O",
"G",
"N",
"C",
"M",
"G",
"S",
"B",
"Č",
"G",
"S",
"J"],

abbreviated:[
"ođđa",
"guov",
"njuk",
"cuo",
"mies",
"geas",
"suoi",
"borg",
"čakč",
"golg",
"skáb",
"juov"],

wide:[
"ođđajagemánnu",
"guovvamánnu",
"njukčamánnu",
"cuoŋománnu",
"miessemánnu",
"geassemánnu",
"suoidnemánnu",
"borgemánnu",
"čakčamánnu",
"golggotmánnu",
"skábmamánnu",
"juovlamánnu"]

};
var dayValues$18={
narrow:[
"S",
"V",
"M",
"G",
"D",
"B",
"L"],

short:[
"sotn",
"vuos",
"maŋ",
"gask",
"duor",
"bear",
"láv"],

abbreviated:[
"sotn",
"vuos",
"maŋ",
"gask",
"duor",
"bear",
"láv"],

wide:[
"sotnabeaivi",
"vuossárga",
"maŋŋebárga",
"gaskavahkku",
"duorastat",
"bearjadat",
"lávvardat"]

};
var dayPeriodValues$18={
narrow:{
am:"a",
pm:"p",
midnight:"gaskaidja",
noon:"gaskabeaivi",
morning:"iđđes",
afternoon:"maŋŋel gaska.",
evening:"eahkes",
night:"ihkku"
},
abbreviated:{
am:"a.m.",
pm:"p.m.",
midnight:"gaskaidja",
noon:"gaskabeaivvi",
morning:"iđđes",
afternoon:"maŋŋel gaskabea.",
evening:"eahkes",
night:"ihkku"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"gaskaidja",
noon:"gaskabeavvi",
morning:"iđđes",
afternoon:"maŋŋel gaskabeaivvi",
evening:"eahkes",
night:"ihkku"
}
};
var ordinalNumber$18=function ordinalNumber$18(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/se.js
/**
* @category Locales
* @summary Northern Sámi locale.
* @language Northern Sámi
* @iso-639-2 sme
* @author Audun Rundberg [@audunru](https://github.com/audunru)
*/
var _se={
code:"se",
formatDistance:formatDistance$18,
formatLong:formatLong$18,
formatRelative:formatRelative$18,
localize:{
ordinalNumber:ordinalNumber$18,
era:buildLocalizeFn({
values:eraValues$18,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$18,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$18,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$18,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$18,
defaultWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\.?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(o\.? ?Kr\.?|m\.? ?Kr\.?)/i,
abbreviated:/^(o\.? ?Kr\.?|m\.? ?Kr\.?)/i,
wide:/^(ovdal Kristusa|ovdal min áiggi|maŋŋel Kristusa|min áigi)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^o/i,/^m/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](\.)? kvartála/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[ogncmsbčj]/i,
abbreviated:/^(ođđa|guov|njuk|cuo|mies|geas|suoi|borg|čakč|golg|skáb|juov)\.?/i,
wide:/^(ođđajagemánnu|guovvamánnu|njukčamánnu|cuoŋománnu|miessemánnu|geassemánnu|suoidnemánnu|borgemánnu|čakčamánnu|golggotmánnu|skábmamánnu|juovlamánnu)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^o/i,
/^g/i,
/^n/i,
/^c/i,
/^m/i,
/^g/i,
/^s/i,
/^b/i,
/^č/i,
/^g/i,
/^s/i,
/^j/i],

any:[
/^o/i,
/^gu/i,
/^n/i,
/^c/i,
/^m/i,
/^ge/i,
/^su/i,
/^b/i,
/^č/i,
/^go/i,
/^sk/i,
/^j/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[svmgdbl]/i,
short:/^(sotn|vuos|maŋ|gask|duor|bear|láv)/i,
abbreviated:/^(sotn|vuos|maŋ|gask|duor|bear|láv)/i,
wide:/^(sotnabeaivi|vuossárga|maŋŋebárga|gaskavahkku|duorastat|bearjadat|lávvardat)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^s/i,
/^v/i,
/^m/i,
/^g/i,
/^d/i,
/^b/i,
/^l/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(gaskaidja|gaskabeaivvi|(på) (iđđes|maŋŋel gaskabeaivvi|eahkes|ihkku)|[ap])/i,
any:/^([ap]\.?\s?m\.?|gaskaidja|gaskabeaivvi|(på) (iđđes|maŋŋel gaskabeaivvi|eahkes|ihkku))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a(\.?\s?m\.?)?$/i,
pm:/^p(\.?\s?m\.?)?$/i,
midnight:/^gaskai/i,
noon:/^gaskab/i,
morning:/iđđes/i,
afternoon:/maŋŋel gaskabeaivvi/i,
evening:/eahkes/i,
night:/ihkku/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/sk/_lib/formatDistance.js
function declensionGroup(scheme,count){
if(count===1&&scheme.one)return scheme.one;
if(count>=2&&count<=4&&scheme.twoFour)return scheme.twoFour;
return scheme.other;
}
function declension$1(scheme,count,time){
return declensionGroup(scheme,count)[time].replace("{{count}}",String(count));
}
function extractPreposition(token){
return[
"lessThan",
"about",
"over",
"almost"].
filter(function(preposition){
return!!token.match(new RegExp("^"+preposition));
})[0];
}
function prefixPreposition(preposition){
var translation="";
if(preposition==="almost")translation="takmer";
if(preposition==="about")translation="približne";
return translation.length>0?translation+" ":"";
}
function suffixPreposition(preposition){
var translation="";
if(preposition==="lessThan")translation="menej než";
if(preposition==="over")translation="viac než";
return translation.length>0?translation+" ":"";
}
function lowercaseFirstLetter(string){
return string.charAt(0).toLowerCase()+string.slice(1);
}
var formatDistanceLocale$17={
xSeconds:{
one:{
present:"sekunda",
past:"sekundou",
future:"sekundu"
},
twoFour:{
present:"{{count}} sekundy",
past:"{{count}} sekundami",
future:"{{count}} sekundy"
},
other:{
present:"{{count}} sekúnd",
past:"{{count}} sekundami",
future:"{{count}} sekúnd"
}
},
halfAMinute:{other:{
present:"pol minúty",
past:"pol minútou",
future:"pol minúty"
}},
xMinutes:{
one:{
present:"minúta",
past:"minútou",
future:"minútu"
},
twoFour:{
present:"{{count}} minúty",
past:"{{count}} minútami",
future:"{{count}} minúty"
},
other:{
present:"{{count}} minút",
past:"{{count}} minútami",
future:"{{count}} minút"
}
},
xHours:{
one:{
present:"hodina",
past:"hodinou",
future:"hodinu"
},
twoFour:{
present:"{{count}} hodiny",
past:"{{count}} hodinami",
future:"{{count}} hodiny"
},
other:{
present:"{{count}} hodín",
past:"{{count}} hodinami",
future:"{{count}} hodín"
}
},
xDays:{
one:{
present:"deň",
past:"dňom",
future:"deň"
},
twoFour:{
present:"{{count}} dni",
past:"{{count}} dňami",
future:"{{count}} dni"
},
other:{
present:"{{count}} dní",
past:"{{count}} dňami",
future:"{{count}} dní"
}
},
xWeeks:{
one:{
present:"týždeň",
past:"týždňom",
future:"týždeň"
},
twoFour:{
present:"{{count}} týždne",
past:"{{count}} týždňami",
future:"{{count}} týždne"
},
other:{
present:"{{count}} týždňov",
past:"{{count}} týždňami",
future:"{{count}} týždňov"
}
},
xMonths:{
one:{
present:"mesiac",
past:"mesiacom",
future:"mesiac"
},
twoFour:{
present:"{{count}} mesiace",
past:"{{count}} mesiacmi",
future:"{{count}} mesiace"
},
other:{
present:"{{count}} mesiacov",
past:"{{count}} mesiacmi",
future:"{{count}} mesiacov"
}
},
xYears:{
one:{
present:"rok",
past:"rokom",
future:"rok"
},
twoFour:{
present:"{{count}} roky",
past:"{{count}} rokmi",
future:"{{count}} roky"
},
other:{
present:"{{count}} rokov",
past:"{{count}} rokmi",
future:"{{count}} rokov"
}
}
};
var formatDistance$17=function formatDistance$17(token,count,options){
var preposition=extractPreposition(token)||"";
var scheme=formatDistanceLocale$17[lowercaseFirstLetter(token.substring(preposition.length))];
if(!(options!==null&&options!==void 0&&options.addSuffix))return prefixPreposition(preposition)+suffixPreposition(preposition)+declension$1(scheme,count,"present");
if(options.comparison&&options.comparison>0)return prefixPreposition(preposition)+"o "+suffixPreposition(preposition)+declension$1(scheme,count,"future");else
return prefixPreposition(preposition)+"pred "+suffixPreposition(preposition)+declension$1(scheme,count,"past");
};
var formatLong$17={
date:buildFormatLongFn({
formats:{
full:"EEEE d. MMMM y",
long:"d. MMMM y",
medium:"d. M. y",
short:"d. M. y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}}, {{time}}",
long:"{{date}}, {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/sk/_lib/formatRelative.js
var accusativeWeekdays$1=[
"nedeľu",
"pondelok",
"utorok",
"stredu",
"štvrtok",
"piatok",
"sobotu"];

function lastWeek$1(day){
var weekday=accusativeWeekdays$1[day];
switch(day){
case 0:
case 3:
case 6:return"'minulú "+weekday+" o' p";
default:return"'minulý' eeee 'o' p";
}
}
function thisWeek$1(day){
var weekday=accusativeWeekdays$1[day];
if(day===4)return"'vo' eeee 'o' p";else
return"'v "+weekday+" o' p";
}
function nextWeek$1(day){
var weekday=accusativeWeekdays$1[day];
switch(day){
case 0:
case 4:
case 6:return"'budúcu "+weekday+" o' p";
default:return"'budúci' eeee 'o' p";
}
}
var formatRelativeLocale$17={
lastWeek:function lastWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$1(day);else
return lastWeek$1(day);
},
yesterday:"'včera o' p",
today:"'dnes o' p",
tomorrow:"'zajtra o' p",
nextWeek:function nextWeek(date,baseDate,options){
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek$1(day);else
return nextWeek$1(day);
},
other:"P"
};
var formatRelative$17=function formatRelative$17(token,date,baseDate,options){
var format=formatRelativeLocale$17[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/sk/_lib/localize.js
var eraValues$17={
narrow:["pred Kr.","po Kr."],
abbreviated:["pred Kr.","po Kr."],
wide:["pred Kristom","po Kristovi"]
};
var quarterValues$17={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1. štvrťrok",
"2. štvrťrok",
"3. štvrťrok",
"4. štvrťrok"]

};
var monthValues$17={
narrow:[
"j",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"máj",
"jún",
"júl",
"aug",
"sep",
"okt",
"nov",
"dec"],

wide:[
"január",
"február",
"marec",
"apríl",
"máj",
"jún",
"júl",
"august",
"september",
"október",
"november",
"december"]

};
var formattingMonthValues$4={
narrow:[
"j",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"máj",
"jún",
"júl",
"aug",
"sep",
"okt",
"nov",
"dec"],

wide:[
"januára",
"februára",
"marca",
"apríla",
"mája",
"júna",
"júla",
"augusta",
"septembra",
"októbra",
"novembra",
"decembra"]

};
var dayValues$17={
narrow:[
"n",
"p",
"u",
"s",
"š",
"p",
"s"],

short:[
"ne",
"po",
"ut",
"st",
"št",
"pi",
"so"],

abbreviated:[
"ne",
"po",
"ut",
"st",
"št",
"pi",
"so"],

wide:[
"nedeľa",
"pondelok",
"utorok",
"streda",
"štvrtok",
"piatok",
"sobota"]

};
var dayPeriodValues$17={
narrow:{
am:"AM",
pm:"PM",
midnight:"poln.",
noon:"pol.",
morning:"ráno",
afternoon:"pop.",
evening:"več.",
night:"noc"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"poln.",
noon:"pol.",
morning:"ráno",
afternoon:"popol.",
evening:"večer",
night:"noc"
},
wide:{
am:"AM",
pm:"PM",
midnight:"polnoc",
noon:"poludnie",
morning:"ráno",
afternoon:"popoludnie",
evening:"večer",
night:"noc"
}
};
var formattingDayPeriodValues$17={
narrow:{
am:"AM",
pm:"PM",
midnight:"o poln.",
noon:"nap.",
morning:"ráno",
afternoon:"pop.",
evening:"več.",
night:"v n."
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"o poln.",
noon:"napol.",
morning:"ráno",
afternoon:"popol.",
evening:"večer",
night:"v noci"
},
wide:{
am:"AM",
pm:"PM",
midnight:"o polnoci",
noon:"napoludnie",
morning:"ráno",
afternoon:"popoludní",
evening:"večer",
night:"v noci"
}
};
var ordinalNumber$17=function ordinalNumber$17(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/sk.js
/**
* @category Locales
* @summary Slovak locale.
* @language Slovak
* @iso-639-2 slk
* @author Marek Suscak [@mareksuscak](https://github.com/mareksuscak)
*/
var _sk={
code:"sk",
formatDistance:formatDistance$17,
formatLong:formatLong$17,
formatRelative:formatRelative$17,
localize:{
ordinalNumber:ordinalNumber$17,
era:buildLocalizeFn({
values:eraValues$17,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$17,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$17,
defaultWidth:"wide",
formattingValues:formattingMonthValues$4,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$17,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$17,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$17,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\.?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(pred Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
abbreviated:/^(pred Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
wide:/^(pred Kristom|pred na[šs][íi]m letopo[čc]tom|po Kristovi|n[áa][šs]ho letopo[čc]tu)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^pr/i,/^(po|n)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234]\. [šs]tvr[ťt]rok/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mar|apr|m[áa]j|j[úu]n|j[úu]l|aug|sep|okt|nov|dec)/i,
wide:/^(janu[áa]ra?|febru[áa]ra?|(marec|marca)|apr[íi]la?|m[áa]ja?|j[úu]na?|j[úu]la?|augusta?|(september|septembra)|(okt[óo]ber|okt[óo]bra)|(november|novembra)|(december|decembra))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^m[áa]j/i,
/^j[úu]n/i,
/^j[úu]l/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[npusšp]/i,
short:/^(ne|po|ut|st|št|pi|so)/i,
abbreviated:/^(ne|po|ut|st|št|pi|so)/i,
wide:/^(nede[ľl]a|pondelok|utorok|streda|[šs]tvrtok|piatok|sobota])/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^n/i,
/^p/i,
/^u/i,
/^s/i,
/^š/i,
/^p/i,
/^s/i],

any:[
/^n/i,
/^po/i,
/^u/i,
/^st/i,
/^(št|stv)/i,
/^pi/i,
/^so/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(am|pm|(o )?poln\.?|(nap\.?|pol\.?)|r[áa]no|pop\.?|ve[čc]\.?|(v n\.?|noc))/i,
abbreviated:/^(am|pm|(o )?poln\.?|(napol\.?|pol\.?)|r[áa]no|pop\.?|ve[čc]er|(v )?noci?)/i,
any:/^(am|pm|(o )?polnoci?|(na)?poludnie|r[áa]no|popoludn(ie|í|i)|ve[čc]er|(v )?noci?)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^am/i,
pm:/^pm/i,
midnight:/poln/i,
noon:/^(nap|(na)?pol(\.|u))/i,
morning:/^r[áa]no/i,
afternoon:/^pop/i,
evening:/^ve[čc]/i,
night:/^(noc|v n\.)/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/sl/_lib/formatDistance.js
function isPluralType$1(val){
return val.one!==void 0;
}
var formatDistanceLocale$16={
lessThanXSeconds:{
present:{
one:"manj kot {{count}} sekunda",
two:"manj kot {{count}} sekundi",
few:"manj kot {{count}} sekunde",
other:"manj kot {{count}} sekund"
},
past:{
one:"manj kot {{count}} sekundo",
two:"manj kot {{count}} sekundama",
few:"manj kot {{count}} sekundami",
other:"manj kot {{count}} sekundami"
},
future:{
one:"manj kot {{count}} sekundo",
two:"manj kot {{count}} sekundi",
few:"manj kot {{count}} sekunde",
other:"manj kot {{count}} sekund"
}
},
xSeconds:{
present:{
one:"{{count}} sekunda",
two:"{{count}} sekundi",
few:"{{count}} sekunde",
other:"{{count}} sekund"
},
past:{
one:"{{count}} sekundo",
two:"{{count}} sekundama",
few:"{{count}} sekundami",
other:"{{count}} sekundami"
},
future:{
one:"{{count}} sekundo",
two:"{{count}} sekundi",
few:"{{count}} sekunde",
other:"{{count}} sekund"
}
},
halfAMinute:"pol minute",
lessThanXMinutes:{
present:{
one:"manj kot {{count}} minuta",
two:"manj kot {{count}} minuti",
few:"manj kot {{count}} minute",
other:"manj kot {{count}} minut"
},
past:{
one:"manj kot {{count}} minuto",
two:"manj kot {{count}} minutama",
few:"manj kot {{count}} minutami",
other:"manj kot {{count}} minutami"
},
future:{
one:"manj kot {{count}} minuto",
two:"manj kot {{count}} minuti",
few:"manj kot {{count}} minute",
other:"manj kot {{count}} minut"
}
},
xMinutes:{
present:{
one:"{{count}} minuta",
two:"{{count}} minuti",
few:"{{count}} minute",
other:"{{count}} minut"
},
past:{
one:"{{count}} minuto",
two:"{{count}} minutama",
few:"{{count}} minutami",
other:"{{count}} minutami"
},
future:{
one:"{{count}} minuto",
two:"{{count}} minuti",
few:"{{count}} minute",
other:"{{count}} minut"
}
},
aboutXHours:{
present:{
one:"približno {{count}} ura",
two:"približno {{count}} uri",
few:"približno {{count}} ure",
other:"približno {{count}} ur"
},
past:{
one:"približno {{count}} uro",
two:"približno {{count}} urama",
few:"približno {{count}} urami",
other:"približno {{count}} urami"
},
future:{
one:"približno {{count}} uro",
two:"približno {{count}} uri",
few:"približno {{count}} ure",
other:"približno {{count}} ur"
}
},
xHours:{
present:{
one:"{{count}} ura",
two:"{{count}} uri",
few:"{{count}} ure",
other:"{{count}} ur"
},
past:{
one:"{{count}} uro",
two:"{{count}} urama",
few:"{{count}} urami",
other:"{{count}} urami"
},
future:{
one:"{{count}} uro",
two:"{{count}} uri",
few:"{{count}} ure",
other:"{{count}} ur"
}
},
xDays:{
present:{
one:"{{count}} dan",
two:"{{count}} dni",
few:"{{count}} dni",
other:"{{count}} dni"
},
past:{
one:"{{count}} dnem",
two:"{{count}} dnevoma",
few:"{{count}} dnevi",
other:"{{count}} dnevi"
},
future:{
one:"{{count}} dan",
two:"{{count}} dni",
few:"{{count}} dni",
other:"{{count}} dni"
}
},
aboutXWeeks:{
one:"približno {{count}} teden",
two:"približno {{count}} tedna",
few:"približno {{count}} tedne",
other:"približno {{count}} tednov"
},
xWeeks:{
one:"{{count}} teden",
two:"{{count}} tedna",
few:"{{count}} tedne",
other:"{{count}} tednov"
},
aboutXMonths:{
present:{
one:"približno {{count}} mesec",
two:"približno {{count}} meseca",
few:"približno {{count}} mesece",
other:"približno {{count}} mesecev"
},
past:{
one:"približno {{count}} mesecem",
two:"približno {{count}} mesecema",
few:"približno {{count}} meseci",
other:"približno {{count}} meseci"
},
future:{
one:"približno {{count}} mesec",
two:"približno {{count}} meseca",
few:"približno {{count}} mesece",
other:"približno {{count}} mesecev"
}
},
xMonths:{
present:{
one:"{{count}} mesec",
two:"{{count}} meseca",
few:"{{count}} meseci",
other:"{{count}} mesecev"
},
past:{
one:"{{count}} mesecem",
two:"{{count}} mesecema",
few:"{{count}} meseci",
other:"{{count}} meseci"
},
future:{
one:"{{count}} mesec",
two:"{{count}} meseca",
few:"{{count}} mesece",
other:"{{count}} mesecev"
}
},
aboutXYears:{
present:{
one:"približno {{count}} leto",
two:"približno {{count}} leti",
few:"približno {{count}} leta",
other:"približno {{count}} let"
},
past:{
one:"približno {{count}} letom",
two:"približno {{count}} letoma",
few:"približno {{count}} leti",
other:"približno {{count}} leti"
},
future:{
one:"približno {{count}} leto",
two:"približno {{count}} leti",
few:"približno {{count}} leta",
other:"približno {{count}} let"
}
},
xYears:{
present:{
one:"{{count}} leto",
two:"{{count}} leti",
few:"{{count}} leta",
other:"{{count}} let"
},
past:{
one:"{{count}} letom",
two:"{{count}} letoma",
few:"{{count}} leti",
other:"{{count}} leti"
},
future:{
one:"{{count}} leto",
two:"{{count}} leti",
few:"{{count}} leta",
other:"{{count}} let"
}
},
overXYears:{
present:{
one:"več kot {{count}} leto",
two:"več kot {{count}} leti",
few:"več kot {{count}} leta",
other:"več kot {{count}} let"
},
past:{
one:"več kot {{count}} letom",
two:"več kot {{count}} letoma",
few:"več kot {{count}} leti",
other:"več kot {{count}} leti"
},
future:{
one:"več kot {{count}} leto",
two:"več kot {{count}} leti",
few:"več kot {{count}} leta",
other:"več kot {{count}} let"
}
},
almostXYears:{
present:{
one:"skoraj {{count}} leto",
two:"skoraj {{count}} leti",
few:"skoraj {{count}} leta",
other:"skoraj {{count}} let"
},
past:{
one:"skoraj {{count}} letom",
two:"skoraj {{count}} letoma",
few:"skoraj {{count}} leti",
other:"skoraj {{count}} leti"
},
future:{
one:"skoraj {{count}} leto",
two:"skoraj {{count}} leti",
few:"skoraj {{count}} leta",
other:"skoraj {{count}} let"
}
}
};
function getFormFromCount(count){
switch(count%100){
case 1:return"one";
case 2:return"two";
case 3:
case 4:return"few";
default:return"other";
}
}
var formatDistance$16=function formatDistance$16(token,count,options){
var result="";
var tense="present";
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0){
tense="future";
result="čez ";
}else{
tense="past";
result="pred ";
}
var tokenValue=formatDistanceLocale$16[token];
if(typeof tokenValue==="string")result+=tokenValue;else
{
var form=getFormFromCount(count);
if(isPluralType$1(tokenValue))result+=tokenValue[form].replace("{{count}}",String(count));else
result+=tokenValue[tense][form].replace("{{count}}",String(count));
}
return result;
};
var formatLong$16={
date:buildFormatLongFn({
formats:{
full:"EEEE, dd. MMMM y",
long:"dd. MMMM y",
medium:"d. MMM y",
short:"d. MM. yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/sl/_lib/formatRelative.js
var formatRelativeLocale$16={
lastWeek:function lastWeek(date){
switch(date.getDay()){
case 0:return"'prejšnjo nedeljo ob' p";
case 3:return"'prejšnjo sredo ob' p";
case 6:return"'prejšnjo soboto ob' p";
default:return"'prejšnji' EEEE 'ob' p";
}
},
yesterday:"'včeraj ob' p",
today:"'danes ob' p",
tomorrow:"'jutri ob' p",
nextWeek:function nextWeek(date){
switch(date.getDay()){
case 0:return"'naslednjo nedeljo ob' p";
case 3:return"'naslednjo sredo ob' p";
case 6:return"'naslednjo soboto ob' p";
default:return"'naslednji' EEEE 'ob' p";
}
},
other:"P"
};
var formatRelative$16=function formatRelative$16(token,date,_baseDate,_options){
var format=formatRelativeLocale$16[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/sl/_lib/localize.js
var eraValues$16={
narrow:["pr. n. št.","po n. št."],
abbreviated:["pr. n. št.","po n. št."],
wide:["pred našim štetjem","po našem štetju"]
};
var quarterValues$16={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1. čet.",
"2. čet.",
"3. čet.",
"4. čet."],

wide:[
"1. četrtletje",
"2. četrtletje",
"3. četrtletje",
"4. četrtletje"]

};
var monthValues$16={
narrow:[
"j",
"f",
"m",
"a",
"m",
"j",
"j",
"a",
"s",
"o",
"n",
"d"],

abbreviated:[
"jan.",
"feb.",
"mar.",
"apr.",
"maj",
"jun.",
"jul.",
"avg.",
"sep.",
"okt.",
"nov.",
"dec."],

wide:[
"januar",
"februar",
"marec",
"april",
"maj",
"junij",
"julij",
"avgust",
"september",
"oktober",
"november",
"december"]

};
var dayValues$16={
narrow:[
"n",
"p",
"t",
"s",
"č",
"p",
"s"],

short:[
"ned.",
"pon.",
"tor.",
"sre.",
"čet.",
"pet.",
"sob."],

abbreviated:[
"ned.",
"pon.",
"tor.",
"sre.",
"čet.",
"pet.",
"sob."],

wide:[
"nedelja",
"ponedeljek",
"torek",
"sreda",
"četrtek",
"petek",
"sobota"]

};
var dayPeriodValues$16={
narrow:{
am:"d",
pm:"p",
midnight:"24.00",
noon:"12.00",
morning:"j",
afternoon:"p",
evening:"v",
night:"n"
},
abbreviated:{
am:"dop.",
pm:"pop.",
midnight:"poln.",
noon:"pold.",
morning:"jut.",
afternoon:"pop.",
evening:"več.",
night:"noč"
},
wide:{
am:"dop.",
pm:"pop.",
midnight:"polnoč",
noon:"poldne",
morning:"jutro",
afternoon:"popoldne",
evening:"večer",
night:"noč"
}
};
var formattingDayPeriodValues$16={
narrow:{
am:"d",
pm:"p",
midnight:"24.00",
noon:"12.00",
morning:"zj",
afternoon:"p",
evening:"zv",
night:"po"
},
abbreviated:{
am:"dop.",
pm:"pop.",
midnight:"opoln.",
noon:"opold.",
morning:"zjut.",
afternoon:"pop.",
evening:"zveč.",
night:"ponoči"
},
wide:{
am:"dop.",
pm:"pop.",
midnight:"opolnoči",
noon:"opoldne",
morning:"zjutraj",
afternoon:"popoldan",
evening:"zvečer",
night:"ponoči"
}
};
var ordinalNumber$16=function ordinalNumber$16(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/sl.js
/**
* @category Locales
* @summary Slovenian locale.
* @language Slovenian
* @iso-639-2 slv
* @author Adam Stradovnik [@Neoglyph](https://github.com/Neoglyph)
* @author Mato Žgajner [@mzgajner](https://github.com/mzgajner)
*/
var _sl={
code:"sl",
formatDistance:formatDistance$16,
formatLong:formatLong$16,
formatRelative:formatRelative$16,
localize:{
ordinalNumber:ordinalNumber$16,
era:buildLocalizeFn({
values:eraValues$16,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$16,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$16,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$16,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$16,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$16,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
abbreviated:/^(pr\. n\. št\.|po n\. št\.)/i,
wide:/^(pred Kristusom|pred na[sš]im [sš]tetjem|po Kristusu|po na[sš]em [sš]tetju|na[sš]ega [sš]tetja)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^pr/i,/^(po|na[sš]em)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]\.\s?[čc]et\.?/i,
wide:/^[1234]\. [čc]etrtletje/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan\.|feb\.|mar\.|apr\.|maj|jun\.|jul\.|avg\.|sep\.|okt\.|nov\.|dec\.)/i,
wide:/^(januar|februar|marec|april|maj|junij|julij|avgust|september|oktober|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

abbreviated:[
/^ja/i,
/^fe/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^av/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

wide:[
/^ja/i,
/^fe/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^av/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"wide"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[nptsčc]/i,
short:/^(ned\.|pon\.|tor\.|sre\.|[cč]et\.|pet\.|sob\.)/i,
abbreviated:/^(ned\.|pon\.|tor\.|sre\.|[cč]et\.|pet\.|sob\.)/i,
wide:/^(nedelja|ponedeljek|torek|sreda|[cč]etrtek|petek|sobota)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^n/i,
/^p/i,
/^t/i,
/^s/i,
/^[cč]/i,
/^p/i,
/^s/i],

any:[
/^n/i,
/^po/i,
/^t/i,
/^sr/i,
/^[cč]/i,
/^pe/i,
/^so/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(d|po?|z?v|n|z?j|24\.00|12\.00)/i,
any:/^(dop\.|pop\.|o?poln(\.|o[cč]i?)|o?pold(\.|ne)|z?ve[cč](\.|er)|(po)?no[cč]i?|popold(ne|an)|jut(\.|ro)|zjut(\.|raj))/i
},
defaultMatchWidth:"any",
parsePatterns:{
narrow:{
am:/^d/i,
pm:/^p/i,
midnight:/^24/i,
noon:/^12/i,
morning:/^(z?j)/i,
afternoon:/^p/i,
evening:/^(z?v)/i,
night:/^(n|po)/i
},
any:{
am:/^dop\./i,
pm:/^pop\./i,
midnight:/^o?poln/i,
noon:/^o?pold/i,
morning:/j/i,
afternoon:/^pop\./i,
evening:/^z?ve/i,
night:/(po)?no/i
}
},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/sq/_lib/formatDistance.js
var formatDistanceLocale$15={
lessThanXSeconds:{
one:"më pak se një sekondë",
other:"më pak se {{count}} sekonda"
},
xSeconds:{
one:"1 sekondë",
other:"{{count}} sekonda"
},
halfAMinute:"gjysëm minuti",
lessThanXMinutes:{
one:"më pak se një minute",
other:"më pak se {{count}} minuta"
},
xMinutes:{
one:"1 minutë",
other:"{{count}} minuta"
},
aboutXHours:{
one:"rreth 1 orë",
other:"rreth {{count}} orë"
},
xHours:{
one:"1 orë",
other:"{{count}} orë"
},
xDays:{
one:"1 ditë",
other:"{{count}} ditë"
},
aboutXWeeks:{
one:"rreth 1 javë",
other:"rreth {{count}} javë"
},
xWeeks:{
one:"1 javë",
other:"{{count}} javë"
},
aboutXMonths:{
one:"rreth 1 muaj",
other:"rreth {{count}} muaj"
},
xMonths:{
one:"1 muaj",
other:"{{count}} muaj"
},
aboutXYears:{
one:"rreth 1 vit",
other:"rreth {{count}} vite"
},
xYears:{
one:"1 vit",
other:"{{count}} vite"
},
overXYears:{
one:"mbi 1 vit",
other:"mbi {{count}} vite"
},
almostXYears:{
one:"pothuajse 1 vit",
other:"pothuajse {{count}} vite"
}
};
var formatDistance$15=function formatDistance$15(token,count,options){
var result;
var tokenValue=formatDistanceLocale$15[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"në "+result;else
return result+" më parë";
return result;
};
var formatLong$15={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'në' {{time}}",
long:"{{date}} 'në' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/sq/_lib/formatRelative.js
var formatRelativeLocale$15={
lastWeek:"'të' eeee 'e shkuar në' p",
yesterday:"'dje në' p",
today:"'sot në' p",
tomorrow:"'nesër në' p",
nextWeek:"eeee 'at' p",
other:"P"
};
var formatRelative$15=function formatRelative$15(token,_date,_baseDate,_options){return formatRelativeLocale$15[token];};
//#endregion
//#region dist/date-fns/locale/sq/_lib/localize.js
var eraValues$15={
narrow:["P","M"],
abbreviated:["PK","MK"],
wide:["Para Krishtit","Mbas Krishtit"]
};
var quarterValues$15={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"4-mujori I",
"4-mujori II",
"4-mujori III",
"4-mujori IV"]

};
var monthValues$15={
narrow:[
"J",
"S",
"M",
"P",
"M",
"Q",
"K",
"G",
"S",
"T",
"N",
"D"],

abbreviated:[
"Jan",
"Shk",
"Mar",
"Pri",
"Maj",
"Qer",
"Kor",
"Gus",
"Sht",
"Tet",
"Nën",
"Dhj"],

wide:[
"Janar",
"Shkurt",
"Mars",
"Prill",
"Maj",
"Qershor",
"Korrik",
"Gusht",
"Shtator",
"Tetor",
"Nëntor",
"Dhjetor"]

};
var dayValues$15={
narrow:[
"D",
"H",
"M",
"M",
"E",
"P",
"S"],

short:[
"Di",
"Hë",
"Ma",
"Më",
"En",
"Pr",
"Sh"],

abbreviated:[
"Die",
"Hën",
"Mar",
"Mër",
"Enj",
"Pre",
"Sht"],

wide:[
"Dielë",
"Hënë",
"Martë",
"Mërkurë",
"Enjte",
"Premte",
"Shtunë"]

};
var dayPeriodValues$15={
narrow:{
am:"p",
pm:"m",
midnight:"m",
noon:"d",
morning:"mëngjes",
afternoon:"dite",
evening:"mbrëmje",
night:"natë"
},
abbreviated:{
am:"PD",
pm:"MD",
midnight:"mesnëtë",
noon:"drek",
morning:"mëngjes",
afternoon:"mbasdite",
evening:"mbrëmje",
night:"natë"
},
wide:{
am:"p.d.",
pm:"m.d.",
midnight:"mesnëtë",
noon:"drek",
morning:"mëngjes",
afternoon:"mbasdite",
evening:"mbrëmje",
night:"natë"
}
};
var formattingDayPeriodValues$15={
narrow:{
am:"p",
pm:"m",
midnight:"m",
noon:"d",
morning:"në mëngjes",
afternoon:"në mbasdite",
evening:"në mbrëmje",
night:"në mesnatë"
},
abbreviated:{
am:"PD",
pm:"MD",
midnight:"mesnatë",
noon:"drek",
morning:"në mëngjes",
afternoon:"në mbasdite",
evening:"në mbrëmje",
night:"në mesnatë"
},
wide:{
am:"p.d.",
pm:"m.d.",
midnight:"mesnatë",
noon:"drek",
morning:"në mëngjes",
afternoon:"në mbasdite",
evening:"në mbrëmje",
night:"në mesnatë"
}
};
var ordinalNumber$15=function ordinalNumber$15(dirtyNumber,options){
var number=Number(dirtyNumber);
if((options===null||options===void 0?void 0:options.unit)==="hour")return String(number);
if(number===1)return number+"-rë";
if(number===4)return number+"t";
return number+"-të";
};
//#endregion
//#region dist/date-fns/locale/sq.js
/**
* @category Locales
* @summary Albanian locale.
* @language Shqip
* @iso-639-2 sqi
* @author Ardit Dine [@arditdine](https://github.com/arditdine)
*/
var _sq={
code:"sq",
formatDistance:formatDistance$15,
formatLong:formatLong$15,
formatRelative:formatRelative$15,
localize:{
ordinalNumber:ordinalNumber$15,
era:buildLocalizeFn({
values:eraValues$15,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$15,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$15,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$15,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$15,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$15,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-rë|-të|t|)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(p|m)/i,
abbreviated:/^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
wide:/^(para krishtit|mbas krishtit)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^b/i,/^(p|m)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234]-mujori (i{1,3}|iv)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jsmpqkftnd]/i,
abbreviated:/^(jan|shk|mar|pri|maj|qer|kor|gus|sht|tet|nën|dhj)/i,
wide:/^(janar|shkurt|mars|prill|maj|qershor|korrik|gusht|shtator|tetor|nëntor|dhjetor)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^s/i,
/^m/i,
/^p/i,
/^m/i,
/^q/i,
/^k/i,
/^g/i,
/^s/i,
/^t/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^shk/i,
/^mar/i,
/^pri/i,
/^maj/i,
/^qer/i,
/^kor/i,
/^gu/i,
/^sht/i,
/^tet/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[dhmeps]/i,
short:/^(di|hë|ma|më|en|pr|sh)/i,
abbreviated:/^(die|hën|mar|mër|enj|pre|sht)/i,
wide:/^(dielë|hënë|martë|mërkurë|enjte|premte|shtunë)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^d/i,
/^h/i,
/^m/i,
/^m/i,
/^e/i,
/^p/i,
/^s/i],

any:[
/^d/i,
/^h/i,
/^ma/i,
/^më/i,
/^e/i,
/^p/i,
/^s/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(p|m|me|në (mëngjes|mbasdite|mbrëmje|mesnatë))/i,
any:/^([pm]\.?\s?d\.?|drek|në (mëngjes|mbasdite|mbrëmje|mesnatë))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^p/i,
pm:/^m/i,
midnight:/^me/i,
noon:/^dr/i,
morning:/mëngjes/i,
afternoon:/mbasdite/i,
evening:/mbrëmje/i,
night:/natë/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/sr/_lib/formatDistance.js
var formatDistanceLocale$14={
lessThanXSeconds:{
one:{
standalone:"мање од 1 секунде",
withPrepositionAgo:"мање од 1 секунде",
withPrepositionIn:"мање од 1 секунду"
},
dual:"мање од {{count}} секунде",
other:"мање од {{count}} секунди"
},
xSeconds:{
one:{
standalone:"1 секунда",
withPrepositionAgo:"1 секунде",
withPrepositionIn:"1 секунду"
},
dual:"{{count}} секунде",
other:"{{count}} секунди"
},
halfAMinute:"пола минуте",
lessThanXMinutes:{
one:{
standalone:"мање од 1 минуте",
withPrepositionAgo:"мање од 1 минуте",
withPrepositionIn:"мање од 1 минуту"
},
dual:"мање од {{count}} минуте",
other:"мање од {{count}} минута"
},
xMinutes:{
one:{
standalone:"1 минута",
withPrepositionAgo:"1 минуте",
withPrepositionIn:"1 минуту"
},
dual:"{{count}} минуте",
other:"{{count}} минута"
},
aboutXHours:{
one:{
standalone:"око 1 сат",
withPrepositionAgo:"око 1 сат",
withPrepositionIn:"око 1 сат"
},
dual:"око {{count}} сата",
other:"око {{count}} сати"
},
xHours:{
one:{
standalone:"1 сат",
withPrepositionAgo:"1 сат",
withPrepositionIn:"1 сат"
},
dual:"{{count}} сата",
other:"{{count}} сати"
},
xDays:{
one:{
standalone:"1 дан",
withPrepositionAgo:"1 дан",
withPrepositionIn:"1 дан"
},
dual:"{{count}} дана",
other:"{{count}} дана"
},
aboutXWeeks:{
one:{
standalone:"око 1 недељу",
withPrepositionAgo:"око 1 недељу",
withPrepositionIn:"око 1 недељу"
},
dual:"око {{count}} недеље",
other:"око {{count}} недеље"
},
xWeeks:{
one:{
standalone:"1 недељу",
withPrepositionAgo:"1 недељу",
withPrepositionIn:"1 недељу"
},
dual:"{{count}} недеље",
other:"{{count}} недеље"
},
aboutXMonths:{
one:{
standalone:"око 1 месец",
withPrepositionAgo:"око 1 месец",
withPrepositionIn:"око 1 месец"
},
dual:"око {{count}} месеца",
other:"око {{count}} месеци"
},
xMonths:{
one:{
standalone:"1 месец",
withPrepositionAgo:"1 месец",
withPrepositionIn:"1 месец"
},
dual:"{{count}} месеца",
other:"{{count}} месеци"
},
aboutXYears:{
one:{
standalone:"око 1 годину",
withPrepositionAgo:"око 1 годину",
withPrepositionIn:"око 1 годину"
},
dual:"око {{count}} године",
other:"око {{count}} година"
},
xYears:{
one:{
standalone:"1 година",
withPrepositionAgo:"1 године",
withPrepositionIn:"1 годину"
},
dual:"{{count}} године",
other:"{{count}} година"
},
overXYears:{
one:{
standalone:"преко 1 годину",
withPrepositionAgo:"преко 1 годину",
withPrepositionIn:"преко 1 годину"
},
dual:"преко {{count}} године",
other:"преко {{count}} година"
},
almostXYears:{
one:{
standalone:"готово 1 годину",
withPrepositionAgo:"готово 1 годину",
withPrepositionIn:"готово 1 годину"
},
dual:"готово {{count}} године",
other:"готово {{count}} година"
}
};
var formatDistance$14=function formatDistance$14(token,count,options){
var result;
var tokenValue=formatDistanceLocale$14[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1){if(options!==null&&options!==void 0&&options.addSuffix){if(options.comparison&&options.comparison>0)result=tokenValue.one.withPrepositionIn;else
result=tokenValue.one.withPrepositionAgo;}else
result=tokenValue.one.standalone;}else
if(count%10>1&&count%10<5&&String(count).substr(-2,1)!=="1")result=tokenValue.dual.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"за "+result;else
return"пре "+result;
return result;
};
var formatLong$14={
date:buildFormatLongFn({
formats:{
full:"EEEE, d. MMMM yyyy.",
long:"d. MMMM yyyy.",
medium:"d. MMM yy.",
short:"dd. MM. yy."
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss (zzzz)",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'у' {{time}}",
long:"{{date}} 'у' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/sr/_lib/formatRelative.js
var formatRelativeLocale$14={
lastWeek:function lastWeek(date){
switch(date.getDay()){
case 0:return"'прошле недеље у' p";
case 3:return"'прошле среде у' p";
case 6:return"'прошле суботе у' p";
default:return"'прошли' EEEE 'у' p";
}
},
yesterday:"'јуче у' p",
today:"'данас у' p",
tomorrow:"'сутра у' p",
nextWeek:function nextWeek(date){
switch(date.getDay()){
case 0:return"'следеће недеље у' p";
case 3:return"'следећу среду у' p";
case 6:return"'следећу суботу у' p";
default:return"'следећи' EEEE 'у' p";
}
},
other:"P"
};
var formatRelative$14=function formatRelative$14(token,date,_baseDate,_options){
var format=formatRelativeLocale$14[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/sr/_lib/localize.js
var eraValues$14={
narrow:["пр.н.е.","АД"],
abbreviated:["пр. Хр.","по. Хр."],
wide:["Пре Христа","После Христа"]
};
var quarterValues$14={
narrow:[
"1.",
"2.",
"3.",
"4."],

abbreviated:[
"1. кв.",
"2. кв.",
"3. кв.",
"4. кв."],

wide:[
"1. квартал",
"2. квартал",
"3. квартал",
"4. квартал"]

};
var monthValues$14={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"јан",
"феб",
"мар",
"апр",
"мај",
"јун",
"јул",
"авг",
"сеп",
"окт",
"нов",
"дец"],

wide:[
"јануар",
"фебруар",
"март",
"април",
"мај",
"јун",
"јул",
"август",
"септембар",
"октобар",
"новембар",
"децембар"]

};
var formattingMonthValues$3={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"јан",
"феб",
"мар",
"апр",
"мај",
"јун",
"јул",
"авг",
"сеп",
"окт",
"нов",
"дец"],

wide:[
"јануар",
"фебруар",
"март",
"април",
"мај",
"јун",
"јул",
"август",
"септембар",
"октобар",
"новембар",
"децембар"]

};
var dayValues$14={
narrow:[
"Н",
"П",
"У",
"С",
"Ч",
"П",
"С"],

short:[
"нед",
"пон",
"уто",
"сре",
"чет",
"пет",
"суб"],

abbreviated:[
"нед",
"пон",
"уто",
"сре",
"чет",
"пет",
"суб"],

wide:[
"недеља",
"понедељак",
"уторак",
"среда",
"четвртак",
"петак",
"субота"]

};
var formattingDayPeriodValues$14={
narrow:{
am:"АМ",
pm:"ПМ",
midnight:"поноћ",
noon:"подне",
morning:"ујутру",
afternoon:"поподне",
evening:"увече",
night:"ноћу"
},
abbreviated:{
am:"АМ",
pm:"ПМ",
midnight:"поноћ",
noon:"подне",
morning:"ујутру",
afternoon:"поподне",
evening:"увече",
night:"ноћу"
},
wide:{
am:"AM",
pm:"PM",
midnight:"поноћ",
noon:"подне",
morning:"ујутру",
afternoon:"после подне",
evening:"увече",
night:"ноћу"
}
};
var dayPeriodValues$14={
narrow:{
am:"AM",
pm:"PM",
midnight:"поноћ",
noon:"подне",
morning:"ујутру",
afternoon:"поподне",
evening:"увече",
night:"ноћу"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"поноћ",
noon:"подне",
morning:"ујутру",
afternoon:"поподне",
evening:"увече",
night:"ноћу"
},
wide:{
am:"AM",
pm:"PM",
midnight:"поноћ",
noon:"подне",
morning:"ујутру",
afternoon:"после подне",
evening:"увече",
night:"ноћу"
}
};
var ordinalNumber$14=function ordinalNumber$14(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/sr.js
/**
* @category Locales
* @summary Serbian cyrillic locale.
* @language Serbian
* @iso-639-2 srp
* @author Igor Radivojević [@rogyvoje](https://github.com/rogyvoje)
*/
var _sr={
code:"sr",
formatDistance:formatDistance$14,
formatLong:formatLong$14,
formatRelative:formatRelative$14,
localize:{
ordinalNumber:ordinalNumber$14,
era:buildLocalizeFn({
values:eraValues$14,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$14,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$14,
defaultWidth:"wide",
formattingValues:formattingMonthValues$3,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$14,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$14,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$14,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(пр\.н\.е\.|АД)/i,
abbreviated:/^(пр\.\s?Хр\.|по\.\s?Хр\.)/i,
wide:/^(Пре Христа|пре нове ере|После Христа|нова ера)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^пр/i,/^(по|нова)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]\.\s?кв\.?/i,
wide:/^[1234]\. квартал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(10|11|12|[123456789])\./i,
abbreviated:/^(јан|феб|мар|апр|мај|јун|јул|авг|сеп|окт|нов|дец)/i,
wide:/^((јануар|јануара)|(фебруар|фебруара)|(март|марта)|(април|априла)|(мја|маја)|(јун|јуна)|(јул|јула)|(август|августа)|(септембар|септембра)|(октобар|октобра)|(новембар|новембра)|(децембар|децембра))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^1/i,
/^2/i,
/^3/i,
/^4/i,
/^5/i,
/^6/i,
/^7/i,
/^8/i,
/^9/i,
/^10/i,
/^11/i,
/^12/i],

any:[
/^ја/i,
/^ф/i,
/^мар/i,
/^ап/i,
/^мај/i,
/^јун/i,
/^јул/i,
/^авг/i,
/^с/i,
/^о/i,
/^н/i,
/^д/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[пусчн]/i,
short:/^(нед|пон|уто|сре|чет|пет|суб)/i,
abbreviated:/^(нед|пон|уто|сре|чет|пет|суб)/i,
wide:/^(недеља|понедељак|уторак|среда|четвртак|петак|субота)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^п/i,
/^у/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i,
/^н/i],

any:[
/^нед/i,
/^пон/i,
/^уто/i,
/^сре/i,
/^чет/i,
/^пет/i,
/^суб/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(ам|пм|поноћ|(по)?подне|увече|ноћу|после подне|ујутру)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^поно/i,
noon:/^под/i,
morning:/ујутру/i,
afternoon:/(после\s|по)+подне/i,
evening:/(увече)/i,
night:/(ноћу)/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/sr-Latn/_lib/formatDistance.js
var formatDistanceLocale$13={
lessThanXSeconds:{
one:{
standalone:"manje od 1 sekunde",
withPrepositionAgo:"manje od 1 sekunde",
withPrepositionIn:"manje od 1 sekundu"
},
dual:"manje od {{count}} sekunde",
other:"manje od {{count}} sekundi"
},
xSeconds:{
one:{
standalone:"1 sekunda",
withPrepositionAgo:"1 sekunde",
withPrepositionIn:"1 sekundu"
},
dual:"{{count}} sekunde",
other:"{{count}} sekundi"
},
halfAMinute:"pola minute",
lessThanXMinutes:{
one:{
standalone:"manje od 1 minute",
withPrepositionAgo:"manje od 1 minute",
withPrepositionIn:"manje od 1 minutu"
},
dual:"manje od {{count}} minute",
other:"manje od {{count}} minuta"
},
xMinutes:{
one:{
standalone:"1 minuta",
withPrepositionAgo:"1 minute",
withPrepositionIn:"1 minutu"
},
dual:"{{count}} minute",
other:"{{count}} minuta"
},
aboutXHours:{
one:{
standalone:"oko 1 sat",
withPrepositionAgo:"oko 1 sat",
withPrepositionIn:"oko 1 sat"
},
dual:"oko {{count}} sata",
other:"oko {{count}} sati"
},
xHours:{
one:{
standalone:"1 sat",
withPrepositionAgo:"1 sat",
withPrepositionIn:"1 sat"
},
dual:"{{count}} sata",
other:"{{count}} sati"
},
xDays:{
one:{
standalone:"1 dan",
withPrepositionAgo:"1 dan",
withPrepositionIn:"1 dan"
},
dual:"{{count}} dana",
other:"{{count}} dana"
},
aboutXWeeks:{
one:{
standalone:"oko 1 nedelju",
withPrepositionAgo:"oko 1 nedelju",
withPrepositionIn:"oko 1 nedelju"
},
dual:"oko {{count}} nedelje",
other:"oko {{count}} nedelje"
},
xWeeks:{
one:{
standalone:"1 nedelju",
withPrepositionAgo:"1 nedelju",
withPrepositionIn:"1 nedelju"
},
dual:"{{count}} nedelje",
other:"{{count}} nedelje"
},
aboutXMonths:{
one:{
standalone:"oko 1 mesec",
withPrepositionAgo:"oko 1 mesec",
withPrepositionIn:"oko 1 mesec"
},
dual:"oko {{count}} meseca",
other:"oko {{count}} meseci"
},
xMonths:{
one:{
standalone:"1 mesec",
withPrepositionAgo:"1 mesec",
withPrepositionIn:"1 mesec"
},
dual:"{{count}} meseca",
other:"{{count}} meseci"
},
aboutXYears:{
one:{
standalone:"oko 1 godinu",
withPrepositionAgo:"oko 1 godinu",
withPrepositionIn:"oko 1 godinu"
},
dual:"oko {{count}} godine",
other:"oko {{count}} godina"
},
xYears:{
one:{
standalone:"1 godina",
withPrepositionAgo:"1 godine",
withPrepositionIn:"1 godinu"
},
dual:"{{count}} godine",
other:"{{count}} godina"
},
overXYears:{
one:{
standalone:"preko 1 godinu",
withPrepositionAgo:"preko 1 godinu",
withPrepositionIn:"preko 1 godinu"
},
dual:"preko {{count}} godine",
other:"preko {{count}} godina"
},
almostXYears:{
one:{
standalone:"gotovo 1 godinu",
withPrepositionAgo:"gotovo 1 godinu",
withPrepositionIn:"gotovo 1 godinu"
},
dual:"gotovo {{count}} godine",
other:"gotovo {{count}} godina"
}
};
var formatDistance$13=function formatDistance$13(token,count,options){
var result;
var tokenValue=formatDistanceLocale$13[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1){if(options!==null&&options!==void 0&&options.addSuffix){if(options.comparison&&options.comparison>0)result=tokenValue.one.withPrepositionIn;else
result=tokenValue.one.withPrepositionAgo;}else
result=tokenValue.one.standalone;}else
if(count%10>1&&count%10<5&&String(count).substr(-2,1)!=="1")result=tokenValue.dual.replace("{{count}}",String(count));else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"za "+result;else
return"pre "+result;
return result;
};
var formatLong$13={
date:buildFormatLongFn({
formats:{
full:"EEEE, d. MMMM yyyy.",
long:"d. MMMM yyyy.",
medium:"d. MMM yy.",
short:"dd. MM. yy."
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss (zzzz)",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'u' {{time}}",
long:"{{date}} 'u' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/sr-Latn/_lib/formatRelative.js
var formatRelativeLocale$13={
lastWeek:function lastWeek(date){
switch(date.getDay()){
case 0:return"'prošle nedelje u' p";
case 3:return"'prošle srede u' p";
case 6:return"'prošle subote u' p";
default:return"'prošli' EEEE 'u' p";
}
},
yesterday:"'juče u' p",
today:"'danas u' p",
tomorrow:"'sutra u' p",
nextWeek:function nextWeek(date){
switch(date.getDay()){
case 0:return"'sledeće nedelje u' p";
case 3:return"'sledeću sredu u' p";
case 6:return"'sledeću subotu u' p";
default:return"'sledeći' EEEE 'u' p";
}
},
other:"P"
};
var formatRelative$13=function formatRelative$13(token,date,_baseDate,_options){
var format=formatRelativeLocale$13[token];
if(typeof format==="function")return format(date);
return format;
};
//#endregion
//#region dist/date-fns/locale/sr-Latn/_lib/localize.js
var eraValues$13={
narrow:["pr.n.e.","AD"],
abbreviated:["pr. Hr.","po. Hr."],
wide:["Pre Hrista","Posle Hrista"]
};
var quarterValues$13={
narrow:[
"1.",
"2.",
"3.",
"4."],

abbreviated:[
"1. kv.",
"2. kv.",
"3. kv.",
"4. kv."],

wide:[
"1. kvartal",
"2. kvartal",
"3. kvartal",
"4. kvartal"]

};
var monthValues$13={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"maj",
"jun",
"jul",
"avg",
"sep",
"okt",
"nov",
"dec"],

wide:[
"januar",
"februar",
"mart",
"april",
"maj",
"jun",
"jul",
"avgust",
"septembar",
"oktobar",
"novembar",
"decembar"]

};
var formattingMonthValues$2={
narrow:[
"1.",
"2.",
"3.",
"4.",
"5.",
"6.",
"7.",
"8.",
"9.",
"10.",
"11.",
"12."],

abbreviated:[
"jan",
"feb",
"mar",
"apr",
"maj",
"jun",
"jul",
"avg",
"sep",
"okt",
"nov",
"dec"],

wide:[
"januar",
"februar",
"mart",
"april",
"maj",
"jun",
"jul",
"avgust",
"septembar",
"oktobar",
"novembar",
"decembar"]

};
var dayValues$13={
narrow:[
"N",
"P",
"U",
"S",
"Č",
"P",
"S"],

short:[
"ned",
"pon",
"uto",
"sre",
"čet",
"pet",
"sub"],

abbreviated:[
"ned",
"pon",
"uto",
"sre",
"čet",
"pet",
"sub"],

wide:[
"nedelja",
"ponedeljak",
"utorak",
"sreda",
"četvrtak",
"petak",
"subota"]

};
var formattingDayPeriodValues$13={
narrow:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
wide:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"posle podne",
evening:"uveče",
night:"noću"
}
};
var dayPeriodValues$13={
narrow:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"popodne",
evening:"uveče",
night:"noću"
},
wide:{
am:"AM",
pm:"PM",
midnight:"ponoć",
noon:"podne",
morning:"ujutru",
afternoon:"posle podne",
evening:"uveče",
night:"noću"
}
};
var ordinalNumber$13=function ordinalNumber$13(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/sr-Latn.js
/**
* @category Locales
* @summary Serbian latin locale.
* @language Serbian
* @iso-639-2 srp
* @author Igor Radivojević [@rogyvoje](https://github.com/rogyvoje)
*/
var _srLatn={
code:"sr-Latn",
formatDistance:formatDistance$13,
formatLong:formatLong$13,
formatRelative:formatRelative$13,
localize:{
ordinalNumber:ordinalNumber$13,
era:buildLocalizeFn({
values:eraValues$13,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$13,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$13,
defaultWidth:"wide",
formattingValues:formattingMonthValues$2,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$13,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$13,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$13,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)\./i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(pr\.n\.e\.|AD)/i,
abbreviated:/^(pr\.\s?Hr\.|po\.\s?Hr\.)/i,
wide:/^(Pre Hrista|pre nove ere|Posle Hrista|nova era)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^pr/i,/^(po|nova)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]\.\s?kv\.?/i,
wide:/^[1234]\. kvartal/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(10|11|12|[123456789])\./i,
abbreviated:/^(jan|feb|mar|apr|maj|jun|jul|avg|sep|okt|nov|dec)/i,
wide:/^((januar|januara)|(februar|februara)|(mart|marta)|(april|aprila)|(maj|maja)|(jun|juna)|(jul|jula)|(avgust|avgusta)|(septembar|septembra)|(oktobar|oktobra)|(novembar|novembra)|(decembar|decembra))/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^1/i,
/^2/i,
/^3/i,
/^4/i,
/^5/i,
/^6/i,
/^7/i,
/^8/i,
/^9/i,
/^10/i,
/^11/i,
/^12/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^avg/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[npusčc]/i,
short:/^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
abbreviated:/^(ned|pon|uto|sre|(čet|cet)|pet|sub)/i,
wide:/^(nedelja|ponedeljak|utorak|sreda|(četvrtak|cetvrtak)|petak|subota)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^s/i,
/^m/i,
/^t/i,
/^w/i,
/^t/i,
/^f/i,
/^s/i],

any:[
/^su/i,
/^m/i,
/^tu/i,
/^w/i,
/^th/i,
/^f/i,
/^sa/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(am|pm|ponoc|ponoć|(po)?podne|uvece|uveče|noću|posle podne|ujutru)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^pono/i,
noon:/^pod/i,
morning:/jutro/i,
afternoon:/(posle\s|po)+podne/i,
evening:/(uvece|uveče)/i,
night:/(nocu|noću)/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/sv/_lib/formatDistance.js
var formatDistanceLocale$12={
lessThanXSeconds:{
one:"mindre än en sekund",
other:"mindre än {{count}} sekunder"
},
xSeconds:{
one:"en sekund",
other:"{{count}} sekunder"
},
halfAMinute:"en halv minut",
lessThanXMinutes:{
one:"mindre än en minut",
other:"mindre än {{count}} minuter"
},
xMinutes:{
one:"en minut",
other:"{{count}} minuter"
},
aboutXHours:{
one:"ungefär en timme",
other:"ungefär {{count}} timmar"
},
xHours:{
one:"en timme",
other:"{{count}} timmar"
},
xDays:{
one:"en dag",
other:"{{count}} dagar"
},
aboutXWeeks:{
one:"ungefär en vecka",
other:"ungefär {{count}} veckor"
},
xWeeks:{
one:"en vecka",
other:"{{count}} veckor"
},
aboutXMonths:{
one:"ungefär en månad",
other:"ungefär {{count}} månader"
},
xMonths:{
one:"en månad",
other:"{{count}} månader"
},
aboutXYears:{
one:"ungefär ett år",
other:"ungefär {{count}} år"
},
xYears:{
one:"ett år",
other:"{{count}} år"
},
overXYears:{
one:"över ett år",
other:"över {{count}} år"
},
almostXYears:{
one:"nästan ett år",
other:"nästan {{count}} år"
}
};
var wordMapping=[
"noll",
"en",
"två",
"tre",
"fyra",
"fem",
"sex",
"sju",
"åtta",
"nio",
"tio",
"elva",
"tolv"];

var formatDistance$12=function formatDistance$12(token,count,options){
var result;
var tokenValue=formatDistanceLocale$12[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count<13?wordMapping[count]:String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return"om "+result;else
return result+" sedan";
return result;
};
var formatLong$12={
date:buildFormatLongFn({
formats:{
full:"EEEE d MMMM y",
long:"d MMMM y",
medium:"d MMM y",
short:"y-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"'kl'. HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'kl.' {{time}}",
long:"{{date}} 'kl.' {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/sv/_lib/formatRelative.js
var formatRelativeLocale$12={
lastWeek:"'i' EEEE's kl.' p",
yesterday:"'igår kl.' p",
today:"'idag kl.' p",
tomorrow:"'imorgon kl.' p",
nextWeek:"EEEE 'kl.' p",
other:"P"
};
var formatRelative$12=function formatRelative$12(token,_date,_baseDate,_options){return formatRelativeLocale$12[token];};
//#endregion
//#region dist/date-fns/locale/sv/_lib/localize.js
var eraValues$12={
narrow:["f.Kr.","e.Kr."],
abbreviated:["f.Kr.","e.Kr."],
wide:["före Kristus","efter Kristus"]
};
var quarterValues$12={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"1:a kvartalet",
"2:a kvartalet",
"3:e kvartalet",
"4:e kvartalet"]

};
var monthValues$12={
narrow:[
"J",
"F",
"M",
"A",
"M",
"J",
"J",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"jan.",
"feb.",
"mars",
"apr.",
"maj",
"juni",
"juli",
"aug.",
"sep.",
"okt.",
"nov.",
"dec."],

wide:[
"januari",
"februari",
"mars",
"april",
"maj",
"juni",
"juli",
"augusti",
"september",
"oktober",
"november",
"december"]

};
var dayValues$12={
narrow:[
"S",
"M",
"T",
"O",
"T",
"F",
"L"],

short:[
"sö",
"må",
"ti",
"on",
"to",
"fr",
"lö"],

abbreviated:[
"sön",
"mån",
"tis",
"ons",
"tors",
"fre",
"lör"],

wide:[
"söndag",
"måndag",
"tisdag",
"onsdag",
"torsdag",
"fredag",
"lördag"]

};
var dayPeriodValues$12={
narrow:{
am:"fm",
pm:"em",
midnight:"midnatt",
noon:"middag",
morning:"morg.",
afternoon:"efterm.",
evening:"kväll",
night:"natt"
},
abbreviated:{
am:"f.m.",
pm:"e.m.",
midnight:"midnatt",
noon:"middag",
morning:"morgon",
afternoon:"efterm.",
evening:"kväll",
night:"natt"
},
wide:{
am:"förmiddag",
pm:"eftermiddag",
midnight:"midnatt",
noon:"middag",
morning:"morgon",
afternoon:"eftermiddag",
evening:"kväll",
night:"natt"
}
};
var formattingDayPeriodValues$12={
narrow:{
am:"fm",
pm:"em",
midnight:"midnatt",
noon:"middag",
morning:"på morg.",
afternoon:"på efterm.",
evening:"på kvällen",
night:"på natten"
},
abbreviated:{
am:"fm",
pm:"em",
midnight:"midnatt",
noon:"middag",
morning:"på morg.",
afternoon:"på efterm.",
evening:"på kvällen",
night:"på natten"
},
wide:{
am:"fm",
pm:"em",
midnight:"midnatt",
noon:"middag",
morning:"på morgonen",
afternoon:"på eftermiddagen",
evening:"på kvällen",
night:"på natten"
}
};
var ordinalNumber$12=function ordinalNumber$12(dirtyNumber,_options){
var number=Number(dirtyNumber);
var rem100=number%100;
if(rem100>20||rem100<10)switch(rem100%10){
case 1:
case 2:return number+":a";
}
return number+":e";
};
//#endregion
//#region dist/date-fns/locale/sv.js
/**
* @category Locales
* @summary Swedish locale.
* @language Swedish
* @iso-639-2 swe
* @author Johannes Ulén [@ejulen](https://github.com/ejulen)
* @author Alexander Nanberg [@alexandernanberg](https://github.com/alexandernanberg)
* @author Henrik Andersson [@limelights](https://github.com/limelights)
*/
var _sv={
code:"sv",
formatDistance:formatDistance$12,
formatLong:formatLong$12,
formatRelative:formatRelative$12,
localize:{
ordinalNumber:ordinalNumber$12,
era:buildLocalizeFn({
values:eraValues$12,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$12,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$12,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$12,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$12,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$12,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(:a|:e)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(f\.? ?Kr\.?|f\.? ?v\.? ?t\.?|e\.? ?Kr\.?|v\.? ?t\.?)/i,
abbreviated:/^(f\.? ?Kr\.?|f\.? ?v\.? ?t\.?|e\.? ?Kr\.?|v\.? ?t\.?)/i,
wide:/^(före Kristus|före vår tid|efter Kristus|vår tid)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^f/i,/^[ev]/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](:a|:e)? kvartalet/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[jfmasond]/i,
abbreviated:/^(jan|feb|mar[s]?|apr|maj|jun[i]?|jul[i]?|aug|sep|okt|nov|dec)\.?/i,
wide:/^(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^j/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^j/i,
/^j/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ja/i,
/^f/i,
/^mar/i,
/^ap/i,
/^maj/i,
/^jun/i,
/^jul/i,
/^au/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[smtofl]/i,
short:/^(sö|må|ti|on|to|fr|lö)/i,
abbreviated:/^(sön|mån|tis|ons|tors|fre|lör)/i,
wide:/^(söndag|måndag|tisdag|onsdag|torsdag|fredag|lördag)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/^s/i,
/^m/i,
/^ti/i,
/^o/i,
/^to/i,
/^f/i,
/^l/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^([fe]\.?\s?m\.?|midn(att)?|midd(ag)?|(på) (morgonen|eftermiddagen|kvällen|natten))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^f/i,
pm:/^e/i,
midnight:/^midn/i,
noon:/^midd/i,
morning:/morgon/i,
afternoon:/eftermiddag/i,
evening:/kväll/i,
night:/natt/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/ta/_lib/formatDistance.js
function isPluralType(val){
return val.one!==void 0;
}
var formatDistanceLocale$11={
lessThanXSeconds:{
one:{
default:"ஒரு வினாடிக்கு குறைவாக",
in:"ஒரு வினாடிக்குள்",
ago:"ஒரு வினாடிக்கு முன்பு"
},
other:{
default:"{{count}} வினாடிகளுக்கு குறைவாக",
in:"{{count}} வினாடிகளுக்குள்",
ago:"{{count}} வினாடிகளுக்கு முன்பு"
}
},
xSeconds:{
one:{
default:"1 வினாடி",
in:"1 வினாடியில்",
ago:"1 வினாடி முன்பு"
},
other:{
default:"{{count}} விநாடிகள்",
in:"{{count}} வினாடிகளில்",
ago:"{{count}} விநாடிகளுக்கு முன்பு"
}
},
halfAMinute:{
default:"அரை நிமிடம்",
in:"அரை நிமிடத்தில்",
ago:"அரை நிமிடம் முன்பு"
},
lessThanXMinutes:{
one:{
default:"ஒரு நிமிடத்திற்கும் குறைவாக",
in:"ஒரு நிமிடத்திற்குள்",
ago:"ஒரு நிமிடத்திற்கு முன்பு"
},
other:{
default:"{{count}} நிமிடங்களுக்கும் குறைவாக",
in:"{{count}} நிமிடங்களுக்குள்",
ago:"{{count}} நிமிடங்களுக்கு முன்பு"
}
},
xMinutes:{
one:{
default:"1 நிமிடம்",
in:"1 நிமிடத்தில்",
ago:"1 நிமிடம் முன்பு"
},
other:{
default:"{{count}} நிமிடங்கள்",
in:"{{count}} நிமிடங்களில்",
ago:"{{count}} நிமிடங்களுக்கு முன்பு"
}
},
aboutXHours:{
one:{
default:"சுமார் 1 மணி நேரம்",
in:"சுமார் 1 மணி நேரத்தில்",
ago:"சுமார் 1 மணி நேரத்திற்கு முன்பு"
},
other:{
default:"சுமார் {{count}} மணி நேரம்",
in:"சுமார் {{count}} மணி நேரத்திற்கு முன்பு",
ago:"சுமார் {{count}} மணி நேரத்தில்"
}
},
xHours:{
one:{
default:"1 மணி நேரம்",
in:"1 மணி நேரத்தில்",
ago:"1 மணி நேரத்திற்கு முன்பு"
},
other:{
default:"{{count}} மணி நேரம்",
in:"{{count}} மணி நேரத்தில்",
ago:"{{count}} மணி நேரத்திற்கு முன்பு"
}
},
xDays:{
one:{
default:"1 நாள்",
in:"1 நாளில்",
ago:"1 நாள் முன்பு"
},
other:{
default:"{{count}} நாட்கள்",
in:"{{count}} நாட்களில்",
ago:"{{count}} நாட்களுக்கு முன்பு"
}
},
aboutXWeeks:{
one:{
default:"சுமார் 1 வாரம்",
in:"சுமார் 1 வாரத்தில்",
ago:"சுமார் 1 வாரம் முன்பு"
},
other:{
default:"சுமார் {{count}} வாரங்கள்",
in:"சுமார் {{count}} வாரங்களில்",
ago:"சுமார் {{count}} வாரங்களுக்கு முன்பு"
}
},
xWeeks:{
one:{
default:"1 வாரம்",
in:"1 வாரத்தில்",
ago:"1 வாரம் முன்பு"
},
other:{
default:"{{count}} வாரங்கள்",
in:"{{count}} வாரங்களில்",
ago:"{{count}} வாரங்களுக்கு முன்பு"
}
},
aboutXMonths:{
one:{
default:"சுமார் 1 மாதம்",
in:"சுமார் 1 மாதத்தில்",
ago:"சுமார் 1 மாதத்திற்கு முன்பு"
},
other:{
default:"சுமார் {{count}} மாதங்கள்",
in:"சுமார் {{count}} மாதங்களில்",
ago:"சுமார் {{count}} மாதங்களுக்கு முன்பு"
}
},
xMonths:{
one:{
default:"1 மாதம்",
in:"1 மாதத்தில்",
ago:"1 மாதம் முன்பு"
},
other:{
default:"{{count}} மாதங்கள்",
in:"{{count}} மாதங்களில்",
ago:"{{count}} மாதங்களுக்கு முன்பு"
}
},
aboutXYears:{
one:{
default:"சுமார் 1 வருடம்",
in:"சுமார் 1 ஆண்டில்",
ago:"சுமார் 1 வருடம் முன்பு"
},
other:{
default:"சுமார் {{count}} ஆண்டுகள்",
in:"சுமார் {{count}} ஆண்டுகளில்",
ago:"சுமார் {{count}} ஆண்டுகளுக்கு முன்பு"
}
},
xYears:{
one:{
default:"1 வருடம்",
in:"1 ஆண்டில்",
ago:"1 வருடம் முன்பு"
},
other:{
default:"{{count}} ஆண்டுகள்",
in:"{{count}} ஆண்டுகளில்",
ago:"{{count}} ஆண்டுகளுக்கு முன்பு"
}
},
overXYears:{
one:{
default:"1 வருடத்திற்கு மேல்",
in:"1 வருடத்திற்கும் மேலாக",
ago:"1 வருடம் முன்பு"
},
other:{
default:"{{count}} ஆண்டுகளுக்கும் மேலாக",
in:"{{count}} ஆண்டுகளில்",
ago:"{{count}} ஆண்டுகளுக்கு முன்பு"
}
},
almostXYears:{
one:{
default:"கிட்டத்தட்ட 1 வருடம்",
in:"கிட்டத்தட்ட 1 ஆண்டில்",
ago:"கிட்டத்தட்ட 1 வருடம் முன்பு"
},
other:{
default:"கிட்டத்தட்ட {{count}} ஆண்டுகள்",
in:"கிட்டத்தட்ட {{count}} ஆண்டுகளில்",
ago:"கிட்டத்தட்ட {{count}} ஆண்டுகளுக்கு முன்பு"
}
}
};
var formatDistance$11=function formatDistance$11(token,count,options){
var tense=options!==null&&options!==void 0&&options.addSuffix?options.comparison&&options.comparison>0?"in":"ago":"default";
var tokenValue=formatDistanceLocale$11[token];
if(!isPluralType(tokenValue))return tokenValue[tense];
if(count===1)return tokenValue.one[tense];else
return tokenValue.other[tense].replace("{{count}}",String(count));
};
var formatLong$11={
date:buildFormatLongFn({
formats:{
full:"EEEE, d MMMM, y",
long:"d MMMM, y",
medium:"d MMM, y",
short:"d/M/yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"a h:mm:ss zzzz",
long:"a h:mm:ss z",
medium:"a h:mm:ss",
short:"a h:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ta/_lib/formatRelative.js
var formatRelativeLocale$11={
lastWeek:"'கடந்த' eeee p 'மணிக்கு'",
yesterday:"'நேற்று ' p 'மணிக்கு'",
today:"'இன்று ' p 'மணிக்கு'",
tomorrow:"'நாளை ' p 'மணிக்கு'",
nextWeek:"eeee p 'மணிக்கு'",
other:"P"
};
var formatRelative$11=function formatRelative$11(token,_date,_baseDate,_options){return formatRelativeLocale$11[token];};
//#endregion
//#region dist/date-fns/locale/ta/_lib/localize.js
var eraValues$11={
narrow:["கி.மு.","கி.பி."],
abbreviated:["கி.மு.","கி.பி."],
wide:["கிறிஸ்துவுக்கு முன்","அன்னோ டோமினி"]
};
var quarterValues$11={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"காலா.1",
"காலா.2",
"காலா.3",
"காலா.4"],

wide:[
"ஒன்றாம் காலாண்டு",
"இரண்டாம் காலாண்டு",
"மூன்றாம் காலாண்டு",
"நான்காம் காலாண்டு"]

};
var monthValues$11={
narrow:[
"ஜ",
"பி",
"மா",
"ஏ",
"மே",
"ஜூ",
"ஜூ",
"ஆ",
"செ",
"அ",
"ந",
"டி"],

abbreviated:[
"ஜன.",
"பிப்.",
"மார்.",
"ஏப்.",
"மே",
"ஜூன்",
"ஜூலை",
"ஆக.",
"செப்.",
"அக்.",
"நவ.",
"டிச."],

wide:[
"ஜனவரி",
"பிப்ரவரி",
"மார்ச்",
"ஏப்ரல்",
"மே",
"ஜூன்",
"ஜூலை",
"ஆகஸ்ட்",
"செப்டம்பர்",
"அக்டோபர்",
"நவம்பர்",
"டிசம்பர்"]

};
var dayValues$11={
narrow:[
"ஞா",
"தி",
"செ",
"பு",
"வி",
"வெ",
"ச"],

short:[
"ஞா",
"தி",
"செ",
"பு",
"வி",
"வெ",
"ச"],

abbreviated:[
"ஞாயி.",
"திங்.",
"செவ்.",
"புத.",
"வியா.",
"வெள்.",
"சனி"],

wide:[
"ஞாயிறு",
"திங்கள்",
"செவ்வாய்",
"புதன்",
"வியாழன்",
"வெள்ளி",
"சனி"]

};
var dayPeriodValues$11={
narrow:{
am:"மு.ப",
pm:"பி.ப",
midnight:"நள்.",
noon:"நண்.",
morning:"கா.",
afternoon:"மதி.",
evening:"மா.",
night:"இர."
},
abbreviated:{
am:"முற்பகல்",
pm:"பிற்பகல்",
midnight:"நள்ளிரவு",
noon:"நண்பகல்",
morning:"காலை",
afternoon:"மதியம்",
evening:"மாலை",
night:"இரவு"
},
wide:{
am:"முற்பகல்",
pm:"பிற்பகல்",
midnight:"நள்ளிரவு",
noon:"நண்பகல்",
morning:"காலை",
afternoon:"மதியம்",
evening:"மாலை",
night:"இரவு"
}
};
var formattingDayPeriodValues$11={
narrow:{
am:"மு.ப",
pm:"பி.ப",
midnight:"நள்.",
noon:"நண்.",
morning:"கா.",
afternoon:"மதி.",
evening:"மா.",
night:"இர."
},
abbreviated:{
am:"முற்பகல்",
pm:"பிற்பகல்",
midnight:"நள்ளிரவு",
noon:"நண்பகல்",
morning:"காலை",
afternoon:"மதியம்",
evening:"மாலை",
night:"இரவு"
},
wide:{
am:"முற்பகல்",
pm:"பிற்பகல்",
midnight:"நள்ளிரவு",
noon:"நண்பகல்",
morning:"காலை",
afternoon:"மதியம்",
evening:"மாலை",
night:"இரவு"
}
};
var ordinalNumber$11=function ordinalNumber$11(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ta.js
/**
* @category Locales
* @summary Tamil locale (India).
* @language Tamil
* @iso-639-2 tam
* @author Sibiraj [@sibiraj-s](https://github.com/sibiraj-s)
*/
var _ta={
code:"ta",
formatDistance:formatDistance$11,
formatLong:formatLong$11,
formatRelative:formatRelative$11,
localize:{
ordinalNumber:ordinalNumber$11,
era:buildLocalizeFn({
values:eraValues$11,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$11,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$11,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$11,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$11,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$11,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(வது)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(கி.மு.|கி.பி.)/i,
abbreviated:/^(கி\.?\s?மு\.?|கி\.?\s?பி\.?)/,
wide:/^(கிறிஸ்துவுக்கு\sமுன்|அன்னோ\sடோமினி)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/கி\.?\s?மு\.?/,/கி\.?\s?பி\.?/]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^காலா.[1234]/i,
wide:/^(ஒன்றாம்|இரண்டாம்|மூன்றாம்|நான்காம்) காலாண்டு/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/1/i,
/2/i,
/3/i,
/4/i],

any:[
/(1|காலா.1|ஒன்றாம்)/i,
/(2|காலா.2|இரண்டாம்)/i,
/(3|காலா.3|மூன்றாம்)/i,
/(4|காலா.4|நான்காம்)/i]

},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(ஜ|பி|மா|ஏ|மே|ஜூ|ஆ|செ|அ|ந|டி)$/i,
abbreviated:/^(ஜன.|பிப்.|மார்.|ஏப்.|மே|ஜூன்|ஜூலை|ஆக.|செப்.|அக்.|நவ.|டிச.)/i,
wide:/^(ஜனவரி|பிப்ரவரி|மார்ச்|ஏப்ரல்|மே|ஜூன்|ஜூலை|ஆகஸ்ட்|செப்டம்பர்|அக்டோபர்|நவம்பர்|டிசம்பர்)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ஜ$/i,
/^பி/i,
/^மா/i,
/^ஏ/i,
/^மே/i,
/^ஜூ/i,
/^ஜூ/i,
/^ஆ/i,
/^செ/i,
/^அ/i,
/^ந/i,
/^டி/i],

any:[
/^ஜன/i,
/^பி/i,
/^மா/i,
/^ஏ/i,
/^மே/i,
/^ஜூன்/i,
/^ஜூலை/i,
/^ஆ/i,
/^செ/i,
/^அ/i,
/^ந/i,
/^டி/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ஞா|தி|செ|பு|வி|வெ|ச)/i,
short:/^(ஞா|தி|செ|பு|வி|வெ|ச)/i,
abbreviated:/^(ஞாயி.|திங்.|செவ்.|புத.|வியா.|வெள்.|சனி)/i,
wide:/^(ஞாயிறு|திங்கள்|செவ்வாய்|புதன்|வியாழன்|வெள்ளி|சனி)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ஞா/i,
/^தி/i,
/^செ/i,
/^பு/i,
/^வி/i,
/^வெ/i,
/^ச/i],

any:[
/^ஞா/i,
/^தி/i,
/^செ/i,
/^பு/i,
/^வி/i,
/^வெ/i,
/^ச/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(மு.ப|பி.ப|நள்|நண்|காலை|மதியம்|மாலை|இரவு)/i,
any:/^(மு.ப|பி.ப|முற்பகல்|பிற்பகல்|நள்ளிரவு|நண்பகல்|காலை|மதியம்|மாலை|இரவு)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^மு/i,
pm:/^பி/i,
midnight:/^நள்/i,
noon:/^நண்/i,
morning:/காலை/i,
afternoon:/மதியம்/i,
evening:/மாலை/i,
night:/இரவு/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/te/_lib/formatDistance.js
var formatDistanceLocale$10={
lessThanXSeconds:{
standalone:{
one:"సెకను కన్నా తక్కువ",
other:"{{count}} సెకన్ల కన్నా తక్కువ"
},
withPreposition:{
one:"సెకను",
other:"{{count}} సెకన్ల"
}
},
xSeconds:{
standalone:{
one:"ఒక సెకను",
other:"{{count}} సెకన్ల"
},
withPreposition:{
one:"ఒక సెకను",
other:"{{count}} సెకన్ల"
}
},
halfAMinute:{
standalone:"అర నిమిషం",
withPreposition:"అర నిమిషం"
},
lessThanXMinutes:{
standalone:{
one:"ఒక నిమిషం కన్నా తక్కువ",
other:"{{count}} నిమిషాల కన్నా తక్కువ"
},
withPreposition:{
one:"ఒక నిమిషం",
other:"{{count}} నిమిషాల"
}
},
xMinutes:{
standalone:{
one:"ఒక నిమిషం",
other:"{{count}} నిమిషాలు"
},
withPreposition:{
one:"ఒక నిమిషం",
other:"{{count}} నిమిషాల"
}
},
aboutXHours:{
standalone:{
one:"సుమారు ఒక గంట",
other:"సుమారు {{count}} గంటలు"
},
withPreposition:{
one:"సుమారు ఒక గంట",
other:"సుమారు {{count}} గంటల"
}
},
xHours:{
standalone:{
one:"ఒక గంట",
other:"{{count}} గంటలు"
},
withPreposition:{
one:"ఒక గంట",
other:"{{count}} గంటల"
}
},
xDays:{
standalone:{
one:"ఒక రోజు",
other:"{{count}} రోజులు"
},
withPreposition:{
one:"ఒక రోజు",
other:"{{count}} రోజుల"
}
},
aboutXWeeks:{
standalone:{
one:"సుమారు ఒక వారం",
other:"సుమారు {{count}} వారాలు"
},
withPreposition:{
one:"సుమారు ఒక వారం",
other:"సుమారు {{count}} వారాలల"
}
},
xWeeks:{
standalone:{
one:"ఒక వారం",
other:"{{count}} వారాలు"
},
withPreposition:{
one:"ఒక వారం",
other:"{{count}} వారాలల"
}
},
aboutXMonths:{
standalone:{
one:"సుమారు ఒక నెల",
other:"సుమారు {{count}} నెలలు"
},
withPreposition:{
one:"సుమారు ఒక నెల",
other:"సుమారు {{count}} నెలల"
}
},
xMonths:{
standalone:{
one:"ఒక నెల",
other:"{{count}} నెలలు"
},
withPreposition:{
one:"ఒక నెల",
other:"{{count}} నెలల"
}
},
aboutXYears:{
standalone:{
one:"సుమారు ఒక సంవత్సరం",
other:"సుమారు {{count}} సంవత్సరాలు"
},
withPreposition:{
one:"సుమారు ఒక సంవత్సరం",
other:"సుమారు {{count}} సంవత్సరాల"
}
},
xYears:{
standalone:{
one:"ఒక సంవత్సరం",
other:"{{count}} సంవత్సరాలు"
},
withPreposition:{
one:"ఒక సంవత్సరం",
other:"{{count}} సంవత్సరాల"
}
},
overXYears:{
standalone:{
one:"ఒక సంవత్సరం పైగా",
other:"{{count}} సంవత్సరాలకు పైగా"
},
withPreposition:{
one:"ఒక సంవత్సరం",
other:"{{count}} సంవత్సరాల"
}
},
almostXYears:{
standalone:{
one:"దాదాపు ఒక సంవత్సరం",
other:"దాదాపు {{count}} సంవత్సరాలు"
},
withPreposition:{
one:"దాదాపు ఒక సంవత్సరం",
other:"దాదాపు {{count}} సంవత్సరాల"
}
}
};
var formatDistance$10=function formatDistance$10(token,count,options){
var result;
var tokenValue=options!==null&&options!==void 0&&options.addSuffix?formatDistanceLocale$10[token].withPreposition:formatDistanceLocale$10[token].standalone;
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"లో";else
return result+" క్రితం";
return result;
};
var formatLong$10={
date:buildFormatLongFn({
formats:{
full:"d, MMMM y, EEEE",
long:"d MMMM, y",
medium:"d MMM, y",
short:"dd-MM-yy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}'కి'",
long:"{{date}} {{time}}'కి'",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/te/_lib/formatRelative.js
var formatRelativeLocale$10={
lastWeek:"'గత' eeee p",
yesterday:"'నిన్న' p",
today:"'ఈ రోజు' p",
tomorrow:"'రేపు' p",
nextWeek:"'తదుపరి' eeee p",
other:"P"
};
var formatRelative$10=function formatRelative$10(token,_date,_baseDate,_options){return formatRelativeLocale$10[token];};
//#endregion
//#region dist/date-fns/locale/te/_lib/localize.js
var eraValues$10={
narrow:["క్రీ.పూ.","క్రీ.శ."],
abbreviated:["క్రీ.పూ.","క్రీ.శ."],
wide:["క్రీస్తు పూర్వం","క్రీస్తుశకం"]
};
var quarterValues$10={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"త్రై1",
"త్రై2",
"త్రై3",
"త్రై4"],

wide:[
"1వ త్రైమాసికం",
"2వ త్రైమాసికం",
"3వ త్రైమాసికం",
"4వ త్రైమాసికం"]

};
var monthValues$10={
narrow:[
"జ",
"ఫి",
"మా",
"ఏ",
"మే",
"జూ",
"జు",
"ఆ",
"సె",
"అ",
"న",
"డి"],

abbreviated:[
"జన",
"ఫిబ్ర",
"మార్చి",
"ఏప్రి",
"మే",
"జూన్",
"జులై",
"ఆగ",
"సెప్టెం",
"అక్టో",
"నవం",
"డిసెం"],

wide:[
"జనవరి",
"ఫిబ్రవరి",
"మార్చి",
"ఏప్రిల్",
"మే",
"జూన్",
"జులై",
"ఆగస్టు",
"సెప్టెంబర్",
"అక్టోబర్",
"నవంబర్",
"డిసెంబర్"]

};
var dayValues$10={
narrow:[
"ఆ",
"సో",
"మ",
"బు",
"గు",
"శు",
"శ"],

short:[
"ఆది",
"సోమ",
"మంగళ",
"బుధ",
"గురు",
"శుక్ర",
"శని"],

abbreviated:[
"ఆది",
"సోమ",
"మంగళ",
"బుధ",
"గురు",
"శుక్ర",
"శని"],

wide:[
"ఆదివారం",
"సోమవారం",
"మంగళవారం",
"బుధవారం",
"గురువారం",
"శుక్రవారం",
"శనివారం"]

};
var dayPeriodValues$10={
narrow:{
am:"పూర్వాహ్నం",
pm:"అపరాహ్నం",
midnight:"అర్ధరాత్రి",
noon:"మిట్టమధ్యాహ్నం",
morning:"ఉదయం",
afternoon:"మధ్యాహ్నం",
evening:"సాయంత్రం",
night:"రాత్రి"
},
abbreviated:{
am:"పూర్వాహ్నం",
pm:"అపరాహ్నం",
midnight:"అర్ధరాత్రి",
noon:"మిట్టమధ్యాహ్నం",
morning:"ఉదయం",
afternoon:"మధ్యాహ్నం",
evening:"సాయంత్రం",
night:"రాత్రి"
},
wide:{
am:"పూర్వాహ్నం",
pm:"అపరాహ్నం",
midnight:"అర్ధరాత్రి",
noon:"మిట్టమధ్యాహ్నం",
morning:"ఉదయం",
afternoon:"మధ్యాహ్నం",
evening:"సాయంత్రం",
night:"రాత్రి"
}
};
var formattingDayPeriodValues$10={
narrow:{
am:"పూర్వాహ్నం",
pm:"అపరాహ్నం",
midnight:"అర్ధరాత్రి",
noon:"మిట్టమధ్యాహ్నం",
morning:"ఉదయం",
afternoon:"మధ్యాహ్నం",
evening:"సాయంత్రం",
night:"రాత్రి"
},
abbreviated:{
am:"పూర్వాహ్నం",
pm:"అపరాహ్నం",
midnight:"అర్ధరాత్రి",
noon:"మిట్టమధ్యాహ్నం",
morning:"ఉదయం",
afternoon:"మధ్యాహ్నం",
evening:"సాయంత్రం",
night:"రాత్రి"
},
wide:{
am:"పూర్వాహ్నం",
pm:"అపరాహ్నం",
midnight:"అర్ధరాత్రి",
noon:"మిట్టమధ్యాహ్నం",
morning:"ఉదయం",
afternoon:"మధ్యాహ్నం",
evening:"సాయంత్రం",
night:"రాత్రి"
}
};
var ordinalNumber$10=function ordinalNumber$10(dirtyNumber,_options){
return Number(dirtyNumber)+"వ";
};
//#endregion
//#region dist/date-fns/locale/te.js
/**
* @category Locales
* @summary Telugu locale
* @language Telugu
* @iso-639-2 tel
* @author Kranthi Lakum [@kranthilakum](https://github.com/kranthilakum)
*/
var _te={
code:"te",
formatDistance:formatDistance$10,
formatLong:formatLong$10,
formatRelative:formatRelative$10,
localize:{
ordinalNumber:ordinalNumber$10,
era:buildLocalizeFn({
values:eraValues$10,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$10,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$10,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$10,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$10,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$10,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(వ)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(క్రీ\.పూ\.|క్రీ\.శ\.)/i,
abbreviated:/^(క్రీ\.?\s?పూ\.?|ప్ర\.?\s?శ\.?\s?పూ\.?|క్రీ\.?\s?శ\.?|సా\.?\s?శ\.?)/i,
wide:/^(క్రీస్తు పూర్వం|ప్రస్తుత శకానికి పూర్వం|క్రీస్తు శకం|ప్రస్తుత శకం)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(పూ|శ)/i,/^సా/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^త్రై[1234]/i,
wide:/^[1234](వ)? త్రైమాసికం/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(జూ|జు|జ|ఫి|మా|ఏ|మే|ఆ|సె|అ|న|డి)/i,
abbreviated:/^(జన|ఫిబ్ర|మార్చి|ఏప్రి|మే|జూన్|జులై|ఆగ|సెప్|అక్టో|నవ|డిసె)/i,
wide:/^(జనవరి|ఫిబ్రవరి|మార్చి|ఏప్రిల్|మే|జూన్|జులై|ఆగస్టు|సెప్టెంబర్|అక్టోబర్|నవంబర్|డిసెంబర్)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^జ/i,
/^ఫి/i,
/^మా/i,
/^ఏ/i,
/^మే/i,
/^జూ/i,
/^జు/i,
/^ఆ/i,
/^సె/i,
/^అ/i,
/^న/i,
/^డి/i],

any:[
/^జన/i,
/^ఫి/i,
/^మా/i,
/^ఏ/i,
/^మే/i,
/^జూన్/i,
/^జులై/i,
/^ఆగ/i,
/^సె/i,
/^అ/i,
/^న/i,
/^డి/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(ఆ|సో|మ|బు|గు|శు|శ)/i,
short:/^(ఆది|సోమ|మం|బుధ|గురు|శుక్ర|శని)/i,
abbreviated:/^(ఆది|సోమ|మం|బుధ|గురు|శుక్ర|శని)/i,
wide:/^(ఆదివారం|సోమవారం|మంగళవారం|బుధవారం|గురువారం|శుక్రవారం|శనివారం)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ఆ/i,
/^సో/i,
/^మ/i,
/^బు/i,
/^గు/i,
/^శు/i,
/^శ/i],

any:[
/^ఆది/i,
/^సోమ/i,
/^మం/i,
/^బుధ/i,
/^గురు/i,
/^శుక్ర/i,
/^శని/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(పూర్వాహ్నం|అపరాహ్నం|అర్ధరాత్రి|మిట్టమధ్యాహ్నం|ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి)/i,
any:/^(పూర్వాహ్నం|అపరాహ్నం|అర్ధరాత్రి|మిట్టమధ్యాహ్నం|ఉదయం|మధ్యాహ్నం|సాయంత్రం|రాత్రి)/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^పూర్వాహ్నం/i,
pm:/^అపరాహ్నం/i,
midnight:/^అర్ధ/i,
noon:/^మిట్ట/i,
morning:/ఉదయం/i,
afternoon:/మధ్యాహ్నం/i,
evening:/సాయంత్రం/i,
night:/రాత్రి/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/th/_lib/formatDistance.js
var formatDistanceLocale$9={
lessThanXSeconds:{
one:"น้อยกว่า 1 วินาที",
other:"น้อยกว่า {{count}} วินาที"
},
xSeconds:{
one:"1 วินาที",
other:"{{count}} วินาที"
},
halfAMinute:"ครึ่งนาที",
lessThanXMinutes:{
one:"น้อยกว่า 1 นาที",
other:"น้อยกว่า {{count}} นาที"
},
xMinutes:{
one:"1 นาที",
other:"{{count}} นาที"
},
aboutXHours:{
one:"ประมาณ 1 ชั่วโมง",
other:"ประมาณ {{count}} ชั่วโมง"
},
xHours:{
one:"1 ชั่วโมง",
other:"{{count}} ชั่วโมง"
},
xDays:{
one:"1 วัน",
other:"{{count}} วัน"
},
aboutXWeeks:{
one:"ประมาณ 1 สัปดาห์",
other:"ประมาณ {{count}} สัปดาห์"
},
xWeeks:{
one:"1 สัปดาห์",
other:"{{count}} สัปดาห์"
},
aboutXMonths:{
one:"ประมาณ 1 เดือน",
other:"ประมาณ {{count}} เดือน"
},
xMonths:{
one:"1 เดือน",
other:"{{count}} เดือน"
},
aboutXYears:{
one:"ประมาณ 1 ปี",
other:"ประมาณ {{count}} ปี"
},
xYears:{
one:"1 ปี",
other:"{{count}} ปี"
},
overXYears:{
one:"มากกว่า 1 ปี",
other:"มากกว่า {{count}} ปี"
},
almostXYears:{
one:"เกือบ 1 ปี",
other:"เกือบ {{count}} ปี"
}
};
var formatDistance$9=function formatDistance$9(token,count,options){
var result;
var tokenValue=formatDistanceLocale$9[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0){if(token==="halfAMinute")return"ใน"+result;else
return"ใน "+result;}else
return result+"ที่ผ่านมา";
return result;
};
var formatLong$9={
date:buildFormatLongFn({
formats:{
full:"วันEEEEที่ do MMMM y",
long:"do MMMM y",
medium:"d MMM y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss น. zzzz",
long:"H:mm:ss น. z",
medium:"H:mm:ss น.",
short:"H:mm น."
},
defaultWidth:"medium"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'เวลา' {{time}}",
long:"{{date}} 'เวลา' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/th/_lib/formatRelative.js
var formatRelativeLocale$9={
lastWeek:"eeee'ที่แล้วเวลา' p",
yesterday:"'เมื่อวานนี้เวลา' p",
today:"'วันนี้เวลา' p",
tomorrow:"'พรุ่งนี้เวลา' p",
nextWeek:"eeee 'เวลา' p",
other:"P"
};
var formatRelative$9=function formatRelative$9(token,_date,_baseDate,_options){return formatRelativeLocale$9[token];};
//#endregion
//#region dist/date-fns/locale/th/_lib/localize.js
var eraValues$9={
narrow:["B","คศ"],
abbreviated:["BC","ค.ศ."],
wide:["ปีก่อนคริสตกาล","คริสต์ศักราช"]
};
var quarterValues$9={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"ไตรมาสแรก",
"ไตรมาสที่สอง",
"ไตรมาสที่สาม",
"ไตรมาสที่สี่"]

};
var dayValues$9={
narrow:[
"อา.",
"จ.",
"อ.",
"พ.",
"พฤ.",
"ศ.",
"ส."],

short:[
"อา.",
"จ.",
"อ.",
"พ.",
"พฤ.",
"ศ.",
"ส."],

abbreviated:[
"อา.",
"จ.",
"อ.",
"พ.",
"พฤ.",
"ศ.",
"ส."],

wide:[
"อาทิตย์",
"จันทร์",
"อังคาร",
"พุธ",
"พฤหัสบดี",
"ศุกร์",
"เสาร์"]

};
var monthValues$9={
narrow:[
"ม.ค.",
"ก.พ.",
"มี.ค.",
"เม.ย.",
"พ.ค.",
"มิ.ย.",
"ก.ค.",
"ส.ค.",
"ก.ย.",
"ต.ค.",
"พ.ย.",
"ธ.ค."],

abbreviated:[
"ม.ค.",
"ก.พ.",
"มี.ค.",
"เม.ย.",
"พ.ค.",
"มิ.ย.",
"ก.ค.",
"ส.ค.",
"ก.ย.",
"ต.ค.",
"พ.ย.",
"ธ.ค."],

wide:[
"มกราคม",
"กุมภาพันธ์",
"มีนาคม",
"เมษายน",
"พฤษภาคม",
"มิถุนายน",
"กรกฎาคม",
"สิงหาคม",
"กันยายน",
"ตุลาคม",
"พฤศจิกายน",
"ธันวาคม"]

};
var dayPeriodValues$9={
narrow:{
am:"ก่อนเที่ยง",
pm:"หลังเที่ยง",
midnight:"เที่ยงคืน",
noon:"เที่ยง",
morning:"เช้า",
afternoon:"บ่าย",
evening:"เย็น",
night:"กลางคืน"
},
abbreviated:{
am:"ก่อนเที่ยง",
pm:"หลังเที่ยง",
midnight:"เที่ยงคืน",
noon:"เที่ยง",
morning:"เช้า",
afternoon:"บ่าย",
evening:"เย็น",
night:"กลางคืน"
},
wide:{
am:"ก่อนเที่ยง",
pm:"หลังเที่ยง",
midnight:"เที่ยงคืน",
noon:"เที่ยง",
morning:"เช้า",
afternoon:"บ่าย",
evening:"เย็น",
night:"กลางคืน"
}
};
var formattingDayPeriodValues$9={
narrow:{
am:"ก่อนเที่ยง",
pm:"หลังเที่ยง",
midnight:"เที่ยงคืน",
noon:"เที่ยง",
morning:"ตอนเช้า",
afternoon:"ตอนกลางวัน",
evening:"ตอนเย็น",
night:"ตอนกลางคืน"
},
abbreviated:{
am:"ก่อนเที่ยง",
pm:"หลังเที่ยง",
midnight:"เที่ยงคืน",
noon:"เที่ยง",
morning:"ตอนเช้า",
afternoon:"ตอนกลางวัน",
evening:"ตอนเย็น",
night:"ตอนกลางคืน"
},
wide:{
am:"ก่อนเที่ยง",
pm:"หลังเที่ยง",
midnight:"เที่ยงคืน",
noon:"เที่ยง",
morning:"ตอนเช้า",
afternoon:"ตอนกลางวัน",
evening:"ตอนเย็น",
night:"ตอนกลางคืน"
}
};
var ordinalNumber$9=function ordinalNumber$9(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/th.js
/**
* @category Locales
* @summary Thai locale.
* @language Thai
* @iso-639-2 tha
* @author Athiwat Hirunworawongkun [@athivvat](https://github.com/athivvat)
* @author [@hawkup](https://github.com/hawkup)
* @author  Jirawat I. [@nodtem66](https://github.com/nodtem66)
*/
var _th={
code:"th",
formatDistance:formatDistance$9,
formatLong:formatLong$9,
formatRelative:formatRelative$9,
localize:{
ordinalNumber:ordinalNumber$9,
era:buildLocalizeFn({
values:eraValues$9,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$9,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$9,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$9,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$9,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$9,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^\d+/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^([bB]|[aA]|คศ)/i,
abbreviated:/^([bB]\.?\s?[cC]\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?|ค\.?ศ\.?)/i,
wide:/^(ก่อนคริสตกาล|คริสต์ศักราช|คริสตกาล)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^[bB]/i,/^(^[aA]|ค\.?ศ\.?|คริสตกาล|คริสต์ศักราช|)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^ไตรมาส(ที่)? ?[1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|แรก|หนึ่ง)/i,
/(2|สอง)/i,
/(3|สาม)/i,
/(4|สี่)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)/i,
abbreviated:/^(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?')/i,
wide:/^(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
wide:[
/^มก/i,
/^กุม/i,
/^มี/i,
/^เม/i,
/^พฤษ/i,
/^มิ/i,
/^กรก/i,
/^ส/i,
/^กัน/i,
/^ต/i,
/^พฤศ/i,
/^ธ/i],

any:[
/^ม\.?ค\.?/i,
/^ก\.?พ\.?/i,
/^มี\.?ค\.?/i,
/^เม\.?ย\.?/i,
/^พ\.?ค\.?/i,
/^มิ\.?ย\.?/i,
/^ก\.?ค\.?/i,
/^ส\.?ค\.?/i,
/^ก\.?ย\.?/i,
/^ต\.?ค\.?/i,
/^พ\.?ย\.?/i,
/^ธ\.?ค\.?/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
short:/^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
abbreviated:/^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
wide:/^(อาทิตย์|จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
wide:[
/^อา/i,
/^จั/i,
/^อั/i,
/^พุธ/i,
/^พฤ/i,
/^ศ/i,
/^เส/i],

any:[
/^อา/i,
/^จ/i,
/^อ/i,
/^พ(?!ฤ)/i,
/^พฤ/i,
/^ศ/i,
/^ส/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(ก่อนเที่ยง|หลังเที่ยง|เที่ยงคืน|เที่ยง|(ตอน.*?)?.*(เที่ยง|เช้า|บ่าย|เย็น|กลางคืน))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ก่อนเที่ยง/i,
pm:/^หลังเที่ยง/i,
midnight:/^เที่ยงคืน/i,
noon:/^เที่ยง/i,
morning:/เช้า/i,
afternoon:/บ่าย/i,
evening:/เย็น/i,
night:/กลางคืน/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/tr/_lib/formatDistance.js
var formatDistanceLocale$8={
lessThanXSeconds:{
one:"bir saniyeden az",
other:"{{count}} saniyeden az"
},
xSeconds:{
one:"1 saniye",
other:"{{count}} saniye"
},
halfAMinute:"yarım dakika",
lessThanXMinutes:{
one:"bir dakikadan az",
other:"{{count}} dakikadan az"
},
xMinutes:{
one:"1 dakika",
other:"{{count}} dakika"
},
aboutXHours:{
one:"yaklaşık 1 saat",
other:"yaklaşık {{count}} saat"
},
xHours:{
one:"1 saat",
other:"{{count}} saat"
},
xDays:{
one:"1 gün",
other:"{{count}} gün"
},
aboutXWeeks:{
one:"yaklaşık 1 hafta",
other:"yaklaşık {{count}} hafta"
},
xWeeks:{
one:"1 hafta",
other:"{{count}} hafta"
},
aboutXMonths:{
one:"yaklaşık 1 ay",
other:"yaklaşık {{count}} ay"
},
xMonths:{
one:"1 ay",
other:"{{count}} ay"
},
aboutXYears:{
one:"yaklaşık 1 yıl",
other:"yaklaşık {{count}} yıl"
},
xYears:{
one:"1 yıl",
other:"{{count}} yıl"
},
overXYears:{
one:"1 yıldan fazla",
other:"{{count}} yıldan fazla"
},
almostXYears:{
one:"neredeyse 1 yıl",
other:"neredeyse {{count}} yıl"
}
};
var formatDistance$8=function formatDistance$8(token,count,options){
var result;
var tokenValue=formatDistanceLocale$8[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",count.toString());
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" sonra";else
return result+" önce";
return result;
};
var formatLong$8={
date:buildFormatLongFn({
formats:{
full:"d MMMM y EEEE",
long:"d MMMM y",
medium:"d MMM y",
short:"dd.MM.yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'saat' {{time}}",
long:"{{date}} 'saat' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/tr/_lib/formatRelative.js
var formatRelativeLocale$8={
lastWeek:"'geçen hafta' eeee 'saat' p",
yesterday:"'dün saat' p",
today:"'bugün saat' p",
tomorrow:"'yarın saat' p",
nextWeek:"eeee 'saat' p",
other:"P"
};
var formatRelative$8=function formatRelative$8(token,_date,_baseDate,_options){return formatRelativeLocale$8[token];};
//#endregion
//#region dist/date-fns/locale/tr/_lib/localize.js
var eraValues$8={
narrow:["MÖ","MS"],
abbreviated:["MÖ","MS"],
wide:["Milattan Önce","Milattan Sonra"]
};
var quarterValues$8={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1Ç",
"2Ç",
"3Ç",
"4Ç"],

wide:[
"İlk çeyrek",
"İkinci Çeyrek",
"Üçüncü çeyrek",
"Son çeyrek"]

};
var monthValues$8={
narrow:[
"O",
"Ş",
"M",
"N",
"M",
"H",
"T",
"A",
"E",
"E",
"K",
"A"],

abbreviated:[
"Oca",
"Şub",
"Mar",
"Nis",
"May",
"Haz",
"Tem",
"Ağu",
"Eyl",
"Eki",
"Kas",
"Ara"],

wide:[
"Ocak",
"Şubat",
"Mart",
"Nisan",
"Mayıs",
"Haziran",
"Temmuz",
"Ağustos",
"Eylül",
"Ekim",
"Kasım",
"Aralık"]

};
var dayValues$8={
narrow:[
"P",
"P",
"S",
"Ç",
"P",
"C",
"C"],

short:[
"Pz",
"Pt",
"Sa",
"Ça",
"Pe",
"Cu",
"Ct"],

abbreviated:[
"Paz",
"Pzt",
"Sal",
"Çar",
"Per",
"Cum",
"Cts"],

wide:[
"Pazar",
"Pazartesi",
"Salı",
"Çarşamba",
"Perşembe",
"Cuma",
"Cumartesi"]

};
var dayPeriodValues$8={
narrow:{
am:"öö",
pm:"ös",
midnight:"gy",
noon:"ö",
morning:"sa",
afternoon:"ös",
evening:"ak",
night:"ge"
},
abbreviated:{
am:"ÖÖ",
pm:"ÖS",
midnight:"gece yarısı",
noon:"öğle",
morning:"sabah",
afternoon:"öğleden sonra",
evening:"akşam",
night:"gece"
},
wide:{
am:"Ö.Ö.",
pm:"Ö.S.",
midnight:"gece yarısı",
noon:"öğle",
morning:"sabah",
afternoon:"öğleden sonra",
evening:"akşam",
night:"gece"
}
};
var formattingDayPeriodValues$8={
narrow:{
am:"öö",
pm:"ös",
midnight:"gy",
noon:"ö",
morning:"sa",
afternoon:"ös",
evening:"ak",
night:"ge"
},
abbreviated:{
am:"ÖÖ",
pm:"ÖS",
midnight:"gece yarısı",
noon:"öğlen",
morning:"sabahleyin",
afternoon:"öğleden sonra",
evening:"akşamleyin",
night:"geceleyin"
},
wide:{
am:"ö.ö.",
pm:"ö.s.",
midnight:"gece yarısı",
noon:"öğlen",
morning:"sabahleyin",
afternoon:"öğleden sonra",
evening:"akşamleyin",
night:"geceleyin"
}
};
var ordinalNumber$8=function ordinalNumber$8(dirtyNumber,_options){
return Number(dirtyNumber)+".";
};
//#endregion
//#region dist/date-fns/locale/tr.js
/**
* @category Locales
* @summary Turkish locale.
* @language Turkish
* @iso-639-2 tur
* @author Alpcan Aydın [@alpcanaydin](https://github.com/alpcanaydin)
* @author Berkay Sargın [@berkaey](https://github.com/berkaey)
* @author Fatih Bulut [@bulutfatih](https://github.com/bulutfatih)
* @author Ismail Demirbilek [@dbtek](https://github.com/dbtek)
* @author İsmail Kayar [@ikayar](https://github.com/ikayar)
*
*
*/
var _tr={
code:"tr",
formatDistance:formatDistance$8,
formatLong:formatLong$8,
formatRelative:formatRelative$8,
localize:{
ordinalNumber:ordinalNumber$8,
era:buildLocalizeFn({
values:eraValues$8,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$8,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return Number(quarter)-1;}
}),
month:buildLocalizeFn({
values:monthValues$8,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$8,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$8,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$8,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(\.)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){
return parseInt(value,10);
}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(mö|ms)/i,
abbreviated:/^(mö|ms)/i,
wide:/^(milattan önce|milattan sonra)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/(^mö|^milattan önce)/i,/(^ms|^milattan sonra)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]ç/i,
wide:/^((i|İ)lk|(i|İ)kinci|üçüncü|son) çeyrek/i
},
defaultMatchWidth:"wide",
parsePatterns:{
any:[
/1/i,
/2/i,
/3/i,
/4/i],

abbreviated:[
/1ç/i,
/2ç/i,
/3ç/i,
/4ç/i],

wide:[
/^(i|İ)lk çeyrek/i,
/(i|İ)kinci çeyrek/i,
/üçüncü çeyrek/i,
/son çeyrek/i]

},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[oşmnhtaek]/i,
abbreviated:/^(oca|şub|mar|nis|may|haz|tem|ağu|eyl|eki|kas|ara)/i,
wide:/^(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^o/i,
/^ş/i,
/^m/i,
/^n/i,
/^m/i,
/^h/i,
/^t/i,
/^a/i,
/^e/i,
/^e/i,
/^k/i,
/^a/i],

any:[
/^o/i,
/^ş/i,
/^mar/i,
/^n/i,
/^may/i,
/^h/i,
/^t/i,
/^ağ/i,
/^ey/i,
/^ek/i,
/^k/i,
/^ar/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[psçc]/i,
short:/^(pz|pt|sa|ça|pe|cu|ct)/i,
abbreviated:/^(paz|pzt|sal|çar|per|cum|cts)/i,
wide:/^(pazar(?!tesi)|pazartesi|salı|çarşamba|perşembe|cuma(?!rtesi)|cumartesi)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^p/i,
/^p/i,
/^s/i,
/^ç/i,
/^p/i,
/^c/i,
/^c/i],

any:[
/^pz/i,
/^pt/i,
/^sa/i,
/^ça/i,
/^pe/i,
/^cu/i,
/^ct/i],

wide:[
/^pazar(?!tesi)/i,
/^pazartesi/i,
/^salı/i,
/^çarşamba/i,
/^perşembe/i,
/^cuma(?!rtesi)/i,
/^cumartesi/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(öö|ös|gy|ö|sa|ös|ak|ge)/i,
any:/^(ö\.?\s?[ös]\.?|öğleden sonra|gece yarısı|öğle|(sabah|öğ|akşam|gece)(leyin))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ö\.?ö\.?/i,
pm:/^ö\.?s\.?/i,
midnight:/^(gy|gece yarısı)/i,
noon:/^öğ/i,
morning:/^sa/i,
afternoon:/^öğleden sonra/i,
evening:/^ak/i,
night:/^ge/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/ug/_lib/formatDistance.js
var formatDistanceLocale$7={
lessThanXSeconds:{
one:"بىر سىكۇنت ئىچىدە",
other:"سىكۇنت ئىچىدە {{count}}"
},
xSeconds:{
one:"بىر سىكۇنت",
other:"سىكۇنت {{count}}"
},
halfAMinute:"يىرىم مىنۇت",
lessThanXMinutes:{
one:"بىر مىنۇت ئىچىدە",
other:"مىنۇت ئىچىدە {{count}}"
},
xMinutes:{
one:"بىر مىنۇت",
other:"مىنۇت {{count}}"
},
aboutXHours:{
one:"تەخمىنەن بىر سائەت",
other:"سائەت {{count}} تەخمىنەن"
},
xHours:{
one:"بىر سائەت",
other:"سائەت {{count}}"
},
xDays:{
one:"بىر كۈن",
other:"كۈن {{count}}"
},
aboutXWeeks:{
one:"تەخمىنەن بىرھەپتە",
other:"ھەپتە {{count}} تەخمىنەن"
},
xWeeks:{
one:"بىرھەپتە",
other:"ھەپتە {{count}}"
},
aboutXMonths:{
one:"تەخمىنەن بىر ئاي",
other:"ئاي {{count}} تەخمىنەن"
},
xMonths:{
one:"بىر ئاي",
other:"ئاي {{count}}"
},
aboutXYears:{
one:"تەخمىنەن بىر يىل",
other:"يىل {{count}} تەخمىنەن"
},
xYears:{
one:"بىر يىل",
other:"يىل {{count}}"
},
overXYears:{
one:"بىر يىلدىن ئارتۇق",
other:"يىلدىن ئارتۇق {{count}}"
},
almostXYears:{
one:"ئاساسەن بىر يىل",
other:"يىل {{count}} ئاساسەن"
}
};
var formatDistance$7=function formatDistance$7(token,count,options){
var result;
var tokenValue=formatDistanceLocale$7[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result;else
return result+" بولدى";
return result;
};
var formatLong$7={
date:buildFormatLongFn({
formats:{
full:"EEEE, MMMM do, y",
long:"MMMM do, y",
medium:"MMM d, y",
short:"MM/dd/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss a zzzz",
long:"h:mm:ss a z",
medium:"h:mm:ss a",
short:"h:mm a"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'دە' {{time}}",
long:"{{date}} 'دە' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/ug/_lib/formatRelative.js
var formatRelativeLocale$7={
lastWeek:"'ئ‍ۆتكەن' eeee 'دە' p",
yesterday:"'تۈنۈگۈن دە' p",
today:"'بۈگۈن دە' p",
tomorrow:"'ئەتە دە' p",
nextWeek:"eeee 'دە' p",
other:"P"
};
var formatRelative$7=function formatRelative$7(token,_date,_baseDate,_options){return formatRelativeLocale$7[token];};
//#endregion
//#region dist/date-fns/locale/ug/_lib/localize.js
var eraValues$7={
narrow:["ب","ك"],
abbreviated:["ب","ك"],
wide:["مىيلادىدىن بۇرۇن","مىيلادىدىن كىيىن"]
};
var quarterValues$7={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1",
"2",
"3",
"4"],

wide:[
"بىرىنجى چارەك",
"ئىككىنجى چارەك",
"ئۈچىنجى چارەك",
"تۆتىنجى چارەك"]

};
var monthValues$7={
narrow:[
"ي",
"ف",
"م",
"ا",
"م",
"ى",
"ى",
"ا",
"س",
"ۆ",
"ن",
"د"],

abbreviated:[
"يانۋار",
"فېۋىرال",
"مارت",
"ئاپرىل",
"ماي",
"ئىيۇن",
"ئىيول",
"ئاۋغۇست",
"سىنتەبىر",
"ئۆكتەبىر",
"نويابىر",
"دىكابىر"],

wide:[
"يانۋار",
"فېۋىرال",
"مارت",
"ئاپرىل",
"ماي",
"ئىيۇن",
"ئىيول",
"ئاۋغۇست",
"سىنتەبىر",
"ئۆكتەبىر",
"نويابىر",
"دىكابىر"]

};
var dayValues$7={
narrow:[
"ي",
"د",
"س",
"چ",
"پ",
"ج",
"ش"],

short:[
"ي",
"د",
"س",
"چ",
"پ",
"ج",
"ش"],

abbreviated:[
"يەكشەنبە",
"دۈشەنبە",
"سەيشەنبە",
"چارشەنبە",
"پەيشەنبە",
"جۈمە",
"شەنبە"],

wide:[
"يەكشەنبە",
"دۈشەنبە",
"سەيشەنبە",
"چارشەنبە",
"پەيشەنبە",
"جۈمە",
"شەنبە"]

};
var dayPeriodValues$7={
narrow:{
am:"ئە",
pm:"چ",
midnight:"ك",
noon:"چ",
morning:"ئەتىگەن",
afternoon:"چۈشتىن كىيىن",
evening:"ئاخشىم",
night:"كىچە"
},
abbreviated:{
am:"ئە",
pm:"چ",
midnight:"ك",
noon:"چ",
morning:"ئەتىگەن",
afternoon:"چۈشتىن كىيىن",
evening:"ئاخشىم",
night:"كىچە"
},
wide:{
am:"ئە",
pm:"چ",
midnight:"ك",
noon:"چ",
morning:"ئەتىگەن",
afternoon:"چۈشتىن كىيىن",
evening:"ئاخشىم",
night:"كىچە"
}
};
var formattingDayPeriodValues$7={
narrow:{
am:"ئە",
pm:"چ",
midnight:"ك",
noon:"چ",
morning:"ئەتىگەندە",
afternoon:"چۈشتىن كىيىن",
evening:"ئاخشامدا",
night:"كىچىدە"
},
abbreviated:{
am:"ئە",
pm:"چ",
midnight:"ك",
noon:"چ",
morning:"ئەتىگەندە",
afternoon:"چۈشتىن كىيىن",
evening:"ئاخشامدا",
night:"كىچىدە"
},
wide:{
am:"ئە",
pm:"چ",
midnight:"ك",
noon:"چ",
morning:"ئەتىگەندە",
afternoon:"چۈشتىن كىيىن",
evening:"ئاخشامدا",
night:"كىچىدە"
}
};
var ordinalNumber$7=function ordinalNumber$7(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/ug.js
/**
* @category Locales
* @summary Uighur locale
* @language Uighur
* @iso-639-2 uig
* @author Abduwaly M. [@abduwaly](https://github.com/abduwaly)
*/
var _ug={
code:"ug",
formatDistance:formatDistance$7,
formatLong:formatLong$7,
formatRelative:formatRelative$7,
localize:{
ordinalNumber:ordinalNumber$7,
era:buildLocalizeFn({
values:eraValues$7,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$7,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$7,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$7,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$7,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$7,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(th|st|nd|rd)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(ب|ك)/i,
wide:/^(مىيلادىدىن بۇرۇن|مىيلادىدىن كىيىن)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^بۇرۇن/i,/^كىيىن/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^چ[1234]/i,
wide:/^چارەك [1234]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[يفمئامئ‍ئاسۆند]/i,
abbreviated:/^(يانۋار|فېۋىرال|مارت|ئاپرىل|ماي|ئىيۇن|ئىيول|ئاۋغۇست|سىنتەبىر|ئۆكتەبىر|نويابىر|دىكابىر)/i,
wide:/^(يانۋار|فېۋىرال|مارت|ئاپرىل|ماي|ئىيۇن|ئىيول|ئاۋغۇست|سىنتەبىر|ئۆكتەبىر|نويابىر|دىكابىر)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ي/i,
/^ف/i,
/^م/i,
/^ا/i,
/^م/i,
/^ى‍/i,
/^ى‍/i,
/^ا‍/i,
/^س/i,
/^ۆ/i,
/^ن/i,
/^د/i],

any:[
/^يان/i,
/^فېۋ/i,
/^مار/i,
/^ئاپ/i,
/^ماي/i,
/^ئىيۇن/i,
/^ئىيول/i,
/^ئاۋ/i,
/^سىن/i,
/^ئۆك/i,
/^نوي/i,
/^دىك/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[دسچپجشي]/i,
short:/^(يە|دۈ|سە|چا|پە|جۈ|شە)/i,
abbreviated:/^(يە|دۈ|سە|چا|پە|جۈ|شە)/i,
wide:/^(يەكشەنبە|دۈشەنبە|سەيشەنبە|چارشەنبە|پەيشەنبە|جۈمە|شەنبە)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^ي/i,
/^د/i,
/^س/i,
/^چ/i,
/^پ/i,
/^ج/i,
/^ش/i],

any:[
/^ي/i,
/^د/i,
/^س/i,
/^چ/i,
/^پ/i,
/^ج/i,
/^ش/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(ئە|چ|ك|چ|(دە|ئەتىگەن) ( ئە‍|چۈشتىن كىيىن|ئاخشىم|كىچە))/i,
any:/^(ئە|چ|ك|چ|(دە|ئەتىگەن) ( ئە‍|چۈشتىن كىيىن|ئاخشىم|كىچە))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^ئە/i,
pm:/^چ/i,
midnight:/^ك/i,
noon:/^چ/i,
morning:/ئەتىگەن/i,
afternoon:/چۈشتىن كىيىن/i,
evening:/ئاخشىم/i,
night:/كىچە/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/uk/_lib/formatDistance.js
function declension(scheme,count){
if(scheme.one!==void 0&&count===1)return scheme.one;
var rem10=count%10;
var rem100=count%100;
if(rem10===1&&rem100!==11)return scheme.singularNominative.replace("{{count}}",String(count));else
if(rem10>=2&&rem10<=4&&(rem100<10||rem100>20))return scheme.singularGenitive.replace("{{count}}",String(count));else
return scheme.pluralGenitive.replace("{{count}}",String(count));
}
function buildLocalizeTokenFn(scheme){
return function(count,options){
if(options&&options.addSuffix){if(options.comparison&&options.comparison>0){if(scheme.future)return declension(scheme.future,count);else
return"за "+declension(scheme.regular,count);}else
if(scheme.past)return declension(scheme.past,count);else
return declension(scheme.regular,count)+" тому";}else
return declension(scheme.regular,count);
};
}
var halfAtMinute=function halfAtMinute(_,options){
if(options&&options.addSuffix)if(options.comparison&&options.comparison>0)return"за півхвилини";else
return"півхвилини тому";
return"півхвилини";
};
var formatDistanceLocale$6={
lessThanXSeconds:buildLocalizeTokenFn({
regular:{
one:"менше секунди",
singularNominative:"менше {{count}} секунди",
singularGenitive:"менше {{count}} секунд",
pluralGenitive:"менше {{count}} секунд"
},
future:{
one:"менше, ніж за секунду",
singularNominative:"менше, ніж за {{count}} секунду",
singularGenitive:"менше, ніж за {{count}} секунди",
pluralGenitive:"менше, ніж за {{count}} секунд"
}
}),
xSeconds:buildLocalizeTokenFn({
regular:{
singularNominative:"{{count}} секунда",
singularGenitive:"{{count}} секунди",
pluralGenitive:"{{count}} секунд"
},
past:{
singularNominative:"{{count}} секунду тому",
singularGenitive:"{{count}} секунди тому",
pluralGenitive:"{{count}} секунд тому"
},
future:{
singularNominative:"за {{count}} секунду",
singularGenitive:"за {{count}} секунди",
pluralGenitive:"за {{count}} секунд"
}
}),
halfAMinute:halfAtMinute,
lessThanXMinutes:buildLocalizeTokenFn({
regular:{
one:"менше хвилини",
singularNominative:"менше {{count}} хвилини",
singularGenitive:"менше {{count}} хвилин",
pluralGenitive:"менше {{count}} хвилин"
},
future:{
one:"менше, ніж за хвилину",
singularNominative:"менше, ніж за {{count}} хвилину",
singularGenitive:"менше, ніж за {{count}} хвилини",
pluralGenitive:"менше, ніж за {{count}} хвилин"
}
}),
xMinutes:buildLocalizeTokenFn({
regular:{
singularNominative:"{{count}} хвилина",
singularGenitive:"{{count}} хвилини",
pluralGenitive:"{{count}} хвилин"
},
past:{
singularNominative:"{{count}} хвилину тому",
singularGenitive:"{{count}} хвилини тому",
pluralGenitive:"{{count}} хвилин тому"
},
future:{
singularNominative:"за {{count}} хвилину",
singularGenitive:"за {{count}} хвилини",
pluralGenitive:"за {{count}} хвилин"
}
}),
aboutXHours:buildLocalizeTokenFn({
regular:{
singularNominative:"близько {{count}} години",
singularGenitive:"близько {{count}} годин",
pluralGenitive:"близько {{count}} годин"
},
future:{
singularNominative:"приблизно за {{count}} годину",
singularGenitive:"приблизно за {{count}} години",
pluralGenitive:"приблизно за {{count}} годин"
}
}),
xHours:buildLocalizeTokenFn({regular:{
singularNominative:"{{count}} годину",
singularGenitive:"{{count}} години",
pluralGenitive:"{{count}} годин"
}}),
xDays:buildLocalizeTokenFn({regular:{
singularNominative:"{{count}} день",
singularGenitive:"{{count}} днi",
pluralGenitive:"{{count}} днів"
}}),
aboutXWeeks:buildLocalizeTokenFn({
regular:{
singularNominative:"близько {{count}} тижня",
singularGenitive:"близько {{count}} тижнів",
pluralGenitive:"близько {{count}} тижнів"
},
future:{
singularNominative:"приблизно за {{count}} тиждень",
singularGenitive:"приблизно за {{count}} тижні",
pluralGenitive:"приблизно за {{count}} тижнів"
}
}),
xWeeks:buildLocalizeTokenFn({regular:{
singularNominative:"{{count}} тиждень",
singularGenitive:"{{count}} тижні",
pluralGenitive:"{{count}} тижнів"
}}),
aboutXMonths:buildLocalizeTokenFn({
regular:{
singularNominative:"близько {{count}} місяця",
singularGenitive:"близько {{count}} місяців",
pluralGenitive:"близько {{count}} місяців"
},
future:{
singularNominative:"приблизно за {{count}} місяць",
singularGenitive:"приблизно за {{count}} місяці",
pluralGenitive:"приблизно за {{count}} місяців"
}
}),
xMonths:buildLocalizeTokenFn({regular:{
singularNominative:"{{count}} місяць",
singularGenitive:"{{count}} місяці",
pluralGenitive:"{{count}} місяців"
}}),
aboutXYears:buildLocalizeTokenFn({
regular:{
singularNominative:"близько {{count}} року",
singularGenitive:"близько {{count}} років",
pluralGenitive:"близько {{count}} років"
},
future:{
singularNominative:"приблизно за {{count}} рік",
singularGenitive:"приблизно за {{count}} роки",
pluralGenitive:"приблизно за {{count}} років"
}
}),
xYears:buildLocalizeTokenFn({regular:{
singularNominative:"{{count}} рік",
singularGenitive:"{{count}} роки",
pluralGenitive:"{{count}} років"
}}),
overXYears:buildLocalizeTokenFn({
regular:{
singularNominative:"більше {{count}} року",
singularGenitive:"більше {{count}} років",
pluralGenitive:"більше {{count}} років"
},
future:{
singularNominative:"більше, ніж за {{count}} рік",
singularGenitive:"більше, ніж за {{count}} роки",
pluralGenitive:"більше, ніж за {{count}} років"
}
}),
almostXYears:buildLocalizeTokenFn({
regular:{
singularNominative:"майже {{count}} рік",
singularGenitive:"майже {{count}} роки",
pluralGenitive:"майже {{count}} років"
},
future:{
singularNominative:"майже за {{count}} рік",
singularGenitive:"майже за {{count}} роки",
pluralGenitive:"майже за {{count}} років"
}
})
};
var formatDistance$6=function formatDistance$6(token,count,options){
options=options||{};
return formatDistanceLocale$6[token](count,options);
};
var formatLong$6={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM y 'р.'",
long:"do MMMM y 'р.'",
medium:"d MMM y 'р.'",
short:"dd.MM.y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} 'о' {{time}}",
long:"{{date}} 'о' {{time}}",
medium:"{{date}}, {{time}}",
short:"{{date}}, {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/uk/_lib/formatRelative.js
var accusativeWeekdays=[
"неділю",
"понеділок",
"вівторок",
"середу",
"четвер",
"п’ятницю",
"суботу"];

function lastWeek(day){
var weekday=accusativeWeekdays[day];
switch(day){
case 0:
case 3:
case 5:
case 6:return"'у минулу "+weekday+" о' p";
case 1:
case 2:
case 4:return"'у минулий "+weekday+" о' p";
}
}
function thisWeek(day){
return"'у "+accusativeWeekdays[day]+" о' p";
}
function nextWeek(day){
var weekday=accusativeWeekdays[day];
switch(day){
case 0:
case 3:
case 5:
case 6:return"'у наступну "+weekday+" о' p";
case 1:
case 2:
case 4:return"'у наступний "+weekday+" о' p";
}
}
var lastWeekFormat=function lastWeekFormat(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek(day);else
return lastWeek(day);
};
var nextWeekFormat=function nextWeekFormat(dirtyDate,baseDate,options){
var date=toDate(dirtyDate);
var day=date.getDay();
if(isSameWeek(date,baseDate,options))return thisWeek(day);else
return nextWeek(day);
};
var formatRelativeLocale$6={
lastWeek:lastWeekFormat,
yesterday:"'вчора о' p",
today:"'сьогодні о' p",
tomorrow:"'завтра о' p",
nextWeek:nextWeekFormat,
other:"P"
};
var formatRelative$6=function formatRelative$6(token,date,baseDate,options){
var format=formatRelativeLocale$6[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/uk/_lib/localize.js
var eraValues$6={
narrow:["до н.е.","н.е."],
abbreviated:["до н. е.","н. е."],
wide:["до нашої ери","нашої ери"]
};
var quarterValues$6={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-й кв.",
"2-й кв.",
"3-й кв.",
"4-й кв."],

wide:[
"1-й квартал",
"2-й квартал",
"3-й квартал",
"4-й квартал"]

};
var monthValues$6={
narrow:[
"С",
"Л",
"Б",
"К",
"Т",
"Ч",
"Л",
"С",
"В",
"Ж",
"Л",
"Г"],

abbreviated:[
"січ.",
"лют.",
"берез.",
"квіт.",
"трав.",
"черв.",
"лип.",
"серп.",
"верес.",
"жовт.",
"листоп.",
"груд."],

wide:[
"січень",
"лютий",
"березень",
"квітень",
"травень",
"червень",
"липень",
"серпень",
"вересень",
"жовтень",
"листопад",
"грудень"]

};
var formattingMonthValues$1={
narrow:[
"С",
"Л",
"Б",
"К",
"Т",
"Ч",
"Л",
"С",
"В",
"Ж",
"Л",
"Г"],

abbreviated:[
"січ.",
"лют.",
"берез.",
"квіт.",
"трав.",
"черв.",
"лип.",
"серп.",
"верес.",
"жовт.",
"листоп.",
"груд."],

wide:[
"січня",
"лютого",
"березня",
"квітня",
"травня",
"червня",
"липня",
"серпня",
"вересня",
"жовтня",
"листопада",
"грудня"]

};
var dayValues$6={
narrow:[
"Н",
"П",
"В",
"С",
"Ч",
"П",
"С"],

short:[
"нд",
"пн",
"вт",
"ср",
"чт",
"пт",
"сб"],

abbreviated:[
"нед",
"пон",
"вів",
"сер",
"чтв",
"птн",
"суб"],

wide:[
"неділя",
"понеділок",
"вівторок",
"середа",
"четвер",
"п’ятниця",
"субота"]

};
var dayPeriodValues$6={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"півн.",
noon:"пол.",
morning:"ранок",
afternoon:"день",
evening:"веч.",
night:"ніч"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"півн.",
noon:"пол.",
morning:"ранок",
afternoon:"день",
evening:"веч.",
night:"ніч"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"північ",
noon:"полудень",
morning:"ранок",
afternoon:"день",
evening:"вечір",
night:"ніч"
}
};
var formattingDayPeriodValues$6={
narrow:{
am:"ДП",
pm:"ПП",
midnight:"півн.",
noon:"пол.",
morning:"ранку",
afternoon:"дня",
evening:"веч.",
night:"ночі"
},
abbreviated:{
am:"ДП",
pm:"ПП",
midnight:"півн.",
noon:"пол.",
morning:"ранку",
afternoon:"дня",
evening:"веч.",
night:"ночі"
},
wide:{
am:"ДП",
pm:"ПП",
midnight:"північ",
noon:"полудень",
morning:"ранку",
afternoon:"дня",
evening:"веч.",
night:"ночі"
}
};
var ordinalNumber$6=function ordinalNumber$6(dirtyNumber,options){
var unit=String(options===null||options===void 0?void 0:options.unit);
var number=Number(dirtyNumber);
var suffix;
if(unit==="date"){if(number===3||number===23)suffix="-є";else
suffix="-е";}else
if(unit==="minute"||unit==="second"||unit==="hour")suffix="-а";else
suffix="-й";
return number+suffix;
};
//#endregion
//#region dist/date-fns/locale/uk.js
/**
* @category Locales
* @summary Ukrainian locale.
* @language Ukrainian
* @iso-639-2 ukr
* @author Andrii Korzh [@korzhyk](https://github.com/korzhyk)
* @author Andriy Shcherbyak [@shcherbyakdev](https://github.com/shcherbyakdev)
*/
var _uk={
code:"uk",
formatDistance:formatDistance$6,
formatLong:formatLong$6,
formatRelative:formatRelative$6,
localize:{
ordinalNumber:ordinalNumber$6,
era:buildLocalizeFn({
values:eraValues$6,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$6,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$6,
defaultWidth:"wide",
formattingValues:formattingMonthValues$1,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$6,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$6,
defaultWidth:"any",
formattingValues:formattingDayPeriodValues$6,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(-?(е|й|є|а|я))?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^((до )?н\.?\s?е\.?)/i,
abbreviated:/^((до )?н\.?\s?е\.?)/i,
wide:/^(до нашої ери|нашої ери|наша ера)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^д/i,/^н/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234](-?[иі]?й?)? кв.?/i,
wide:/^[1234](-?[иі]?й?)? квартал/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[слбктчвжг]/i,
abbreviated:/^(січ|лют|бер(ез)?|квіт|трав|черв|лип|серп|вер(ес)?|жовт|лис(топ)?|груд)\.?/i,
wide:/^(січень|січня|лютий|лютого|березень|березня|квітень|квітня|травень|травня|червня|червень|липень|липня|серпень|серпня|вересень|вересня|жовтень|жовтня|листопад[а]?|грудень|грудня)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^с/i,
/^л/i,
/^б/i,
/^к/i,
/^т/i,
/^ч/i,
/^л/i,
/^с/i,
/^в/i,
/^ж/i,
/^л/i,
/^г/i],

any:[
/^сі/i,
/^лю/i,
/^б/i,
/^к/i,
/^т/i,
/^ч/i,
/^лип/i,
/^се/i,
/^в/i,
/^ж/i,
/^лис/i,
/^г/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[нпвсч]/i,
short:/^(нд|пн|вт|ср|чт|пт|сб)\.?/i,
abbreviated:/^(нед|пон|вів|сер|че?тв|птн?|суб)\.?/i,
wide:/^(неділ[яі]|понеділ[ок][ка]|вівтор[ок][ка]|серед[аи]|четвер(га)?|п\W*?ятниц[яі]|субот[аи])/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^н/i,
/^п/i,
/^в/i,
/^с/i,
/^ч/i,
/^п/i,
/^с/i],

any:[
/^н/i,
/^п[он]/i,
/^в/i,
/^с[ер]/i,
/^ч/i,
/^п\W*?[ят]/i,
/^с[уб]/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^([дп]п|півн\.?|пол\.?|ранок|ранку|день|дня|веч\.?|ніч|ночі)/i,
abbreviated:/^([дп]п|півн\.?|пол\.?|ранок|ранку|день|дня|веч\.?|ніч|ночі)/i,
wide:/^([дп]п|північ|полудень|ранок|ранку|день|дня|вечір|вечора|ніч|ночі)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^дп/i,
pm:/^пп/i,
midnight:/^півн/i,
noon:/^пол/i,
morning:/^р/i,
afternoon:/^д[ен]/i,
evening:/^в/i,
night:/^н/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/uz/_lib/formatDistance.js
var formatDistanceLocale$5={
lessThanXSeconds:{
one:"sekunddan kam",
other:"{{count}} sekunddan kam"
},
xSeconds:{
one:"1 sekund",
other:"{{count}} sekund"
},
halfAMinute:"yarim minut",
lessThanXMinutes:{
one:"bir minutdan kam",
other:"{{count}} minutdan kam"
},
xMinutes:{
one:"1 minut",
other:"{{count}} minut"
},
aboutXHours:{
one:"tahminan 1 soat",
other:"tahminan {{count}} soat"
},
xHours:{
one:"1 soat",
other:"{{count}} soat"
},
xDays:{
one:"1 kun",
other:"{{count}} kun"
},
aboutXWeeks:{
one:"tahminan 1 hafta",
other:"tahminan {{count}} hafta"
},
xWeeks:{
one:"1 hafta",
other:"{{count}} hafta"
},
aboutXMonths:{
one:"tahminan 1 oy",
other:"tahminan {{count}} oy"
},
xMonths:{
one:"1 oy",
other:"{{count}} oy"
},
aboutXYears:{
one:"tahminan 1 yil",
other:"tahminan {{count}} yil"
},
xYears:{
one:"1 yil",
other:"{{count}} yil"
},
overXYears:{
one:"1 yildan ko'p",
other:"{{count}} yildan ko'p"
},
almostXYears:{
one:"deyarli 1 yil",
other:"deyarli {{count}} yil"
}
};
var formatDistance$5=function formatDistance$5(token,count,options){
var result;
var tokenValue=formatDistanceLocale$5[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" dan keyin";else
return result+" oldin";
return result;
};
var formatLong$5={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM, y",
long:"do MMMM, y",
medium:"d MMM, y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"h:mm:ss zzzz",
long:"h:mm:ss z",
medium:"h:mm:ss",
short:"h:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}}, {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/uz/_lib/formatRelative.js
var formatRelativeLocale$5={
lastWeek:"'oldingi' eeee p 'da'",
yesterday:"'kecha' p 'da'",
today:"'bugun' p 'da'",
tomorrow:"'ertaga' p 'da'",
nextWeek:"eeee p 'da'",
other:"P"
};
var formatRelative$5=function formatRelative$5(token,_date,_baseDate,_options){return formatRelativeLocale$5[token];};
//#endregion
//#region dist/date-fns/locale/uz/_lib/localize.js
var eraValues$5={
narrow:["M.A","M."],
abbreviated:["M.A","M."],
wide:["Miloddan Avvalgi","Milodiy"]
};
var quarterValues$5={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"CH.1",
"CH.2",
"CH.3",
"CH.4"],

wide:[
"1-chi chorak",
"2-chi chorak",
"3-chi chorak",
"4-chi chorak"]

};
var monthValues$5={
narrow:[
"Y",
"F",
"M",
"A",
"M",
"I",
"I",
"A",
"S",
"O",
"N",
"D"],

abbreviated:[
"Yan",
"Fev",
"Mar",
"Apr",
"May",
"Iyun",
"Iyul",
"Avg",
"Sen",
"Okt",
"Noy",
"Dek"],

wide:[
"Yanvar",
"Fevral",
"Mart",
"Aprel",
"May",
"Iyun",
"Iyul",
"Avgust",
"Sentabr",
"Oktabr",
"Noyabr",
"Dekabr"]

};
var dayValues$5={
narrow:[
"Y",
"D",
"S",
"CH",
"P",
"J",
"SH"],

short:[
"Ya",
"Du",
"Se",
"Cho",
"Pa",
"Ju",
"Sha"],

abbreviated:[
"Yak",
"Dush",
"Sesh",
"Chor",
"Pay",
"Jum",
"Shan"],

wide:[
"Yakshanba",
"Dushanba",
"Seshanba",
"Chorshanba",
"Payshanba",
"Juma",
"Shanba"]

};
var dayPeriodValues$5={
narrow:{
am:"a",
pm:"p",
midnight:"y.t",
noon:"p.",
morning:"ertalab",
afternoon:"tushdan keyin",
evening:"kechqurun",
night:"tun"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"yarim tun",
noon:"peshin",
morning:"ertalab",
afternoon:"tushdan keyin",
evening:"kechqurun",
night:"tun"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"yarim tun",
noon:"peshin",
morning:"ertalab",
afternoon:"tushdan keyin",
evening:"kechqurun",
night:"tun"
}
};
var formattingDayPeriodValues$5={
narrow:{
am:"a",
pm:"p",
midnight:"y.t",
noon:"p.",
morning:"ertalab",
afternoon:"tushdan keyin",
evening:"kechqurun",
night:"tun"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"yarim tun",
noon:"peshin",
morning:"ertalab",
afternoon:"tushdan keyin",
evening:"kechqurun",
night:"tun"
},
wide:{
am:"a.m.",
pm:"p.m.",
midnight:"yarim tun",
noon:"peshin",
morning:"ertalab",
afternoon:"tushdan keyin",
evening:"kechqurun",
night:"tun"
}
};
var ordinalNumber$5=function ordinalNumber$5(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/uz.js
/**
* @category Locales
* @summary Uzbek locale.
* @language Uzbek
* @iso-639-2 uzb
* @author Mukhammadali [@mukhammadali](https://github.com/Mukhammadali)
*/
var _uz={
code:"uz",
formatDistance:formatDistance$5,
formatLong:formatLong$5,
formatRelative:formatRelative$5,
localize:{
ordinalNumber:ordinalNumber$5,
era:buildLocalizeFn({
values:eraValues$5,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$5,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$5,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$5,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$5,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$5,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(chi)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(m\.a|m\.)/i,
abbreviated:/^(m\.a\.?\s?m\.?)/i,
wide:/^(miloddan avval|miloddan keyin)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^b/i,/^(a|c)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^q[1234]/i,
wide:/^[1234](chi)? chorak/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[yfmasond]/i,
abbreviated:/^(yan|fev|mar|apr|may|iyun|iyul|avg|sen|okt|noy|dek)/i,
wide:/^(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^y/i,
/^f/i,
/^m/i,
/^a/i,
/^m/i,
/^i/i,
/^i/i,
/^a/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i],

any:[
/^ya/i,
/^f/i,
/^mar/i,
/^ap/i,
/^may/i,
/^iyun/i,
/^iyul/i,
/^av/i,
/^s/i,
/^o/i,
/^n/i,
/^d/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[ydschj]/i,
short:/^(ya|du|se|cho|pa|ju|sha)/i,
abbreviated:/^(yak|dush|sesh|chor|pay|jum|shan)/i,
wide:/^(yakshanba|dushanba|seshanba|chorshanba|payshanba|juma|shanba)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^y/i,
/^d/i,
/^s/i,
/^ch/i,
/^p/i,
/^j/i,
/^sh/i],

any:[
/^ya/i,
/^d/i,
/^se/i,
/^ch/i,
/^p/i,
/^j/i,
/^sh/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|y\.t|p| (ertalab|tushdan keyin|kechqurun|tun))/i,
any:/^([ap]\.?\s?m\.?|yarim tun|peshin| (ertalab|tushdan keyin|kechqurun|tun))/i
},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^a/i,
pm:/^p/i,
midnight:/^y\.t/i,
noon:/^pe/i,
morning:/ertalab/i,
afternoon:/tushdan keyin/i,
evening:/kechqurun/i,
night:/tun/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/uz-Cyrl/_lib/formatDistance.js
var formatDistanceLocale$4={
lessThanXSeconds:{
one:"1 сониядан кам",
other:"{{count}} сониядан кам"
},
xSeconds:{
one:"1 сония",
other:"{{count}} сония"
},
halfAMinute:"ярим дақиқа",
lessThanXMinutes:{
one:"1 дақиқадан кам",
other:"{{count}} дақиқадан кам"
},
xMinutes:{
one:"1 дақиқа",
other:"{{count}} дақиқа"
},
aboutXHours:{
one:"тахминан 1 соат",
other:"тахминан {{count}} соат"
},
xHours:{
one:"1 соат",
other:"{{count}} соат"
},
xDays:{
one:"1 кун",
other:"{{count}} кун"
},
aboutXWeeks:{
one:"тахминан 1 хафта",
other:"тахминан {{count}} хафта"
},
xWeeks:{
one:"1 хафта",
other:"{{count}} хафта"
},
aboutXMonths:{
one:"тахминан 1 ой",
other:"тахминан {{count}} ой"
},
xMonths:{
one:"1 ой",
other:"{{count}} ой"
},
aboutXYears:{
one:"тахминан 1 йил",
other:"тахминан {{count}} йил"
},
xYears:{
one:"1 йил",
other:"{{count}} йил"
},
overXYears:{
one:"1 йилдан кўп",
other:"{{count}} йилдан кўп"
},
almostXYears:{
one:"деярли 1 йил",
other:"деярли {{count}} йил"
}
};
var formatDistance$4=function formatDistance$4(token,count,options){
var result;
var tokenValue=formatDistanceLocale$4[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"дан кейин";else
return result+" олдин";
return result;
};
var formatLong$4={
date:buildFormatLongFn({
formats:{
full:"EEEE, do MMMM, y",
long:"do MMMM, y",
medium:"d MMM, y",
short:"dd/MM/yyyy"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"H:mm:ss zzzz",
long:"H:mm:ss z",
medium:"H:mm:ss",
short:"H:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{any:"{{date}}, {{time}}"},
defaultWidth:"any"
})
};
//#endregion
//#region dist/date-fns/locale/uz-Cyrl/_lib/formatRelative.js
var formatRelativeLocale$4={
lastWeek:"'ўтган' eeee p 'да'",
yesterday:"'кеча' p 'да'",
today:"'бугун' p 'да'",
tomorrow:"'эртага' p 'да'",
nextWeek:"eeee p 'да'",
other:"P"
};
var formatRelative$4=function formatRelative$4(token,_date,_baseDate,_options){return formatRelativeLocale$4[token];};
//#endregion
//#region dist/date-fns/locale/uz-Cyrl/_lib/localize.js
var eraValues$4={
narrow:["М.А","М"],
abbreviated:["М.А","М"],
wide:["Милоддан Аввалги","Милодий"]
};
var quarterValues$4={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"1-чор.",
"2-чор.",
"3-чор.",
"4-чор."],

wide:[
"1-чорак",
"2-чорак",
"3-чорак",
"4-чорак"]

};
var monthValues$4={
narrow:[
"Я",
"Ф",
"М",
"А",
"М",
"И",
"И",
"А",
"С",
"О",
"Н",
"Д"],

abbreviated:[
"янв",
"фев",
"мар",
"апр",
"май",
"июн",
"июл",
"авг",
"сен",
"окт",
"ноя",
"дек"],

wide:[
"январ",
"феврал",
"март",
"апрел",
"май",
"июн",
"июл",
"август",
"сентабр",
"октабр",
"ноябр",
"декабр"]

};
var dayValues$4={
narrow:[
"Я",
"Д",
"С",
"Ч",
"П",
"Ж",
"Ш"],

short:[
"як",
"ду",
"се",
"чо",
"па",
"жу",
"ша"],

abbreviated:[
"якш",
"душ",
"сеш",
"чор",
"пай",
"жум",
"шан"],

wide:[
"якшанба",
"душанба",
"сешанба",
"чоршанба",
"пайшанба",
"жума",
"шанба"]

};
var dayPeriodValues$4={any:{
am:"П.О.",
pm:"П.К.",
midnight:"ярим тун",
noon:"пешин",
morning:"эрталаб",
afternoon:"пешиндан кейин",
evening:"кечаси",
night:"тун"
}};
var formattingDayPeriodValues$4={any:{
am:"П.О.",
pm:"П.К.",
midnight:"ярим тун",
noon:"пешин",
morning:"эрталаб",
afternoon:"пешиндан кейин",
evening:"кечаси",
night:"тун"
}};
var ordinalNumber$4=function ordinalNumber$4(dirtyNumber,_options){
return String(dirtyNumber);
};
//#endregion
//#region dist/date-fns/locale/uz-Cyrl.js
/**
* @category Locales
* @summary Uzbek Cyrillic locale.
* @language Uzbek
* @iso-639-2 uzb
* @author Kamronbek Shodmonov [@kamronbek28](https://github.com/kamronbek28)
*/
var _uzCyrl={
code:"uz-Cyrl",
formatDistance:formatDistance$4,
formatLong:formatLong$4,
formatRelative:formatRelative$4,
localize:{
ordinalNumber:ordinalNumber$4,
era:buildLocalizeFn({
values:eraValues$4,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$4,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$4,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$4,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$4,
defaultWidth:"any",
formattingValues:formattingDayPeriodValues$4,
defaultFormattingWidth:"any"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)(чи)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(м\.а|м\.)/i,
abbreviated:/^(м\.а|м\.)/i,
wide:/^(милоддан аввал|милоддан кейин)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^м/i,/^а/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^[1234]-чор./i,
wide:/^[1234]-чорак/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/1/i,
/2/i,
/3/i,
/4/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^[яфмамииасонд]/i,
abbreviated:/^(янв|фев|мар|апр|май|июн|июл|авг|сен|окт|ноя|дек)/i,
wide:/^(январ|феврал|март|апрел|май|июн|июл|август|сентабр|октабр|ноябр|декабр)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^я/i,
/^ф/i,
/^м/i,
/^а/i,
/^м/i,
/^и/i,
/^и/i,
/^а/i,
/^с/i,
/^о/i,
/^н/i,
/^д/i],

any:[
/^я/i,
/^ф/i,
/^мар/i,
/^ап/i,
/^май/i,
/^июн/i,
/^июл/i,
/^ав/i,
/^с/i,
/^о/i,
/^н/i,
/^д/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[ядсчпжш]/i,
short:/^(як|ду|се|чо|па|жу|ша)/i,
abbreviated:/^(якш|душ|сеш|чор|пай|жум|шан)/i,
wide:/^(якшанба|душанба|сешанба|чоршанба|пайшанба|жума|шанба)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^я/i,
/^д/i,
/^с/i,
/^ч/i,
/^п/i,
/^ж/i,
/^ш/i],

any:[
/^як/i,
/^ду/i,
/^се/i,
/^чор/i,
/^пай/i,
/^жу/i,
/^шан/i]

},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(п\.о\.|п\.к\.|ярим тун|пешиндан кейин|(эрталаб|пешиндан кейин|кечаси|тун))/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^п\.о\./i,
pm:/^п\.к\./i,
midnight:/^ярим тун/i,
noon:/^пешиндан кейин/i,
morning:/эрталаб/i,
afternoon:/пешиндан кейин/i,
evening:/кечаси/i,
night:/тун/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/vi/_lib/formatDistance.js
var formatDistanceLocale$3={
lessThanXSeconds:{
one:"dưới 1 giây",
other:"dưới {{count}} giây"
},
xSeconds:{
one:"1 giây",
other:"{{count}} giây"
},
halfAMinute:"nửa phút",
lessThanXMinutes:{
one:"dưới 1 phút",
other:"dưới {{count}} phút"
},
xMinutes:{
one:"1 phút",
other:"{{count}} phút"
},
aboutXHours:{
one:"khoảng 1 giờ",
other:"khoảng {{count}} giờ"
},
xHours:{
one:"1 giờ",
other:"{{count}} giờ"
},
xDays:{
one:"1 ngày",
other:"{{count}} ngày"
},
aboutXWeeks:{
one:"khoảng 1 tuần",
other:"khoảng {{count}} tuần"
},
xWeeks:{
one:"1 tuần",
other:"{{count}} tuần"
},
aboutXMonths:{
one:"khoảng 1 tháng",
other:"khoảng {{count}} tháng"
},
xMonths:{
one:"1 tháng",
other:"{{count}} tháng"
},
aboutXYears:{
one:"khoảng 1 năm",
other:"khoảng {{count}} năm"
},
xYears:{
one:"1 năm",
other:"{{count}} năm"
},
overXYears:{
one:"hơn 1 năm",
other:"hơn {{count}} năm"
},
almostXYears:{
one:"gần 1 năm",
other:"gần {{count}} năm"
}
};
var formatDistance$3=function formatDistance$3(token,count,options){
var result;
var tokenValue=formatDistanceLocale$3[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+" nữa";else
return result+" trước";
return result;
};
var formatLong$3={
date:buildFormatLongFn({
formats:{
full:"EEEE, 'ngày' d MMMM 'năm' y",
long:"'ngày' d MMMM 'năm' y",
medium:"d MMM 'năm' y",
short:"dd/MM/y"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"HH:mm:ss zzzz",
long:"HH:mm:ss z",
medium:"HH:mm:ss",
short:"HH:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/vi/_lib/formatRelative.js
var formatRelativeLocale$3={
lastWeek:"eeee 'tuần trước vào lúc' p",
yesterday:"'hôm qua vào lúc' p",
today:"'hôm nay vào lúc' p",
tomorrow:"'ngày mai vào lúc' p",
nextWeek:"eeee 'tới vào lúc' p",
other:"P"
};
var formatRelative$3=function formatRelative$3(token,_date,_baseDate,_options){return formatRelativeLocale$3[token];};
//#endregion
//#region dist/date-fns/locale/vi/_lib/localize.js
var eraValues$3={
narrow:["TCN","SCN"],
abbreviated:["trước CN","sau CN"],
wide:["trước Công Nguyên","sau Công Nguyên"]
};
var quarterValues$3={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"Quý 1",
"Quý 2",
"Quý 3",
"Quý 4"]

};
var formattingQuarterValues={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"Q1",
"Q2",
"Q3",
"Q4"],

wide:[
"quý I",
"quý II",
"quý III",
"quý IV"]

};
var monthValues$3={
narrow:[
"1",
"2",
"3",
"4",
"5",
"6",
"7",
"8",
"9",
"10",
"11",
"12"],

abbreviated:[
"Thg 1",
"Thg 2",
"Thg 3",
"Thg 4",
"Thg 5",
"Thg 6",
"Thg 7",
"Thg 8",
"Thg 9",
"Thg 10",
"Thg 11",
"Thg 12"],

wide:[
"Tháng Một",
"Tháng Hai",
"Tháng Ba",
"Tháng Tư",
"Tháng Năm",
"Tháng Sáu",
"Tháng Bảy",
"Tháng Tám",
"Tháng Chín",
"Tháng Mười",
"Tháng Mười Một",
"Tháng Mười Hai"]

};
var formattingMonthValues={
narrow:[
"01",
"02",
"03",
"04",
"05",
"06",
"07",
"08",
"09",
"10",
"11",
"12"],

abbreviated:[
"thg 1",
"thg 2",
"thg 3",
"thg 4",
"thg 5",
"thg 6",
"thg 7",
"thg 8",
"thg 9",
"thg 10",
"thg 11",
"thg 12"],

wide:[
"tháng 01",
"tháng 02",
"tháng 03",
"tháng 04",
"tháng 05",
"tháng 06",
"tháng 07",
"tháng 08",
"tháng 09",
"tháng 10",
"tháng 11",
"tháng 12"]

};
var dayValues$3={
narrow:[
"CN",
"T2",
"T3",
"T4",
"T5",
"T6",
"T7"],

short:[
"CN",
"Th 2",
"Th 3",
"Th 4",
"Th 5",
"Th 6",
"Th 7"],

abbreviated:[
"CN",
"Thứ 2",
"Thứ 3",
"Thứ 4",
"Thứ 5",
"Thứ 6",
"Thứ 7"],

wide:[
"Chủ Nhật",
"Thứ Hai",
"Thứ Ba",
"Thứ Tư",
"Thứ Năm",
"Thứ Sáu",
"Thứ Bảy"]

};
var dayPeriodValues$3={
narrow:{
am:"am",
pm:"pm",
midnight:"nửa đêm",
noon:"tr",
morning:"sg",
afternoon:"ch",
evening:"tối",
night:"đêm"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"nửa đêm",
noon:"trưa",
morning:"sáng",
afternoon:"chiều",
evening:"tối",
night:"đêm"
},
wide:{
am:"SA",
pm:"CH",
midnight:"nửa đêm",
noon:"trưa",
morning:"sáng",
afternoon:"chiều",
evening:"tối",
night:"đêm"
}
};
var formattingDayPeriodValues$3={
narrow:{
am:"am",
pm:"pm",
midnight:"nửa đêm",
noon:"tr",
morning:"sg",
afternoon:"ch",
evening:"tối",
night:"đêm"
},
abbreviated:{
am:"AM",
pm:"PM",
midnight:"nửa đêm",
noon:"trưa",
morning:"sáng",
afternoon:"chiều",
evening:"tối",
night:"đêm"
},
wide:{
am:"SA",
pm:"CH",
midnight:"nửa đêm",
noon:"giữa trưa",
morning:"vào buổi sáng",
afternoon:"vào buổi chiều",
evening:"vào buổi tối",
night:"vào ban đêm"
}
};
var ordinalNumber$3=function ordinalNumber$3(dirtyNumber,options){
var number=Number(dirtyNumber);
var unit=options===null||options===void 0?void 0:options.unit;
if(unit==="quarter")switch(number){
case 1:return"I";
case 2:return"II";
case 3:return"III";
case 4:return"IV";
}else
if(unit==="day")switch(number){
case 1:return"thứ 2";
case 2:return"thứ 3";
case 3:return"thứ 4";
case 4:return"thứ 5";
case 5:return"thứ 6";
case 6:return"thứ 7";
case 7:return"chủ nhật";
}else
if(unit==="week"){if(number===1)return"thứ nhất";else
return"thứ "+number;}else
if(unit==="dayOfYear")if(number===1)return"đầu tiên";else
return"thứ "+number;
return String(number);
};
//#endregion
//#region dist/date-fns/locale/vi.js
/**
* @category Locales
* @summary Vietnamese locale (Vietnam).
* @language Vietnamese
* @iso-639-2 vie
* @author Thanh Tran [@trongthanh](https://github.com/trongthanh)
* @author Leroy Hopson [@lihop](https://github.com/lihop)
*/
var _vi={
code:"vi",
formatDistance:formatDistance$3,
formatLong:formatLong$3,
formatRelative:formatRelative$3,
localize:{
ordinalNumber:ordinalNumber$3,
era:buildLocalizeFn({
values:eraValues$3,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$3,
defaultWidth:"wide",
formattingValues:formattingQuarterValues,
defaultFormattingWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$3,
defaultWidth:"wide",
formattingValues:formattingMonthValues,
defaultFormattingWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$3,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$3,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$3,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(\d+)/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(tcn|scn)/i,
abbreviated:/^(trước CN|sau CN)/i,
wide:/^(trước Công Nguyên|sau Công Nguyên)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^t/i,/^s/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^([1234]|i{1,3}v?)/i,
abbreviated:/^q([1234]|i{1,3}v?)/i,
wide:/^quý ([1234]|i{1,3}v?)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|i)$/i,
/(2|ii)$/i,
/(3|iii)$/i,
/(4|iv)$/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(0?[2-9]|10|11|12|0?1)/i,
abbreviated:/^thg[ _]?(0?[1-9](?!\d)|10|11|12)/i,
wide:/^tháng ?(Một|Hai|Ba|Tư|Năm|Sáu|Bảy|Tám|Chín|Mười|Mười ?Một|Mười ?Hai|0?[1-9](?!\d)|10|11|12)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/0?1$/i,
/0?2/i,
/3/,
/4/,
/5/,
/6/,
/7/,
/8/,
/9/,
/10/,
/11/,
/12/],

abbreviated:[
/^thg[ _]?0?1(?!\d)/i,
/^thg[ _]?0?2/i,
/^thg[ _]?0?3/i,
/^thg[ _]?0?4/i,
/^thg[ _]?0?5/i,
/^thg[ _]?0?6/i,
/^thg[ _]?0?7/i,
/^thg[ _]?0?8/i,
/^thg[ _]?0?9/i,
/^thg[ _]?10/i,
/^thg[ _]?11/i,
/^thg[ _]?12/i],

wide:[
/^tháng ?(Một|0?1(?!\d))/i,
/^tháng ?(Hai|0?2)/i,
/^tháng ?(Ba|0?3)/i,
/^tháng ?(Tư|0?4)/i,
/^tháng ?(Năm|0?5)/i,
/^tháng ?(Sáu|0?6)/i,
/^tháng ?(Bảy|0?7)/i,
/^tháng ?(Tám|0?8)/i,
/^tháng ?(Chín|0?9)/i,
/^tháng ?(Mười|10)/i,
/^tháng ?(Mười ?Một|11)/i,
/^tháng ?(Mười ?Hai|12)/i]

},
defaultParseWidth:"wide"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^(CN|T2|T3|T4|T5|T6|T7)/i,
short:/^(CN|Th ?2|Th ?3|Th ?4|Th ?5|Th ?6|Th ?7)/i,
abbreviated:/^(CN|Th ?2|Th ?3|Th ?4|Th ?5|Th ?6|Th ?7)/i,
wide:/^(Chủ ?Nhật|Chúa ?Nhật|thứ ?Hai|thứ ?Ba|thứ ?Tư|thứ ?Năm|thứ ?Sáu|thứ ?Bảy)/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/CN/i,
/2/i,
/3/i,
/4/i,
/5/i,
/6/i,
/7/i],

short:[
/CN/i,
/2/i,
/3/i,
/4/i,
/5/i,
/6/i,
/7/i],

abbreviated:[
/CN/i,
/2/i,
/3/i,
/4/i,
/5/i,
/6/i,
/7/i],

wide:[
/(Chủ|Chúa) ?Nhật/i,
/Hai/i,
/Ba/i,
/Tư/i,
/Năm/i,
/Sáu/i,
/Bảy/i]

},
defaultParseWidth:"wide"
}),
dayPeriod:buildMatchFn({
matchPatterns:{
narrow:/^(a|p|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i,
abbreviated:/^(am|pm|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i,
wide:/^(ch[^i]*|sa|nửa đêm|trưa|(giờ) (sáng|chiều|tối|đêm))/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:{
am:/^(a|sa)/i,
pm:/^(p|ch[^i]*)/i,
midnight:/nửa đêm/i,
noon:/trưa/i,
morning:/sáng/i,
afternoon:/chiều/i,
evening:/tối/i,
night:/^đêm/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/zh-CN/_lib/formatDistance.js
var formatDistanceLocale$2={
lessThanXSeconds:{
one:"不到 1 秒",
other:"不到 {{count}} 秒"
},
xSeconds:{
one:"1 秒",
other:"{{count}} 秒"
},
halfAMinute:"半分钟",
lessThanXMinutes:{
one:"不到 1 分钟",
other:"不到 {{count}} 分钟"
},
xMinutes:{
one:"1 分钟",
other:"{{count}} 分钟"
},
xHours:{
one:"1 小时",
other:"{{count}} 小时"
},
aboutXHours:{
one:"大约 1 小时",
other:"大约 {{count}} 小时"
},
xDays:{
one:"1 天",
other:"{{count}} 天"
},
aboutXWeeks:{
one:"大约 1 个星期",
other:"大约 {{count}} 个星期"
},
xWeeks:{
one:"1 个星期",
other:"{{count}} 个星期"
},
aboutXMonths:{
one:"大约 1 个月",
other:"大约 {{count}} 个月"
},
xMonths:{
one:"1 个月",
other:"{{count}} 个月"
},
aboutXYears:{
one:"大约 1 年",
other:"大约 {{count}} 年"
},
xYears:{
one:"1 年",
other:"{{count}} 年"
},
overXYears:{
one:"超过 1 年",
other:"超过 {{count}} 年"
},
almostXYears:{
one:"将近 1 年",
other:"将近 {{count}} 年"
}
};
var formatDistance$2=function formatDistance$2(token,count,options){
var result;
var tokenValue=formatDistanceLocale$2[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"内";else
return result+"前";
return result;
};
var formatLong$2={
date:buildFormatLongFn({
formats:{
full:"y'年'M'月'd'日' EEEE",
long:"y'年'M'月'd'日'",
medium:"yyyy-MM-dd",
short:"yy-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"zzzz a h:mm:ss",
long:"z a h:mm:ss",
medium:"a h:mm:ss",
short:"a h:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/zh-CN/_lib/formatRelative.js
function checkWeek(date,baseDate,options){
var baseFormat="eeee p";
if(isSameWeek(date,baseDate,options))return baseFormat;else
if(date.getTime()>baseDate.getTime())return"'下个'eeee p";
return"'上个'eeee p";
}
var formatRelativeLocale$2={
lastWeek:checkWeek,
yesterday:"'昨天' p",
today:"'今天' p",
tomorrow:"'明天' p",
nextWeek:checkWeek,
other:"PP p"
};
var formatRelative$2=function formatRelative$2(token,date,baseDate,options){
var format=formatRelativeLocale$2[token];
if(typeof format==="function")return format(date,baseDate,options);
return format;
};
//#endregion
//#region dist/date-fns/locale/zh-CN/_lib/localize.js
var eraValues$2={
narrow:["前","公元"],
abbreviated:["前","公元"],
wide:["公元前","公元"]
};
var quarterValues$2={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"第一季",
"第二季",
"第三季",
"第四季"],

wide:[
"第一季度",
"第二季度",
"第三季度",
"第四季度"]

};
var monthValues$2={
narrow:[
"一",
"二",
"三",
"四",
"五",
"六",
"七",
"八",
"九",
"十",
"十一",
"十二"],

abbreviated:[
"1月",
"2月",
"3月",
"4月",
"5月",
"6月",
"7月",
"8月",
"9月",
"10月",
"11月",
"12月"],

wide:[
"一月",
"二月",
"三月",
"四月",
"五月",
"六月",
"七月",
"八月",
"九月",
"十月",
"十一月",
"十二月"]

};
var dayValues$2={
narrow:[
"日",
"一",
"二",
"三",
"四",
"五",
"六"],

short:[
"日",
"一",
"二",
"三",
"四",
"五",
"六"],

abbreviated:[
"周日",
"周一",
"周二",
"周三",
"周四",
"周五",
"周六"],

wide:[
"星期日",
"星期一",
"星期二",
"星期三",
"星期四",
"星期五",
"星期六"]

};
var dayPeriodValues$2={
narrow:{
am:"上",
pm:"下",
midnight:"凌晨",
noon:"午",
morning:"早",
afternoon:"下午",
evening:"晚",
night:"夜"
},
abbreviated:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜间"
},
wide:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜间"
}
};
var formattingDayPeriodValues$2={
narrow:{
am:"上",
pm:"下",
midnight:"凌晨",
noon:"午",
morning:"早",
afternoon:"下午",
evening:"晚",
night:"夜"
},
abbreviated:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜间"
},
wide:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜间"
}
};
var ordinalNumber$2=function ordinalNumber$2(dirtyNumber,options){
var number=Number(dirtyNumber);
switch(options===null||options===void 0?void 0:options.unit){
case"date":return number.toString()+"日";
case"hour":return number.toString()+"时";
case"minute":return number.toString()+"分";
case"second":return number.toString()+"秒";
default:return"第 "+number.toString();
}
};
//#endregion
//#region dist/date-fns/locale/zh-CN.js
/**
* @category Locales
* @summary Chinese Simplified locale.
* @language Chinese Simplified
* @iso-639-2 zho
* @author Changyu Geng [@KingMario](https://github.com/KingMario)
* @author Song Shuoyun [@fnlctrl](https://github.com/fnlctrl)
* @author sabrinaM [@sabrinamiao](https://github.com/sabrinamiao)
* @author Carney Wu [@cubicwork](https://github.com/cubicwork)
* @author Terrence Lam [@skyuplam](https://github.com/skyuplam)
*/
var _zhCN={
code:"zh-CN",
formatDistance:formatDistance$2,
formatLong:formatLong$2,
formatRelative:formatRelative$2,
localize:{
ordinalNumber:ordinalNumber$2,
era:buildLocalizeFn({
values:eraValues$2,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$2,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$2,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$2,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$2,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$2,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(第\s*)?\d+(日|时|分|秒)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(前)/i,
abbreviated:/^(前)/i,
wide:/^(公元前|公元)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(前)/i,/^(公元)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^第[一二三四]刻/i,
wide:/^第[一二三四]刻钟/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|一)/i,
/(2|二)/i,
/(3|三)/i,
/(4|四)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(一|二|三|四|五|六|七|八|九|十[二一]?)/i,
abbreviated:/^(一|二|三|四|五|六|七|八|九|十[二一]?|\d|1[0-2])月/i,
wide:/^(一|二|三|四|五|六|七|八|九|十[二一]?)月/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^一/i,
/^二/i,
/^三/i,
/^四/i,
/^五/i,
/^六/i,
/^七/i,
/^八/i,
/^九/i,
/^十(?!(一|二))/i,
/^十一/i,
/^十二/i],

any:[
/^(一|1(?!\d))/i,
/^(二|2)/i,
/^(三|3)/i,
/^(四|4)/i,
/^(五|5)/i,
/^(六|6)/i,
/^(七|7)/i,
/^(八|8)/i,
/^(九|9)/i,
/^(十(?!(一|二))|10)/i,
/^(十一|11)/i,
/^(十二|12)/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[一二三四五六日]/i,
short:/^[一二三四五六日]/i,
abbreviated:/^周[一二三四五六日]/i,
wide:/^星期[一二三四五六日]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/日/i,
/一/i,
/二/i,
/三/i,
/四/i,
/五/i,
/六/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(上午?|下午?|午夜|[中正]午|早上?|下午|晚上?|凌晨|)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^上午?/i,
pm:/^下午?/i,
midnight:/^午夜/i,
noon:/^[中正]午/i,
morning:/^早上/i,
afternoon:/^下午/i,
evening:/^晚上?/i,
night:/^凌晨/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale/zh-HK/_lib/formatDistance.js
var formatDistanceLocale$1={
lessThanXSeconds:{
one:"少於 1 秒",
other:"少於 {{count}} 秒"
},
xSeconds:{
one:"1 秒",
other:"{{count}} 秒"
},
halfAMinute:"半分鐘",
lessThanXMinutes:{
one:"少於 1 分鐘",
other:"少於 {{count}} 分鐘"
},
xMinutes:{
one:"1 分鐘",
other:"{{count}} 分鐘"
},
xHours:{
one:"1 小時",
other:"{{count}} 小時"
},
aboutXHours:{
one:"大約 1 小時",
other:"大約 {{count}} 小時"
},
xDays:{
one:"1 天",
other:"{{count}} 天"
},
aboutXWeeks:{
one:"大約 1 個星期",
other:"大約 {{count}} 個星期"
},
xWeeks:{
one:"1 個星期",
other:"{{count}} 個星期"
},
aboutXMonths:{
one:"大約 1 個月",
other:"大約 {{count}} 個月"
},
xMonths:{
one:"1 個月",
other:"{{count}} 個月"
},
aboutXYears:{
one:"大約 1 年",
other:"大約 {{count}} 年"
},
xYears:{
one:"1 年",
other:"{{count}} 年"
},
overXYears:{
one:"超過 1 年",
other:"超過 {{count}} 年"
},
almostXYears:{
one:"將近 1 年",
other:"將近 {{count}} 年"
}
};
var formatDistance$1=function formatDistance$1(token,count,options){
var result;
var tokenValue=formatDistanceLocale$1[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"內";else
return result+"前";
return result;
};
var formatLong$1={
date:buildFormatLongFn({
formats:{
full:"y'年'M'月'd'日' EEEE",
long:"y'年'M'月'd'日'",
medium:"yyyy-MM-dd",
short:"yy-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"zzzz a h:mm:ss",
long:"z a h:mm:ss",
medium:"a h:mm:ss",
short:"a h:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/zh-HK/_lib/formatRelative.js
var formatRelativeLocale$1={
lastWeek:"'上個'eeee p",
yesterday:"'昨天' p",
today:"'今天' p",
tomorrow:"'明天' p",
nextWeek:"'下個'eeee p",
other:"P"
};
var formatRelative$1=function formatRelative$1(token,_date,_baseDate,_options){return formatRelativeLocale$1[token];};
//#endregion
//#region dist/date-fns/locale/zh-HK/_lib/localize.js
var eraValues$1={
narrow:["前","公元"],
abbreviated:["前","公元"],
wide:["公元前","公元"]
};
var quarterValues$1={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"第一季",
"第二季",
"第三季",
"第四季"],

wide:[
"第一季度",
"第二季度",
"第三季度",
"第四季度"]

};
var monthValues$1={
narrow:[
"一",
"二",
"三",
"四",
"五",
"六",
"七",
"八",
"九",
"十",
"十一",
"十二"],

abbreviated:[
"1月",
"2月",
"3月",
"4月",
"5月",
"6月",
"7月",
"8月",
"9月",
"10月",
"11月",
"12月"],

wide:[
"一月",
"二月",
"三月",
"四月",
"五月",
"六月",
"七月",
"八月",
"九月",
"十月",
"十一月",
"十二月"]

};
var dayValues$1={
narrow:[
"日",
"一",
"二",
"三",
"四",
"五",
"六"],

short:[
"日",
"一",
"二",
"三",
"四",
"五",
"六"],

abbreviated:[
"週日",
"週一",
"週二",
"週三",
"週四",
"週五",
"週六"],

wide:[
"星期日",
"星期一",
"星期二",
"星期三",
"星期四",
"星期五",
"星期六"]

};
var dayPeriodValues$1={
narrow:{
am:"上",
pm:"下",
midnight:"午夜",
noon:"晌",
morning:"早",
afternoon:"午",
evening:"晚",
night:"夜"
},
abbreviated:{
am:"上午",
pm:"下午",
midnight:"午夜",
noon:"中午",
morning:"上午",
afternoon:"下午",
evening:"晚上",
night:"夜晚"
},
wide:{
am:"上午",
pm:"下午",
midnight:"午夜",
noon:"中午",
morning:"上午",
afternoon:"下午",
evening:"晚上",
night:"夜晚"
}
};
var formattingDayPeriodValues$1={
narrow:{
am:"上",
pm:"下",
midnight:"午夜",
noon:"晌",
morning:"早",
afternoon:"午",
evening:"晚",
night:"夜"
},
abbreviated:{
am:"上午",
pm:"下午",
midnight:"午夜",
noon:"中午",
morning:"上午",
afternoon:"下午",
evening:"晚上",
night:"夜晚"
},
wide:{
am:"上午",
pm:"下午",
midnight:"午夜",
noon:"中午",
morning:"上午",
afternoon:"下午",
evening:"晚上",
night:"夜晚"
}
};
var ordinalNumber$1=function ordinalNumber$1(dirtyNumber,options){
var number=Number(dirtyNumber);
switch(options===null||options===void 0?void 0:options.unit){
case"date":return number+"日";
case"hour":return number+"時";
case"minute":return number+"分";
case"second":return number+"秒";
default:return"第 "+number;
}
};
//#endregion
//#region dist/date-fns/locale/zh-HK.js
/**
* @category Locales
* @summary Chinese Traditional locale.
* @language Chinese Traditional
* @iso-639-2 zho
* @author Gary Ip [@gaplo](https://github.com/gaplo)
*/
var _zhHK={
code:"zh-HK",
formatDistance:formatDistance$1,
formatLong:formatLong$1,
formatRelative:formatRelative$1,
localize:{
ordinalNumber:ordinalNumber$1,
era:buildLocalizeFn({
values:eraValues$1,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues$1,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues$1,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues$1,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues$1,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues$1,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(第\s*)?\d+(日|時|分|秒)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(前)/i,
abbreviated:/^(前)/i,
wide:/^(公元前|公元)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(前)/i,/^(公元)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^第[一二三四]季/i,
wide:/^第[一二三四]季度/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|一)/i,
/(2|二)/i,
/(3|三)/i,
/(4|四)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(一|二|三|四|五|六|七|八|九|十[二一]?)/i,
abbreviated:/^(一|二|三|四|五|六|七|八|九|十[二一]?|\d|1[0-2])月/i,
wide:/^(一|二|三|四|五|六|七|八|九|十[二一]?)月/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^一/i,
/^二/i,
/^三/i,
/^四/i,
/^五/i,
/^六/i,
/^七/i,
/^八/i,
/^九/i,
/^十(?!(一|二))/i,
/^十一/i,
/^十二/i],

any:[
/^(一|1(?!\d))/i,
/^(二|2)/i,
/^(三|3)/i,
/^(四|4)/i,
/^(五|5)/i,
/^(六|6)/i,
/^(七|7)/i,
/^(八|8)/i,
/^(九|9)/i,
/^(十(?!(一|二))|10)/i,
/^(十一|11)/i,
/^(十二|12)/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[一二三四五六日]/i,
short:/^[一二三四五六日]/i,
abbreviated:/^週[一二三四五六日]/i,
wide:/^星期[一二三四五六日]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/日/i,
/一/i,
/二/i,
/三/i,
/四/i,
/五/i,
/六/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(上午?|下午?|午夜|[中正]午|早上?|下午|晚上?|凌晨)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^上午?/i,
pm:/^下午?/i,
midnight:/^午夜/i,
noon:/^[中正]午/i,
morning:/^早上/i,
afternoon:/^下午/i,
evening:/^晚上?/i,
night:/^凌晨/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:0,
firstWeekContainsDate:1
}
};
//#endregion
//#region dist/date-fns/locale/zh-TW/_lib/formatDistance.js
var formatDistanceLocale={
lessThanXSeconds:{
one:"少於 1 秒",
other:"少於 {{count}} 秒"
},
xSeconds:{
one:"1 秒",
other:"{{count}} 秒"
},
halfAMinute:"半分鐘",
lessThanXMinutes:{
one:"少於 1 分鐘",
other:"少於 {{count}} 分鐘"
},
xMinutes:{
one:"1 分鐘",
other:"{{count}} 分鐘"
},
xHours:{
one:"1 小時",
other:"{{count}} 小時"
},
aboutXHours:{
one:"大約 1 小時",
other:"大約 {{count}} 小時"
},
xDays:{
one:"1 天",
other:"{{count}} 天"
},
aboutXWeeks:{
one:"大約 1 個星期",
other:"大約 {{count}} 個星期"
},
xWeeks:{
one:"1 個星期",
other:"{{count}} 個星期"
},
aboutXMonths:{
one:"大約 1 個月",
other:"大約 {{count}} 個月"
},
xMonths:{
one:"1 個月",
other:"{{count}} 個月"
},
aboutXYears:{
one:"大約 1 年",
other:"大約 {{count}} 年"
},
xYears:{
one:"1 年",
other:"{{count}} 年"
},
overXYears:{
one:"超過 1 年",
other:"超過 {{count}} 年"
},
almostXYears:{
one:"將近 1 年",
other:"將近 {{count}} 年"
}
};
var formatDistance=function formatDistance(token,count,options){
var result;
var tokenValue=formatDistanceLocale[token];
if(typeof tokenValue==="string")result=tokenValue;else
if(count===1)result=tokenValue.one;else
result=tokenValue.other.replace("{{count}}",String(count));
if(options!==null&&options!==void 0&&options.addSuffix)if(options.comparison&&options.comparison>0)return result+"內";else
return result+"前";
return result;
};
var formatLong={
date:buildFormatLongFn({
formats:{
full:"y'年'M'月'd'日' EEEE",
long:"y'年'M'月'd'日'",
medium:"yyyy-MM-dd",
short:"yy-MM-dd"
},
defaultWidth:"full"
}),
time:buildFormatLongFn({
formats:{
full:"zzzz a h:mm:ss",
long:"z a h:mm:ss",
medium:"a h:mm:ss",
short:"a h:mm"
},
defaultWidth:"full"
}),
dateTime:buildFormatLongFn({
formats:{
full:"{{date}} {{time}}",
long:"{{date}} {{time}}",
medium:"{{date}} {{time}}",
short:"{{date}} {{time}}"
},
defaultWidth:"full"
})
};
//#endregion
//#region dist/date-fns/locale/zh-TW/_lib/formatRelative.js
var formatRelativeLocale={
lastWeek:"'上個'eeee p",
yesterday:"'昨天' p",
today:"'今天' p",
tomorrow:"'明天' p",
nextWeek:"'下個'eeee p",
other:"P"
};
var formatRelative=function formatRelative(token,_date,_baseDate,_options){return formatRelativeLocale[token];};
//#endregion
//#region dist/date-fns/locale/zh-TW/_lib/localize.js
var eraValues={
narrow:["前","公元"],
abbreviated:["前","公元"],
wide:["公元前","公元"]
};
var quarterValues={
narrow:[
"1",
"2",
"3",
"4"],

abbreviated:[
"第一刻",
"第二刻",
"第三刻",
"第四刻"],

wide:[
"第一刻鐘",
"第二刻鐘",
"第三刻鐘",
"第四刻鐘"]

};
var monthValues={
narrow:[
"一",
"二",
"三",
"四",
"五",
"六",
"七",
"八",
"九",
"十",
"十一",
"十二"],

abbreviated:[
"1月",
"2月",
"3月",
"4月",
"5月",
"6月",
"7月",
"8月",
"9月",
"10月",
"11月",
"12月"],

wide:[
"一月",
"二月",
"三月",
"四月",
"五月",
"六月",
"七月",
"八月",
"九月",
"十月",
"十一月",
"十二月"]

};
var dayValues={
narrow:[
"日",
"一",
"二",
"三",
"四",
"五",
"六"],

short:[
"日",
"一",
"二",
"三",
"四",
"五",
"六"],

abbreviated:[
"週日",
"週一",
"週二",
"週三",
"週四",
"週五",
"週六"],

wide:[
"星期日",
"星期一",
"星期二",
"星期三",
"星期四",
"星期五",
"星期六"]

};
var dayPeriodValues={
narrow:{
am:"上",
pm:"下",
midnight:"凌晨",
noon:"午",
morning:"早",
afternoon:"下午",
evening:"晚",
night:"夜"
},
abbreviated:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜間"
},
wide:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜間"
}
};
var formattingDayPeriodValues={
narrow:{
am:"上",
pm:"下",
midnight:"凌晨",
noon:"午",
morning:"早",
afternoon:"下午",
evening:"晚",
night:"夜"
},
abbreviated:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜間"
},
wide:{
am:"上午",
pm:"下午",
midnight:"凌晨",
noon:"中午",
morning:"早晨",
afternoon:"中午",
evening:"晚上",
night:"夜間"
}
};
var ordinalNumber=function ordinalNumber(dirtyNumber,options){
var number=Number(dirtyNumber);
switch(options===null||options===void 0?void 0:options.unit){
case"date":return number+"日";
case"hour":return number+"時";
case"minute":return number+"分";
case"second":return number+"秒";
default:return"第 "+number;
}
};
//#endregion
//#region dist/date-fns/locale/zh-TW.js
/**
* @category Locales
* @summary Chinese Traditional locale.
* @language Chinese Traditional
* @iso-639-2 zho
* @author tonypai [@tpai](https://github.com/tpai)
* @author Jack Hsu [@jackhsu978](https://github.com/jackhsu978)
* @author Terrence Lam [@skyuplam](https://github.com/skyuplam)
*/
var _zhTW={
code:"zh-TW",
formatDistance:formatDistance,
formatLong:formatLong,
formatRelative:formatRelative,
localize:{
ordinalNumber:ordinalNumber,
era:buildLocalizeFn({
values:eraValues,
defaultWidth:"wide"
}),
quarter:buildLocalizeFn({
values:quarterValues,
defaultWidth:"wide",
argumentCallback:function argumentCallback(quarter){return quarter-1;}
}),
month:buildLocalizeFn({
values:monthValues,
defaultWidth:"wide"
}),
day:buildLocalizeFn({
values:dayValues,
defaultWidth:"wide"
}),
dayPeriod:buildLocalizeFn({
values:dayPeriodValues,
defaultWidth:"wide",
formattingValues:formattingDayPeriodValues,
defaultFormattingWidth:"wide"
})
},
match:{
ordinalNumber:buildMatchPatternFn({
matchPattern:/^(第\s*)?\d+(日|時|分|秒)?/i,
parsePattern:/\d+/i,
valueCallback:function valueCallback(value){return parseInt(value,10);}
}),
era:buildMatchFn({
matchPatterns:{
narrow:/^(前)/i,
abbreviated:/^(前)/i,
wide:/^(公元前|公元)/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[/^(前)/i,/^(公元)/i]},
defaultParseWidth:"any"
}),
quarter:buildMatchFn({
matchPatterns:{
narrow:/^[1234]/i,
abbreviated:/^第[一二三四]刻/i,
wide:/^第[一二三四]刻鐘/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/(1|一)/i,
/(2|二)/i,
/(3|三)/i,
/(4|四)/i]
},
defaultParseWidth:"any",
valueCallback:function valueCallback(index){return index+1;}
}),
month:buildMatchFn({
matchPatterns:{
narrow:/^(一|二|三|四|五|六|七|八|九|十[二一]?)/i,
abbreviated:/^(一|二|三|四|五|六|七|八|九|十[二一]?|\d|1[0-2])月/i,
wide:/^(一|二|三|四|五|六|七|八|九|十[二一]?)月/i
},
defaultMatchWidth:"wide",
parsePatterns:{
narrow:[
/^一/i,
/^二/i,
/^三/i,
/^四/i,
/^五/i,
/^六/i,
/^七/i,
/^八/i,
/^九/i,
/^十(?!(一|二))/i,
/^十一/i,
/^十二/i],

any:[
/^(一|1(?!\d))/i,
/^(二|2)/i,
/^(三|3)/i,
/^(四|4)/i,
/^(五|5)/i,
/^(六|6)/i,
/^(七|7)/i,
/^(八|8)/i,
/^(九|9)/i,
/^(十(?!(一|二))|10)/i,
/^(十一|11)/i,
/^(十二|12)/i]

},
defaultParseWidth:"any"
}),
day:buildMatchFn({
matchPatterns:{
narrow:/^[一二三四五六日]/i,
short:/^[一二三四五六日]/i,
abbreviated:/^週[一二三四五六日]/i,
wide:/^星期[一二三四五六日]/i
},
defaultMatchWidth:"wide",
parsePatterns:{any:[
/日/i,
/一/i,
/二/i,
/三/i,
/四/i,
/五/i,
/六/i]
},
defaultParseWidth:"any"
}),
dayPeriod:buildMatchFn({
matchPatterns:{any:/^(上午?|下午?|午夜|[中正]午|早上?|下午|晚上?|凌晨)/i},
defaultMatchWidth:"any",
parsePatterns:{any:{
am:/^上午?/i,
pm:/^下午?/i,
midnight:/^午夜/i,
noon:/^[中正]午/i,
morning:/^早上/i,
afternoon:/^下午/i,
evening:/^晚上?/i,
night:/^凌晨/i
}},
defaultParseWidth:"any"
})
},
options:{
weekStartsOn:1,
firstWeekContainsDate:4
}
};
//#endregion
//#region dist/date-fns/locale.js
var locale_exports=/* @__PURE__ */__exportAll({
af:function af(){return _af;},
ar:function ar(){return _ar;},
arDZ:function arDZ(){return _arDZ;},
arEG:function arEG(){return _arEG;},
arMA:function arMA(){return _arMA;},
arSA:function arSA(){return _arSA;},
arTN:function arTN(){return _arTN;},
az:function az(){return _az;},
be:function be(){return _be;},
beTarask:function beTarask(){return _beTarask;},
bg:function bg(){return _bg;},
bn:function bn(){return _bn;},
bs:function bs(){return _bs;},
ca:function ca(){return _ca;},
ckb:function ckb(){return _ckb;},
cs:function cs(){return _cs;},
cy:function cy(){return _cy;},
da:function da(){return _da;},
de:function de(){return _de;},
deAT:function deAT(){return _deAT;},
el:function el(){return _el;},
enAU:function enAU(){return _enAU;},
enCA:function enCA(){return _enCA;},
enGB:function enGB(){return _enGB;},
enIE:function enIE(){return _enIE;},
enIN:function enIN(){return _enIN;},
enNZ:function enNZ(){return _enNZ;},
enUS:function enUS(){return _enUS;},
enZA:function enZA(){return _enZA;},
eo:function eo(){return _eo;},
es:function es(){return _es;},
et:function et(){return _et;},
eu:function eu(){return _eu;},
faIR:function faIR(){return _faIR;},
fi:function fi(){return _fi;},
fr:function fr(){return _fr;},
frCA:function frCA(){return _frCA;},
frCH:function frCH(){return _frCH;},
fy:function fy(){return _fy;},
gd:function gd(){return _gd;},
gl:function gl(){return _gl;},
gu:function gu(){return _gu;},
he:function he(){return _he;},
hi:function hi(){return _hi;},
hr:function hr(){return _hr;},
ht:function ht(){return _ht;},
hu:function hu(){return _hu;},
hy:function hy(){return _hy;},
id:function id(){return _id;},
is:function is(){return _is;},
it:function it(){return _it;},
itCH:function itCH(){return _itCH;},
ja:function ja(){return _ja;},
jaHira:function jaHira(){return _jaHira;},
ka:function ka(){return _ka;},
kk:function kk(){return _kk;},
km:function km(){return _km;},
kn:function kn(){return _kn;},
ko:function ko(){return _ko;},
lb:function lb(){return _lb;},
lt:function lt(){return _lt;},
lv:function lv(){return _lv;},
mk:function mk(){return _mk;},
mn:function mn(){return _mn;},
ms:function ms(){return _ms;},
mt:function mt(){return _mt;},
nb:function nb(){return _nb;},
nl:function nl(){return _nl;},
nlBE:function nlBE(){return _nlBE;},
nn:function nn(){return _nn;},
oc:function oc(){return _oc;},
pl:function pl(){return _pl;},
pt:function pt(){return _pt;},
ptBR:function ptBR(){return _ptBR;},
ro:function ro(){return _ro;},
ru:function ru(){return _ru;},
se:function se(){return _se;},
sk:function sk(){return _sk;},
sl:function sl(){return _sl;},
sq:function sq(){return _sq;},
sr:function sr(){return _sr;},
srLatn:function srLatn(){return _srLatn;},
sv:function sv(){return _sv;},
ta:function ta(){return _ta;},
te:function te(){return _te;},
th:function th(){return _th;},
tr:function tr(){return _tr;},
ug:function ug(){return _ug;},
uk:function uk(){return _uk;},
uz:function uz(){return _uz;},
uzCyrl:function uzCyrl(){return _uzCyrl;},
vi:function vi(){return _vi;},
zhCN:function zhCN(){return _zhCN;},
zhHK:function zhHK(){return _zhHK;},
zhTW:function zhTW(){return _zhTW;}
});
//#endregion
//#region dist/date-fns/_entries/locale/cdn.js
window.dateFns=_objectSpread(_objectSpread({},
window.dateFns),{},{
locale:_objectSpread(_objectSpread({},(_window$dateFns=
window.dateFns)===null||_window$dateFns===void 0?void 0:_window$dateFns.locale),
locale_exports)});


//#endregion

console.log("date-fns CDN files have moved to @date-fns/cdn. Please update your URLs. See: https://date-fns.org/docs/CDN");
})();