---
title: JHTML - Customizing Molecular Visualizations in Jupyter
date: 2025-10-04
permalink: customizing-molecular-visualizations-in-jupyter
tags: python jupyter chemistry
---

# Customizing Molecular Visualizations in Jupyter

A constant when working with molecules and quantum chemistry is the need to visualize a structure or a transformation. Traditionally, I'd write an `.xyz` or `.mol` file and open the structure in a different visualization program, but when I want to work interactively this becomes a pain

To circumvent this, I decided a while back it was time to have a visualizer I could fully customize in Jupyter. My first plugin worked with the [NGLViewer plugin to JupyterLab](https://github.com/nglviewer/nglview). This worked for a time, but it depends on the Jupyter widgets framework which is as of yet still underbaked and prone to all sorts of nasty dependency issues and clashes. This wasn't sustainable and I wanted a system that could be constructed as static HTML. This way I could visualize in my notebook, but I could also just write the HTML to a file and load it up in a browser or send it off to my collaborators.

To support that, I decided (a year ago) on using two different systems to keep my options open. First I would write a JSMol plugin that uses embedded JSMol in a cell to run the visualization. In practice, this looks like


```python
from Psience.Molecools import Molecule

mol = Molecule.from_string('cyclohexanol')
mol
```
<div id="jsmol-applet-4769d8" style="width:500px; height:500px;"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" id="tmp-49f604fb-d" onload="
                            (function() {
                                document.getElementById('tmp-49f604fb-d').remove();
                                const frag = document.createRange().createContextualFragment(`<script src=&quot;https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/JSmol.min.js&quot; onload=&quot;
(function() {
   $.getScript('https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/js/Jmol2.js').then(
   () =&amp;gt; {
       
        if (typeof Jmol._patched === 'undefined') {
            Jmol._patched = true;
            Jmol._serverUrl = Jmol.Info[&amp;quot;serverURL&amp;quot;];
            Jmol._appletNameMap = {};
            jmolInitialize('https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/');
        };
        
       let loaded = false;
        if (!loaded) {
            if (typeof Jmol._appletNameMap === &amp;quot;undefined&amp;quot;) {
                Jmol._appletNameMap = {}
            };
            loaded = true;
            let applet = jmolAppletInline([500, 500], \`19
struct 0
O      2.449      0.404     -0.527
C      1.254      0.308      0.200
C      0.757     -1.104      0.065
C     -0.588     -1.192      0.752
C     -1.514     -0.343     -0.117
C     -1.085      1.088      0.179
C      0.282      1.237     -0.477
H      2.279      0.002     -1.422
H      1.427      0.549      1.263
H      0.571     -1.321     -1.013
H      1.446     -1.851      0.474
H     -0.491     -0.707      1.756
H     -0.957     -2.219      0.876
H     -1.292     -0.489     -1.205
H     -2.573     -0.527      0.092
H     -0.956      1.188      1.286
H     -1.802      1.837     -0.172
H      0.180      0.855     -1.519
H      0.614      2.283     -0.491\`, '', '_4769d8');
            applet.serverURL = Jmol.Info.serverURL;
            let wrapper = document.getElementById('jsmol-applet-4769d8');
            wrapper.innerHTML = applet._code;
            Jmol._appletNameMap['jsmol-applet-4769d8'] = applet;
            wrapper.ondelete = function() { delete Jmol._appletNameMap['jsmol-applet-4769d8'] };
            if (''.length) {
                document.getElementById('').innerHTML = applet._code;
            }
        }
    })
})();
&quot;&gt;</script&gt;`);
                                document.head.appendChild(frag);
                            })()"></div>
Behind the scenes, this just uses an [embeddable version of JSMol](https://github.com/b3m2a1/jsmol-cdn) I tweaked from the source and a rich HTML construction library I built to support [JHTML](/jhtml-a-web-framework-for-jupyter). This molecules get exported directly into the HTML and so can easily be shared as well as visualized.

### Animation Support

Much of my work involves mapping out chemical dynamics, so being able to visualizem molecules as coordinates distort is important. I've had the tools to get the appropriate derivatives for transformations for years, but now it's possible to do visualize this more generally


```python
int_mol = mol.modify(internals='auto') # pick reasonable internal coordinates
int_mol.animate_coordinate(-1)
```
<div id="jsmol-applet-12dc07" style="width:500px; height:500px;"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" id="tmp-120fed00-0" onload="
                            (function() {
                                document.getElementById('tmp-120fed00-0').remove();
                                const frag = document.createRange().createContextualFragment(`<script src=&quot;https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/JSmol.min.js&quot; onload=&quot;
(function() {
   $.getScript('https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/js/Jmol2.js').then(
   () =&amp;gt; {
       
        if (typeof Jmol._patched === 'undefined') {
            Jmol._patched = true;
            Jmol._serverUrl = Jmol.Info[&amp;quot;serverURL&amp;quot;];
            Jmol._appletNameMap = {};
            jmolInitialize('https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/');
        };
        
       let loaded = false;
        if (!loaded) {
            if (typeof Jmol._appletNameMap === &amp;quot;undefined&amp;quot;) {
                Jmol._appletNameMap = {}
            };
            loaded = true;
            let applet = jmolAppletInline([500, 500], \`19
struct 1
O      2.449      0.404     -0.527      0.000     -0.016     -0.208     -0.200
C      1.254      0.308      0.200      0.000      0.109      0.128      0.051
C      0.757     -1.104      0.065      0.000      0.033      0.140      0.121
C     -0.588     -1.192      0.752      0.000     -0.012      0.011      0.013
C     -1.514     -0.343     -0.117      0.000      0.013     -0.072     -0.114
C     -1.085      1.088      0.179      0.000     -0.129     -0.055     -0.036
C      0.282      1.237     -0.477      0.000     -0.019      0.110      0.229
H      2.279      0.002     -1.422      0.000     -0.286     -0.258     -0.126
H      1.427      0.549      1.263      0.000      0.072      0.032      0.079
H      0.571     -1.321     -1.013      0.000     -0.043      0.172      0.128
H      1.446     -1.851      0.474      0.000      0.049      0.153      0.116
H     -0.491     -0.707      1.756      0.000     -0.144     -0.034      0.047
H     -0.957     -2.219      0.876      0.000      0.037     -0.016     -0.067
H     -1.292     -0.489     -1.205      0.000      0.165     -0.047     -0.087
H     -2.573     -0.527      0.092      0.000      0.002     -0.166     -0.253
H     -0.956      1.188      1.286      0.000     -0.302     -0.156     -0.007
H     -1.802      1.837     -0.172      0.000     -0.123     -0.074     -0.091
H      0.180      0.855     -1.519      0.000      0.917      0.463      0.009
H      0.614      2.283     -0.491      0.000     -0.023      0.112      0.283\`, 'vibration on', '_12dc07');
            applet.serverURL = Jmol.Info.serverURL;
            let wrapper = document.getElementById('jsmol-applet-12dc07');
            wrapper.innerHTML = applet._code;
            Jmol._appletNameMap['jsmol-applet-12dc07'] = applet;
            wrapper.ondelete = function() { delete Jmol._appletNameMap['jsmol-applet-12dc07'] };
            if (''.length) {
                document.getElementById('').innerHTML = applet._code;
            }
        }
    })
})();
&quot;&gt;</script&gt;`);
                                document.head.appendChild(frag);
                            })()"></div>
### Better Script Support

The JSMol interface can also be a little bit finnicky, so I added a (very ugly) system for running scripts and doing screen recordings


```python
int_mol.animate_coordinate(0, include_script_interface=True)
```
<div id="jsmol-applet-217223" style="width:500px; height:700px;"><div id="jsmol-applet-217223-applet" style="width:100%; height:500px;"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" id="tmp-7a76a4f6-1" onload="
                            (function() {
                                document.getElementById('tmp-7a76a4f6-1').remove();
                                const frag = document.createRange().createContextualFragment(`<script src=&quot;https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/JSmol.min.js&quot; onload=&quot;
(function() {
   $.getScript('https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/js/Jmol2.js').then(
   () =&amp;gt; {
       
        if (typeof Jmol._patched === 'undefined') {
            Jmol._patched = true;
            Jmol._serverUrl = Jmol.Info[&amp;quot;serverURL&amp;quot;];
            Jmol._appletNameMap = {};
            jmolInitialize('https://cdn.jsdelivr.net/gh/b3m2a1/jsmol-cdn@16.3.7.9/jsmol/');
        };
        
       let loaded = false;
        if (!loaded) {
            if (typeof Jmol._appletNameMap === &amp;quot;undefined&amp;quot;) {
                Jmol._appletNameMap = {}
            };
            loaded = true;
            let applet = jmolAppletInline([500, 500], \`19
struct 1
O      2.449      0.404     -0.527      0.000      0.005      0.012      0.030
C      1.254      0.308      0.200      0.000     -0.001      0.007      0.018
C      0.757     -1.104      0.065      0.000      0.005      0.005      0.010
C     -0.588     -1.192      0.752      0.000     -0.001     -0.001     -0.002
C     -1.514     -0.343     -0.117      0.000      0.004     -0.002     -0.009
C     -1.085      1.088      0.179      0.000     -0.004     -0.001     -0.002
C      0.282      1.237     -0.477      0.000      0.002      0.005      0.011
H      2.279      0.002     -1.422      0.000     -0.146     -0.367     -0.822
H      1.427      0.549      1.263      0.000     -0.012      0.005      0.020
H      0.571     -1.321     -1.013      0.000      0.015      0.007      0.008
H      1.446     -1.851      0.474      0.000      0.003      0.007      0.015
H     -0.491     -0.707      1.756      0.000     -0.012     -0.003     -0.000
H     -0.957     -2.219      0.876      0.000      0.001     -0.002     -0.008
H     -1.292     -0.489     -1.205      0.000      0.014      0.002     -0.007
H     -2.573     -0.527      0.092      0.000      0.003     -0.006     -0.019
H     -0.956      1.188      1.286      0.000     -0.014     -0.003     -0.000
H     -1.802      1.837     -0.172      0.000     -0.003     -0.003     -0.006
H      0.180      0.855     -1.519      0.000      0.013      0.007      0.010
H      0.614      2.283     -0.491      0.000     -0.001      0.006      0.017\`, 'vibration on', '_217223');
            applet.serverURL = Jmol.Info.serverURL;
            let wrapper = document.getElementById('jsmol-applet-217223-applet');
            wrapper.innerHTML = applet._code;
            Jmol._appletNameMap['jsmol-applet-217223-applet'] = applet;
            wrapper.ondelete = function() { delete Jmol._appletNameMap['jsmol-applet-217223-applet'] };
            if ('jsmol-applet-217223-interface'.length) {
                document.getElementById('jsmol-applet-217223-interface').innerHTML = \`<div style='display:block'&amp;gt;
<textarea id=&amp;quot;jsmol-applet-217223-applet-script-input&amp;quot; style=&amp;quot;width:100%;&amp;quot;&amp;gt;</textarea&amp;gt;

<button id=&amp;quot;jsmol-applet-217223-applet-button-input&amp;quot; onclick=&amp;quot;
                (function() {
                    const script = document.getElementById('jsmol-applet-217223-applet-script-input').value;
                    const app = Jmol._appletNameMap['jsmol-applet-217223-applet'];
                    app._script(script);
                    document.getElementById('jsmol-applet-217223-applet-script-input').value = '';
                })()
                &amp;quot;&amp;gt;Run Script</button&amp;gt;

<div style=&amp;quot;display:flex;&amp;quot;&amp;gt;<button onclick=&amp;quot;
(function(){
  let link = document.createElement('a');
  let base_name = 'jmolApplet_217223_appletdiv';
  link.download = base_name + '.png';
  link.href = document.getElementById('jmolApplet_217223_appletdiv').getElementsByTagName('canvas')[0].toDataURL()
  link.click();
})()
       &amp;quot;&amp;gt;Save Figure</button&amp;gt;<button onclick=&amp;quot;
    (function(){
        let canvas = document.getElementById('jmolApplet_217223_appletdiv').getElementsByTagName('canvas')[0];
        
        let pollingRate = (typeof canvas.pollingRate === 'undefined') ? 30 : canvas.pollingRate;
        let videoFormat = (typeof canvas.videoFormat === 'undefined') ? &amp;amp;quot;video/webm&amp;amp;quot; : canvas.videoFormat;
        let videoExtension = canvas.videoExtension;
        if (typeof canvas.videoExtension === 'undefined') {
            videoExtension = &amp;amp;quot;&amp;amp;quot;
        }
        let x3DRecordingStream = canvas.captureStream(pollingRate);
        let mediaRecorder = new MediaRecorder(x3DRecordingStream, {mimeType: videoFormat});
        
        mediaRecorder.frames = [];
        mediaRecorder.ondataavailable = function(e) {
          mediaRecorder.frames.push(e.data);
        };
        
        mediaRecorder.onstop = function(e) {
          link = document.createElement('a');
          const base_name = 'jmolApplet_217223_appletdiv';
          const blob = mediaRecorder.frames[0];
          link.download = base_name + videoExtension;
          console.log(blob);
          const blobURL = window.URL.createObjectURL(blob);
          link.href = blobURL;
          console.log(blobURL);
          mediaRecorder.frames = [];
          link.click();
        };
        
        let duration = (typeof canvas.recordingDuration === 'undefined') ? 2 : canvas.recordingDuration;
        setTimeout(() =&amp;amp;gt; {mediaRecorder.stop()}, duration * 1000);
        mediaRecorder.start()
    })()
           &amp;quot;&amp;gt;Record Animation</button&amp;gt;<input value=&amp;quot;2&amp;quot; id=&amp;quot;jsmol-applet-217223-applet-duration-input&amp;quot; oninput=&amp;quot;
    (function(){
        let canvas = document.getElementById('jsmol-applet-217223-applet').getElementsByTagName('canvas')[0];
        let input = document.getElementById('jsmol-applet-217223-applet-duration-input');
        
        canvas.recordingDuration = input.value;
    })()
           &amp;quot;&amp;gt;</div&amp;gt;
</div&amp;gt;\`;
            }
        }
    })
})();
&quot;&gt;</script&gt;`);
                                document.head.appendChild(frag);
                            })()"></div><div id="jsmol-applet-217223-interface" style="height:200px; width:100%; padding:2rem;"></div></div>