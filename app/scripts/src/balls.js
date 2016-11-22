import * as config from './config';
import { calculateMetaballs } from './grid';
import { translate, rgba } from './utils';

const { cellWidth, cellHeight } = config.grid;
const { dimension } = config;

const balls = [];

function addBalls (container, numBalls) {
    // const { drag } = setupInteraction(balls);
    // ensure they are away from edges just for generation
    for (let i = 0; i < numBalls; i++) {
        const radius = Math.random() * 30 + 15;
        const colPadding = cellWidth * 3 + radius;
        const rowPadding = cellHeight * 3+ radius;
        balls.push({
            radius,
            cluster: Math.random() > 0.5 ? 1: 0,
            // ensure they are away from edges
            x: Math.random() * (dimension.width - colPadding * 2) + colPadding,
            y: Math.random() * (dimension.height - rowPadding * 2) + rowPadding,
            speed: Math.random() * 4 + 1,
            direction: Math.random() * Math.PI * 2,
        });
    }
    // update();

setupContainer(container);

}

function setupContainer (container) {
    let group = container
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

    let force = d3.layout.force()
        .nodes(balls)
        .size([dimension.width, dimension.height])
        .gravity(.5)
        .charge(d => d.radius * - 30)
        .on('tick', () => {
            tick(group);
            update();
        })

    group
        .call(force.drag);

    force.start();

    return group;
}

// const dragMove = (d) => {
//   var x = d3.event.x;
//   var y = d3.event.y;
//   d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
// }

// function setupInteraction (data) {
//     const drag = d3.behavior.drag()
//         .on("drag", function (d) {
//             d.x += d3.event.dx;
//             d.y += d3.event.dy;
//
//             const minWidth = d.radius + cellWidth;
//             const minHeight = d.radius + cellHeight;
//             const maxWidth = dimension.width - d.radius - cellWidth;
//             const maxHeight = dimension.height - d.radius - cellHeight;
//             // constraints
//             if (d.x >= maxWidth)
//                 d.x = maxWidth;
//             if (d.y >= maxHeight)
//                 d.y = maxHeight;
//             if (d.x <= minWidth)
//                 d.x = minWidth;
//             if (d.y <= minHeight)
//                 d.y = minHeight;
//
//             d3.select(this).attr({
//                 'transform': d => translate(d.x, d.y),
//             });
//
//             update();
//         });
//
//     return {
//         drag,
//     }
// }

function tick (nodes) {
    collide(.5, balls)

    nodes
        .attr("transform", (d) => {
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
            return translate(d.x, d.y);
        })
}
// Resolves collisions between d and all other circles.
// taken from https://bl.ocks.org/mbostock/3231298
function collide(alpha, nodes) {
    var q = d3.geom.quadtree(nodes),
        i = 0,
        n = nodes.length;
    while (++i < n) {
        q.visit(resolveCollision(nodes[i]));
    }
}
// modified from https://bl.ocks.org/mbostock/3231298
function resolveCollision (node) {
    var r = node.radius + 120,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return (quad, x1, y1, x2, y2) => {
        if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = node.radius + quad.point.radius + 10;
            if (l < r) {
                l = (l - r) / l * .5;
                node.x -= x *= l;
                node.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
            }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
}

function update () {
    calculateMetaballs(balls);
};

export {
    addBalls,
    // update,
};
