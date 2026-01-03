export function getNiceTicks(min, max, maxTicks = 10) {
    if (min === max) return [min];

    const range = niceNum(max - min, false);
    const tickSpacing = niceNum(range / (maxTicks - 1), true);

    // Careful with float precision using very small numbers
    const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
    const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;

    const ticks = [];
    // Use epsilon for float comparison safety
    const epsilon = tickSpacing / 1000;

    for (let x = niceMin; x < niceMax + tickSpacing / 2; x += tickSpacing) {
        if (x >= min - epsilon && x <= max + epsilon) {
            // Fix float issues (e.g. 0.300000000004)
            // Determine decimal places from tickSpacing
            ticks.push(Number(x.toPrecision(12)));
        }
    }
    return ticks;
}

function niceNum(range, round) {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / Math.pow(10, exponent);
    let niceFraction;

    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }

    return niceFraction * Math.pow(10, exponent);
}
