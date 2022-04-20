---
title: Building a Mathematica Package Ecosystem, Part 1.
authors: 
date: 2017-08-29 02:53:34
disqus_ID: b3m2a1-home-a7f6cc97-f14d-4669-831c-dd6475ea1124
modified: 2017-09-05 03:21:25
permalink: building-a-mathematica-package-ecosystem-part-1
tags: mathematica
---

We’ll start off this post by trying to establish what we mean by a “Package Ecosystem”. The basic idea is a collection of frameworks that make package distribution and development easy and relatively seamless. Essentially, we’ll want something or a collection of somethings that don’t actually (explicitly) change the way we write our code, but more how we share it and link it to others’ code. And to make it as seamless as possible, we’ll want to be able to run everything via Mathematica.

Before we start implementing away, we need to consider how useful it is to implement something like this for ourselves, given that there’s a platform out there already that covers the vast majority of what we’ll need:  [GitHub](https://github.com) . Let’s look at what it brings to the table so we can see where exactly it’s insufficient (or at least where we can build systems that complement it).

GitHub gives us two major things:

* Easy sharing of source code 

* A standard platform for hosting packages

And, really, these cover most of the bases, with that last one being the most notable. The fact that GitHub is the de-facto standard for code distribution is probably the single best reason to put one’s code on it. People trust GitHub, and are used to using it, and so if you put your code in a GitHub repo and simply send people there they’ll generally know what to do.

The major problem with using just GitHub, though, is that it’s not designed for scaling up. That is, you can put up your code, you can put up a Readme, you can even start to build out pages and sites, but at some point if you want to go bigger or customize more you start to hit the constraints of the (very nice and convenient) space GitHub has provided for you.

A more minor problem, but still an important one, is that in general you’ll want to use Mathematica’s native package distribution system and it doesn’t work great with GitHub. Mathematica allows you to build out servers from which to distribute your packages, but GitHub, given the server configurations necessary.

So we’ll approach ecosystem building from two directions. We’ll want easy distribution of our code in a packaged format (as we can easily just host the source on GitHub) and and convenient systems for documenting our code and distributing this documentation, as nothing serves as a better advertisement for code than good doc pages.

For reasons of space and attention span, we’ll only handle the first part of that in this post and push documentation off to another.

<a id="package-distribution" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Package Distribution

Unfortunately, before we can discuss how we’re going to simplify package distribution, we’ll need to talk about paclets.

### WTF is a “Paclet”?

A paclet is Mathematica’s package distribution format. It’s basically the source-code for a package, plus a metadata PacletInfo.m file. The source looks like a standard Mathematica application, e.g.:

	Package
	 Package.m
	  + Kernel
	    - init.m
	  + FrontEnd
	    + StyleSheets
	      - ss1.nb
	      ...
	      + Palettes
	      - palette1.nb 
	      ...
	    + Documentation
	    + English
	      + ReferencePages
	        + Symbols
	      + Guides
	      + Tutorials

But now we have an extra PacletInfo.m file so it looks like:

	Package
	 Package.m
	 PacletInfo.m
	  + Kernel
	    - init.m
	  etc.

And this PacletInfo.m really just contains a single expression with the head  ```Paclet``` . All you absolutely need is this:

	Paclet[
	  Name -> "Package",
	  Version -> "nn.nn.nn"
	  ]

But to build a nice distribution ecosystem it’s much better to have something like this:

	Paclet[
	  Name -> "Package",
	  Version -> "nn.nn.nn",
	  Description -> "A few lines of package description",
	  Creator -> "me@me.me"
	  ]

This file can also specify things about the package via an  ```"Extensions"```  argument, but we won’t deal with that here. We’ll restrict ourselves to this more basic information.

Now for our use we’ll include a few fields that currently have no meaning in the paclet expression, but which will be useful for us. Our expression will end up looking like:

	Paclet[
	  Name -> "Package",
	  Version -> "nn.nn.nn",
	  Description -> "A few lines of package description",
	  Creator -> "me@me.me",
	  Tags -> {"a", "list", "of", "tags"},
	  Categories -> {"a", "list", "of", "categories"}
	  ]

This expression then gets exported to PacletInfo.m and the whole package is compressed to a .paclet file. This is the file format we’ll work with.

### Paclet Servers

The paclet file format is a distribution format and so Mathematica also provides tools for managing these distributions. The basic use case is to call  ```PacletInstall```  on one of these paclet files, this works as such:

	PacletInstall@"path/to/paclet"

or

	PacletInstall@"http://url/of/paclet"

depending on whether one has downloaded the paclet or not. And this can be reversed by calling  ```PacletUninstall```  on the paclet name or paclet name and version.

There’s another usage though, which involves what’s known as a paclet server (or paclet site). This is how Wolfram Research distributes its packages and addons. We can find the Wolfram paclet server as follows:

	$PacletSite

	(*Out:*)
	
	"http://pacletserver.wolfram.com"

Actually, that’s not quite what the real server site is. We can figure out how to find the real server site by looking at the source code for the manager. In it we find this:

	StringReplace[$PacletSite, 
	  "pacletserver" -> (
	     "pacletserver" <> 
	    PacletManager`Services`Private`$wriPacletServerIndex
	     )]

	(*Out:*)
	
	"http://pacletserver4.wolfram.com"

Per the comments in the source that 4 is just something that WRI puts in place for performance reasons. It’s randomly chosen between 1 and 6 and seems to define a mirror server. In any case, we can find what’s living on that server by looking at the paclet server version of a sitemap, which is a file called PacletSite.mz

	Import[
	  URLRead@
	   HTTPRequest[
	      StringReplace[$PacletSite, 
	         "pacletserver" -> (
	            
	        "pacletserver" <> 
	         PacletManager`Services`Private`$wriPacletServerIndex
	            )] <> "/PacletSite.mz",
	    <|
	     "UserAgent" -> PacletManager`Package`$userAgent,
	       "Headers" -> {
	          "Mathematica-systemID" -> $SystemID, 
	       "Mathematica-license" -> ToString[$LicenseID],
	          "Mathematica-mathID" -> ToString[$MachineID], 
	       "Mathematica-language" -> ToString[$Language],
	          "Mathematica-activationKey" -> ToString[$ActivationKey]}
	     |>
	    ],
	  {"ZIP", "PacletSite.m"}
	  ] // Take[#, 5] &

	(*Out:*)
	
	PacletSite[PacletManager`Paclet[
	 "Name" -> "Alexa", "Version" -> "1.0.0", 
	  "MathematicaVersion" -> "10+", 
	  "Description" -> "Easily create Alexa skills for the Amazon Echo \
	and other devices that support Alexa Voice Services.", 
	  "Creator" -> "Todd Gayley", 
	  "Extensions" -> { {
	    "Kernel", "Root" -> "Kernel", "Context" -> "Alexa`"}, {
	    "Documentation", "Language" -> "English", 
	     "MainPage" -> "Alexa/guide/AlexaSkills"}, {
	    "LibraryLink"} }], PacletManager`Paclet[
	 "Name" -> "ARDrone", "Version" -> "0.3.1", 
	  "Extensions" -> { {
	    "Kernel", "Root" -> "Kernel", "Context" -> "ARDrone`"}, {
	    "Documentation", "MainPage" -> "Tutorials/ARDroneTutorial"}, {
	    "LibraryLink"} }], PacletManager`Paclet[
	 "Name" -> "AstronomicalData_AdditionalExoplanetHostStars", 
	  "Version" -> "9.0.15", "MathematicaVersion" -> "9.0+", 
	  "BackwardCompatible" -> "*", 
	  "Extensions" -> { {
	    "Resource", "Root" -> "Data"} }], PacletManager`Paclet[
	 "Name" -> "AstronomicalData_Comets1", "Version" -> "7.0.17", 
	  "MathematicaVersion" -> "7.0+", "BackwardCompatible" -> "*", 
	  "Extensions" -> { {
	    "Resource", "Root" -> "Data"} }], PacletManager`Paclet[
	 "Name" -> "AstronomicalData_Comets1", "Version" -> "8.0.9", 
	  "MathematicaVersion" -> "8.0+", "BackwardCompatible" -> "*", 
	  "Extensions" -> { {"Resource", "Root" -> "Data"} }]]

And we see this is just an expression  ```PacletSite```  which contains a bunch of those  ```Paclet```  metadata files. And each of these metadata files points to a .paclet file on the server, hosted at server.url/Paclets/name-version.paclet. Finally, we can then install and update paclets from one of such a server by name one of two ways:

* Set the server as a site and call  ```PacletInstall```

* Pass the site as the  ```"Site"```  option to  ```PacletInstall```

Either way works, although having previously added the site can be faster as Mathematica will store that data from the PacletSite.mz file.

In any case, since Wolfram’s paclet server is already set as a known site let’s just quickly look at how this works:

	PacletInstall["Alexa"]

	(*Out:*)
	
	PacletManager`Paclet[
	"Name" -> "Alexa", "Version" -> "1.0.0", 
	 "MathematicaVersion" -> "10+", 
	 "Description" -> "Easily create Alexa skills for the Amazon Echo and \
	other devices that support Alexa Voice Services.", 
	 "Creator" -> "Todd Gayley", 
	 "Extensions" -> { {
	   "Kernel", "Root" -> "Kernel", "Context" -> "Alexa`"}, {
	   "Documentation", "Language" -> "English", 
	    "MainPage" -> "Alexa/guide/AlexaSkills"}, {"LibraryLink"} }, 
	 "Location" -> "~/Library/Mathematica/Paclets/Repository/Alexa-1.0.0"]

### Making an Extended Paclet Server

Happily, this handles most of the distribution side of things, as we can easily pack up and ship out our packages via a server. The issue is that it’s not all that easy for people to figure out what’s on a paclet server and therefore even though we have a nice, easy-to-use, installation process, our packages aren’t really any more mobile than before.

But recall that we have that  ```PacletSite```  expression that tells us everything that’s on the server to be distributed. Moreover it gives us all of that metadata. So why not use all of this information to build a nicer way to show people what’s on a server?

There are two approaches to this that I’ve thought of and liked:

* Create a GUI to be run within Mathematica that provides, for every paclet in the  ```PacletSite``` :  a) The paclet metadata b) Whether it has been installed already c) Whether an update is available d) Install and uninstall buttons

* Create a static site for a paclet server that provides shingles for each package

Both are good options, I think, and honestly they are complementary. At this point in time though, I have only implemented the latter, as I think it gets us further.

My approach to this was to use a Mathematica implementation of the  [pelican site generator](https://blog.getpelican.com/)  for python. Building this may get its own post some day, but here’s  [a link to the source](https://github.com/b3m2a1/mathematica-SiteBuilder) . The basic idea is that we write static content in markdown which get converted to HTML, passed through templates, and aggregated by tags, categories, etc.

It is for this reason that we’re adding the  ```Tags```  and  ```Categories```  fields to our  ```Paclet```  expressions. Each paclet will get a page that lists its information from the  ```Paclet```  expression as well as a link to download the paclet (the address from which can of course also simply be copied and fed into  ```PacletInstall``` ).

Happily, since I had already written a notebook to markdown converter for building this site, I could simply export the information to a notebook expression, which is more extensible that going straight to markdown.

There are particulars about building servers that will be discussed later, but first let’s just look at one of these sites in action.  [This](https://www.wolframcloud.com/objects/b3m2a1.paclets/PacletServer/main.html)  is my personal paclet server. It serves up all of the paclets I make and so is obviously my guinea-pig server for building such a site. We’ll note a few things about the site that make it useful for getting paclets off of:

* It has a landing site that lays out everything that’s on the site:

![building-a-mathematica-package-ecosystem-part-1-8752386334307355490]({{site.base_url}}/img/building-a-mathematica-package-ecosystem-part-1-8752386334307355490.png)

* Each paclet in turn has a page laying out the info on the paclet

![building-a-mathematica-package-ecosystem-part-1-6837272127839565584]({{site.base_url}}/img/building-a-mathematica-package-ecosystem-part-1-6837272127839565584.png)

* There’re aggregation pages for things like authors, categories, and tags:

![building-a-mathematica-package-ecosystem-part-1-1410395217613385545]({{site.base_url}}/img/building-a-mathematica-package-ecosystem-part-1-1410395217613385545.png)

These make clicking through and figuring out what’s there easier and, of course, the release pages for each paclet can be tweaked and customized and pages detailing more of what’s on the server can be added, etc. 

Now, back to how we build our server. We’ll assume we have a a paclet named  ```"MyPack"```  that’s discoverable as a .paclet file or a directory via  ```PacletFind``` . I’ve built out a function called  [```PacletUpload```](https://www.wolframcloud.com/objects/b3m2a1.paclets/reference/BTools/ref/PacletUpload.html)  that packs a paclet and pushes it to a server. Generally this server is in the cloud, which is useful quick sharing, but makes it hard to build a good paclet server off of. Conveniently, though, a paclet server can be local and served via the  [file:// protocol](https://en.wikipedia.org/wiki/File_URI_scheme)  and so I had previously extended  ```PacletUpload```  to work with local uploads. We will make good use of that here.

We’ll stick our server here:

	FileNameJoin@{$UserBaseDirectory, "ApplicationData", "WebSites", 
	  "PacletServer"}

The decision to put it in ApplicationData/WebSites is pretty much arbitrary (and other locations may be used) but it’ll do for now.

So with that in mind we now need to get our paclets onto our server. For that I wrote a function,  ```PacletServerAdd``` , that is really just a wrapper to  ```PacletUpload``` :

	Options[PacletServerAdd] =
	   Options@PacletUpload;
	PacletServerAdd[
	    pacletSpecs : $PacletUploadPatterns,
	    ops : OptionsPattern[]
	    ] :=
	   PacletUpload[pacletSpecs,
	     ops,
	     Sequence @@
	       FilterRules[
	         Normal@$PacletServer,
	         Options@PacletUpload
	         ],
	     "UseCachedPaclets" -> False,
	     "UploadSiteFile" -> True
	     ];

(note that  ```PacletUpload```  is a something of a behemoth of a function and so is unsuitable to put here)

This just tosses the paclet onto our server:

	PacletServerAdd["SiteBuilder"]

And the we’ll have a function  ```PacletServerBuild```  that will take those markdown files (from the markdown notebooks we built for each paclet), send them through a the  ```WebSiteBuild```  function that process pages in a static website, and return a site in an output directory almost ready to be deployed:

	PacletServerBuild[]

	(*Out:*)
	
	"~/Library/Mathematica/ApplicationData/WebSites/PacletServer/output"

 Then our actual deployment will simply copy the Paclets directory and PacletSite.mz file into this directory and copy it all to the cloud with  ```WebSiteDeploy``` :

	Take[PacletServerDeploy[], 3]
	(*Returns all of the cloud objects it makes, so we'll just take three \
	of them*)

	(*Out:*)
	
	{CloudObject[
	 "https://www.wolframcloud.com/objects/user-e4d1d43a-267f-4924-934a-\
	2ba2321519a9/PacletServer/authors/b3m2a1.html"], CloudObject[
	 "https://www.wolframcloud.com/objects/user-e4d1d43a-267f-4924-934a-\
	2ba2321519a9/PacletServer/authors.html"], CloudObject[
	 "https://www.wolframcloud.com/objects/user-e4d1d43a-267f-4924-934a-\
	2ba2321519a9/PacletServer/btools.html"]}

And now our server is ready for other people to use

<a id="moving-forward" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Moving Forward

Now that we have a good distribution format and a good way to publicize these distributions, we can move to the issue of popularizing such a format. The core difficulty here is, of course, that aggregating all of this information is a step that many people may not feel worth their time.

We can, however, make this more palatable to people by providing functionality that makes all of this easier, as decreasing barriers to development can only help get good packages and content out there in the long term. This will focus on simplifying the application building process in Mathematica. But unfortunately it will have to wait for another post.