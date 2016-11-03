'use strict';

var margin = 10;
var width = 300 - margin * 2;
var height = 600 - margin * 2;

var dimension = {
    margin: margin,
    width: width,
    height: height
};

function translate(x, y) {
    if (y === undefined) return 'translate(' + x + ')';
    return 'translate(' + x + ',' + y + ')';
}

function rgba(r, g, b, a) {
    if (a === undefined) return 'rgb(' + r + ',' + g + ',' + b + ')';
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

var xScale = d3.scale.linear().range([0, dimension.height]);
var yScale = d3.scale.linear().range([0, dimension.width]);

var cellWidth = 10;
var cellHeight = 10;

var numColumns = Math.ceil(yScale(1) / cellWidth);
var numRows = Math.ceil(xScale(1) / cellHeight);
var container = null;
console.log(numColumns, numRows);
// 1D array, all values set to 0, mod `numColumns` is a new row
// 2D arrays become clumsy with d3
var cells = d3.range(numRows * numColumns).map(function (d, i) {
    return {
        value: 0,
        x: i % numColumns * cellWidth,
        y: Math.floor(i / numColumns) * cellHeight
    };
});

var debugCells = null;

function drawGrid() {
    debugCells = container.append('g').attr({
        'class': 'Grid'
    }).selectAll('rect').data(cells).enter().append('rect');

    debugCells.attr({
        'class': 'Grid-cell',
        x: function x(d) {
            return d.x;
        },
        y: function y(d) {
            return d.y;
        },
        width: cellWidth,
        height: cellHeight,
        fill: function fill(d) {
            if (d > 1) d = 1;
            if (d < 0) d = 0;
            return rgba(0, 200, 0, d.value);
        },
        'shape-rendering': 'crispEdges',
        stroke: 'black',
        'stroke-width': '1px'
    });
}

function calculateMetaballs(balls) {
    var w2 = cellWidth / 2; // cache
    var h2 = cellHeight / 2; // cache
    cells.map(function (cell, i) {
        var x = cells[i].x;
        var y = cells[i].y;
        var sum = balls.reduce(function (total, ball) {
            var dx = cell.x + w2 - ball.x;
            var dy = cell.y + h2 - ball.y;
            var r = ball.radius;
            return total + r * r / (dx * dx + dy * dy);
        }, 0);
        cell.value = sum;
    });
    update();
    // console.log(cells);
}

function update() {
    debugCells.attr('fill', function (d) {
        if (d > 1) d = 1;
        if (d < 0) d = 0;
        return rgba(0, 200, 0, d.value);
    });
}

function setContainer(element) {
    container = element;
}

// const

var balls = [];

function addBalls(container, numBalls) {
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
}

// const dragMove = (d) => {
//   var x = d3.event.x;
//   var y = d3.event.y;
//   d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
// }

function setupInteraction(data) {
    var drag = d3.behavior.drag().on("drag", function (d) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;

        // constraints
        if (d.x >= dimension.width) d.x = dimension.width;
        if (d.y >= dimension.height) d.y = dimension.height;
        if (d.x <= 0) d.x = 0;
        if (d.y <= 0) d.y = 0;

        d3.select(this).attr({
            'transform': function transform(d) {
                return translate(d.x, d.y);
            }
        });

        calculateMetaballs(balls);
    });

    return {
        drag: drag
    };
}

var svg = d3.select('.App').append('svg').attr('width', dimension.width + dimension.margin * 2).attr('height', dimension.height + dimension.margin * 2).append('g').attr('transform', 'translate(' + dimension.margin + ',' + dimension.margin + ')');

setContainer(svg);
drawGrid();
addBalls(svg, 10);