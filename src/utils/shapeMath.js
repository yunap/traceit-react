const break_point = {
    left: [0.50, 0.40, 0.60],
    top_left: [0.65, 0.50, 0.85],
    top_right: [0.85, 0.75, 0.95],
    top: [0.75, 0.65, 0.85],
    right: [1.0, 0.90, 1.10],
    bottom_right: [0.10, 0.05, 0.20],
    bottom_left: [0.35, 0.25, 0.45]
};

const getGapPoint = (location) => {
    let percent, percent2, percent3;
    //validate break point location
    if (typeof location != "string" && typeof location != "number") {
        console.log("Bad location value: " + location + " please specify value between 0% and 100%. Switching to default location 85%.");
        location = 'top_left';
    }

    if (typeof location === "string") {
        if (break_point[location] == undefined) location = 'top_left';
        percent = break_point[location][0];
        percent2 = break_point[location][1];
        percent3 = break_point[location][2];
    } else {
        if (typeof location === "number") {
            percent = location / 100;
            if (percent > 1.0) {
                percent = 0.85;
                console.log("Bad location value: " + location + " please specify value between 0% and 100%. Switching to default location 85%.");
            }

            percent2 = percent - 0.10;
            if (percent2 < 0) {
                percent2 = 1.0 - percent2;
            }
            percent3 = percent + 0.10;
            if (percent3 > 1.0) {
                percent3 = percent3 - 1.0;
            }
        }
    }
    return {percent, percent2, percent3};
}

const getEllipseCoordinates = (cx, cy, rx, ry, angle) => {
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    return { x, y };
};

export const generateEllipsePoints = (width, height, padding, gapPoint) => {
    const ellipsPoints = [];
    const numPoints = 100;
    const rx = parseInt((width - padding)/2);
    const ry = parseInt((height - padding)/2);
    const xc = rx + padding/2;
    const yc = ry + padding/2;

    const {percent, percent2, percent3} = getGapPoint(gapPoint);
    const step = 2 * Math.PI / numPoints; // Calculate angle step for uniform distribution

    for (let i = percent*100; i <= 100; i++) {
        const angle = i * step;
        const point = getEllipseCoordinates(xc, yc, rx, ry, angle);
        ellipsPoints.push(point);
    }

    for (let i = 0; i < percent2 * 100; i++) {
        const angle = i * step;
        const point = getEllipseCoordinates(xc, yc, rx, ry, angle);
        ellipsPoints.push(point);
    }

    const numberOfPoints = percent3 > percent2 ? (percent3 - percent2) * 100 : (1 - percent2 + percent3) * 100;
    const radiusStep = padding / numberOfPoints;
    for (let i = percent2 * 100, add = radiusStep; i <= percent3 * 100; i++, add += radiusStep) {
        const angle = i * step;
        const point = getEllipseCoordinates(xc, yc, rx + add, ry + add, angle);
        ellipsPoints.push(point);
    }

    return ellipsPoints;
};
