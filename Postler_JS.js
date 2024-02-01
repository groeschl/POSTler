function jobArrived( s : Switch, job : Job )
{
	//v1.61 - Florian - 28.11.2017
	//Erweiterung um Timeout Eingabe
	
	//v1.62 - Florian
	//Erweiterung um Teapod Fehler (418)
	
	//v1.63 - Florian
	//Erweiterung um Whitespace Abfrage bei Url Replace
	
	//v1.64 - Florian
	//Private Variable für _URL setzen bei Filelist
	
	//v1.65 - Marc
	//'moveFiles = false' bei Outsourcer (!DciOrderOutbound)
	
	//v1.65 - Florian
	//Private Variable für bei Outsourcer (!DciOrderOutbound)
	
	//v1.67 - Florian
	//Fehlermeldung (Freitextfeld) wird aus ASP-Client übergeben.
	
	//v1.68 - Florian
	//Wenn bei ASP Fehler nichts eingegeben wird, wird ein Leerstring und nicht "undefined" übergeben.
	
	//v1.69 - Florian
	// Erweiterung um HTTP Status Code job.setPrivateData('HTTP-Status', theHTTP.statusCode);
	
	//v1.170 - Florian
	//Processing List wird um Parameter "SwitchID" erweitert.
	
	//v1.71 - Florian
	//FileList um dynamische Sujenummer erweitert. Funktioniert aber nur bei Kugelschreiber
	
	//v1.72 - Florian
	// Workaround über Kalkulationsschema
	
	//Test github
	function urlencode( url : String ) {
	
		    function toHex( c : Number ) {
	
		        var v = "", upNib = (c >> 4);
	
		        if (upNib > 9)
	
		            v += String.fromCharCode(55+upNib);
	
		        else
	
		            v += String.fromCharCode(48+upNib);
	
		        var lowNib = (c & 0x0f);
	
		        if (lowNib > 9)
	
		            v += String.fromCharCode(55+lowNib);
	
		        else
	
		            v += String.fromCharCode(48+lowNib);
	
		        return v;
	
		    }
	
			
	
			// Anything that matches this RegExp should be encoded.
	
			// not a wordCharacter - . ~
	
			var re = /[^w-.~]/; 
	
			var encodedStr = "";
	
		
	
			for (var i=0; i<url.length; i++) {
	
		        var c = url.charAt(i);
	
				if ( c.match(re) ) {
	
					encodedStr += '%' + toHex(c.charCodeAt(0));
	
				}
	
				else {
	
					encodedStr += c;
	
				}
	
		    }
	
		    return encodedStr;
	
		}	
	
	var _TimeOut = s.getPropertyValue('TimeOut');
	_TimeOut = parseInt(_TimeOut);
	var theHTTP = new HTTP(HTTP.NoSSL);
	var _Method = s.getPropertyValue('HTTPVerb');
	var _Endpoint = s.getPropertyValue('Endpoint');
	var _CustomEndpoint = s.getPropertyValue('CustomEndpoint');
	var _JobNumber = job.getVariableAsString('[Metadata.Text:Path="/Auftragpostionen_/datensatz[@Tag=\'AUP_Auftragsnummer\']/@Value",Dataset="Auftragpostionen_",Model="XML"]');
	var _FileName = job.getName();
	var _SujetNumber = job.getVariableAsString('[Metadata.Text:Path="/PrePreps_Daten/datensatz[@Tag=\'Sujetnummer\']/@Value",Dataset="PrePreps_Daten",Model="XML"]');
	var _CounterNummer = job.getVariableAsString('[Metadata.Text:Path="/PrePreps_Daten/datensatz[@Tag=\'Counternummer\']/@Value",Dataset="PrePreps_Daten",Model="XML"]');
	_CounterNummer = parseInt(_CounterNummer);
	var _CustomVars = s.getPropertyValue('UseVars');
	var _URL = "";
	var _URLPart1 = "";
	var _SwitchID = job.getVariableAsString('[Job.UniqueNamePrefix]');
	var _KalkSchema = job.getVariableAsString('[Metadata.Text:Path="/Auftragpostionen_/datensatz[@Tag=\'AR_Kialkulationsschema\']/@Value",Dataset="Auftragpostionen_",Model="XML"]');

	var filelist = "";
	var moveFiles = "true";
	
	if (job.getDataset("Filelist")) {
		filelist = job.getVariableAsString('[Metadata.Text:Path="/Filelist/datensatz[@Tag=\'Dateiliste\']/@Value",Dataset="Filelist",Model="XML"]');
		moveFiles = "false";
	}
	

	try {
	
	if (_CustomVars == "Custom"){
		_JobNumber = s.getPropertyValue('Auftragsnummer');
		_FileName = s.getPropertyValue('FileName');
		_SujetNumber = s.getPropertyValue('SujetNumber');
		_CounterNummer = s.getPropertyValue('CounterNumber');
	}
	
	
	switch(_Endpoint){
	case "ASP-Add":
		_URLPart1 = "http://192.168.0.41:13000/switch/autosetup/add/" + _JobNumber;
		break;
	case "ASP-Ok":
		_URLPart1 = "http://192.168.0.41:13000/switch/autosetup/successful/" +_JobNumber;
		break;
	case "ASP-Fail":
		_Fehlermeldung = job.getVariableAsString('[Metadata.Text:Path="/field-list/field[tag=\'Fehlerbeschreibung\']/value",Dataset="AutoSetup-Checkpoint",Model="XML"]');
		if(!_Fehlermeldung){_Fehlermeldung = "";}
		_URLPart1 = "http://192.168.0.41:13000/switch/autosetup/failed/" + _JobNumber + "?message=" + _Fehlermeldung;
		break;
	case "Success":
		_URLPart1 = "http://192.168.0.41:5555/workflow/accept/";
		break;
	case "filesToProcess":
		_URLPart1 = "http://192.168.0.41:13000/switch/addFileToProcessList?orderNumber=";
		break;
	case "filesAsProcessed":
		_URLPart1 = "http://192.168.0.41:13000/switch/markFileAsProcessed?orderNumber=";
		break;		
	
	}
	
	if ((_Endpoint == "filesAsProcessed") || (_Endpoint == "filesToProcess"))  {
			var JobHierarchy = job.getVariableAsString('[Job.Hierarchy]');
			var thePath = JobHierarchy.split(";");
			var theNumber = thePath.length;
			var theOrderNumber = thePath[0];
			var theFileName = job.getVariableAsString('[Job.PrivateData:Key="FileName"]');
			var theFilePath = "";
			
			var option = "";
		
			for ( i = 0; i < theNumber; i++ ) { 
   				theFilePath += thePath[i] + "\/";
			}
		
	
			_URLPart1 += theOrderNumber + "&fileName=";
			_URLPart1 += theFilePath;
			_URLPart1 += theFileName;
			_URLPart1 += "&SwitchID=" + _SwitchID;
	
		
	}
	
	if (moveFiles == "true") {
		if (_Endpoint == "Success") {
			
			var myJobHierarchy = job.getVariableAsString('[Job.Hierarchy]');
			var myJobHierarchyParts = myJobHierarchy.split(";");
			
			if (myJobHierarchyParts[4] == "Outsourcer") {
				moveFiles = "false";
			}
			
			job.log(3,"|| MOVEFILES: %11 - %12", [moveFiles, myJobHierarchyParts[4]]);
			
			var filecount = job.getVariableAsNumber("[Job.PrivateData:Key=\"filecount\"]");
			if (filecount) {
				option = "?filecount="+filecount+"&sujetNumber="+_SujetNumber+"&moveFiles="+moveFiles;
				}
			else{
				option = "?sujetNumber="+_SujetNumber+"&moveFiles="+moveFiles;
			}
			
			_URLPart1 += _JobNumber + "/" + _CounterNummer + "/" +_FileName+option;
			
		}
		
		job.log(-1, "Ausgabe: " + _URLPart1);
		
		
		//Aufruf zusammenbauen
		_URL += _URLPart1;
			
		if (_Endpoint == "Custom"){
			_URL = _CustomEndpoint;
		}
		
		var _REGEX = /\s/g;		
		_URL = _URL.replace(_REGEX, "%20");
		urlencode(_URL);
		
		theHTTP.url = _URL;
		theHTTP.timeOut = _TimeOut;
		//theHTTP.url = "http://192.168.0.41:5555/workflow/accept/4678989/1/4678989_01_Tran_01_PVC_500x1500_1.pdf?sujetNumber=0/";
	
		if (_Method == "PUT"){
			theHTTP.put();
		}
		
		
		else if (_Method == "POST"){
			theHTTP.post();
		}
		
		
		job.log( 4, "Upload started", 100);
	
		
		while( !theHTTP.waitForFinished( _TimeOut ) ){
			job.log( 5, "Uploading...", theHTTP.progress() );
		}
		
		
		
		job.log( 6, "Upload finished" );
		job.log( 1, "Server response: %1", theHTTP.getServerResponse().toString( "UTF-8" ) );
		
		//URL als Private Variable speichern
		job.setPrivateData('URL', _URL);
		
		if( (theHTTP.finishedStatus == HTTP.Ok) && (theHTTP.statusCode == 200) ) {
			ampelFlag = "ok";
			job.log( 1, "Upload completed successfully" );
		} 
		
		else if (theHTTP.statusCode == 418){
			ampelFlag = "Fehler";
			job.setPrivateData('HTTTP-Status', "418");
			}		
		else {
			ampelFlag = "Fehler";
			job.log(3, "Method: " + theHTTP.lastError);
			//Fehlermeldung als Private Variable speichern
			job.setPrivateData('HTTTP-Error', theHTTP.lastError);
			job.setPrivateData('ServerResponse', theHTTP.getServerResponse().toString( "UTF-8" ));
			job.setPrivateData('HTTP-Status', theHTTP.statusCode);
		}
	} else {
		
		/**********************************/
		/** Success-Route für Dateilisten */
		/**********************************/
		
		var filelistParts = filelist.split(";");
		

		//Workaround für Kugelschreiber Sujets
		
		if((_KalkSchema == "117") || (_KalkSchema == "118") || (_KalkSchema == "119")){
		
							for (i = 1; i < filelistParts.length; i++) {
								if(filelistParts[i].split("_").length == "3"){
								_URL = "http://192.168.0.41:5555/workflow/accept/"+filelistParts[i].split("_")[0] + "/" + filelistParts[i].split("_")[1] + "/" +filelistParts[i]+"?sujetNumber=1&moveFiles=false";
								job.log(-1, "Ausgabe: " + _URL);
							}else{
								_URL = "http://192.168.0.41:5555/workflow/accept/"+filelistParts[i].split("_")[0] + "/" + filelistParts[i].split("_")[1] + "/" +filelistParts[i]+"?sujetNumber=" + filelistParts[i].split("_")[3] + "&moveFiles=false";
								job.log(-1, "Ausgabe: " + _URL);
							}
								}
							
			}else{
				for (i = 1; i < filelistParts.length; i++) {
				_URL = "http://192.168.0.41:5555/workflow/accept/"+filelistParts[i].split("_")[0] + "/" + filelistParts[i].split("_")[1] + "/" +filelistParts[i]+"?sujetNumber=1&moveFiles=false";
				job.log(-1, "Ausgabe: " + _URL);
				}
					}
						
						
			var _REGEX = /\s/g;		
			_URL = _URL.replace(_REGEX, "%20");
			urlencode(_URL);
			
			
			theHTTP.url = _URL;
		
			if (_Method == "PUT"){
				theHTTP.put();
			} else if (_Method == "POST"){
				theHTTP.post();
			}
			//URL als Private Variable speichern
			job.setPrivateData('URL', _URL);
			job.log( 4, "Upload started", 100);
		
			while( !theHTTP.waitForFinished( 3 ) ){
				job.log( 5, "Uploading...", theHTTP.progress() );
			}
			
			job.log( 6, "Upload finished" );
			job.log( 1, "Server response: %1", theHTTP.getServerResponse().toString( "UTF-8" ) );
			
			if( (theHTTP.finishedStatus == HTTP.Ok) && (theHTTP.statusCode == 200) ) {
				ampelFlag = "ok";
				job.log( 1, "Upload completed successfully" );
			}
			else if (theHTTP.statusCode == 418){
			ampelFlag = "Fehler";
			job.setPrivateData('HTTTP-Status', "418");
			}	 
						
			else {
				ampelFlag = "Fehler";
				job.log(3, "Method: " + theHTTP.lastError);
				job.setPrivateData('HTTP-Status', theHTTP.statusCode);
			}
		}
	

	
	
		if (ampelFlag == "ok") {
			job.sendToData(1,job.getPath());
		} else if (ampelFlag == "Fehler") {
			job.sendToData(3,job.getPath());
		} else {
			job.fail("AmpelFlag nicht gesetzt. %1",ampelFlag);
		}
		job.log(-1, "Ampelflag: " + ampelFlag);
	}

	catch (_e) { job.fail("Fehler: %1",_e); }
	
}