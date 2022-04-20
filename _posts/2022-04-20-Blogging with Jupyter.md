---
title: Blogging with Jupyter
date: 2022-04-20
permalink: blogging-with-jupyter
tags: python jupyter
---

It has been a few years since I've contributed anything to this blog, which isn't to say that I have forgotten about it, but rather I found that the workflow for writing post I had wasn't conducive to the way I work these days.

The last time I wrote anything was Spring of 2019. 
Between then and now (2022) I've changed the way I work from being almost exclusively in my extended version of Mathematica (I even wrote a fully functioning IDE for it!) to being mostly in PyCharm with some analyses run in Mathematica and Jupyter.
There are a number of reasons for the change, but the biggest one is that it was easier for me to uproot years of high-quality development work in Mathematica and move it ot python than it was for my coworkers to get comfortable with Mathematica.
It was unfortunate, but these things happen.

My prior blogging workflow was heavily based on the convenience of working with Mathematica notebooks, which I still think are the best implementation of the notebook interface I've encountered.
That meant, as I used Mathematica less and less, the previously convenient procedure I had became ever less so and coupled with the difficulty of moving years of work to a new platform my desire to write blog posts decreased steadily.

But we're back here because it is worth taking another look at this blog as a vehicle for demonstrating some fun things I've been developing in python.

### How do we do this?

The actual act of blogging in Jupyter is pretty straightforward. Almost all cells will be Markdown cells so we can add text. Headers can be added naturally. Some small amounts of python output will be generated, for example, here's me loading a package I've been developing recently for making nice interfaces with Jupyter:


```python
from McUtils.Jupyter import JHTML, DefaultOutputArea
JHTML.load()
```


    




    <!-- CSS only -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <!-- JavaScript Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">

<div class="alert alert-info">Bootstrap loaded <p class="d-none" style="color:red">This text will be visible if Bootstrap isn't loaded</p></div>



### Exporting the Notebook

This is straight-forward, althout I do introduce a helper or two. To start, we extract the cells from the notebook (we need to supply the notebook's name, `nb_name`)


```python
import nbformat

nb_name = '2022-04-20-Blogging with Jupyter'
this_nb = nb_name+'.ipynb'
with open(this_nb) as nb:
    nb_cells = nbformat.reads(nb.read(), as_version=4)
```

Then in the simplest of cases, we can just write the converted form of this notebook to file


```python
from nbconvert import MarkdownExporter

exporter = MarkdownExporter()

(body, resources) = exporter.from_notebook_node(nb_cells)
output_md = nb_name+'.md'

with open(output_md, 'w+') as md:
    md.write(body)
```

And after we push Jekyll will turn this into a new blog post.

### Adding Filters

It is probably the case that we don't want to export every single cell. Some might be for analysis or, in particular, some might be the cells used for exporting the notebook itself. To add these filters, we simply use the tag filter mechanism described [here](https://nbconvert.readthedocs.io/en/6.5.0/removing_cells.html#removing-pieces-of-cells-using-cell-tags) and we are able to only use the relevant cells.


```python

```
