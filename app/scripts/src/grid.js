import * as config from './config';
import { rgba } from './utils';

// Use name for cheap comparison
const LEFT = { x: -1, y: 0, name: 'left'};
const RIGHT = { x: 1, y: 0, name: 'right'};
const UP = { x: 0, y: -1, name: 'up'};
const DOWN = { x: 0, y: 1, name: 'down'};

const { cellWidth, cellHeight } = config.grid;
const { dimension } = config;

const xScale = d3.scale.linear()
    .range([0, dimension.height]);
const yScale = d3.scale.linear()
    .range([0, dimension.width]);

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
                fill: 'transparent',
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

function getLerpForPoints (a, b) {
    const THRESHOLD = 1;
    return (THRESHOLD - a) / (b - a)
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
    switch (value) {
        case 1: return LEFT; // [DOWN, LEFT],
        case 2: return DOWN; // [RIGHT, DOWN],
        case 3: return LEFT; // [RIGHT, LEFT],
        case 4: return RIGHT; // [UP, RIGHT],
        case 5: return previousDirection.name === UP.name && previousDirection.name === UP.name // previousDirection === UP ? [DOWN, RIGHT] : [UP, LEFT],
                ? RIGHT
                : LEFT;
        case 6: return DOWN; // [UP, DOWN],
        case 7: return LEFT; // [UP, LEFT],
        case 8: return UP; // [LEFT, UP],
        case 9: return UP; // [DOWN, UP],
        case 10: return previousDirection.name === RIGHT.name && previousDirection.name === RIGHT.name // previousDirection === RIGHT ? [LEFT, DOWN] : [RIGHT, UP],
                ? DOWN
                : UP;
        case 11: return UP; // [RIGHT, UP],
        case 12: return RIGHT; // [LEFT, RIGHT],
        case 13: return RIGHT; // [DOWN, RIGHT],
        case 14: return DOWN; // [LEFT, DOWN],
    };
}

function getCell (col, row) {
    if (col < 0 || col > numColumns - 1 ||
            row < 0 || row > numRows - 1) {
        return null;
    }
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
    let previousDirection = DOWN; // set to DOWN for offgrid handling
    const startingCell = getEdge(cells);
    let contour = [];
    let cell = startingCell;
    do {
        let direction = getMarchingSquareDirection(cell.value, previousDirection);
        // used when edge of the grid is hit, keep moving in previous direction based on which edge we're on
        if (!direction) {
            direction = previousDirection;
        }
        let nextCell = getCell(cell.col + direction.x, cell.row + direction.y);
        // Handle offgrid positions by drawing along the edges
        if (!nextCell) {
            // top left cell handled by 'DOWN' default direction
            // special case on top right cell
            if (cell.col === numColumns -1 && cell.row === 0) {
                direction = LEFT;
            }
            // special case on bottom right cell
            else if (cell.col === numColumns -1 && cell.row === numRows - 1) {
                direction = UP;
            }
            // special case on bottom left cell
            else if (cell.col === 0 && cell.row === numRows - 1) {
                direction = RIGHT;
            }
            // left or right edge
            else if (cell.col <= 0 || cell.col >= numColumns - 1) {
                direction = UP;
                switch (cell.value) {
                    case 2:
                    case 4:
                    case 6:
                    case 7:
                    case 14:
                        direction = DOWN;
                        break;
                    case 15:
                        direction = previousDirection;
                }
            }
            // top or bottom edge
            else {
                direction = LEFT;
                switch (cell.value) {
                    case 2:
                    case 6:
                    case 8:
                    case 12:
                    case 13:
                    case 14:
                        direction = RIGHT;
                        break;
                    case 15:
                        direction = previousDirection;
                }
            }
            // Catch problems
            if (!direction) {
                console.error('No direction', cell);
                debugger;
            }
            nextCell = getCell(cell.col + direction.x, cell.row + direction.y);
            if (!nextCell) {
                console.error('No next cell', cell);
                debugger;
            }
        }
        if (direction === LEFT && previousDirection === RIGHT ||
            direction === RIGHT && previousDirection === LEFT ||
            direction === UP && previousDirection === DOWN ||
            direction === DOWN && previousDirection === UP) {
            console.error('Endless loop detected', cell);
            debugger
        }
        // TODO simplify lerping
        let lerpX = 0;
        let lerpY = 0;
        // handle endpoint edge lerp (i.e. only care about vertices at endpoint)
        // points are anti-clockwise on square starting bottom left
        if (cell.value === 2 || cell.value === 6 || cell.value === 14) {
            lerpX = getLerpForPoints(cell.rawValue[0], cell.rawValue[1]) * cellWidth - cellWidth / 2;
        }
        if (cell.value === 8 || cell.value === 9 || cell.value === 11) {
            lerpX = getLerpForPoints(cell.rawValue[3], cell.rawValue[2]) * cellWidth - cellWidth / 2;
        }
        if (cell.value === 7 || cell.value === 1 || cell.value === 3) {
            lerpY = getLerpForPoints(cell.rawValue[3], cell.rawValue[0]) * cellWidth - cellWidth / 2;
        }
        if (cell.value === 4 || cell.value === 13 || cell.value === 12) {
            lerpY = getLerpForPoints(cell.rawValue[2], cell.rawValue[1]) * cellWidth - cellWidth / 2;
        }
        contour.push({
            x: cell.x + direction.x * cellWidth / 2 + lerpX,
            y: cell.y + direction.y * cellHeight / 2 + lerpY,
        });
        cell = nextCell;
        previousDirection = direction;
    } while (cell !== startingCell);
    contour.push(contour[0])
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

    let availableCells = cells.filter(cell => cell.value > 0 && cell.value < 15);
    const points = getMarchingSquaresContour(availableCells);

    if (!points)
        return;

    const draw = (points) => {
        const path = d3.svg.line()
            .x(d => d.x + w2) // w2 draw through middle of cell
            .y(d => d.y + h2) // h2 draw through middle of cell
            .interpolate('linear');

        allPaths
            .append('path')
            .attr({
                d: path(points),
                stroke: '#000',
                'stroke-width': 1,
                fill: rgba(0,0,0,0.2),
                'class': 'Contour',
            });
    };
    if (points[0].hasOwnProperty('x')) {
        // points[0].x
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
