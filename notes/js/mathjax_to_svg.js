//Adapted from https://www.mathjax.org/js/main.js

window.MathJax = {
  loader: {
    load: ['input/asciimath', '[tex]/color'],
  },
  startup: {
    pageReady: function () {
      //
      // Synchronize menu renderer item with on-screen popup menu
      //
      var select = document.getElementById('Renderer');
      if (select) {
        var renderer = MathJax.startup.document.menu.settings.renderer;
        var menu = MathJax.startup.document.menu.menu;
        var item = (menu.getPool ? menu.getPool() : menu.pool).lookup('renderer');
        select.value = renderer;
        if (renderer !== 'CHTML') item.setValue(renderer);
        item.registerCallback(function () {
          var value = item.getValue();
          if (value !== select.value) select.value = value;
        });
        window.setMode = function (renderer) {
          if (item.getValue() !== renderer) item.setValue(renderer);
        }
        //
        //  Set up processing of input content
        //
        var input = document.getElementById('MathInput');
        var output = document.getElementById('MathPreview');
        var button = document.getElementById('renderHTML');
        output.innerHTML = input.value.trim();
        window.typesetInput = function () {
          button.disabled = true;
          output.innerHTML = input.value.trim();
          MathJax.texReset();
          MathJax.typesetClear();
          MathJax.typesetPromise([output]).catch(function (err) {
            output.innerHTML = '';
            output.appendChild(document.createTextNode(err.message));
            console.error(err);
          }).then(function () {
            button.disabled = false;
          });
        }

        window.saveResult = function() {

          let renderer = document.getElementById('Renderer').value
          let node = document.getElementById('MathPreview')
          
          if (renderer === 'SVG') {
            node = node.getElementsByTagName("svg")[0]
            node.style['color'] = 'black'
          }

          //get svg source.
          let serializer = new XMLSerializer();
          let source = serializer.serializeToString(node);

          
          let fmt = "data:text/html;charset=utf-8";
          let extension = ".html"
          if (renderer === 'SVG') {
            //add name spaces.
            if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
              source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
              source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }
            
            //add xml declaration
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
            
            //convert svg source to URI data scheme.
            fmt = "data:image/svg+xml;charset=utf-8";
            extension = ".svg"
          }
          let svgBlob = new Blob([source], {type:fmt});
          let svgUrl = URL.createObjectURL(svgBlob);
          let downloadLink = document.createElement("a");
          downloadLink.href = svgUrl;

          let fileName = document.getElementById('fileName').value
          if (!fileName.length) {
            fileName = "tex_output"
          }
          downloadLink.download = fileName + extension;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }

        input.oninput = typesetInput;
      }

      return MathJax.startup.defaultPageReady();
    }
  },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    processEscapes: true
  }
};

//
//  Load MathJax
//
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
script.setAttribute('id', 'MathJax-script');
document.head.appendChild(script);