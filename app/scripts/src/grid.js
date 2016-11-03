import { dimension } from './config';
import { rgba } from './utils';

const xScale = d3.scale.linear()
    .range([0, dimension.height]);
const yScale = d3.scale.linear()
    .range([0, dimension.width]);

const cellWidth = 10;
const cellHeight = 10;

const numColumns = yScale(1) / cellWidth;
const numRows = xScale(1) / cellHeight;

// quick 2d array, all values set to 0
export const grid = d3.range(numRows)
    .map(d => d3.range(numColumns).map(d => 0));

export const drawGrid = (container, xScale, yScale) => {
    container
        .append('g')
            .attr({
                'class': 'Grid',
            })
        .selectAll('rect')
        .data(grid)
        .enter()
        .append('g')
            // .attr('transform', (d, i) => {
            //     return 'translate(0, ' + i * cellHeight + ')';
            // })
        .selectAll('rect')
        .data(d => d)
        .enter()
            .append('rect')
                .attr(
                {
                    'class':'Grid-cell',
                    x: (d, x, y) => x * cellWidth,
                    y: (d, x, y) => y * cellHeight,
                    width: cellWidth,
                    height: cellHeight,
                    fill: rgba(0, 200, 0, 1),
                    'shape-rendering': 'crispEdges',
                    stroke: 'black',
                    'stroke-width': '1px'
                });
};
