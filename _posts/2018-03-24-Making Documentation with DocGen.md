---
title: Making Documentation with DocGen
authors: 
date: 2018-03-24 10:16:29
modified: 2018-03-24 13:08:59
permalink: making-documentation-with-docgen
tags: documentation
---

Here's a quick example of how we can use some of the stuff I showed  [in this post](https://www.wolframcloud.com/objects/b3m2a1/home/making-mathematica-documentation-with-mathematica.html)  to build out full documentation by hand.

<a id="getting-docgen" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Getting DocGen

This post will be using my DocGen system which is built into a large package of mine that supports other parts of the development process as well. This package lives in a paclet on my paclet server. You can install it with:

	PacletInstall["BTools",
	 "Site"->""
	 ]

If you want to learn more about making paclet servers you can read more  [here](https://www.wolframcloud.com/objects/b3m2a1/home/building-a-mathematica-package-ecosystem-part-1.html) .

<a id="documenting-the-templating-system" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Documenting the Templating system

We're going to make use of a palette I designed for helping with the documentation system. After you've installed BTools you can open it by looking for  ```BTools▸DocGen```  in the palettes menu:

![making-documentation-with-docgen-50323364875999283]({{site.base_url}}/img/making-documentation-with-docgen-50323364875999283.png)

### Palette Overview

The entire palette looks like this:

![making-documentation-with-docgen-7767653871764496452]({{site.base_url}}/img/making-documentation-with-docgen-7767653871764496452.png)

If we look at it, it essentially has five sections:

![making-documentation-with-docgen-6312758860212914569]({{site.base_url}}/img/making-documentation-with-docgen-6312758860212914569.png)

The first of these chooses the paclet and lets us open the relevant config files. The second lets us open any built documentation pages for this context. The third actually generates the content and optionally deploys it to the cloud. The fourth will make documentation indices for pre version 11.2 and the last creates a new documentation paclet.

### Creating a new Documentation Paclet

We start off by making a new paclet to hold our documentation. To do that we just use the  ![making-documentation-with-docgen-7009256029017860706]({{site.base_url}}/img/making-documentation-with-docgen-7009256029017860706.png)  button. It pops up a window:

![making-documentation-with-docgen-2791007331622069100]({{site.base_url}}/img/making-documentation-with-docgen-2791007331622069100.png)

And we simply provide the name of our paclet. The current project will then switch to  ```"Templating"``` :

![making-documentation-with-docgen-1743412973075559677]({{site.base_url}}/img/making-documentation-with-docgen-1743412973075559677.png)

And we see the paclet info and config file have been built:

![making-documentation-with-docgen-552763968467873143]({{site.base_url}}/img/making-documentation-with-docgen-552763968467873143.png)

### Making a SymbolPage Template

First we go to the  ```"Context Pages"```  menu and select  ```"Symbol Page Template"```

![making-documentation-with-docgen-3053272758509917492]({{site.base_url}}/img/making-documentation-with-docgen-3053272758509917492.png)

This opens up a notebook with templates for all the symbols in the context:

![making-documentation-with-docgen-462167994733675065]({{site.base_url}}/img/making-documentation-with-docgen-462167994733675065.png)

### Making a Symbol Page

We can fill out the content for a page:

![making-documentation-with-docgen-5498733888786341535]({{site.base_url}}/img/making-documentation-with-docgen-5498733888786341535.png)

And then we use the docked cell on the template page to build out the HTML (with the bracket for the content we're generating selected):

![making-documentation-with-docgen-2943174513768772591]({{site.base_url}}/img/making-documentation-with-docgen-2943174513768772591.png)

This then builds a doc page for us:

![making-documentation-with-docgen-725166031214461507]({{site.base_url}}/img/making-documentation-with-docgen-725166031214461507.png)

### Saving a Symbol Page

Alternately we can do this from the palette using the  ```"Generate and Save"```  menu to save the page to the current paclet:

![making-documentation-with-docgen-6219661019162151278]({{site.base_url}}/img/making-documentation-with-docgen-6219661019162151278.png)

And then if we go to the  ```"Open Symbol Page"```  menu we see we've generated and saved the page:

![making-documentation-with-docgen-3284837002929066762]({{site.base_url}}/img/making-documentation-with-docgen-3284837002929066762.png)

### Making Multiple Pages

Alternately, if we opted not to select a cell bracket the package will generate a page for every template in the  [```InputNotebook```](https://reference.wolfram.com/language/ref/InputNotebook.html) . Or if we had selected multiple brackets pages would be generated for each. This gives us a way to easily update our documentation from a saved template. Here's what we get if we did it with no bracket selected:

![making-documentation-with-docgen-6556851610799844716]({{site.base_url}}/img/making-documentation-with-docgen-6556851610799844716.png)

### Deploying the Paclet

The DocGen palette doesn't directly support deploying this paclet to a server, but we can use the Paclet Server Manager palette that also comes with BTools to do that. I won't go into the details, though, as they're documented  [here](https://mathematica.stackexchange.com/a/160987/38205) .

### Generating HTML Documentation

We can also use these template to build HTML documentation. To do this without deployment we can simply select the  ```"Symbol Web Pages"```  action from the  ```"Generate from Notebook"```  menu (again with the bracket selected):

![making-documentation-with-docgen-6451737925142533680]({{site.base_url}}/img/making-documentation-with-docgen-6451737925142533680.png)

This builds to a temporary directory (it also mirrors the display assets it needs the first time it's generated). The Cloud Deploy option comes into play when using the  ```"Generate and Save"```  menu.

After this copies every thing and generates the HTML we end up with a page that looks like:

![making-documentation-with-docgen-1179710600402752990]({{site.base_url}}/img/making-documentation-with-docgen-1179710600402752990.png)

Which of course looks like the 11.0 docs, but until a new version of  ```"Transmogrify"```  and  ```"DocumentationBuild"```  come out this is what we're restricted to. That, unfortunately, is outside of my control so we'll stop at this.