import { dimension } from './config';
import { calculateMetaballs } from './grid';
import { translate, rgba } from './utils';

// const

const balls = [];

function addBalls (container, numBalls) {
    const { drag } = setupInteraction(balls);
    // ensure they are away from edges just for generation
    const edgePadding = 10;
    for (let i = 0; i < numBalls; i++) {
        const radius = Math.random() * 40 + 25;
        const padding = edgePadding + radius;
        balls.push({
            radius,
            // ensure they are away from edges
            x: Math.random() * (dimension.width - padding * 2) + padding,
            y: Math.random() * (dimension.height - padding * 2) + padding,
            speed: Math.random() * 4 + 1,
            direction: Math.random() * Math.PI * 2,
        });
    }
    update();

    return container.selectAll('circle')
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

            // constraints
            if (d.x >= dimension.width)
                d.x = dimension.width;
            if (d.y >= dimension.height)
                d.y = dimension.height;
            if (d.x <= 0)
                d.x = 0;
            if (d.y <= 0)
                d.y = 0;

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
