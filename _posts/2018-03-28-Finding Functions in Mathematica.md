---
title: Finding Functions in Mathematica
authors: 
date: 2018-03-28 18:25:23
Modified: 2018-03-28 19:21:45
permalink: finding-functions-in-mathematica
tags: documentation
---

As someone who has used Mathematica for a long time now, one thing I often forget is how hard it can be to find the best functions for a given task when you're just starting out.

Mathematica has a nice  [```Documentation Center```](https://reference.wolfram.com/language/guide/WolframRoot.html) , but finding stuff in it often turns into a long slog of randomly clicking through links. The documentation search is okay, but it's generally cluttered with links and cruft and not clever enough on the fuzzy-matching that people usually want. 

So we're going to develop and alternative for finding the right function for the job. I'll build up to this and provide a package implementation at the end.

<a id="names-and-wildcards" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Names and Wildcards

The heart of this approach will be the function  [```Names```](https://reference.wolfram.com/language/ref/Names.html) . This takes a string pattern and returns all the symbols matching that pattern. If you remember nothing else from this, keep in mind that  ```Names```  is your best friend when working with Mathematica. It allows us to use  [```string pattern-matching syntax```](https://reference.wolfram.com/language/tutorial/StringPatterns.html)  to find functions. That lets us use wildcards and other things. For example, to find all the  ```"*View"```  functions we could do:

	Names["*View"]

	(*Out:*)
	
	{"FlipView","GalleryView","MenuView","OpenerView","PopupView","SlideView","TableView","TabView"}

And then we can look at the docs for each of these

<a id="helplookup" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## HelpLookup

With these in hand, we can turn to their doc pages. Now, we could obviously select the string and press Command-F for each, but we can do this more automatically, using the function  ```Documentation`HelpLookup``` . For instance, if we wanted to find the doc page for a function that we know has  ```"Log"```  and the name and ends in  ```"Plot"``` , we could just do:

	Documentation`HelpLookup@First@Names["*Log*Plot"]

	(*Out:*)
	
![finding-functions-in-mathematica-2084183971320515060]({{site.base_url}}/img/finding-functions-in-mathematica-2084183971320515060.png)

<a id="printdefinitionslocal" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## PrintDefinitionsLocal

Most of the time, though, the documentation page isn't enough. It's a template for how to use a function, but doesn't give us the whole story. Better is to be able to  [spelunk a symbol](https://mathematica.stackexchange.com/a/15948/38205) . This is actually built-in as of 10.1 and the function is  ```GeneralUtilities`PrintDefinitionsLocal```  (there's also a version that opens a new notebook but that one's generally clumsier in my view).

Now we can do stuff like look at functions that help us define layers in NNs:

	LinearLayer; (* This autoloads the NN context *)
	GeneralUtilities`PrintDefinitionsLocal@First@Names["NeuralNetworks`Define*Layer"]

	(*Out:*)
	
![finding-functions-in-mathematica-1755617662583270663]({{site.base_url}}/img/finding-functions-in-mathematica-1755617662583270663.png)

<a id="putting-it-all-together" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Putting it All Together

Now we can combine these parts to write a function that will take a string pattern, provide links to the documentation via  ```Documentation`HelpLookup``` , and also wrap in the  ```GeneralUtilities`PrintDefinitionsLocal```  data at the bottom of the page. I've written this into a package here.

You can load the package like this:

	Get["https://raw.githubusercontent.com/b3m2a1/mathematica-tools/master/DocFind.wl"]

And then we can go-to-town. First let's find all the functions in the  ```"NeuralNetworks`"```  context:

	DocFind["*", "NeuralNetworks`", Select->"Function"]

	(*Out:*)
	
![finding-functions-in-mathematica-2210417243271107702]({{site.base_url}}/img/finding-functions-in-mathematica-2210417243271107702.png)

Clicking on any of these links will attempt to open the doc page and will stick the  ```PrintDefinitionsLocal```  data at the bottom:

	(*Out:*)
	
![finding-functions-in-mathematica-2963264718765358883]({{site.base_url}}/img/finding-functions-in-mathematica-2963264718765358883.png)

This makes finding the functions we need so much nicer.

Alternately we can just search for any function with the name  ```"DocFind"```  in the  [```$Packages```](https://reference.wolfram.com/language/ref/%24Packages.html) :

	DocFind["DocFind"]

	(*Out:*)
	
![finding-functions-in-mathematica-5233777250735749012]({{site.base_url}}/img/finding-functions-in-mathematica-5233777250735749012.png)

This is how I generally use the function. And with sophisticated pattern matching we can find functions that we know  *should*  exist but we just don't have the names for. Say a constant somewhere in the  ```"PacletManager`"```  context that has  ```"Dir"```  in its name:

	DocFind["Dir", "PacletManager*", Select->"Constant"]

	(*Out:*)
	
![finding-functions-in-mathematica-1817945970746530836]({{site.base_url}}/img/finding-functions-in-mathematica-1817945970746530836.png)

And now figuring out how the  ```"PacletManager`"```  works is as simple as doing a few  ```DocFinds```  and clicking a few links.