import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

/**
 * PixelatedReveal Component
 * 
 * Renders a canvas that displays a pixelated version of an image.
 * The visibility of each "pixel" is controlled by a heat diffusion simulation.
 * 
 * @param {string} src - The source image URL.
 * @param {number} gridSize - The size of each pixel block in CSS pixels.
 * @param {number} decay - How fast the heat fades (0-1).
 * @param {number} diffusion - How fast the heat spreads to neighbors (0-1).
 * @param {number} threshold - Minimum heat value to show a pixel (0-1).
 */
const PixelatedReveal = forwardRef(({
    src,
    gridSize = 20,
    decay = 0.98,
    diffusion = 0.15,
    threshold = 0.1,
    influenceRadius = 4
}, ref) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Simulation state
    const gridRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000, active: false });
    const animationRef = useRef(null);

    // Expose method to parent
    useImperativeHandle(ref, () => ({
        onMouseMove: (x, y) => {
            mouseRef.current = { x, y, active: true };
        },
        onMouseLeave: () => {
            mouseRef.current.active = false;
        }
    }));

    useEffect(() => {
        // Load image
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            imageRef.current = img;
            initGrid();
        };
    }, [src]);

    const initGrid = () => {
        if (!containerRef.current || !canvasRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Set canvas resolution
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Calculate grid dimensions
        const cols = Math.ceil(width / gridSize);
        const rows = Math.ceil(height / gridSize);

        // Initialize grid with 0 heat
        // We use a 1D array for performance: index = y * cols + x
        gridRef.current = new Float32Array(cols * rows).fill(0);
    };

    useEffect(() => {
        const handleResize = () => {
            initGrid();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [gridSize]);

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            active: true
        };
    };

    const handleMouseLeave = () => {
        mouseRef.current.active = false;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: true }); // Enable transparency

        if (!canvas || !ctx) return;

        const update = () => {
            if (!imageRef.current || !gridRef.current.length) {
                animationRef.current = requestAnimationFrame(update);
                return;
            }

            const width = canvas.width;
            const height = canvas.height;
            const cols = Math.ceil(width / gridSize);
            const rows = Math.ceil(height / gridSize);
            const grid = gridRef.current;

            // Create a buffer for the next state to avoid directional bias
            const nextGrid = new Float32Array(grid.length);

            // 1. Add heat from mouse
            if (mouseRef.current.active) {
                const mx = Math.floor(mouseRef.current.x / gridSize);
                const my = Math.floor(mouseRef.current.y / gridSize);

                // Add heat to the cell under mouse and immediate neighbors
                // Radius of influence
                const radius = influenceRadius;
                for (let y = -radius; y <= radius; y++) {
                    for (let x = -radius; x <= radius; x++) {
                        const tx = mx + x;
                        const ty = my + y;
                        if (tx >= 0 && tx < cols && ty >= 0 && ty < rows) {
                            const index = ty * cols + tx;
                            // Add heat, capped at 1.0
                            // Distance based falloff for mouse input
                            const dist = Math.sqrt(x * x + y * y);
                            if (dist <= radius) {
                                grid[index] = Math.min(grid[index] + 0.5 * (1 - dist / radius), 1.0);
                            }
                        }
                    }
                }
            }

            // 2. Diffusion and Decay
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    let currentHeat = grid[i];

                    // Gather heat from neighbors
                    let neighborHeat = 0;
                    let neighborCount = 0;

                    const neighbors = [
                        { dx: 0, dy: -1 }, // Top
                        { dx: 0, dy: 1 },  // Bottom
                        { dx: -1, dy: 0 }, // Left
                        { dx: 1, dy: 0 },  // Right
                    ];

                    for (const n of neighbors) {
                        const nx = x + n.dx;
                        const ny = y + n.dy;
                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                            neighborHeat += grid[ny * cols + nx];
                            neighborCount++;
                        }
                    }

                    // Average neighbor heat
                    if (neighborCount > 0) {
                        const avgNeighbor = neighborHeat / neighborCount;
                        // Move current heat towards average neighbor heat
                        currentHeat = currentHeat * (1 - diffusion) + avgNeighbor * diffusion;
                    }

                    // Apply decay
                    currentHeat *= decay;

                    // Clamp
                    if (currentHeat < 0.001) currentHeat = 0;

                    nextGrid[i] = currentHeat;
                }
            }

            // Update grid state
            gridRef.current = nextGrid;

            // 3. Render
            ctx.clearRect(0, 0, width, height);

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    const heat = nextGrid[i];

                    if (heat > threshold) {
                        // Calculate opacity based on heat
                        // Smooth step for nicer fade
                        const alpha = Math.min((heat - threshold) / (1 - threshold), 1);

                        ctx.globalAlpha = alpha;

                        const sWidth = imageRef.current.naturalWidth;
                        const sHeight = imageRef.current.naturalHeight;

                        // Calculate cover scaling
                        const scale = Math.max(width / sWidth, height / sHeight);
                        const xOffset = (width - sWidth * scale) / 2;
                        const yOffset = (height - sHeight * scale) / 2;

                        const dx = x * gridSize;
                        const dy = y * gridSize;

                        // Map dest rect back to source rect
                        const sx = (dx - xOffset) / scale;
                        const sy = (dy - yOffset) / scale;
                        const sSize = gridSize / scale;

                        ctx.drawImage(
                            imageRef.current,
                            sx, sy, sSize, sSize,
                            dx, dy, gridSize, gridSize
                        );
                    }
                }
            }

            ctx.globalAlpha = 1.0;
            animationRef.current = requestAnimationFrame(update);
        };

        animationRef.current = requestAnimationFrame(update);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [gridSize, decay, diffusion, threshold]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <canvas
                ref={canvasRef}
                style={{ display: 'block' }}
            />
        </div>
    );
});

export default PixelatedReveal;
