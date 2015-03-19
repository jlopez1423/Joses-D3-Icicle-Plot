/*Code segments were taken from: http://mbostock.github.io/d3/talk/20111018/partition.html*/ 
var w = 1120,
    h = 600,
    x = d3.scale.linear().range([0, w]),
    y = d3.scale.linear().range([0, h]);

var brain_h = 500,
    brain_w = 500;

var vis = d3.select("#icicle").append("div")
    .attr("class", "chart")
    .style("width", w + "px")
    .style("height", h + "px")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h);

var partition = d3.layout.partition()
    .value(function(d) { return d.size; });

var addSizes = function(root) {
  var children = root.children;
  if (children.length == 0) {
    root.size = 1;
  }
  else {
    for (var i = 0; i < children.length; i++) {
      addSizes(children[i]);
    }
  }
}

var structBFS = function(root, myid) {
    var children = root.children;
    if (children != null) {
      for (var i = 0; i < children.length; i++) {
        if (children[i].id== myid) return root;
        structBFS(children[i], myid);
      }
   }
}

// Helper function for dealing with the weirdness of xml. Find the first
// child of elem "n" that is of type "element".
// Adapted from: http://www.w3schools.com/dom/prop_element_firstchild.asp
var get_firstchild = function (n) {
  var localfirstchild = n.firstChild;
  while (localfirstchild.nodeType != 1) {
    localfirstchild = localfirstchild.nextSibling;
  }
  return localfirstchild;
}

var xml_elem;

// Load all of the slices.
////Data obtained from: http://www.brain-map.org/
d3.json("slices_rep.json", function (filenames) {
    d3.select("#brain")
        .append("svg:svg")
        .attr("id", "brain_svg")
        .attr("width", w)
        .attr("height", h);

    for (var i = 0; i < filenames.length; i++) {
      d3.xml("svgslices/" + filenames[i], "images/svg+xml", function (xml) {
        var brain_svg = document.getElementById("brain_svg");
        xml_elem = get_firstchild(xml.documentElement);
        brain_svg.appendChild(xml_elem);

        var slice_id = "p" + get_firstchild(xml_elem).attributes.id.value
        xml_elem.setAttribute("id",slice_id);
        xml_elem.setAttribute("visibility", "hidden");
        xml_elem.setAttribute("class", "slice_svg");
        xml_elem.setAttribute("transform", "scale(0.00625)");

        //if (slice_id == "p278109162") {
        //  console.log('found slice!');
        //  d3.select("#p278109162").selectAll("path")
        //    .on("click", function() {
        //      console.log("mouse down");
        //      click(d3.select("rect[id='" + this.attributes.structure_id.value + "']")
        //       // this.attributes.structure_id.value
        //    });
        //}
      });
    }
    
});
var debug;

d3.json("allen.json", function(root) {

  var highlightPath = function (struct_id, color) {
    var d3_path = d3.select("path[structure_id=" +"'" + struct_id + "'" + "]" );
    debug = d3_path[0][0];
    var path_elem = d3_path[0][0];
    if (path_elem != null) {
      d3_path.style("fill", function (data) { return color; })
      path_elem.parentElement.parentElement.attributes.visibility.value = "visible";
      return true;
    }
    else {
      return false;
    }
  }


  var g = vis.selectAll("g")
      .data(partition.nodes(root))
    .enter().append("svg:g")
      .attr("transform", function(d) { console.log(d); return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
      .on("click", click);

  var kx = w / root.dx,
      ky = h / 1;

  g.append("svg:rect")
      .attr("width", root.dy * kx)
      .attr("height", function(d) { return d.dx * ky; })
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .style("fill", function(d) { return '#' + d.color_hex_triplet; })
      .on("mouseover", function (d) {
        console.log('hello');
        d3.selectAll(".slice_svg").attr("visibility", "hidden");

        console.log(d.id);
        var was_found = highlightPath(d.id, "red");
      })
      .on("mouseout", function (d) {
        d3.selectAll(".slice_svg").attr("visibility", "hidden");
        d3.select("#p278109162").attr("visibility", "visible");
        var was_found = highlightPath(d.id, d.color_hex_triplet);
      });

  g.append("svg:text")
      .attr("transform", transform)
      .attr("dy", ".35em")
      .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
      .text(function(d) { return d.name; });

  d3.select(window)
      .on("click", function() { click(root); })

  function click(d) {
    if (!d.children) return;

    kx = (d.y ? w - 40 : w) / (1 - d.y);
    ky = h / d.dx;
    x.domain([d.y, 1]).range([d.y ? 40 : 0, w]);
    y.domain([d.x, d.x + d.dx]);

    var t = g.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

    t.select("rect")
        .attr("width", d.dy * kx)
        .attr("height", function(d) { return d.dx * ky; });

    t.select("text")
        .attr("transform", transform)
        .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });

    d3.event.stopPropagation();
  }

  function transform(d) {
    return "translate(8," + d.dx * ky / 2 + ")";
  }
});
