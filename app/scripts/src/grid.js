import { dimension } from './config';
import { rgba } from './utils';

const xScale = d3.scale.linear()
    .range([0, dimension.height]);
const yScale = d3.scale.linear()
    .range([0, dimension.width]);

const cellWidth = 40;
const cellHeight = 40;

const numColumns = Math.ceil(yScale(1) / cellWidth);
const numRows = Math.ceil(xScale(1) / cellHeight);

const reduction = 2;
const threshold = 0.3;
const rangeMultiplier = 1 / (1 - threshold);

let container = null;
console.log(numColumns, numRows);
// 1D array, all values set to 0, mod `numColumns` is a new row
// 2D arrays become clumsy with d3
let cells = d3.range(numRows * numColumns)
    .map( (d, i) => {
        return {
            value: 0,
            x: i % numColumns * cellWidth,
            y: Math.floor(i / numColumns) * cellHeight,
        }
    });

let debugCells = null;
let debugCellsRect = null;
let debugCellsText = null;

function drawGrid () {
    debugCells = container
        .append('g')
            .attr({
                'class': 'Grid',
            })
        .selectAll('g')
        .data(cells)
        .enter()
            .append('g');

    debugCellsRect = debugCells
        .append('rect')
            .attr(
            {
                'class':'Grid-cell',
                x: d => d.x,
                y: d => d.y,
                width: cellWidth,
                height: cellHeight,
                fill: d => {
                    if (d > 1)
                        d = 1;
                    if (d < 0)
                        d = 0;
                    return rgba(0, 200, 200, d.value)
                },
                'shape-rendering': 'crispEdges',
                stroke: '#eee',
                // 'stroke-width': '1px'
            });

    debugCellsText = debugCells
        .append('text')
            .attr({
                fill: '#000',
                'font-family': 'Helvetica',
                'font-size': '12px',
                x: d => d.x + cellWidth / 2,
                y: d => d.y + cellHeight / 2,
                'text-anchor': 'middle',
            });

};

function getMarchingSquareCorner (balls, cell, offsetX, offsetY) {
    return balls.reduce( (total, ball) => {
        let dx = cell.x + offsetX - ball.x;
        let dy = cell.y + offsetY - ball.y;
        let r = ball.radius;
        const result = (r * r) / ((dx * dx) + (dy * dy));
        return total + result;
    }, 0) > 1 ? 1 : 0;
};

function calculateMarchingSquares (balls) {
    cells.map( (cell, i) => {
        const x = cells[i].x;
        const y = cells[i].y;
        let sumTL = getMarchingSquareCorner(balls, cell, 0, 0) << 3;
        let sumTR = getMarchingSquareCorner(balls, cell, cellWidth, 0) << 2;
        let sumBR = getMarchingSquareCorner(balls, cell, cellWidth, cellHeight) << 1;
        let sumBL = getMarchingSquareCorner(balls, cell, 0, cellHeight);

        // marching squares
        // http://jamie-wong.com/images/14-08-11/marching-squares-mapping.png
        // The configuration number between 0-15 is computed by assigning a value of 0 to each of the corners where f(x,y)<1f(x,y)<1, and a value of 1 where f(x,y)≥1f(x,y)≥1, then interpreting these bits as a binary number, ordered (southwest, southeast, northeast, northwest).
        // cell.value = parseInt('' + sumBL + sumBR + sumTR + sumTL, 2);
        cell.value = sumBL + sumBR + sumTR + sumTL;
    });
    update();
}

// get x,y back as (0-2, 0-2)->(0-2, 0-2) for a line within square from edge to edge
// where x=0 is leftmost, x=1 is middle, x=2 is rightmost
// a line from middle left edge tp bottom right edge is
//  (0,1) -> (1,2)
// return [0,1, 1,2]
//         x,y->x,y
// REF
// x
//   +---+
// 0 | 1 | 2
//   +---+
//
// y   0
//   +---+
//   | 1 |
//   +---+
//     2
function getMarchingSquaresLine (value) {
    switch (value) {
        case 1:
        case 14:
            return [{x:0,y:1}, {x:1,y:2}];
        case 2:
        case 13:
            return [{x:1,y:2}, {x:2,y:1}]
        case 3:
        case 12:
            return [{x:0,y:1}, {x:2,y:1}]
        case 4:
        case 11:
            return [{x:1,y:0}, {x:2,y:1}]
        case 5: // saddle
            return [
                [{x:0,y:1}, {x:1,y:0}],
                [{x:1,y:2}, {x:2,y:1}],
            ];
        case 6:
        case 9:
            return [{x:1,y:0}, {x:1,y:2}]
        case 7:
        case 8:
            return [{x:0,y:1}, {x:1,y:0}]
        case 10:
            return [
                [{x:1,y:0}, {x:2,y:1}],
                [{x:0,y:1}, {x:1,y:2}],
            ];
        case 0:
        case 15:
            return null
    }
}

function drawMarchingSquares () {
    container
        // select('g')
        .selectAll('path')
        .remove()


    const allPaths = container
        .append('g').attr('class', 'paths')
    const w2 = cellWidth / 2; // cache
    const h2 = cellHeight / 2; // cache

    cells.map(cell => {
        const points = getMarchingSquaresLine(cell.value);
        if (!points)
            return;

        const draw = (points) => {
            const path = d3.svg.line()
                .x(d => cell.x + d.x * w2)
                .y(d => cell.y + d.y * h2)
                .interpolate('linear');

            allPaths
                .append('path')
                .attr({
                    d: path(points),
                    stroke: '#000',
                    'stroke-width': 1,
                });
        };
        if (points[0].hasOwnProperty('x')) {
            draw(points);
        }
        else {
            draw(points[0]);
            draw(points[1]);
        }
    });
}

function calculateMetaballs (balls) {
    calculateMarchingSquares(balls);
    drawMarchingSquares();
    //
    // const w2 = cellWidth / 2; // cache
    // const h2 = cellHeight / 2; // cache
    // cells.map( (cell, i) => {
    //     const x = cells[i].x;
    //     const y = cells[i].y;
    //     let sum = balls.reduce( (total, ball) => {
    //         let dx = cell.x + w2 - ball.x;
    //         let dy = cell.y + h2 - ball.y;
    //         let r = ball.radius;
    //         return total + (r * r) / ((dx * dx) + (dy * dy));
    //     }, 0);
    //     cell.value = sum;
    // });
    update();
    // console.log(cells);
}

function update () {
    debugCellsRect
        .attr('fill', d => {
            var brightness = d.value;
            if (brightness > 1)
                brightness = 1;
            // if (brightness < 0)
            //     brightness = 0;
            brightness /= reduction;
            if (brightness < threshold)
                brightness = 0;
            else
                brightness = 0.5;// (brightness - threshold) * rangeMultiplier * reduction;
            return rgba(0, 200, 200, brightness)
        });
    debugCellsText
        // .text(d => d.value / reduction < threshold ? 0 : 1);
        .text(d => d.value);
}

function setContainer (element) {
    container = element;
}

export {
    setContainer,
    drawGrid,
    calculateMetaballs,
    // calculateMarchingSquares,
};
