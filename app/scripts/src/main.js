import { setContainer, drawGrid } from './grid';
import { dimension } from './config';
import { addBalls } from './balls';

const svg = d3.select('.App')
    .append('svg')
    .attr('width', dimension.width + dimension.margin * 2)
    .attr('height', dimension.height + dimension.margin * 2)
    .append('g')
        .attr('transform', 'translate(' + dimension.margin + ',' + dimension.margin + ')');

setContainer(svg);
drawGrid();
addBalls(svg, 8);
