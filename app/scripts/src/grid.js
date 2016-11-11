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
    .map( (d, id) => {
        const col = id % numColumns;
        const row = Math.floor(id / numColumns);
        return {
            id,
            row,
            col,
            x: col * cellWidth,
            y: row * cellHeight,
            value: 0,
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
    }, 0);
};

function calculateMarchingSquares (balls) {
    cells.map( (cell, i) => {
        const x = cells[i].x;
        const y = cells[i].y;
        const simplify = (v) => (v > 1 ? 1 : 0);
        let sumTL = getMarchingSquareCorner(balls, cell, 0, 0);
        let sumTR = getMarchingSquareCorner(balls, cell, cellWidth, 0);
        let sumBR = getMarchingSquareCorner(balls, cell, cellWidth, cellHeight);
        let sumBL = getMarchingSquareCorner(balls, cell, 0, cellHeight);

        // marching squares
        // http://jamie-wong.com/images/14-08-11/marching-squares-mapping.png
        // The configuration number between 0-15 is computed by assigning a value of 0 to each of the corners where f(x,y)<1f(x,y)<1, and a value of 1 where f(x,y)≥1f(x,y)≥1, then interpreting these bits as a binary number, ordered (southwest, southeast, northeast, northwest).
        // cell.value = parseInt('' + sumBL + sumBR + sumTR + sumTL, 2);
        cell.value = simplify(sumBL) +
            (simplify(sumBR) << 1) +
            (simplify(sumTR) << 2) +
            (simplify(sumTL) << 3);
        cell.rawValue = [sumBL, sumBR, sumTR, sumTL];
    });
    update();
}

function getLerpForSquare (x0, y0, x1, y1, threshold) {
    if (!threshold)
        threshold = 1;
	if (x0 === x1) {
	    return 0.5;
	}

	return y0 + (y1 - y0) * (threshold - x0) / (x1 - x0);
};

// get x,y back as (0-2, 0-2)->(0-2, 0-2) for a line within square from edge to edge
// where x=0 is leftmost, x=1 is middle, x=2 is rightmost
// a line from middle left edge tp bottom right edge is
//  (0,1) -> (1,2)
// return [0,1, 1,2]
//         x,y->x,y
// Since range is 0->2, multiply by half size of cell to get actual point
//
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

// Case 0   Case 1   Case 2   Case 3   Case 4   Case 5   Case 6   Case 7
// O-----O  O-----O  O-----O  O-----O  O-----#  O-----#  O-----#  O-----#
// |     |  |     |  |     |  |     |  |    \|  |/    |  |  |  |  |/    |
// |     |  |\    |  |    /|  |-----|  |     |  |    /|  |  |  |  |     |
// O-----O  #-----O  O-----#  #-----#  O-----O  #-----O  O-----#  #-----#
//
// Case 8   Case 9   Case 10  Case 11  Case 12  Case 13  Case 14  Case 15
// #-----O  #-----O  #-----O  #-----O  #-----#  #-----#  #-----#  #-----#
// |/    |  |  |  |  |    \|  |    \|  |-----|  |     |  |     |  |     |
// |     |  |  |  |  |\    |  |     |  |     |  |    /|  |\    |  |     |
// O-----O  #-----O  O-----#  #-----#  O-----O  #-----O  O-----#  #-----#
// TODO put contour in order
// TODO write as [left,up] , [up, down] to describe lines
// TODO square give location of next square to march to, so saddle points just return one line depending on what the previous cell ends on
//      e.g. end on right, means give the saddle line that starts on left

function getMarchingSquareDirection (value, previousDirection) {
    const LEFT = [-1, 0];
    const RIGHT = [1, 0];
    const UP = [0, -1];
    const DOWN = [0, 1];
    switch (value) {
        case 1: return LEFT; // [DOWN, LEFT],
        case 2: return DOWN; // [RIGHT, DOWN],
        case 3: return LEFT; // [RIGHT, LEFT],
        case 4: return RIGHT; // [UP, RIGHT],
        case 5: return previousDirection[0] === UP[0] && previousDirection[1] === UP[1] // previousDirection === UP ? [DOWN, RIGHT] : [UP, LEFT],
                ? RIGHT
                : LEFT;
        case 6: return DOWN; // [UP, DOWN],
        case 7: return LEFT; // [UP, LEFT],
        case 8: return UP; // [LEFT, UP],
        case 9: return UP; // [DOWN, UP],
        case 10: return previousDirection[0] === RIGHT[0] && previousDirection[1] === RIGHT[1] // previousDirection === RIGHT ? [LEFT, DOWN] : [RIGHT, UP],
                ? DOWN
                : UP;
        case 11: return UP; // [RIGHT, UP],
        case 12: return RIGHT; // [LEFT, RIGHT],
        case 13: return RIGHT; // [DOWN, RIGHT],
        case 14: return DOWN; // [LEFT, DOWN],
    };
}

function getCell (col, row) {
    return cells[numColumns * row + col];
}

function getEdge (cells, contour) {
    let cell;
    for (var i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.value > 0 && cell.value < 15/* &&
            _.find(contour, cell) === -1*/) {
            return cell;
        }
    }
}

function getMarchingSquaresContour (cells) {
    let previousDirection = null;
    const startingCell = getEdge(cells);
    let contour = [startingCell];
    let cell = startingCell;
    do {
        let direction = getMarchingSquareDirection(cell.value, previousDirection);
        cell = getCell(cell.col + direction[0], cell.row + direction[1]);
        contour.push(cell);
        previousDirection = direction;
    } while (cell !== startingCell)
    return contour;
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

    // let availableCells = cells.filter(cell => cell.value > 0);
    const points = getMarchingSquaresContour(cells);

    if (!points)
        return;

    const draw = (points) => {
        const path = d3.svg.line()
            .x(d => d.x + w2)
            .y(d => d.y + h2)
            .interpolate('linear');

        allPaths
            .append('path')
            .attr({
                d: path(points),
                stroke: '#000',
                'stroke-width': 1,
                fill: rgba(0,0,0,0.2),
            });
    };
    if (points[0].hasOwnProperty('x')) {
        points[0].x
        draw(points);
    }
    else {
        draw(points[0]);
        draw(points[1]);
    }
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
