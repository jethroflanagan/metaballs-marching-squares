import * as config from './config';
import { calculateMetaballs } from './grid';
import { translate, rgba } from './utils';

const { cellWidth, cellHeight } = config.grid;
const { dimension } = config;

const balls = [];

function addBalls (container, numBalls) {
    const { drag } = setupInteraction(balls);
    // ensure they are away from edges just for generation
    for (let i = 0; i < numBalls; i++) {
        const radius = Math.random() * 40 + 25;
        const colPadding = cellWidth * 3 + radius;
        const rowPadding = cellHeight * 3+ radius;
        balls.push({
            radius,
            // ensure they are away from edges
            x: Math.random() * (dimension.width - colPadding * 2) + colPadding,
            y: Math.random() * (dimension.height - rowPadding * 2) + rowPadding,
            speed: Math.random() * 4 + 1,
            direction: Math.random() * Math.PI * 2,
        });
    }
    update();

    return container
        .append('g')
        .selectAll('circle')
        .data(balls)
        .enter()
            .append('circle')
                .attr({
                    'classed': 'Ball',
                    r: d => d.radius,
                    x: d => d.x,
                    y: d => d.y,
                    transform: d => translate(d.x, d.y),
                    stroke: '#C00',
                    fill: rgba(0, 0, 0, 0),
                })
                .call(drag);
}


// const dragMove = (d) => {
//   var x = d3.event.x;
//   var y = d3.event.y;
//   d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
// }

function setupInteraction (data) {
    const drag = d3.behavior.drag()
        .on("drag", function (d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;

            const minWidth = d.radius + cellWidth;
            const minHeight = d.radius + cellHeight;
            const maxWidth = dimension.width - d.radius - cellWidth;
            const maxHeight = dimension.height - d.radius - cellHeight;
            // constraints
            if (d.x >= maxWidth)
                d.x = maxWidth;
            if (d.y >= maxHeight)
                d.y = maxHeight;
            if (d.x <= minWidth)
                d.x = minWidth;
            if (d.y <= minHeight)
                d.y = minHeight;

            d3.select(this).attr({
                'transform': d => translate(d.x, d.y),
            });

            update();
        });

    return {
        drag,
    }
}

function update () {
    calculateMetaballs(balls);
};

export {
    addBalls,
    update,
};
