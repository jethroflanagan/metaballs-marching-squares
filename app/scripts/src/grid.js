import { dimension } from './config';
import { rgba } from './utils';

const xScale = d3.scale.linear()
    .range([0, dimension.height]);
const yScale = d3.scale.linear()
    .range([0, dimension.width]);

const cellWidth = 10;
const cellHeight = 10;

const numColumns = Math.ceil(yScale(1) / cellWidth);
const numRows = Math.ceil(xScale(1) / cellHeight);
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

function drawGrid () {
    debugCells = container
        .append('g')
            .attr({
                'class': 'Grid',
            })
        .selectAll('rect')
        .data(cells)
        .enter()
            .append('rect');

            debugCells
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
                        return rgba(0, 200, 0, d.value)
                    },
                    'shape-rendering': 'crispEdges',
                    stroke: 'black',
                    'stroke-width': '1px'
                });
};

function calculateMetaballs (balls) {
    const w2 = cellWidth / 2; // cache
    const h2 = cellHeight / 2; // cache
    cells.map( (cell, i) => {
        const x = cells[i].x;
        const y = cells[i].y;
        let sum = balls.reduce( (total, ball) => {
            let dx = cell.x + w2 - ball.x;
            let dy = cell.y + h2 - ball.y;
            let r = ball.radius;
            return total + (r * r) / ((dx * dx) + (dy * dy));
        }, 0);
        cell.value = sum;
    });
    update();
    // console.log(cells);
}

function update () {
    debugCells
        .attr('fill', d => {
            if (d > 1)
                d = 1;
            if (d < 0)
                d = 0;
            return rgba(0, 200, 0, d.value)
        });
}

function setContainer (element) {
    container = element;
}

export {
    setContainer,
    drawGrid,
    calculateMetaballs,
};
