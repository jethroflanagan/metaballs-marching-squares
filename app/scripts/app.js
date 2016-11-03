'use strict';

var margin = 10;
var width = 300 - margin * 2;
var height = 600 - margin * 2;

var dimension = {
    margin: margin,
    width: width,
    height: height
};

var translate = function translate(x, y) {
    if (y === undefined) return 'translate(' + x + ')';
    return 'translate(' + x + ',' + y + ')';
};

var rgba = function rgba(r, g, b, a) {
    if (a === undefined) return 'rgb(' + r + ',' + g + ',' + b + ')';
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};

var xScale = d3.scale.linear().range([0, dimension.height]);
var yScale = d3.scale.linear().range([0, dimension.width]);

var cellWidth = 10;
var cellHeight = 10;

var numColumns = yScale(1) / cellWidth;
var numRows = xScale(1) / cellHeight;

// quick 2d array, all values set to 0
var grid = d3.range(numRows).map(function (d) {
    return d3.range(numColumns).map(function (d) {
        return 0;
    });
});

var drawGrid = function drawGrid(container, xScale, yScale) {
    container.append('g').attr({
        'class': 'Grid'
    }).selectAll('rect').data(grid).enter().append('g')
    // .attr('transform', (d, i) => {
    //     return 'translate(0, ' + i * cellHeight + ')';
    // })
    .selectAll('rect').data(function (d) {
        return d;
    }).enter().append('rect').attr({
        'class': 'Grid-cell',
        x: function x(d, _x, y) {
            return _x * cellWidth;
        },
        y: function y(d, x, _y) {
            return _y * cellHeight;
        },
        width: cellWidth,
        height: cellHeight,
        fill: rgba(0, 200, 0, 1),
        'shape-rendering': 'crispEdges',
        stroke: 'black',
        'stroke-width': '1px'
    });
};

// const

var balls = [];

var addBalls = function addBalls(container, numBalls) {
    var _setupInteraction = setupInteraction(balls),
        drag = _setupInteraction.drag;
    // ensure they are away from edges just for generation


    var edgePadding = 10;
    for (var i = 0; i < numBalls; i++) {
        var radius = Math.random() * 40 + 25;
        var padding = edgePadding + radius;
        balls.push({
            radius: radius,
            // ensure they are away from edges
            x: Math.random() * (dimension.width - padding * 2) + padding,
            y: Math.random() * (dimension.height - padding * 2) + padding,
            speed: Math.random() * 4 + 1,
            direction: Math.random() * Math.PI * 2
        });
    }

    return container.selectAll('circle').data(balls).enter().append('circle').attr({
        'classed': 'Ball',
        r: function r(d) {
            return d.radius;
        },
        x: function x(d) {
            return d.x;
        },
        y: function y(d) {
            return d.y;
        },
        transform: function transform(d) {
            return translate(d.x, d.y);
        },
        stroke: '#C00',
        fill: rgba(0, 0, 0, 0.3)
    }).call(drag);
};

// const dragMove = (d) => {
//   var x = d3.event.x;
//   var y = d3.event.y;
//   d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
// }

var setupInteraction = function setupInteraction(data) {
    var drag = d3.behavior.drag().on("drag", function (d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        if (d.x >= dimension.width) d.x = dimension.width;
        if (d.y >= dimension.height) d.y = dimension.height;
        if (d.x <= 0) d.x = 0;
        if (d.y <= 0) d.y = 0;
        d3.select(this).attr({
            'transform': function transform(d) {
                return translate(d.x, d.y);
            }
        });
    });

    return {
        drag: drag
    };
};

var svg = d3.select('.App').append('svg').attr('width', dimension.width + dimension.margin * 2).attr('height', dimension.height + dimension.margin * 2).append('g').attr('transform', 'translate(' + dimension.margin + ',' + dimension.margin + ')');

drawGrid(svg);
addBalls(svg, 10);