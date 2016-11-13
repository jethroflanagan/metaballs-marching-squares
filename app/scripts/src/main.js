import { setContainer, drawGrid } from './grid';
import * as config from './config';
import { addBalls } from './balls';

const { dimension } = config;
const svg = d3.select('.App')
    .append('svg')
    .attr('width', dimension.width + dimension.margin * 2)
    .attr('height', dimension.height + dimension.margin * 2)
    .append('g')
        .attr('transform', 'translate(' + dimension.margin + ',' + dimension.margin + ')');

setContainer(svg);
drawGrid();
addBalls(svg, config.balls.numToAdd);
