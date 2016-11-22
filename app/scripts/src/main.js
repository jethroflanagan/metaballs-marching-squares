import {
    setContainer,
    drawGrid,
    setThreshold as setGridThreshold
} from './grid';

import * as config from './config';
import { addBalls } from './balls';
import { init as initSlider } from './slider';

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
initSlider(setGridThreshold);

d3.select('.App')
    .style({
        width: dimension.width + dimension.margin * 2 + 'px',
        height: dimension.height + dimension.margin * 2 + 'px',
    });
