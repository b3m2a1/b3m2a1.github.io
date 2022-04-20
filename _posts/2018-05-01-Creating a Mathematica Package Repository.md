---
title: Creating a Mathematica Package Repository
authors: b3m2a1
date: 2018-05-01 22:29:20
modified: 2018-05-02 00:05:01
permalink: creating-a-mathematica-package-repository
tags: packages
---


This post is going to detail how I set up one of my recent projects—and a project I hope outlasts my direct involvement in it.

We're going to talk about how to set up a custom paclet server in GitHub.

<a id="paclet-servers-revisited" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Paclet Servers Revisited

I talked about paclet servers a while back in  [this post](building-a-mathematica-package-ecosystem-part-1.html) . Now we get to build on all of that work. Fundamentally, all we're going to be doing is building a paclet server via the method discussed there, but instead of deploying to the Wolfram Cloud, and opaque, unknown (and hence untrusted),  [severely](http://community.wolfram.com/groups/-/m/t/1250045)   [lacking](http://community.wolfram.com/groups/-/m/t/1250055)  system we'll deploy to GitHub, the defacto standard for code sharing and highly open and trusted system.

To do this, we'll mostly treat things as before, but it might be worth revisiting what we did before.

### Using the Paclet Manager

We're going to hook in to Mathematica's built-in package manager, called the  ```PacletManager``` . It's called that because Mathematica packages are distributed as  ```.paclet```  files (which are just structured zip files with a  ```Paclet```  expression cooked in).

If people know the server where a paclet is stored, they can install it as easy as:

    PacletInstall[
      "PacletName",
      "Site"->"http://paclet.site/Server"
      ]

And so we're trying to make that accessible.

### Paclet Server Components

To do that we need to expose a  ```Paclets```  directory where all of our paclet files will be stored and a  ```PacletSite.mz```  file that details the paclets that are stored there.

Happily, I'd already built out the tool-chains for those previously, so I just had to adapt those to this project. The function that handles this is call  ```PacletServerAdd``` . It takes a paclet and stores it in that  ```Paclets```  directory and updates the  ```PacletSite.mz```  file to reflect this

### Paclet Server Website

The other part of a good paclet server is the interface that tells people what's on it. For my own stuff I built out a set of paclet server pages that detail what's available for download, the details of these, etc. As of the time I'm writing this for us this looks like:

![18creatingamathematicapackagerepository-7826302109937894265]({{site.base_url}}/img/18creatingamathematicapackagerepository-7826302109937894265.png)

Although the design is subject to change.

What's important is that it details everything that's there and it's customizable for our needs moving forward.

Each paclet has a page that is derived from the data in the  ```PacletSite.mz```  file (which in turn reflects the data in the  ```PacletInfo.m```  files cooked into each paclet). All we do here is take the parameters from the file, shove them into a notebook via some  ```CellTags```  driven replacements, and then export that notebook to Markdown. From there the static site builder takes over. An example of one of those pages is:

![18creatingamathematicapackagerepository-2481485970852989325]({{site.base_url}}/img/18creatingamathematicapackagerepository-2481485970852989325.png)

Scrolling further down the page will give you all the details about who made it (me) what version it is, what extensions it has, etc.

<a id="building-the-paclet-server" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Building the Paclet Server

We'll walk through most of the steps involved in this so that potentially others can make use of a similar flow. First we need to get everything working with GitHub.

### Making a GitHub Organization

Since this is supposed to be a community effort I didn't want it attached to my personal GitHub. Better would be if it's associated with a  [GitHub organization](https://blog.github.com/2010-06-29-introducing-organizations/) . So I made an organization that  halirutan helpfully suggested I call  [paclets](https://github.com/paclets)  and made a  [repository for hosting our server](https://github.com/paclets/PacletServer) .

![18creatingamathematicapackagerepository-7139290626530984083]({{site.base_url}}/img/18creatingamathematicapackagerepository-7139290626530984083.png)

### Configuring the Repo

To set up the repository I just cloned it locally, then started adding paclets to it via  ```PacletServerAdd``` . The standard way I'd call it is

    PacletServerAdd["path/to/server", "PacletName"]

Which adds the paclet for the folder and sets up things as they ought to be.

Then I call

    PacletServerBuild["path/to/server"]

Which builds out the website and all the necessary components.

Finally I push this back to GitHub via an interface to its API (and also to git) that I wrote up. That generally looks like:

    Git["Add", "path/to/server", "All"->True];
    Git["Commit", "path/to/server", "Message"->TemplateApply["Rebuilt on ``", DateString[]]];
    GitHub["Push", "path/to/server"]

And simple as that out server is built

### Making a ReviewQueue

To make things nice for collaboration we'll want a way for people to submit things via GitHub on their own.

The way we're currently doing this is via a review queue mechanism working off of GitHub's pull request machinery.

A user forks the repo, adds a paclet to the  ```ReviewQueue```  directory, and then we check to make sure it's formatted correctly before building it into the server.

To simplify this I cooked up a  [build script](https://github.com/paclets/PacletServer/blob/master/build/src/BuildScript.m)  and  [build notebook](https://github.com/paclets/PacletServer/blob/master/build/build.nb) . These load and submit the things in review queue (although checking that all the parts are there for the actual paclet is still best done by hand).

I won't go into too much detail on the queue though, because I built an interface paclet to try to hide the all the steps in working with the queue.

### Protections in Place

As with all packages, it's impossible to be sure that a paclet won't be harmful. To minimize the risk people face in using the server we added a  [change log](https://paclets.github.io/PacletServer/pages/log.html)  that extracts who committed and changed which paclets.

If a user you don't trust has recently changed a paclet, don't install it. We even put this in bold face anywhere we provide installation code.

![18creatingamathematicapackagerepository-4293929817718253197]({{site.base_url}}/img/18creatingamathematicapackagerepository-4293929817718253197.png)

<a id="building-an-interface-paclet" style="width:0;height:0;margin:0;padding:0;">&zwnj;</a>

## Building an Interface Paclet

This has been the toughest part of the entire project. I wanted to make it so that people could submit their paclets directly in Mathematica, the fewer the lines of code necessary the better.

To this effect I set up a paclet which is on the server and  [you can install](https://paclets.github.io/PacletServer/publicpacletserver.html)  to get the job done. The paclet is called (rather uncreatively)  ```"PublicPacletServer"``` . I talked about it some  [here](http://community.wolfram.com/groups/-/m/t/1330267) . To use it you install it based on what was on that link and load it like

    <<PublicPacletServer`

It will expose a single function  ```PublicPacletServer```  which provides access to the server and submission process. If you have a paclet you've been working on you can simply run:

    PublicPacletServer["SubmitPaclet", "YourPacletName"]

And it will search for your paclet and submit it if it can find it and build it. If not you can also supply the path to your paclet and it will build and submit your paclet automatically.

This submits the paclet to your review queue. To get it onto the public server you'll submit a request to merge your paclet in. The way you do that is via:

    PublicPacletServer["SubmitPullRequest"]

And then once your paclet has passed review it will be added.

This simple interface hides some complicated innards, though.

### Creating a Fork

The heart of this workflow is forking the original server. This is a way that git knows which repository is the main / parent repository and makes it possible to easily merge changes up or down this tree.

GitHub itself provides an  [API for creating forks](https://developer.github.com/v3/repos/forks/) . I used this to make sure that no one has to download the entire server just to upload their package. What I do is I check whether you have a fork already by comparing your repositories to the forks of the main repository. You can check whether you have a fork by running

    PublicPacletServer["ForkedQ"]

    (*Out:*)
    
    True

If you have a fork,  ```"SubmitPaclet"```  will add it to the review queue for it. If not, it'll tell you to make a fork by running

    PublicPacletServer["Fork"]

    (*Out:*)
    
    "b3m2a1/PacletServer"

### Submitting a Paclet

The paclet submission process hooks into GitHub's  [API for single file uploads](https://developer.github.com/v3/repos/contents/) . It uses a toolchain I built for automatically finding and building a paclet (in fact the same one used by  ```PacletServerAdd``` ) to build out a paclet then pushes it through the API to your fork's  ```ReviewQueue```  directory.

### Submitting a Pull Request

This is something I expected to be incredibly simple. There's a  [pull request API](https://developer.github.com/v3/pulls/)  that I do use in the end for submitting the request, but it turns out not all pull requests are valid. If there are changes on both the head and child repositories that conflict the child repository will need to merge the changes on the head repository before its changes can be pushed. To try to cover this case I run the  [merges API](https://developer.github.com/v3/repos/merging/)  on a  [reference](https://developer.github.com/v3/git/refs/)  extracted from the main repository. If that sounds like a whole bunch of jargon, that's because it is. Suffice it to say, for the most part you won't need this, but I tried to protect you if you do.

### Future Directions

This paclet is most certainly in beta (it's currently only a  ```0.0.1```  release). There are a number of features I still need to add, such as 

* Better support for cloning

* Support for end users to build the server themselves

* Review queue validation

* A paclet submission GUI

* Encapsulating functionality in a paclet

If you'd like to help with any of these, feel free to  [clone the repo](https://github.com/b3m2a1/mathematica-PublicPacletServer)  and collaborate.

In the meantime, I hope this encourages you to submit your paclets to the repository. We'd love to have them.