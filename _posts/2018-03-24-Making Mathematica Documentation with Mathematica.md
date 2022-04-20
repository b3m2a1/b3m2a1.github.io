---
title: Making Mathematica Documentation with Mathematica
authors: b3m2a1
date: 2018-03-21 15:33:53
modified: 2018-03-24 10:18:02
permalink: making-mathematica-documentation-with-mathematica
tags: documentation
---


This post is going to be long on design and relatively short on code. As usual, it's exposition of something I spent a while developing and have  [cooked into one of my packages](https://github.com/b3m2a1/mathematica-BTools) .

I'm going to talk about how to make and distribute documentation in Mathematica, with specific emphasis on the automatic generation of documentation.

<a id="documentation-overview" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

# Documentation Overview

To start, though, we'll break down the types of things that we find in the documentation and which we'll want to support in a package. At this point there are about 10 different types of documentation formats out there:

* Symbol pages

* Guide pages

* Tutorial pages

* Message pages

* Format pages

* Service Connection pages

* HowTos

* Workflows

* Overviews

Of these, there are really only 4 distinct types of things that we see in the documentation folders:

* Reference Pages

* Guides

* Tutorials

* Workflows

And of these I opted to only implement the first three as they are the ones I use the most.

<a id="reference-pages-symbols" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Reference Pages (Symbols)

Ref pages come in a few different flavors, but the most common one, and the most common type of documentation in general, is the symbol page.

As of version 11.1 symbol pages look like this:

	Rasterize@Documentation`HelpLookup["ref/StatusArea"]

	(*Out:*)
	
![making-mathematica-documentation-with-mathematica-526634225825234956]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-526634225825234956.png)

Which can be split into 5 major parts

* Header bar

* Usage table

* Details

* Examples

* Related Links

We'll need to include each of these when we build our own docs

<a id="guide-pages" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Guide Pages

Guides have four parts. In the interest of space I won't show an actual image of a guide, but you can see one via:

	Documentation`HelpLookup["guide/PlottingOptions"]

These parts are 

* Header bar

* Title and abstract

* Function listing

* Related links

<a id="tutorials" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Tutorials

Tutorials are so much more flexible than guides of symbol pages that it only really makes sense to discuss three sections, with an optional fourth

* Header bar

* Jump-links (optional)

* Tutorial content

* Related links

This flexibility makes them both easier and harder to handle, as we'll get to later.

<a id="generating-documentation" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

# Generating Documentation

Now that we know what kinds of things we need to include we can move to how to include them. Before jumping into the actual code, though, it's worth noting that WRI does provide a tool for building docs.

<a id="workbench" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Workbench

Workbench is Wolfram's primary IDE. It's a plugin to Eclipse

### Why not just use Workbench?

There's no absolute reason not to use Workbench. Indeed it's probably got the lowest barrier to entry given that it's semi-battle-tested by WRI.

On the other hand, using Workbench restricts ones possibilities. It doesn't always stay up-to-date (as of writing this the documentation it builds by default is still on version 11.0) and by using it we lose the edge of our knowledge of Mathematica.

In general, Mathematica will be the best tool for manipulating Mathematica documents, so my view is why not simply provide a Mathematica package to do it?

<a id="docgen" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## DocGen

The package that I developed is called  [DocGen](https://github.com/b3m2a1/mathematica-BTools/blob/master/Packages/Paclets/DocGen.m)  (inspired by, but not nearly as clever as,  [doxygen](http://www.stack.nl/~dimitri/doxygen/) ). It uses my larger BTools toolchain to provide extra linkages to the entire Mathematica ecosystem.

### Documentation Templates

The first place any documentation starts is as a documentation template. This is simply a notebook with cell-types attached that will be post-processed into a full documentation notebook. We can make a new one for a Symbol Page like:

	(* to load DocGen *)
	<<BTools`Paclets`
	DocGen["SymbolPage", MyFunction, Method->"Template"]//CreateDocument;

	(*Out:*)
	
![making-mathematica-documentation-with-mathematica-7939871188899330678]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-7939871188899330678.png)

We can simply type in this notebook to add content. I'll fill this out, then generate it and we'll see what happens:

![making-mathematica-documentation-with-mathematica-5746074635887181910]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-5746074635887181910.png)

We can see that for the most part it looks the same, but now the notebook is formatted properly for use with the Documentation Center. In actually using the template we also find that there are, in essence, the different sections encoded—a usage template, a details box, an examples pane, and related links. We simply extract these and format them to build out the documentation page.

A similar workflow is implemented for guides and tutorials, except with different sections and cell types.

### Automatic Generation

This by itself doesn't give us much of a leg-up on Workbench. In fact, this template system may even be a little bit  *worse*  than Workbench's DocuTools (although significantly less bloated and quicker to use).

What does make this powerful is how it allows us to now  *automatically*  generate documentation, as all we need to do it extract parameters from a  ```Symbol```  or context and feed them into this type of template.

The actual details behind this can be a bit gory, but you can read about them in  [my post on StackExchange](https://mathematica.stackexchange.com/a/146671/38205) . In general we simply take the  ```Symbol```  and extract the usage patterns to fill out the usage table, the calling patterns to fill out the details, make a few sample Examples based on the calling patterns, and provide See Also links based on camel-case similarity in the first hump.

This is what  ```DocGen```  does by default, so for instance we can do:

	DocGen@DocGen

![making-mathematica-documentation-with-mathematica-6455205443540996861]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-6455205443540996861.png)

And we get a fully-functional documentation notebook automatically

We can take this further, though, and do the same for an entire set of  *contexts*  to link a package or multiple packages together:

	DocGen@
	 {
	  "BTools`Paclets`","BTools`FrontEnd`", 
	  "BTools`Web`", "BTools`External`",
	  "BTools`"
	  }

	(*Out:*)
	
![making-mathematica-documentation-with-mathematica-5587525071093655299]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-5587525071093655299.png)

This gives us a really powerful way to provide accessible documentation with a minimum of effort. In all, that makes it much more likely that the documentation will actually get made.

This also rewards good package design as the better ones definition patterns are, the clearer the documentation built will be.

<a id="distributing-documentation" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

# Distributing Documentation

Simply building the documentation isn't enough, though. Good documentation should serve as an advertisement for one's package. So the next thing to do is design a distribution system that allows us to publicize and distribute our documentation effectively. To do that we'll want to start with building some paclets for our docs.

<a id="documentation-paclets" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Documentation Paclets

### Paclets

I've talked about paclets before on a number of occasions, so I won't go into depth on them now, but if you want a refresher you can look  [here](https://www.wolframcloud.com/objects/b3m2a1/home/building-a-mathematica-package-ecosystem-part-1.html#main-content) . 

When we build our documentation paclets, we'll want to make them to have four properties:

* They are obviously documentation, not code

* They do not interfere or interact with the package they document in anyway

* They are modularized as much as possible

* They can be easily updated and versioned

The last one is easy using the paclet manager and a paclet server. The second to last can be done easily if packages are well partitioned into subcontexts. The first and second, however, are a little bit trickier.

If we have a paclet call  ```"MyPaclet"```  and we wanted to distribute its documentation separately, we couldn't simply call the documentation paclet  ```"MyPaclet"```  as well. Instead, we'll follow suit with what WRI does for many of its subpaclets, such as  ```"ServiceConnections"```  and curated data and append a qualifier to the paclet name. So instead of  ```"MyPaclet"```  we'll call it  ```"Documentation_MyPaclet"```  to make it obvious where it comes from.

The issue with this is that it breaks our simple lookup procedure, but happily it's simple enough to fix this. In the  ```"Documentation"```  extension to a  ```Paclet```  expression we find the option  ```"LinkBase"``` . This specifies what the lookup-root for things in the paclet should be. For instance if there is a page at  ```"Guides/MyPaclet"```  in our  ```"Documentation_MyPaclet"```  paclet, by using  ```"MyPaclet"```  as the  ```"LinkBase"```  this page will resolve to  ```"MyPaclet/guide/MyPaclet"```  on lookup, and so the documentation will behave as expected.

Overall, then, we'll have our  ```Paclet```  expression look like:

	Paclet[
	 Name -> "Documentation_MyPaclet", 
	 Version -> "1.0.0", 
	 Extensions -> 
	  {
	    {
	      "Documentation", 
	      "Language" -> "English", 
	      "LinkBase" -> "MyPaclet", 
	      "MainPage" -> "Guides/MyPaclet"
	      }
	    }
	  ]

This is something I go over  [here](https://mathematica.stackexchange.com/a/169488/38205)  as well.

### Paclet Server

With these documentation paclets in hand, we can go one step further and build a paclet server for our documentation (see the refresher link for paclets for a refresher on paclet servers, too). This will be an entirely generic paclet server, but it will serve as a way to easily share documentation in small chunks, just like curated data. I set up a server for all the documentation I've built  [here](https://www.wolframcloud.com/objects/b3m2a1.docs/DocumentationServer/main.html)  which looks like:

![making-mathematica-documentation-with-mathematica-2355226512675681026]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-2355226512675681026.png)

People can then install pieces of documentation from there, like:

	PacletInstall[
	 "Documentation_PacletManager",
	 "Site"->
	  "http://www.wolframcloud.com/objects/b3m2a1.docs/DocumentationServer"
	 ]

	(*Out:*)
	
![making-mathematica-documentation-with-mathematica-2019233375110478896]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-2019233375110478896.png)

And they'll be immediately ready to use in Mathematica.

<a id="documentation-sites" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Documentation Sites

One last thing to comment on is how we can take our documentation  ```Notebooks```  and turn them into true HTML documentation which you can peruse on the web. This will involve taking some pieces out of Workbench (but which I've made accessible from a paclet server, so no worries if you don't want to download Workbench).

### HTML Documentation

Workbench provides some facilities for generating HTML documentation. These facilities are (as of when I wrote this package) limited to 11.0-style documentation, but that's more than good enough for most things. 

The main thing I needed to do was apply a thorough cleaning to the documentation pages I generated to make sure the finicky package that actually generates the HTML (called  ```Transmogrify```  which is in turn called by a higher-level package called  ```DocumentationBuild``` ) won't hang when it reaches a directive it doesn't know how to process.

After that, the main issue was simply making sure all the appropriate resources are deployed, and then we're good to go.

I've built this into  ```DocGen```  as a method. So if you want to build out HTML documentation for a paclet or set of paclets you can do it like:

	DocGen["HTML", PacletFind["Documentation_BTools*"]]

	(*Out:*)
	
	{
	 {"~/Library/Mathematica/Applic"…"Gen/Web/BToolsWeb/guide/BToolsWeb.html",<<24>>,""…""},
	 {"~/Library/Mathematica/Applic"…"Gen/Web/BToolsWeb/guide/BToolsWeb.html",<<24>>,""…""},
	 {"~/Library/Mathematica/Appli"…"oolsExternal/guide/BToolsExternal.html",<<22>>,""…""},
	 {"~/Library/Mathematica/Appli"…"oolsFrontEnd/guide/BToolsFrontEnd.html",<<40>>,""…""},
	 {"~/Library/Mathematica/ApplicationData/DocGen/Web/BTools/guide/BTools.html"},
	 {"~/Library/Mathematica/Applicat"…"Web/BToolsPaclets/ref/AppAddContent.html"}
	 }

And this can be deployed to the web to use as documentation. If we want that we can simply run it with  ```CloudDeploy->True```  and it will do so.

Alternately  ```DocGen```  also support deploying built HTML automatically, which we can see in the  ```"Methods"``` :

	DocGen["HTML", "Methods"]

	(*Out:*)
	
	{Automatic,"Deploy"}

The best way to do this is passing the directory with all the HTML:

	DocGen["HTML", PacletFind["Documentation_BTools*"], Method->"Deploy"];

### Documentation Site

We can take this a step further though, and build a wrapper around this type of functionality to get it to upload 

	DocumentationSiteBuild["BuildOverview"->True, "AutoDeploy"->True];

This creates  [a site](https://www.wolframcloud.com/objects/b3m2a1.docs/main.html)  where we can browse all of the exposed documentation, much like the paclet server we had before:

![making-mathematica-documentation-with-mathematica-7555384944798244364]({{site.base_url}}/img/making-mathematica-documentation-with-mathematica-7555384944798244364.png)

And with that, I think, we're done.