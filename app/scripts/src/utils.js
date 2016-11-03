
const rotate = (deg) => {
    return 'rotate(' + deg + ')';
};

const scale = (x, y) => {
    if (y === undefined)
        return 'scale(' + x + ')';
    return 'scale(' + x + ',' + y + ')';
};

const translate = (x, y) => {
    if (y === undefined)
        return 'translate(' + x + ')';
    return 'translate(' + x + ',' + y + ')';
};

const rgba = (r, g, b, a) => {
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
