// MultiExporter.jsx
// Version 0.1
// Version 0.2 Adds PNG and EPS exports
// Version 0.3 Adds support for exporting at different resolutions
// Version 0.4 Adds support for SVG, changed EPS behaviour to minimise output filesize
// Version 0.5 Fixed cropping issues
// Version 0.6 Added inner padding mode to prevent circular bounds clipping
//
// Copyright 2013 Tom Byrne
// Comments or suggestions to tom@tbyrne.org
// 
// Copyright 2011 Matthew Ericson


var docRef = app.activeDocument;	





	
// Format specific functionality
getPng8Options = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	var options = new ExportOptionsPNG8();
	options.antiAliasing = true;
	options.transparency = transparency; 
	options.artBoardClipping = true;
	options.horizontalScale = scaling;
	options.verticalScale = scaling;
	return options;
}
getPng24Options = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	var options = new ExportOptionsPNG24();
	options.antiAliasing = true;
	options.transparency = transparency; 
	options.artBoardClipping = true;
	options.horizontalScale = scaling;
	options.verticalScale = scaling;	
	return options;
}
getPdfOptions = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	var options = new PDFSaveOptions();
	options.compatibility = PDFCompatibility.ACROBAT5;
	options.generateThumbnails = true;
	options.preserveEditability = false;
	return options;
}
getJpgOptions = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	var options = new ExportOptionsJPEG();
	options.antiAliasing = true;
	options.artBoardClipping = true;
	options.horizontalScale = scaling;
	options.verticalScale = scaling;	
	return options;
}
getEpsOptions = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	var options = new EPSSaveOptions();
	options.embedLinkedFiles = embedImage;
	options.embedAllFonts = embedFont;
	options.includeDocumentThumbnails = true;
	options.saveMultipleArtboards = false;
	return options;
}
getSvgOptions = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	options = new ExportOptionsSVG();
	options.embedRasterImages = embedImage;
	return options;
}
getFxg1Options = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	options = new FXGSaveOptions();
	options.version = FXGVersion.VERSION1PT0;
	return options;
}
getFxg2Options = function ( transparency, scaling, embedImage, embedFont, trimEdges ) {
	options = new FXGSaveOptions();
	options.version = FXGVersion.VERSION2PT0;
	return options;
}

// Format specific save functions
savePng8 = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.png' );
	doc.exportFile(destFile, ExportType.PNG8 , options);
}
savePng24 = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.png' );
	doc.exportFile(destFile, ExportType.PNG24 , options);
}
savePdf = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.pdf' );   
	options.artboardRange = (artboardIndex+1).toString();
	doc.saveAs( destFile, options, artboardIndex, artboardName )
}
saveJpg = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.jpg' );
	doc.exportFile(destFile, ExportType.JPEG , options);
}
saveEps = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.eps' );
	options.artboardRange = (artboardIndex+1).toString();
	doc.saveAs( destFile, options, artboardIndex, artboardName )			
}
saveSvg = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.svg' );
	doc.exportFile(destFile, ExportType.SVG , options);
}
saveFxg = function ( doc, filePath, options, artboardIndex, artboardName ) {
	var destFile = new File( filePath + '.fxg' );
	options.artboardRange = (artboardIndex+1).toString();
	doc.saveAs( destFile, options, artboardIndex, artboardName )	
}




var multi_exporter = {

	PREFS_LAYER_NAME: "nyt_exporter_info",
	
	multiExporterPrefs:   null,
	
	prefix:		 '',
	suffix:		 '',
	base_path:	  '~/Desktop',
	transparency:   false,
	embedImage:   true,
	embedFont:   true,
	trimEdges:   true,
	innerPadding:   false,
	ignoreWarnings:   false,
	
	format:		 "PNG 24",
	artboards:	null,
	layers:	null,
	
	dlg:			null,
	prefs_xml:	  null,

	currentFormatInfo: null,
	
	num_to_export:  0,
	
	failed_artboards:  null,
	failed_layers:  null,

	export_artboards: null, 
	export_layers: null, 
	whole_artboard_mode: false, 

	formatList:null,
	artboardList:null,
	progLabel:null,

	// these are controls that are format dependant
	controlNames:["scalingInput","transCheckBox","embedImageCheckBox","embedFontCheckBox","trimEdgesCheckBox","innerPaddingCheckBox"],
	scalingInput:null,
	transCheckBox:null,
	embedImageCheckBox:null,
	embedFontCheckBox:null,
	trimEdgesCheckBox:null,
	ignoreCheckBox:null,
	exportArtboardsCheckBox:null,

	// copyBehaviour - for vector outputs the output must be done from a copy of the document (to avoid hidden layers being included in output)
	formatInfo: [   {name:"PNG 8", copyBehaviour:false, pixelDocSize:true, getOptions:getPng8Options, saveFile:savePng8, activeControls:["scalingInput","transCheckBox","trimEdgesCheckBox","innerPaddingCheckBox"]},
					{name:"PNG 24", copyBehaviour:false, pixelDocSize:true, getOptions:getPng24Options, saveFile:savePng24, activeControls:["scalingInput","transCheckBox","trimEdgesCheckBox","innerPaddingCheckBox"]},
					{name:"PDF", copyBehaviour:false, pixelDocSize:false, getOptions:getPdfOptions, saveFile:savePdf, activeControls:["trimEdgesCheckBox"]},
					{name:"JPG", copyBehaviour:false, pixelDocSize:true, getOptions:getJpgOptions, saveFile:saveJpg, activeControls:["scalingInput","trimEdgesCheckBox","innerPaddingCheckBox"]},
					{name:"EPS", copyBehaviour:true, pixelDocSize:false, getOptions:getEpsOptions, saveFile:saveEps, activeControls:["embedImageCheckBox","embedFontCheckBox","trimEdgesCheckBox"]},
					{name:"SVG", copyBehaviour:true, pixelDocSize:false, getOptions:getSvgOptions, saveFile:saveSvg, activeControls:["embedImageCheckBox","trimEdgesCheckBox"]},
					{name:"FXG 1.0", copyBehaviour:true, pixelDocSize:false, getOptions:getFxg1Options, saveFile:saveFxg, activeControls:["trimEdgesCheckBox"]},
					{name:"FXG 2.0", copyBehaviour:true, pixelDocSize:false, getOptions:getFxg2Options, saveFile:saveFxg, activeControls:["trimEdgesCheckBox"]}],

	artboardSelect: [   {code:"all", name:'All Artboards (except those beginning with - )'},
						{code:"current", name:'Current Artboard'},
						{name:'---'} ],

	layerSelect: [  {code:"all", name:'All Layers (except those beginning with - )'},
					{code:"none", name:'None (for use with \'Export Artboard Images\')'},
					{code:"selected", name:'Selected Items\' Layers'},
					{name:'---'} ],

	init: function() {
		
		var parse_success = this.load_prefs();	
		
		if (parse_success) {
			this.show_dialog();
		}
	},

	findExportTypeByCode: function(code){
		for(var i=0; i<this.exportTypes.length; ++i){
			var type = this.exportTypes[i];
			if(type.code==code)return type;
		}
	},
	
	load_prefs: function() {
	
		var parse_success = false;
		
		// find existing layers or add new one
		try {
			this.multiExporterPrefs = docRef.layers.getByName( this.PREFS_LAYER_NAME );

		} catch ( e ) {
			
			this.multiExporterPrefs = docRef.layers.add();
			this.multiExporterPrefs.name = this.PREFS_LAYER_NAME;
			
			var nyt_exporter_info_xml = this.multiExporterPrefs.textFrames.add();
			
			var saved_data = new XML( '<nyt_prefs></nyt_prefs>' );
			saved_data.appendChild( new XML('<nyt_prefix></nyt_prefix>') );
			saved_data.appendChild( new XML('<nyt_suffix></nyt_suffix>') );
			saved_data.appendChild( new XML('<nyt_base_path>~/Desktop</nyt_base_path>') );
			saved_data.appendChild( new XML('<nyt_scaling>100%</nyt_scaling>') );
			saved_data.appendChild( new XML('<nyt_transparency>true</nyt_transparency>') );
			saved_data.appendChild( new XML('<nyt_embedImage>true</nyt_embedImage>') );
			saved_data.appendChild( new XML('<nyt_embedFont>true</nyt_embedFont>') );
			saved_data.appendChild( new XML('<nyt_trimEdges>true</nyt_trimEdges>') );
			saved_data.appendChild( new XML('<nyt_innerPadding>false</nyt_innerPadding>') );
			saved_data.appendChild( new XML('<nyt_format>PNG 24</nyt_format>') );
			saved_data.appendChild( new XML('<nyt_artboards>all</nyt_artboards>') );
			saved_data.appendChild( new XML('<nyt_layers>all</nyt_layers>') );
			saved_data.appendChild( new XML('<nyt_exportArtboards>false</nyt_exportArtboards>') );
			saved_data.appendChild( new XML('<nyt_ignoreWarnings>false</nyt_ignoreWarnings>') );
			
			nyt_exporter_info_xml.contents = saved_data.toXMLString();	
			
			this.multiExporterPrefs.printable = false;
			this.multiExporterPrefs.visible = false;
		}
		
		
		// get xml out of the 1 text item on that layer and parse it
		if ( this.multiExporterPrefs.textFrames.length != 1 ) {
			Window.alert( 'Please delete the '+this.PREFS_LAYER_NAME+' layer and try again.' );
			
		} else {	 
			
			try {
				this.prefs_xml		= new XML( this.multiExporterPrefs.textFrames[0].contents );
				this.prefix			= this.prefs_xml.nyt_prefix;
				this.suffix			= this.prefs_xml.nyt_suffix;
				this.base_path		= this.prefs_xml.nyt_base_path;
				this.scaling 		= this.prefs_xml.nyt_scaling;
				this.transparency	= this.prefs_xml.nyt_transparency == "true" ? true : false;
				this.embedImage	    = this.prefs_xml.nyt_embedImage == "true" ? true : false;
				this.ignoreWarnings = this.prefs_xml.nyt_ignoreWarnings == "true" ? true : false;
				this.embedFont	    = this.prefs_xml.nyt_embedFont == "true" ? true : false;
				this.trimEdges	    = this.prefs_xml.nyt_trimEdges == "true" ? true : false;
				this.innerPadding   = this.prefs_xml.nyt_innerPadding == "true" ? true : false;
				this.format		    = this.prefs_xml.nyt_format;
				this.artboards		= this.prefs_xml.nyt_artboards.toString();
				this.layers	        = this.prefs_xml.nyt_layers.toString();
				this.whole_artboard_mode = this.prefs_xml.nyt_exportArtboards == "true" ? true : false;

				if(!this.artboards){
					this.artboards = this.artboardSelect[0].code;
				}else if(parseInt(this.artboards).toString()==this.artboards){
					this.artboards = parseInt(this.artboards);
				}
				if(!this.layers){
					this.layers = this.layerSelect[0].code;
				}else if(parseInt(this.layers).toString()==this.layers){
					this.layers = parseInt(this.layers);
				}
				
				if ( ! this.prefs_xml.nyt_scaling || this.prefs_xml.nyt_scaling == '' ) {
				   this.scaling = '100%';
				} 
				parse_success = true;
			
			} catch ( e ) {
				Window.alert( 'Please delete the this.multiExporterPrefs layer and try again.' );
			}
			
		}
		
		return parse_success;
	},

	
	// dialog display
	show_dialog: function() {
		
		// Export dialog
		this.dlg = new Window('dialog', 'Multi Exporter');
		
		var row;

		// ARTBOARD TYPE ROW
		
		row = this.dlg.add('group', undefined, '')
		row.oreintation = 'row';
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

		var typeSt = row.add('statictext', undefined, 'Export artboards:'); 
		typeSt.size = [ 100,20 ];	
		
		var artboardNames = [];
		for(var i=0; i<this.artboardSelect.length; ++i){
			artboardNames.push(this.artboardSelect[i].name)
		}
		for(var i=0; i<docRef.artboards.length; i++){
			var artboard = docRef.artboards[i];
			artboardNames.push((i+1)+": "+artboard.name);
		}

		this.artboardList = row.add('dropdownlist', undefined, artboardNames);
		this.artboardList.selection = this.findDataIndex(this.artboards, this.artboardSelect);
		
		this.exportArtboardsCheckBox = row.add('checkbox', undefined, 'Export Artboard Images');
		this.exportArtboardsCheckBox.value = this.whole_artboard_mode;

		// LAYER TYPE ROW
		
		row = this.dlg.add('group', undefined, '')
		row.oreintation = 'row';
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

		var typeSt = row.add('statictext', undefined, 'Export layers:'); 
		typeSt.size = [ 100,20 ];	
		
		var layerNames = [];
		for(var i=0; i<this.layerSelect.length; ++i){
			layerNames.push(this.layerSelect[i].name)
		}
		for(var i=0; i<docRef.layers.length; i++){
			var layer = docRef.layers[i];
			layerNames.push((i+1)+": "+layer.name);
		}

		this.layerList = row.add('dropdownlist', undefined, layerNames);
		this.layerList.selection = this.findDataIndex(this.layers, this.layerSelect);

		// PREFIX GRP
		row = this.dlg.add('group', undefined, '')
		row.oreintation = 'row';
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

		var prefixSt = row.add('statictext', undefined, 'File prefix:'); 
		prefixSt.size = [100,20]

		this.prefixEt = row.add('edittext', undefined, this.prefix); 
		this.prefixEt.size = [ 300,20 ];

		// suffix row
		row = this.dlg.add('group', undefined, '')
		row.oreintation = 'row';
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

		row = this.dlg.add('group', undefined, '')
		row.oreintation = 'row';
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

		var suffixSt = row.add('statictext', undefined, 'File suffix:'); 
		suffixSt.size = [100,20]

		this.suffixEt = row.add('edittext', undefined, this.suffix); 
		this.suffixEt.size = [ 300,20 ];

		// scaling row
		row = this.dlg.add('group', undefined, '')
		row.oreintation = 'row';
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

		var scalingLabel = row.add('statictext', undefined, 'Scaling:'); 
		scalingLabel.size = [100,20]

		this.scalingInput = row.add('edittext', undefined, this.scaling); 
		this.scalingInput.size = [ 100,20 ];

		var scalingTip = row.add('statictext', undefined, '(Normally 100%; Use 200% for Retina display exports)'); 
		scalingTip.size = [300,20]

		// DIR GROUP
		row = this.dlg.add( 'group', undefined, '') 
		row.orientation = 'row'
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]
		
		var dirSt = row.add('statictext', undefined, 'Output directory:'); 
		dirSt.size = [ 100,20 ];

		this.dirEt = row.add('edittext', undefined, this.base_path); 
		this.dirEt.size = [ 300,20 ];

		var chooseBtn = row.add('button', undefined, 'Choose ...' );
		chooseBtn.onClick = function() { multi_exporter.dirEt.text = Folder.selectDialog(); }

		// FORMAT ROW
		row = this.dlg.add('group', undefined, ''); 
		row.orientation = 'row'
		row.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]
		
		var formatSt = row.add('statictext', undefined, 'Export format:'); 
		formatSt.size = [ 100,20 ];	
		
		var formatNames = [];
		for(var i=0; i<this.formatInfo.length; ++i){
			formatNames.push(this.formatInfo[i].name)
		}
		this.formatList = row.add('dropdownlist', undefined, formatNames);
		
		this.formatList.selection = 1;
		for ( var i=0; i < this.formatList.items.length; i++ ) {
			if ( multi_exporter.format == this.formatList.items[i].text ) {
				this.formatList.selection = i;
			}
		}
		
		this.embedImageCheckBox = row.add('checkbox', undefined, 'Embed Imagery');
		this.embedImageCheckBox.value = this.embedImage;
		
		this.embedFontCheckBox = row.add('checkbox', undefined, 'Embed Fonts');
		this.embedFontCheckBox.value = this.embedFont;

		// TRANSPARENCY AND TRIM ROW
		row = this.dlg.add('group', undefined, ''); 
		row.orientation = 'row'
		row.alignment = [ScriptUI.Alignment.CENTER, ScriptUI.Alignment.TOP]
		
		this.transCheckBox = row.add('checkbox', undefined, 'Transparency');
		this.transCheckBox.value = this.transparency;
		
		this.trimEdgesCheckBox = row.add('checkbox', undefined, 'Trim Edges');
		this.trimEdgesCheckBox.value = this.trimEdges;
		
		this.innerPaddingCheckBox = row.add('checkbox', undefined, 'Inner Padding (to prevent curved edge clipping)');
		this.innerPaddingCheckBox.value = this.innerPadding;

		// progress bar
		var progBar = this.dlg.add( 'progressbar', undefined, 0, 100 );
		progBar.size = [400,10]

		this.progLabel = this.dlg.add('statictext', undefined, '...' ); 
		this.progLabel.size = [ 400,20 ];

		// buttons row
		row = this.dlg.add('group', undefined, ''); 
		row.orientation = 'row'

		var cancelBtn = row.add('button', undefined, 'Cancel', {name:'cancel'});
		cancelBtn.onClick = function() { multi_exporter.dlg.close() };

		var saveBtn = row.add('button', undefined, 'Save and Close', {name:'saveClose'});
		saveBtn.onClick = function() {
			multi_exporter.saveOptions();
			multi_exporter.dlg.close()
		};

		// OK button
		var okBtn = row.add('button', undefined, 'Export', {name:'ok'});
		okBtn.onClick = function() { 
			
			multi_exporter.saveOptions(); // save options before export in case of errors

			try{
				multi_exporter.run_export(); 
			}catch(e){
				alert(e);
			}
		};
		
		this.ignoreCheckBox = row.add('checkbox', undefined, 'Ignore Warnings');
		this.ignoreCheckBox.value = this.ignoreWarnings;
		
		// Export type handler
		this.artboardList.onChange = function() {
			multi_exporter.artboards  = multi_exporter.getListData(multi_exporter.artboardList.selection.index, multi_exporter.artboardSelect);
			multi_exporter.update_export_desc(  );
		};
		this.layerList.onChange = function() {
			multi_exporter.layers  = multi_exporter.getListData(multi_exporter.layerList.selection.index, multi_exporter.layerSelect);
			multi_exporter.update_export_desc( );
		};
		this.exportArtboardsCheckBox.onClick = function() {
			multi_exporter.whole_artboard_mode  = multi_exporter.exportArtboardsCheckBox.value;
			multi_exporter.update_export_desc( );
		};

		// Format change handler
		this.formatList.onChange = function() {
			multi_exporter.checkFormat();
		};

		multi_exporter.update_export_desc( );
		
		this.dlg.progBar = progBar;
		
		this.checkFormat();
		this.dlg.show();
	},

	findDataIndex: function(data, selectList){
		if(typeof(data)=="string" && parseInt(data).toString()==data){
			data = parseInt(data);
		}
		if(typeof(data)=="number"){
			return selectList.length+data;
		}else{
			for(var i=0; i<selectList.length; ++i){
				if(selectList[i].code==data){
					return i;
				}
			}
		}
		alert("no find: "+data);
	},

	getListData: function(index, selectList){
		if(index>=selectList.length){
			return index-selectList.length;
		}else{
			return selectList[index].code;
		}
	},

	checkFormat: function ( progLabel ) {
		var formatInfo = this.formatInfo[this.formatList.selection.index];
		this.currentFormatInfo = formatInfo;

		for(var i=0; i<this.controlNames.length; i++){
			var controlName = this.controlNames[i];
			this[controlName].enabled = (this.indexOf(formatInfo.activeControls, controlName)!=-1);
		}
	},

	indexOf: function ( array, element ) {
		for(var i=0; i<array.length; i++){
			if(array[i]==element)return i;
		}
		return -1;
	},
	
	update_export_desc: function () {

		this.export_artboards = []; 
		this.export_layers = [];

		if(this.artboards=="all"){
			for(var i=0; i<docRef.artboards.length; ++i){
				var artboard = docRef.artboards[i];
				if(!artboard.name.match( /^\-/ )){
					this.export_artboards.push(i);
				}
			}
		}else if(this.artboards=="current"){
			this.export_artboards.push(docRef.artboards.getActiveArtboardIndex());
		}else if(typeof(this.artboards)=="number"){
			this.export_artboards.push(this.artboards);
		}

		if(this.layers=="all"){
			for(var i=0; i<docRef.layers.length; ++i){
				var layer = docRef.layers[i];
				if(!this.isAdditionalLayer(layer) && this.isIncludeLayer(layer)){
					this.export_layers.push(i);
				}
			}
		}else if(this.layers=="selected"){
			for(var i=0; i<docRef.layers.length; ++i){
				var layer = docRef.layers[i];
				if(!this.isAdditionalLayer(layer) && this.isIncludeLayer(layer) && layer.hasSelectedArtwork){
					this.export_layers.push(i);
				}
			}
			this.export_layers.push(docRef.artboards.getActiveArtboardIndex());
		}else if(typeof(this.layers)=="number"){
			this.export_layers.push(this.layers);
		}
		this.updateExportCounts();
	},
	updateExportCounts: function(){
		this.num_to_export = this.export_artboards.length*this.export_layers.length;
		var artboardExportTxt;
		if(this.whole_artboard_mode){
			this.num_to_export += this.export_artboards.length;
			if(this.export_layers.length){
				artboardExportTxt = " (and "+this.export_artboards.length+" artboard images)";
			}else{
				this.progLabel.text = 'Will export ' + this.export_artboards.length + ' of ' + docRef.artboards.length + ' artboards';
				return;
			}
		}else{
			artboardExportTxt = "";
		}

		if(this.export_artboards.length>1 && this.export_layers.length>1){
			this.progLabel.text = 'Will export ' + this.num_to_export + ' files (' + this.export_layers.length + ' layers * ' + this.export_artboards.length + ' artboards)'+artboardExportTxt;

		}else if(this.export_layers.length>0 && this.export_artboards.length==1){
			var artboard = docRef.artboards[this.export_artboards[0]];
			this.progLabel.text = 'Will export ' + this.export_layers.length + ' of ' + docRef.layers.length+ ' layers on artboard "' + artboard.name +'"' +artboardExportTxt;

		}else if(this.export_layers.length>0 && this.export_artboards.length>0){
			var artboard = docRef.artboards[this.export_artboards[0]];
			this.progLabel.text = 'Will export ' + this.export_layers.length+' layers on "' + this.export_artboards.length +'" artboards' +artboardExportTxt;
		}else{
			this.progLabel.text = 'Please select valid artboards / layers' ;

		}

	},

	saveOptions:function(){
		this.prefix	   = this.prefixEt.text; 
		this.suffix	   = this.suffixEt.text; 
		this.base_path	= this.dirEt.text;
		this.transparency = this.transCheckBox.value;
		this.embedImage = this.embedImageCheckBox.value; 
		this.embedFont = this.embedFontCheckBox.value;
		this.trimEdges = this.trimEdgesCheckBox.value;
		this.innerPadding = this.innerPaddingCheckBox.value;
		this.ignoreWarnings = this.ignoreCheckBox.value;
		this.format	   = this.formatList.selection.text;
		this.scaling	  = parseFloat( this.scalingInput.text.replace( /\% /, '' ));

		this.prefs_xml.nyt_base_path	= this.base_path;
		this.prefs_xml.nyt_scaling	  = this.scaling;
		this.prefs_xml.nyt_prefix	   = this.prefix;
		this.prefs_xml.nyt_suffix	   = this.suffix;
		this.prefs_xml.nyt_transparency = this.transparency;
		this.prefs_xml.nyt_embedImage = this.embedImage;
		this.prefs_xml.nyt_ignoreWarnings = this.ignoreWarnings;
		this.prefs_xml.nyt_embedFont = this.embedFont;
		this.prefs_xml.nyt_trimEdges = this.trimEdges;
		this.prefs_xml.nyt_innerPadding = this.innerPadding;
		this.prefs_xml.nyt_format	   = this.format;
		this.prefs_xml.nyt_artboards  = this.artboards;
		this.prefs_xml.nyt_layers  = this.layers;
		this.prefs_xml.nyt_exportArtboards  = this.whole_artboard_mode;
		
		this.multiExporterPrefs.textFrames[0].contents = this.prefs_xml.toXMLString();
	},

	
	// run_export function. does the dirty work
	run_export: function() {
		this.failed_artboards = [];
		this.failed_layers = [];
		var formatInfo = this.currentFormatInfo;

		var copyBehaviour = formatInfo.copyBehaviour || this.trimEdges;

		var num_exported = 0;
		var options = formatInfo.getOptions(this.transparency, this.scaling, this.embedImage, this.embedFont, this.trimEdges);

		if(!copyBehaviour){
			var were_shown = this.get_shown_layers();
		}

		if(!this.export_artboards.length || (!this.export_layers.length && !this.whole_artboard_mode)){
			alert('Please select valid artboards / layers');
			return;
		}

		if(!this.base_path){
			alert('Please select select a destination');
			return;
		}

		// offsetting must be in relation to the center of the first artboard
		var firstRect = docRef.artboards[0].artboardRect;
		var firstCentX = (firstRect[2]-firstRect[0])/2;
		var firstCentY = (firstRect[1]-firstRect[3])/2;

		for (var i = 0; i < this.export_artboards.length; i++ ) {
			var artboard = docRef.artboards[this.export_artboards[i]];
			var artboardName = artboard.name;
			starting_artboard = docRef.artboards.setActiveArtboardIndex(i);
			
			var rect = artboard.artboardRect;


			var offsetX = firstRect[0]-rect[0];
			var offsetY = firstRect[1]-rect[1];

			var artW = rect[2]-rect[0];
			var artH = rect[1]-rect[3];

			var copyDoc;

			// if exporting artboard by artboard, export layers as is
			if ( this.whole_artboard_mode) {

				try{
					var base_filename = this.base_path + "/" + this.prefix + artboardName + this.suffix;
					if(copyBehaviour){
						var offset = {x:offsetX, y:offsetY};
						copyDoc = this.copyDocument(docRef, formatInfo.pixelDocSize, artboard, rect, artW, artH, offset, function(layer){return (layer.name!=multi_exporter.PREFS_LAYER_NAME && layer.visible)});
						
						formatInfo.saveFile(copyDoc, base_filename, options, i, artboardName);

						copyDoc.close(SaveOptions.DONOTSAVECHANGES);
						copyDoc = null;
					}else{
						formatInfo.saveFile(docRef, base_filename, options, i, artboardName);
					}
				}catch(e){
					this.failed_artboards.push(i);
				}
				

				this.updateProgress(++num_exported);
						
			}
			if(this.export_layers.length){
					
				if(copyBehaviour){

					if(!this.trimEdges){
						var layerDepths = [];
						var offset = {x:offsetX, y:offsetY};
						copyDoc = this.copyDocument(docRef, formatInfo.pixelDocSize, artboard, rect, docRef.width, docRef.height, offset, this.isAdditionalLayer, layerDepths);
						var hasAdditLayers = copyDoc.layers.length>0;
					}
				}else{
					this.hide_all_layers();
				}
				
				for ( var j=0; j < this.export_layers.length; j++ ) {
					var layer = docRef.layers[this.export_layers[j]];
					var lyr_name = layer.name;

					try{
						var layerRect
						// only process layer if it has bounds (i.e. not guide layer) and falls within current artboard bounds
						layerRect = this.get_layer_bounds(layer)
						if(layerRect==null)continue;

						if (layerRect[0]<layerRect[2] && layerRect[1]>layerRect[3]) {
							var isVis = this.intersects(rect, layerRect);

							if(!hasAdditLayers && !isVis && !this.trimEdges){
								// skip layers where nothing is visible
								continue;
							}
							var base_filename;
							if ( this.export_artboards.length==1 ) {
								base_filename = this.base_path + "/" + this.prefix + lyr_name + this.suffix;
							} else{
								base_filename = this.base_path + "/" + this.prefix + artboardName + '-' + lyr_name + this.suffix;
							}
							if(copyBehaviour){

								if(this.trimEdges){
									if(copyDoc){
										copyDoc.close(SaveOptions.DONOTSAVECHANGES);
										copyDoc = null;
									}

									// crop to artboard
									if(layerRect[0]<rect[0]){
										layerRect[0] = rect[0];
									}else{
										intendedX = 0;
									}
									if(layerRect[1]>rect[1]){
										layerRect[1] = rect[1];
									}
									if(layerRect[2]>rect[2]){
										layerRect[2] = rect[2];
									}
									if(layerRect[3]<rect[3]){
										layerRect[3] = rect[3];
									}else{
										intendedY = 0;
									}
									layerOffsetY = rect[3] - layerRect[3];
									layerOffsetX = rect[0] - layerRect[0];

									docW = layerRect[2]-layerRect[0];
									docH = layerRect[1]-layerRect[3];

									offset = {x:offsetX+layerOffsetX, y:offsetY+layerOffsetY};
									var layerDepths = [];
									var copyDoc = this.copyDocument(docRef, formatInfo.pixelDocSize, artboard, rect, docW, docH, offset, this.isAdditionalLayer, layerDepths);
								
									var hasAdditLayers = copyDoc.layers.length>1; // there will be one empty layer in the new file (which can be ignored)

									if(!hasAdditLayers && !isVis){
										// skip layers where nothing is visible
										continue;
									}
								}
								if(isVis){
									// only copy layer if it is visible (if not only visible '+' layers will be output)
									var new_layer = this.copy_layer(layer, copyDoc.layers.add(), offset, copyDoc.width, copyDoc.height, this.innerPadding);
									new_layer.visible = true;
									var depth = layerDepths[this.export_layers[j]];
									while(new_layer.zOrderPosition<depth){
										new_layer.zOrder(ZOrderMethod.BRINGFORWARD);
									}
									while(new_layer.zOrderPosition>depth){
										new_layer.zOrder(ZOrderMethod.SENDBACKWARD);
									}
								}
								formatInfo.saveFile(copyDoc, base_filename, options, i, artboardName);
								if(new_layer && !this.trimEdges){
									new_layer.remove();
									new_layer = null;
								}
							}else{
								layer.visible = true;

								formatInfo.saveFile(docRef, base_filename, options, i, artboardName);

								layer.visible = false;
							}
						}
					}catch(e){
						this.failed_artboards.push(i);
						this.failed_layers.push(j);
						if(new_layer && !this.trimEdges){
							new_layer.remove();
							new_layer = null;
						}
					}
					this.updateProgress(++num_exported);
				}
				if(copyDoc){
					copyDoc.close(SaveOptions.DONOTSAVECHANGES);
					copyDoc = null;
				}
			}
			
		}
		if(!copyBehaviour){
			this.show_layers(were_shown);
		}
		if((!this.failed_layers.length && !this.failed_artboards.length) || !this.redoFailed(this.failed_layers, this.failed_artboards)){
			this.dlg.close();
		}
	},
	
	redoFailed: function(failed_layers, failed_artboards) {
		var newLayers = [];
		for(var i=0; i<failed_layers.length; ++i){
			var index = this.export_layers[failed_layers[i]];
			if(this.indexOf(newLayers, index)==-1)newLayers.push(index);
		}
		var newArtboards = [];
		for(var i=0; i<failed_artboards.length; ++i){
			var index = this.export_artboards[failed_artboards[i]];
			if(this.indexOf(newArtboards, index)==-1)newArtboards.push(index);
		}
		if(newLayers.length){
			var layerNames = "";
			for(var i=0; i<newLayers.length; ++i){
				var index = newLayers[i];
				layerNames += "\n - "+docRef.layers[index].name;
			}
			var msg = newLayers.length+" layers failed across "+newArtboards.length+" artboards:"+layerNames+"\n Retry?";
		}else{
			var artboardNames = "";
			for(var i=0; i<newArtboards.length; ++i){
				var index = newArtboards[i];
				artboardNames += "\n - "+docRef.artboards[index].name;
			}
			var msg = newArtboards.length+" artboards failed:"+artboardNames+"\nRetry?";
		}
		if(confirm(msg)){
			this.export_artboards = newArtboards;
			this.export_layers = newLayers;
			this.updateExportCounts();
			this.run_export();
			return true;
		}
		return false;
	},
	
	traceRect: function(rect) {
		if(!rect)return "no rect";
		return "l: "+Math.round(rect[0])+" t: "+Math.round(rect[1])+" r: "+Math.round(rect[2])+" b: "+Math.round(rect[3])+" w: "+(rect[2]-rect[0])+" h: "+(rect[1]-rect[3]);
	},
	
	isAdditionalLayer: function(layer) {
		return ( layer.name.match( /^\+/ ) && layer.visible);
	},
	
	isIncludeLayer: function(layer) {
		return ( !layer.name.match( /^\+/ ) && layer.name!=this.PREFS_LAYER_NAME && !layer.name.match( /^\-/) )
	},
	
	copyDocument: function(docRef, pixelDocSize, artboard, rect, w, h, offset, layerCheck, layerDepths) {
		var docW;
		var docH;
		if(pixelDocSize){
			w = Math.round(w *1000) / 1000;
			h = Math.round(h *1000) / 1000;
			w = Math.ceil(w);
			h = Math.ceil(h);
		}

		var preset = new DocumentPreset();
		preset.width = w;
		preset.height = h;
		preset.colorMode = docRef.documentColorSpace;
		preset.units = docRef.rulerUnits;

		var copyDoc = app.documents.addDocument(docRef.documentColorSpace, preset);
		copyDoc.pageOrigin = docRef.pageOrigin;
		copyDoc.rulerOrigin = docRef.rulerOrigin;
		var count = 1; // indices are 1 based!
		var n = docRef.layers.length;
		for ( var j=docRef.layers.length-1; j >=0; j-- ) {
			
			layer = docRef.layers[j];
			
			if (layerCheck(layer)) {
				var layerBounds = this.get_layer_bounds(layer);
				if(layerBounds && this.intersects(rect, layerBounds)){
					this.copy_layer(layer, copyDoc.layers.add(), offset, w, h, false);
					++count;
				}
			}else if(layerDepths){
				layerDepths[j] = count;
			}
		}
		return copyDoc;
	},

	updateProgress: function(num_exported) {
		this.progLabel.text = 'Exported ' + num_exported + ' of ' + this.num_to_export;
		this.dlg.progBar.value = num_exported / this.num_to_export * 100;
		this.dlg.update();
	},
	
	copy_layer: function(from_layer, to_layer, offset, docW, docH, doInnerPadding) {
		to_layer.artworkKnockout = from_layer.artworkKnockout;
		to_layer.blendingMode = from_layer.blendingMode;
		to_layer.color = from_layer.color;
		to_layer.dimPlacedImages = from_layer.dimPlacedImages;
		to_layer.isIsolated = from_layer.isIsolated;
		to_layer.name = from_layer.name;
		to_layer.opacity = from_layer.opacity;
		to_layer.preview = from_layer.preview;
		to_layer.printable = from_layer.printable;
		to_layer.sliced = from_layer.sliced;
		to_layer.typename = from_layer.typename;

		if(!offset.norm){
			var oldBounds = this.get_layer_bounds(from_layer);
			 //for mystery reasons, this only works if done before copying items across
		}

		var items = from_layer.pageItems;
		try{
			this.copy_items(items, to_layer);
		}catch(e){
			alert("copy items failed");
		}

		// copy backwards for correct z-ordering
		for(var i=from_layer.layers.length-1; i>=0; --i){
			var child = from_layer.layers[i];
			if(child.visible)this.copy_layer(child, to_layer.layers.add(), offset, docW, docH, false)
		}

		if(!offset.norm){

			var newBounds = this.get_layer_bounds(to_layer);
			if(this.rect_equal(oldBounds, newBounds)){
				//$.sleep(5000); // sleeping doesn't help!!

				if(!this.ignoreWarnings)alert("Illustrator visibleBounds issue workaround.\nTry removing groups on layer '"+from_layer.name+"' to avoid this in future.\nPlease press OK");
				newBounds = this.get_layer_bounds(to_layer);
				// sometimes it takes a moment for bounds to be updated
			}
			if(oldBounds && newBounds){
				offset.x += oldBounds[0]-newBounds[0];
				offset.y += oldBounds[3]-newBounds[3];
				offset.norm = true;
			}
		}
		if(to_layer.parent.artboards!=null){ // only if top level layer
			try{
				this.shift_layer(to_layer, offset.x, offset.y);
			}catch(e){
				alert("shift layer failed");
			}
		}
		if(doInnerPadding)this.innerPadLayer(to_layer, docW, docH);

		return to_layer;
	},

	innerPadLayer: function(layer, docW, docH){
		docW = Math.round(docW * 100) / 100;
		docH = Math.round(docH * 100) / 100;
		for(var i=0; i<layer.pageItems.length; ++i){
			var item = layer.pageItems[i];
			var bounds = item.visibleBounds;
			// round to two decimal points
			var l = Math.round(bounds[0] * 100) / 100;
			var b = Math.round(bounds[1] * 100) / 100;
			var r = Math.round(bounds[2] * 100) / 100;
			var t = Math.round(bounds[3] * 100) / 100;
			var w = (r - l);
			var h = (b - t);
			if(w>docW-1 && h>docH-1){
				var scaleX = (w-1) / w * 100; // resize takes percentage values
				var scaleY = (h-1) / h * 100;
				item.resize(scaleX, scaleY, null, null, null, null, null, Transformation.CENTER);
			}
		}
		for(var i=0; i<layer.layers.length; ++i){
			innerPadLayer(layer.layers[i], docW, docH);
		}
	},
	
	rect_equal: function(rect1, rect2) {
		return rect1[0]==rect2[0] && rect1[1]==rect2[1] && rect1[2]==rect2[2] && rect1[3]==rect2[3] ;
	},
	
	copy_items: function(from_list, to_layer) {

		var visWas = to_layer.visible;
		to_layer.visible = true;
		for(var i=0; i<from_list.length; ++i){
			var item = from_list[i].duplicate(to_layer, ElementPlacement.PLACEATEND);
			/*if(shiftX!=0 || shiftY!=0){
				item.translate(shiftX, shiftY)
			}*/
		}
		to_layer.visible = visWas;
	},
	
	shift_layer: function(layer, shiftX, shiftY) {
		this.shift_items(layer.pageItems, shiftX, shiftY);

		// copy backwards for correct z-ordering
		for(var i=layer.layers.length-1; i>=0; --i){
			this.shift_layer(layer.layers[i], shiftX, shiftY)
		}
	},
	
	shift_items: function(items, shiftX, shiftY) {
		if(shiftX==undefined)shiftX = 0;
		if(shiftY==undefined)shiftY = 0;

		for(var i=0; i<items.length; ++i){
			items[i].translate(shiftX, shiftY)
		}
	},
	
	hide_all_layers: function() {
		var n = docRef.layers.length;
		
		for(var i=0; i<n; ++i) {
			
			layer = docRef.layers[i];
			
			lyr_name = layer.name;
			
			// any layers that start with + are always turned on
			if (this.isAdditionalLayer(layer)) {
				layer.visible = true;
			} else {
				layer.visible = false;
			}
		}
	},
	
	get_shown_layers: function() {
		var shown = []
		var n = docRef.layers.length;
		
		for(var i=0; i<n; ++i) {
			
			layer = docRef.layers[i];
			
			if(layer.visible){
				shown.push(i);
			}
		}
		return shown;
	},
	
	get_layer_bounds: function(layer) {
		var rect;
		var items = layer.pageItems;
		for(var i=0; i<items.length; ++i){
			var item = items[i];

			if(item.guides){
				continue;
			}
			var visBounds = item.visibleBounds;
			if(visBounds==null)continue;

			if(rect==null){
				rect = visBounds;
			}else{
				if(rect[0]>visBounds[0]){
					rect[0] = visBounds[0];
				}
				if(rect[1]<visBounds[1]){
					rect[1] = visBounds[1];
				}
				if(rect[2]<visBounds[2]){
					rect[2] = visBounds[2];
				}
				if(rect[3]>visBounds[3]){
					rect[3] = visBounds[3];
				}
			}
		}
		for(var i=0; i<layer.layers.length; ++i){
			var childRect = this.get_layer_bounds(layer.layers[i]);
			if(childRect==null)continue;

			if(rect==null){
				rect = childRect;
			}else{
				if(rect[0]>childRect[0]){
					rect[0] = childRect[0];
				}
				if(rect[1]<childRect[1]){
					rect[1] = childRect[1];
				}
				if(rect[2]<childRect[2]){
					rect[2] = childRect[2];
				}
				if(rect[3]>childRect[3]){
					rect[3] = childRect[3];
				}
			}
		}
		return rect;
	},
	
	intersects: function(rect1, rect2) {
		return !(  rect2[0] > rect1[2] || 
		           rect2[1] < rect1[3] ||
		           rect2[2] < rect1[0] || 
		           rect2[3] > rect1[1]);
	},
	
	
	show_layers: function(layerIndices) {
		var n = layerIndices.length;
		for(var i=0; i<n; ++i) {
			layer = docRef.layers[layerIndices[i]];
			layer.visible = true;
		}
	}
};



multi_exporter.init();



