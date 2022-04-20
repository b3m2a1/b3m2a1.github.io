---
title: ServiceConnections - Mathematica on the Web
authors: 
date: 2017-07-24 22:09:34
disqus_ID: b3m2a1-home-ecfbd9f3-deea-4e81-b898-14678638e4d9
modified: 2017-07-26 00:36:30
permalink: serviceconnections---mathematica-on-the-web
tags: mathematica
---

### This is a an amalgamation of  [three](https://mathematica.stackexchange.com/a/147196/38205)   [Stack Exchange](https://mathematica.stackexchange.com/a/147452/38205)   [answers](https://mathematica.stackexchange.com/a/147547/38205)

Mathematica has a nice system for building API connections. It’s clean, object oriented, and built off of the function  [```ServiceConnect```](https://reference.wolfram.com/language/ref/ServiceConnect.html) . The basic idea is that one connects to a service, creates an object representing that connection and caching its state, and then uses that object to send and parse calls.

Then digging in the  [```$UserBasePacletsDirectory```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/PacletManager/ref/%24UserBasePacletsDirectory.html)  one day I stumbled upon a bunch of paclets whose names were things like ServiceConnection_ServiceName. And that made me think that I could build my own (moreover I’d had success doing the same with the curated data framework already).

If you just want to start building your own I only ever build them using the  ```CustomServiceConnection```  I stuck into my  [primary package.](http://www.wolframcloud.com/objects/b3m2a1.paclets/paclets/PacletServer/main.html#BTools)

<a id="service-connection-paclets" >&zwnj;</a>

# Service Connection Paclets

These paclets are pretty bare bones, to take a look at one of them:

	PacletOpen["ServiceConnection_ChemSpider"]

![image-posts-serviceconnections--mathematica-on-the-web-2309314407486505745]({{site.base_url}}/img/posts-serviceconnections--mathematica-on-the-web-2309314407486505745.png)

Some of these things have an extra file, $ServiceName.m, but in general this appears to be pretty standard. We’ll dig through this an see how it works.

<a id="load.m" >&zwnj;</a>

## load.m

This file is trivial. For ChemSpider I have:

	PacletManager`Package`getPacletWithProgress["ServiceConnection_\
	ChemSpider"]
	
	Get["ChemSpiderLoad`"]

Basically it just configures the loader. Easy. Let’s move on.

<a id="chemspiderload.m" >&zwnj;</a>

## ChemSpiderLoad.m

This is also super simple. I have:

	(* Mathematica Package *)
	
	BeginPackage["ChemSpiderLoad`"]
	(* Exported symbols added here with SymbolName::usage *)  
	
	Begin["`Private`"] (* Begin Private Context *) 
	
	If[! ListQ[System`$Services], Get["OAuth`"]]
	
	Block[{dir = DirectoryName[System`Private`$InputFileName]},
	  KeyClient`addKeyservice["ChemSpider", dir]
	 ]
	
	
	End[] (* End Private Context *)
	EndPackage[]

The main thing to note here is that  [```KeyClient`addKeyservice```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/KeyClient/ref/addKeyservice.html)  chilling there. It’s one of three different clients whoever wrote the framework has provided, the big one being the  [```OAuthClient` ```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/OAuthClient/guide/OAuthClient.html) .

<a id="chemspider.m" >&zwnj;</a>

## ChemSpider.m

This is the meat of the paclet. Basically you provide the system with all the needed to format an object via  ```ServiceConnect``` .

Let’s forget our  [do-re-mis](https://www.youtube.com/watch?v=k33ZQ4I4p24)  (sorry Julie) and not start at the very beginning. Instead we’ll start at the very end where we see this:

	(* Return three functions to define oauthservicedata, \
	oauthcookeddata, oauthsendmessage  *)
	\
	{ChemSpiderAPI`Private`chemspiderdata, \
	ChemSpiderAPI`Private`chemspidercookeddata, \
	ChemSpiderAPI`Private`chemspidersendmessage}

This is what’s returned (and all of what’s returned) by the package. So these three functions define the entire service. Actually, it’s really the first two that define the service, that last one generally only ever appears in a line like this:

	chemspidersendmessage[___] := $Failed

Except in the Twilio connection where it does something. But it’s never been worth it for me to figure it out. So moving on!

<a id="chemspiderdata" >&zwnj;</a>

## chemspiderdata

This is the core service data function. It defines the all of the service parameters and how the connection should be formatted. Here’s the primary data definition from the file:

	chemspiderdata[] = {
	    "ServiceName" 		-> "ChemSpider", 
	  
	          
	  "URLFetchFun"  :> (With[{params = Lookup[{##2}, "Parameters", {}]},
	              	URLFetch[#1, "ContentData",
	               		
	       Sequence @@ 
	        FilterRules[{##2}, Except["Parameters" | "Headers"]], 
	               		"Parameters" -> params /. "apikey" -> "token",
	               		"Headers" -> {}]] &),
	          		
	          
	  "ClientInfo"  :> 
	   OAuthDialogDump`Private`MultipleKeyDialog[
	    "ChemSpider", {"Security Token" -> "token"},
	                                            
	    "https://www.chemspider.com/UserProfile.aspx", 
	    "http://www.rsc.org/help-legal/legal/terms-conditions/"],
	  	 	"Gets"    -> {"Search", "CompoundInformation", 
	    "CompoundThumbnail", "Databases", "ExtendedCompoundInformation", 
	    "AllSpectraInformation", "CompoundSpectraInformation", 
	    "SpectrumInformation", "InChIKeyQ", "GetIdentifier"(*,
	    "MOLToInChI","MOLToInChIKey","IDToMOL","RecordToMOL",
	    "MOLToID"*)},
	  	 	"RawGets"   -> {"RawGetDatabases", "RawGetExtendedCompoundInfo", 
	    "RawGetRecordMOL", "RawSearchByFormula2", "RawSearchByMass2",
	    	 		"RawAsyncSimpleSearch", "RawAsyncSimpleSearchOrdered", 
	    "RawGetAsyncSearchResults", "RawGetCompoundInfo", 
	    "RawGetCompoundThumbnail", "RawMol2CSID", "RawSimpleSearch", 
	    "RawGetAllSpectraInfo",
	    	 		"RawGetCompoundSpectraInfo", "RawGetSpectrumInfo", 
	    "RawCSIDToMol", "RawIsValidInChIKey", "RawMolToInChI", 
	    "RawMolToInChIKey", "RawInChIToMol", "RawInChIToInChIKey", 
	    "RawInChIToCSID", "RawInChIKeyToMol", "RawInChIKeyToInChI", 
	    "RawInChIKeyToCSID"},
	  	 	"Posts"    -> {},
	  	 	"RawPosts"   -> {},
	   		"Information"  -> 
	   "Import ChemSpider API data to the Wolfram Language"
	   		}

There are a few groupings here that should stand out.

### ServiceName / Information

These two are basic AF. They’re plain strings that just give the service a name and a one-line description.

### Gets / RawGets & Posts / RawPosts

These give the names of the requests that will eventually be passable into  [```ServiceExecute```](https://reference.wolfram.com/language/ref/ServiceExecute.html)  as well as the names of the core requests that will be called to provide data to those.

I’ll detail how these work  [later](#request-formatting)

### ClientInfo

This is the data that defines how authentication should be done. Looking at the one we have here: 

	"ClientInfo" :>
	  OAuthDialogDump`Private`MultipleKeyDialog["ChemSpider",
	    {"Security Token" -> "token"},
	    "https://www.chemspider.com/UserProfile.aspx",
	    "http://www.rsc.org/help-legal/legal/terms-conditions/"
	    ]

It’s calling a function that pops open a dialog with a button that sends you to the URL in the third argument, asks for the field(s) given in the second argument, and is named according to the first.

As I mentioned before there are two main clients for these connections and, as best I can tell, this is the core authorization function of the  [```KeyClient` ```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/KeyClient/guide/KeyClient.html) . I think it is so called because it uses an API key, rather than the  [OAuth flow](https://stormpath.com/blog/what-the-heck-is-oauth) .

For a standard OAuth implementation we’ll pull from the Facebook connection (note that I chopped a lot of unrelated stuff out):

	{
	  "AuthorizeEndpoint" -> "https://graph.facebook.com/oauth/authorize", 
	  "AccessEndpoint" -> 
	  "https://graph.facebook.com/oauth/access_token",
	  "RedirectURI"       -> 
	  "https://www.wolfram.com/oauthlanding?service=Facebook",
	  "VerifierLabel"     -> "code",
	  "AuthenticationDialog" -> (OAuthClient`tokenOAuthDialog[#, 
	     "Facebook", fbicon] &),
	  "ClientInfo"        -> {"Wolfram", "Token"},
	  "AccessTokenExtractor"  -> "JSON/2.0"
	  }

If it’s not clear this is an OAuth 2.0 flow, but most services these days use OAuth 2.0 so I have yet to dig and figure out how an OAuth 1.0 service would be set up.

Note that we provide an  ```"AuthorizeEndpoint"``` ,  ```"AccessEndpoint"``` ,  ```"RedirectURI"```  and  ```"VerifierLabel"``` . For some, like the Google Drive API, there are yet a few parameters to add, but they should be straight-forward and guessable.

The function  [```OAuthClient`tokenOAuthDialog```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/OAuthClient/ref/tokenOAuthDialog.html)  calls the code that actually implements the flow, sending you to authorize the site and then passing you off to a redirect URL to copy the token.

Modern paclets use the  [Channel Framework](http://reference.wolfram.com/language/guide/Channel-BasedCommunication.html.en)  to provide a seamless way to get a token, presumably by listening into a channel to which is provided as the redirect URI. This is someone one could implement oneself easily enough.

### URLFetchFunc

This is simply the function that’s used to process calls. It defaults to  [```URLFetch```](https://reference.wolfram.com/language/ref/URLFetch.html)  but can be an arbitrary function, as is done here, replacing the  ```"Parameters"```  and  ```"Headers"```  options.

<a id="request-formatting" >&zwnj;</a>

<a id="request-formatting" >&zwnj;</a>

## Request Formatting

Continuing on, we move to the requests themselves. There are two types of requests. The first are the “raw” requests which are the raw importers from the APIs. These provide info to the  ```"URLFetchFunc"```

### Raw Requests

We’ll look at a sample raw request spec:

	chemspiderdata["RawGetRecordMol"] := {
	    "URL"    -> 
	   "http://www.chemspider.com/MassSpecAPI.asmx/GetRecordMol",
	          "HTTPSMethod"  -> "GET",
	          "Parameters"  -> {"csid", "calc3d"},
	          "RequiredParameters" -> {"csid", "calc3d"},
	          "ResultsFunction" -> chemspiderimport
	          }

We can see we’re give a URL, HTTP verb, query parameters, required parameters, and an import function (defaults to  ```"URLFetchFunc"``` ).

These are all pretty straightforward, but it’s worth noting that these can look rather different. Here’s another example, this time from Facebook:

	$facebookphotopermissions = {};
	facebookdata["RawUserPhotos"] = {
	          
	  "URL"    ->  (ToString@
	      StringForm["https://graph.facebook.com/v2.3/`1`/photos", 
	       formatuser[##]] &),
	          "PathParameters" -> {"UserID"},
	          "Parameters"  -> {"limit"},
	          "HTTPSMethod"  -> "GET",
	          "ResultsFunction" -> facebookimport,
	          "RequiredPermissions" :> $facebookphotopermissions
	      }

Note that the  ```"URL"```  is now a function. I tend to use  [```URLBuild```](https://reference.wolfram.com/language/ref/URLBuild.html)  over the  [```StringForm```](https://reference.wolfram.com/language/ref/StringForm.html)  calls one tends to see in the paclets. 

Also we now have  ```"PathParameters"```  which get passed to  ```"URL"```  (note that  ```"PathParameters"```  can be added to the  ```"RequiredParameters"```  list).

And we have  ```"RequiredPermissions"```  which is there for requesting permissions incrementally. I’ve never used. Not sure how it works.

Note that the raw request needs to be a) defined in the basic  ```$servicenamedata```  function and b) needs to be added to the  ```"RawGets"``` / ```"RawPosts"```  section of the  ```"ClientInfo"``` .

### Exposed Requests

These raw requests aren’t accessible to the user via  ```ServiceExecute``` , though. Those exposed requests come via the  ```$servicenamecookeddata```  function that’s returned as the second argument of the service data list.

Here’s a sample from the Facebook connection:

	facebookcookeddata["PageData", id_, args_] := Block[
	   {rawdata, params, data},
	   params = filterparameters[args, getallparameters["RawPageData"]];
	    params = 
	   params /. 
	    HoldPattern[Rule[a_, b_Integer]] :> Rule[a, ToString[b]];
	   If[FreeQ[params, "PageID"], 
	   Message[ServiceExecute::nparam, "PageID"]; Throw[$Failed]];
	   rawdata = 
	   OAuthClient`rawoauthdata[id, "RawPageData", 
	    Join[params, {"fields" -> 
	       StringJoin[Riffle[facebookpagefields, ","]]}]];      
	   data = facebookimport[rawdata];
	   Association[
	   Replace[Normal[data], 
	     HoldPattern[Rule[a_String, b_]] :> Rule[a, pagedataparse[b, a]], 
	     Infinity] /. Thread[facebookpagefields -> facebookpageNames]]   
	  ]

Note that this is a real function, not just a list of parameters. And in fact these requests can be arbitrary functions that never go to the web. In all of my connections I add extra meta requests that tell me about the object itself, such as what parameters its requests can take.

But the basic format looks like this:

	$servicenamecookeddata["Request", id_, args_] :=
	  Block[
	    {rawdata, params},
	    params = preProcessArguments[args];
	    rawdata = OAuthClient`rawoauthdata[id, "RawRequest", params];    
	    postProcessData[rawdata]
	   ]

Where that  [```OAuthClient`rawoauthdata```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/OAuthClient/ref/rawoauthdata.html)  will be  [```KeyClient`rawkeydata```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/KeyClient/ref/rawkeydata.html)  for services that use API keys.

And analogously to the raw request, this request a) needs to defined in  ```$servicenamecookeddata```  and b) needs to be added to the  ```"Gets"``` / ```"Posts"```  section of the  ```"ClientInfo"``` .

<a id="custom-service-connection" >&zwnj;</a>

# Custom Service Connection

All of this is nice to know for making them by hand, but generally it’s not worth it to fill all that out just to get an API connection. That’s why I built a function that can fill all of that out from a template. The basic idea is that there are template files that will programmatically configure a service connection if given the appropriate parameters and so the function simply needs to format the parameters appropriately.

<a id="template-files" >&zwnj;</a>

## Template Files

We’ll ignore load.m because it’s so basic.

### $ServiceConnectionLoad.m

The main thing we change here is to add the block:

	Block[{dir = DirectoryName[System`Private`$InputFileName]},
	  Switch[$ServiceConnectionClientName,
	     "OAuthClient" | "oauthclient" | "OauthClient",
	      OAuthClient`addOAuthservice,
	     "KeyClient" | "keyclient",
	      KeyClient`addKeyservice,
	     "OtherClient" | "otherclient",
	      OtherClient`addOtherservice
	     ]["$ServiceConnection", dir]
	  ]

Where the client name will be provided by the user and formatted by the function.

### $ServiceConnectionFunctions.m

This is a standard file that is in many service connections (although not either of the two we looked at). Looking at some of what we have in the template:

	$ServiceConnectionHelperNames
	(* OAuth loopback *)
	$serviceconnectionprivateoauthpagelink::usage =
	   "A local redirect URI that tells the user what the access code to \
	copy is";
	$serviceconnectionprivateoauthcloudlink::usage =
	   "A cloud exported redirect URI that tells the user what the access \
	code to copy is";
	$serviceconnectionprivateoauthtokenfile::usage =
	   "A fake OAuth token for when a real OAuth token isn't needed by \
	the OAuth client is desired";
	$$serviceconnectionaccesscodecloudlink::usage =
	  "A static cloud object URL for getting code copied"
	$$serviceconnectionaccesstokencloudlink::usage =
	  "A static cloud object URL for getting an access_token copied"
	(* Request Formatting *)
	$serviceconnectionreformatbodydata::usage =
	   "Reformats the BodyData parameter of a request. Used by default \
	for KeyClient";
	$serviceconnectionreformatmultipartbodydata::usage =
	   "Reformats BodyData into a MultipartData made of metadata and \
	content fragment";
	$serviceconnectionpatchedurlfetchblock::usage =
	   "A block that patches $$serviceconnectionurlfetchpatch into \
	URLFetch";
	$serviceconnectionpatchmultipartparams::usage =
	   "A block that sets the patching for multipart data";
	$$serviceconnectionlastrequest::usage =
	   "A symbol that temporariliy gets the request association when \
	using URLFetch override";

We see there’s a block for custom functions:  ```$ServiceConnectionHelperNames```  but also a bunch of stuff that will be common to all these connections (although renamed to avoid shadowing).

There’s stuff for forcing parameters into a  ```URLFetch```  which can be important for things like multi-part requests, and some functions for configuring call-back URLs plus two such URLs for code and access_token copying. In the future stuff could be added for using the channel framework to automatically pull in auth tokens, etc.

This file is where most of the customization happens.

### $ServiceConnection.m

This file provides a programmatic template for formatting these connections. The basic premise is that requests will be formatted as lists of rules, and the package will loop over these lists, filling out and customizing the  ```$servicenamedata```  and  ```$servicenamecookeddata```  functions.

In the cooked data functions it determines whether a request has a raw request underpinning it and, if so, uses a version of:

	$servicenamecookeddata["Request", id_, args_] :=
	  Block[
	    {rawdata, params},
	    params = preProcessArguments[args];
	    rawdata = OAuthClient`rawoauthdata[id, "RawRequest", params];    
	    postProcessData[rawdata]
	   ]

with pre and post provided

If there’s no raw request, it provides some basic  ```"RequiredParameters"```  checking and some other useful stuff, but basically just calls the function on the object and request parameters.

### Paclet Creation

Then the function just packs up the paclet with the appropriate PacletInfo.m so it can be installed.

<a id="template-notebook" >&zwnj;</a>

## Template Notebook

Given that there’re lots of parameters to track and fill out it makes sense to run this as a  <a href="https://raw.githubusercontent.com/b3m2a1/mathematica-BTools/master/Templates/ServiceConnectionTemplate.nb" download>template notebook</a> .

The template is divided into sections roughly corresponding to the sections of the $ServiceConnection.m file, they are:

* Basics - the name of the service, the prefix to stick onto function names, and the basic description

* Connection Info - the  ```"ClientInfo"```  setup, 4 different templates are provided for this

* Helper Functions - functions to be inserted into the $ServiceConnectionFunctions.m file for access throughout the connection. A few common functions are provided.

* Raw Import Functions - the setup for the RawRequests each is formatted like:

	$importFuncs["Raw" <> < name >] =
	  With[{
	    base = $serviceBase,
	    stdParams = $serviceBaseParameters
	    },
	   {
	    "URL" ->(*<URL> or (URLBuild[{< Params >,<Slots>, <
	    Params> ...}]&) for processes one can use `key` to insert a \
	keyword parameter*),
	    "Method" ->(* "Get", "Post", "Delete", etc. Defaults to "Get"*),
	    "Path" ->(* 
	    Parameters that will be inserted in the URL (in sequential order) \
	*),
	    "Parameters" ->(* 
	    Parameters that will be passed as Parameters to the URLFetch \
	function *),
	    "Required" -> (* the arguments that will be required *),
	    "Headers" -> (* Headers that will be passed by default *),
	    "Function" ->(* The function used to import the results *)
	    }
	   ];

* Cooked Functions - the functions that implement the actual requests. These look like:

	$cookedFuncs[< Name >] = {
	   "Call" -> Raw < Name >,
	   "Pre" -> < Preprocess Parameters Function >,
	   "Import" -> < Import Function >,
	   "Post" -> < Post Process Dataset >
	   };

* Paclet Creation - the setup for the paclet (with a section for adding a service connection icon). This section finally calls  ```CustomServiceConnection```  to build the paclet.

<a id="testing" >&zwnj;</a>

## Testing

The template notebook also provides a testing section so you can check that your connection is working as it should. The core of this is a function that will reload your paclet data:

	ServiceConnections`Private`findandloadServicePaclet[$serviceName]

But if you need to change your client info (say you added a request) this actually won’t suffice as the system calls  [```Once```](https://reference.wolfram.com/language/ref/Once.html) . For that, instead, you’ll need to actually clear the stored data:

	With[{func = $client <> "Client`Private`" <> ToLowerCase[$client] <> 
	    "$servicedata"},
	 Quiet[
	  Once[func[$serviceName]] =.;
	  $so // ServiceDisconnect
	  ]
	 ]

<a id="paclet-distribution" >&zwnj;</a>

## Paclet Distribution

Once you’ve stress tested your connection, you can move on to distributing it to others. This uses  ```PacletUpload```  to place the paclet in the cloud where others can access it:

	PacletUpload["ServiceConnection_" <> $serviceName] // 
	   Key["PacletFiles"] // First // First

Then all others need to do is call  [```PacletInstall```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/PacletManager/ref/PacletInstall.html)  on that link and they’ll be able to use your connection with  ```ServiceConnect``` .