
function rotate (deg) {
    return 'rotate(' + deg + ')';
};

function scale (x, y) {
    if (y === undefined)
        return 'scale(' + x + ')';
    return 'scale(' + x + ',' + y + ')';
};

function translate (x, y) {
    if (y === undefined)
        return 'translate(' + x + ')';
    return 'translate(' + x + ',' + y + ')';
};

function rgba (r, g, b, a) {
    if (a === undefined)
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
};

export {
    rotate,
    scale,
    translate,
    rgba,
};
