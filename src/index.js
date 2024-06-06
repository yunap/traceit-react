import { useEffect, useRef, useState } from 'react';

const break_point = {
    left: [0.50, 0.40, 0.60],
    top_left: [0.65, 0.50, 0.85],
    top_right: [0.85, 0.75, 0.95],
    top: [0.75, 0.65, 0.85],
    right: [1.0, 0.90, 1.10],
    bottom_right: [0.10, 0.05, 0.20],
    bottom_left: [0.35, 0.25, 0.45]
};

const defaultOptions = {
    strokeColor: '#00ff00',
    strokeWidth: 2,
    strokeOpacity: 1,
    fillOpacity: 0,
    gapPoint: 'top_left',
    redrawSpeed: 3500,
    canvasPadding: 15,
    onEndTrace: () => {},
    onClick: () => {},
};

const useTrace = (elementRef, hide, trace, options) => {
    const mergedOptions = { ...defaultOptions, ...options };
    const canvasRef = useRef(null);
    const [redraw, setRedraw] = useState(trace); // Add state to trigger redraw

    const handleClick = (e) => {
        const { onClick } = mergedOptions;
        e.preventDefault();
        onClick(e);
    };

    const getEllipseCoordinates = (cx, cy, rx, ry, angle) => {
        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);
        return { x, y };
    };

    const generateEllipsePoints = (width, height, padding, gapPoint) => {
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

    useEffect(() => {
        const element = elementRef.current;
        if (!element || hide) return;

        const setupCanvas = (canvas, element, mergedOptions) => {
            const padding = mergedOptions.canvasPadding;
            let { width, height, left, top } = element.getBoundingClientRect();
            const { scrollLeft, scrollTop } = document.documentElement || document.body.parentNode || document.body;
            left += scrollLeft - padding / 2;
            top += scrollTop - padding / 2;
            width += padding;
            height += padding;
            canvas.width = parseInt(width);
            canvas.height = parseInt(height);
            canvas.style.position = 'absolute';
            canvas.style.left = `${parseInt(left)}px`;
            canvas.style.top = `${parseInt(top)}px`;
        };

        const animateTrace = () => {
            const { strokeColor, strokeWidth, strokeOpacity, fillOpacity, redrawSpeed, onEndTrace } = mergedOptions;
            let start = null;

            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const percentage = Math.min(progress / redrawSpeed, 1);

                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
                ctx.save();
                ctx.beginPath();
    
                // Draw the shape based on progress
                const endPointIndex = Math.floor(percentage * controlPoints.length);
                for (let i = 0; i < endPointIndex - 1; i++) {
                    if (i === 0) {
                        ctx.moveTo(controlPoints[i].x, controlPoints[i].y);
                    } else {
                        const prevPoint = controlPoints[i - 1];
                        const midPoint = controlPoints[i];
                        const currPoint = controlPoints[i + 1];
                        
                        ctx.bezierCurveTo(prevPoint.x, prevPoint.y, midPoint.x, midPoint.y, currPoint.x, currPoint.y);
                    }
                }
        
                ctx.strokeStyle = `rgba(${hexToRgb(strokeColor)}, ${strokeOpacity})`;
                ctx.fillStyle = `rgba(${hexToRgb(strokeColor)}, ${fillOpacity})`;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();
        
                if (progress < redrawSpeed) {
                    requestAnimationFrame(animate);
                } else {
                    onEndTrace();
                }
            }

            requestAnimationFrame(animate);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        setupCanvas(canvas, element, mergedOptions);
        const controlPoints = generateEllipsePoints(canvas.width, canvas.height, mergedOptions.canvasPadding, mergedOptions.gapPoint);

        animateTrace();

        canvas.addEventListener('click', handleClick);
        window.addEventListener('resize', setRedraw);

        // Append canvas to body
        document.body.appendChild(canvas);

        return () => {
            window.removeEventListener('resize', setRedraw);

            if (canvas) {
                canvas.removeEventListener('click', handleClick);
                // Remove canvas from body
                console.log('removing canvas')
                document.body.removeChild(canvas);
            }
        };
    }, [trace, redraw, hide]);

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : null;
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


    return null;
};

export default useTrace;
