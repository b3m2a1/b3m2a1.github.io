---
title: Building Websites with Mathematica
authors: b3m2a1
date: 2017-07-23 03:27:43
disqus_ID: b3m2a1-home-c483b162-3932-4eed-bdb5-80b63a7fff5d
modified: 2018-05-01 22:35:15
permalink: building-websites-with-mathematica
tags: mathematica python meta
---

For this website's inaugural post I thought I'd detail how it was built.

It starts, I suppose, with an HTML templating package I wrote. For various things I'd needed to host static HTML pages in the Wolfram Cloud. My basic process there was to write some block like:

```lang-mathematica
$htmlTemplate=
 "<html>
   <a href=\"my-link\">``</a>
  </html>"
```

And I'd fill it in with various parameters using  [```TemplateApply```](https://reference.wolfram.com/language/ref/TemplateApply.html) .

Over time this just got too clunky, though, and I wanted a better system, so I sunk a day's work into building a system to display that HTML right in the notebook as a listing of cells and export it to a .html file, exporting all the CSS and image necessary to get things working.

And, you know, it worked pretty well. But on the other hand it meant I was writing the raw HTML. Even speeding things up using templates and nicer stylesheets could only got me so far. That prompted me to think "hmm... do I know do this for markdown and write a converter?" which I really didn't like the thought of. So instead I decided to look at  [a website](http://szhorvat.net/pelican)  I had a guess was built programmatically. Which eventually got me to  [pelican](https://blog.getpelican.com/) .

Looking through the docs got me convinced that this was, in fact, the way I wanted to render a site. It was simple, supported Markdown syntax, was extensible. And even better it was written in python so if I had to extend things or figure out what was going on I'd be able to do it in a langue I was fluent in.

<a id="installing-pelican" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Installing Pelican

So as with most python projects, the step-1 is to build a virtual environment and install via pip. The whole flow looks like this:

    #!/bin/sh
    venv ~/virtualenvs/pelican
    cd ~/virtualenvs/pelican
    source bin/activate
    pip install pelican

I thought, though, that it might make sense to build this into Mathematica. After all there're a lot of quality python packages out there and the easier it is to use them in my primary development environment the better. 

So I built a quick  [```ProcessObject```](https://reference.wolfram.com/language/ref/ProcessObject.html)  wrapper for a virtual environment, which I use via the  [```PyVenvRun```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/PyVenvRun.html)  function

The core of the function is that there is a  ```ProcessObject```  which has been initialized with the appropriate virtual environment. If one hasn't been started,  ```PyVenvRun```  starts it and kills after the run is over. In the run itself it generates start/end-of-process flags via  [```CreateUUID```](https://reference.wolfram.com/language/ref/CreateUUID.html) , passes the start flag to be echoed, passes the appropriately escaped command, then the end flag to be echoed command and reads until it times out or finds the end of process flag.

Here's a sample using my python3.4 environment

    PyVenvRun["python3.4",
      "python -V"
      ]

    (*Out:*)
    
    <|"StandardOutput"->"Python 3.4.4","StandardError"->""|>

It has a timeout, of course, for when things go wrong, which defaults to one second:

    PyVenvRun["python3.4",
      "sleep 2; echo cat"
      ]

    (*Out:*)
    
    <|"StandardOutput"->"","StandardError"->""|>

You can see that it just timed out there, generating no output. But we can get the output back by increasing the timeout:

    PyVenvRun["python3.4",
      "sleep 2; echo cat",
      TimeConstraint->5
      ]

    (*Out:*)
    
    <|"StandardOutput"->"cat","StandardError"->""|>

In any case that's not terribly exciting. We'll use it, though, with a virtualenv set up with pelican and Markdown, to build our site.

<a id="creating-the-site" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Creating the Site

To actually build the site we need to set up the core content and setting files and provide a theme, the latter of which being of course the bigger time-sink. With that we can test locally using another python command-line tool.

### Directory Structure & Basic Configuration

The actual function for building the site is just going to be a very simple wrapper to  ```PyVenvRun``` , but before that the site needs actual content.

For that we'll take a look at the standard pelicanconf.py file that the `pelican-quickstart` command in the CLI will produce, then replace the fields with templates:

    "#!/usr/bin/env python
    # -*- coding: utf-8 -*- #
    from __future__ import unicode_literals
    
    AUTHOR = u'`Author`'
    SITENAME = u'`Title`'
    SITEURL = '`URL`'
    
    PATH = 'content'
    STATIC_PATHS = ['posts','img']
    
    TIMEZONE = '`Timezone`'
    
    DEFAULT_LANG = u'`Language`'
    
    # Feed generation is usually not desired when developing
    FEED_ALL_ATOM = None
    CATEGORY_FEED_ATOM = None
    TRANSLATION_FEED_ATOM = None
    AUTHOR_FEED_ATOM = None
    AUTHOR_FEED_RSS = None
    
    # Enable Markdown
    MARKDOWN = {
     `MarkdownExtensions`
     }
    
    # Theme
    
    THEME = '`Theme`'
    
    # Blogroll
    LINKS = `Links`
    
    # Social widget
    SOCIAL = `Social`
    
    DEFAULT_PAGINATION = `PaginationNumber`
    
    # Uncomment following line if you want document-relative URLs when developing
    #RELATIVE_URLS = `UseRelativeURLs`"

We'll set that up with a function that will also build out the editing layout.

### Themes

Generally, one is expected to provide a custom theme for one's pelican website. There are lots of different pelican themes out there, many are quite attractive. I chose a very simple (but nice) one to build off of called  [alchemy](https://github.com/nairobilug/pelican-alchemy) .

For convenience when testing out themes, though, I wrote a quick little theme lister / installer function  [```PelicanThemes```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/PelicanThemes.html) .

There's a lot of info out there on editing pelican themes, but basically it's just setting up some HTML templates and CSS to make the site look how you want it. Easy enough, very convenient, etc.

I made my own site theme, building off of elements I saw in a number of the themes available.

One of the core utilities for someone writing Mathematica code, though, is the ability to plug into the prettify.js Mathematica code formatter. We'll build off of the best  [Mathematica prettify.js plugin](https://github.com/halirutan/Mathematica-Source-Highlighting) . Just include that in the theme and the base.html template and we're good to go.

### Testing the Site

Obviously one needs content before the site can be built-out, but that's rather more complex than a simple test is, so I'll start with the latter.

The build process is really just all pelican doing it's thing. The build function itself is just a basic  ```PyVenvRun```  call, with the site directory passed (defaulting to the current notebook directory). We need to set the timeout rather higher, but not much as pelican is quite fast (on small sites).

Then we'll want a way to test the site. For that we'll use python's SimpleHTTPServer, but, again with a Mathematica layer. The simple server setup is almost exactly the same as the  ```PyVenv```  setup, with a  ```ProcessObject```  and a root directory, etc. But here we need to choose a port and stuff. I chose 7001 because  ```HTTPHandling`StartWebServer```  uses 7000 by default.

So once we've built out the site, we just start the  ```PySimpleServer```  on the output directory of the build and we're good to go. So the process looks like

    $site="path/to/site";
    PelicanBuild[$site];
    PySimpleServerOpen@FileNameJoin@{$site,"output"}

![1buildingwebsiteswithmathematica-3684620436964631583](/img/1buildingwebsiteswithmathematica-3684620436964631583.png)

<a id="creating-content" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Creating Content

Obviously the most important part of a website is its content and the way pelican sets that up is to have you write in either markdown or reStructuredText. In both cases you provide the text and the metadata and this gets processed and fed into the system where it can be consumed by the templates.

Since I use Mathematica for so much already, it was worth it (to me) to make a system to create my content in notebooks.

### Metadata

Metadata for pelican can be pretty much whatever, but there's a standard subset of fields

* Title

* Date

* Modified

* Tags

* Slug

* Authors

Since I was using Mathematica to write my content, I realized there was no reason I couldn't simplify these fields.

First off, for the Title I could obviously just take the notebook title. Easy. We'll let  ```Automatic```  as a title value map to that. The Slug could then just be the notebook title, lower-cased, with spaces replaced by dashes. We'll let that be what's signified by  ```Automatic```

For the Date and Modified fields it made sense to just use  ```DateString```  and  ```DateObject```  to format everything correctly. And this way the Modified could always be  ```Now```  while the Date would be the original creation date.

Finally the Tags and Authors just needed to be a list of strings

And then I can just put these in a special Metadata cell in  ```InputForm```  as an  ```Association``` . And of course any other fields can be added to that association (the Category field can be important, too).

### Notebook to Markdown

I'm used to markdown from working with Stack Exchange, so I opted to use markdown as my blog posting format. So, since I also wanted to be able to write my blog pages in notebooks, I needed a notebook-to-markdown converter. I decided to just knock one up rather than try to adapt  [the best existing one](https://mathematica.stackexchange.com/questions/84556/how-to-export-a-mathematica-notebook-into-markdown)  to my purposes, because I really didn't need to do much fancy stuff.

The basic idea is as follows:

* Strings export to strings

* Input/Code cells export in  ```InputForm```

* Output cells export as plain-text

* Graphics boxes get exported to image files by expression hash (to avoid exporting unnecessarily)

* Section/Subsection/Subsubsection cells get exported as h1 / h2 / h3 respectively

* Items get exported as items

* A new Quote cell will be introduced for block quotes

It's simple to state and really pretty simple to do (there're like 2 complications with getting images to render in code-based output)

Then just set it up so that when the notebook is saved, it also exports to markdown, using this mechanism. I stuck that all into a function called  [```PelicanNotebookSave```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/PelicanNotebookSave.html)  and added the following to my stylesheet:

    Cell[StyleData["Notebook"],
      {
        CellEventActions->
          {
            {"MenuCommand","Save"}:>BTools`PelicanNotebookSave[]
            }
          }
      ]

<a id="publishing-the-site" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Publishing the Site

With the content built we now have to publish our site. For that we'll go to a quick export function for a directory to the cloud, which I called  [```PelicanDeploy```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/PelicanDeploy.html)  which is built on top of a function  [```WebSiteDeploy```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/WebSiteDeploy.html)  that takes files from a directory and exports them to the cloud, with some selectivity for file names and modification dates.

The core of the function is using  [```CopyFile```](https://reference.wolfram.com/language/ref/CopyFile.html)  on a  [```CloudObject```](https://reference.wolfram.com/language/ref/CloudObject.html)  to move the files up to the cloud, making sure to set the  ```CloudObject```  permissions to public. Essentially it looks like:

    $site="path/to/site";
    CopyFile[
      #,
      CloudObject[
        URLBuild@
          Flatten@{
            FileBaseName@$site,
            FileNameSplit@FileNameDrop[#,1+FileNameDepth[$site]] (*1 extra for the "output"*)
            },
        Permissions->"Public"
        ]
      ]&/@FileNames["*.*",$site,∞]

Note that one needs to actually be connected to the cloud, which I tend to do via  [```KeyChainConnect```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/KeyChainConnect.html)

There's one last complication though: the cloud doesn't seem to display index.html files. A work around is to pass it to some URL like path/to/home/main.html. It make sense, however, to deploy both (just for security). So our deployment ends up looking like this:

    $site="path/to/site";
    Function[
      If[FileNameTake[#]==="index.html",
        CopyFile[
          #,
          CloudObject[
            StringTrim[
              URLBuild@
                Flatten@{
                  FileBaseName@$site,
                  FileNameSplit@FileNameDrop[#,1+FileNameDepth[$site]] (*1 extra for the "output"*)
                  },
              "/index.html"
              ]<>"/main.html",
            Permissions->"Public"
            ]
          ]
      ];
      CopyFile[
        #,
        CloudObject[
          URLBuild@
            Flatten@{
              FileBaseName@$site,
              FileNameSplit@FileNameDrop[#,1+FileNameDepth[$site]] (*1 extra for the "output"*)
              },
          Permissions->"Public"
          ]
        ]
      ]/@FileNames["*.*",$site,∞]

With that in place we're good to go. I wrote that into the function  [```PelicanDeploy```](https://www.wolframcloud.com/objects/b3m2a1.docs/reference/BTools/ref/PelicanDeploy.html)  so just run:

    PelicanDeploy["home" (*replace with your site base*)]

And your site is built ( Note: when exporting lots of files I've sometimes hit a timeout.  Take a break and come back and it should work. )