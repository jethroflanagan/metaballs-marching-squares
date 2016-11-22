let $slider;
let $label;

function init (onUpdate) {
    $slider = d3.select('.Slider-input');
    $label = d3.select('.Slider-value');

    $slider.on('input', update(onUpdate));
    setValue(0);
}

function update (onUpdate) {
    return function () {
        const value = this.value;
        $label.html(value);
        if (onUpdate) {
            onUpdate(value / 100);
        }
    }
}
function setValue (value) {
    $label.html(value);
    $slider.attr('value', 0);
}
export {
    init,
    setValue,
};
