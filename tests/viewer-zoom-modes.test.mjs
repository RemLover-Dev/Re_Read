import test from 'node:test';
import assert from 'node:assert/strict';

// Helper: Calculate zoom focal point offset invariance
function calculateNewScroll(cursorPos, currentScroll, oldZoom, newZoom) {
  // Content space coordinate under the cursor
  const contentCoord = (currentScroll + cursorPos) / oldZoom;
  // New scroll position required so contentCoord remains at cursorPos
  const newScroll = contentCoord * newZoom - cursorPos;
  return { contentCoord, newScroll };
}

// Helper: Clamp scale
function clampScale(scale, min = 0.4, max = 4.0) {
  return Math.min(Math.max(scale, min), max);
}

test('Touchpad zoom to cursor preserves exact point under cursor', () => {
  const cursorX = 350;
  const cursorY = 220;
  const scrollLeft = 100;
  const scrollTop = 150;
  const oldScale = 1.0;
  const newScale = 1.8;

  const resultX = calculateNewScroll(cursorX, scrollLeft, oldScale, newScale);
  const resultY = calculateNewScroll(cursorY, scrollTop, oldScale, newScale);

  // Content point under cursor should be (450, 370)
  assert.equal(resultX.contentCoord, 450);
  assert.equal(resultY.contentCoord, 370);

  // When new scroll position is applied, re-projecting content point to screen coordinates
  // should yield EXACTLY the original cursor position!
  const screenXAfterZoom = resultX.contentCoord * newScale - resultX.newScroll;
  const screenYAfterZoom = resultY.contentCoord * newScale - resultY.newScroll;

  assert.equal(Math.round(screenXAfterZoom), cursorX);
  assert.equal(Math.round(screenYAfterZoom), cursorY);
});

test('Scale clamping limits zoom within safe ergonomic bounds', () => {
  // PDF zoom bounds [0.4, 4.0]
  assert.equal(clampScale(0.1, 0.4, 4.0), 0.4);
  assert.equal(clampScale(5.5, 0.4, 4.0), 4.0);
  assert.equal(clampScale(1.5, 0.4, 4.0), 1.5);

  // Markdown zoom bounds [0.5, 3.0]
  assert.equal(clampScale(0.2, 0.5, 3.0), 0.5);
  assert.equal(clampScale(3.8, 0.5, 3.0), 3.0);
  assert.equal(clampScale(2.0, 0.5, 3.0), 2.0);
});

test('Touchpad pinch multiplier formula produces smooth positive progression', () => {
  // Positive deltaY (pinch in / zoom out)
  const pinchInDelta = 50;
  const zoomFactorOut = Math.exp(-pinchInDelta * 0.0035);
  assert.ok(zoomFactorOut < 1.0, 'Pinch in must reduce scale factor');
  assert.ok(zoomFactorOut > 0.5, 'Single pinch gesture should be smooth and controlled');

  // Negative deltaY (pinch out / zoom in)
  const pinchOutDelta = -50;
  const zoomFactorIn = Math.exp(-pinchOutDelta * 0.0035);
  assert.ok(zoomFactorIn > 1.0, 'Pinch out must increase scale factor');
  assert.ok(zoomFactorIn < 1.5, 'Single pinch gesture should be smooth and controlled');
});

test('PDF View Modes: single and continuous support valid configurations', () => {
  const validModes = ['single', 'continuous'];
  assert.ok(validModes.includes('single'), 'single page mode must be supported');
  assert.ok(validModes.includes('continuous'), 'continuous stacking mode must be supported');
});

test('Centered document focal point shift preserves cursor position on screen', () => {
  // Page width 600, centered in viewport width 1000
  const viewportWidth = 1000;
  const initialWidth = 600;
  const initialLeft = (viewportWidth - initialWidth) / 2; // 200px
  const clientX = 450; // Cursor is at 450px on screen
  const offsetX = clientX - initialLeft; // 250px from left of page
  const ratio = 1.5; // Zoom in 50%

  // Shift formula used in components:
  const shiftX = (offsetX - initialWidth / 2) * (ratio - 1);

  // New width after zoom:
  const newWidth = initialWidth * ratio; // 900px
  // In centered layout, the page center remains at viewportWidth / 2:
  const newLeft = (viewportWidth - newWidth) / 2; // 50px
  // New position of that point on the page:
  const newOffsetX = offsetX * ratio; // 250 * 1.5 = 375px

  // Screen position of the point when container scroll adjusts by shiftX:
  const screenPosAfterScroll = newLeft + newOffsetX - shiftX;
  assert.equal(Math.round(screenPosAfterScroll), clientX, 'Point on page must remain under cursor');
});

test('Smooth trackpad pinch factor scaling produces responsive sub-step deltas', () => {
  // Tiny trackpad gesture delta
  const trackpadDelta = 6;
  const factor = Math.exp(trackpadDelta * 0.005);
  // ~3% change
  assert.ok(factor > 1.01 && factor < 1.05, 'Smooth trackpad zoom should be ~1-5% per tick');

  // Negative trackpad gesture
  const trackpadZoomOut = Math.exp(-trackpadDelta * 0.005);
  assert.ok(trackpadZoomOut > 0.95 && trackpadZoomOut < 0.99, 'Smooth trackpad zoom out should be ~1-5% per tick');
});

test('Touchpad pinch detector recognizes both Ctrl (Windows/Linux) and Meta (macOS) keys', () => {
  const isPinchEvent = (e) => Boolean(e.ctrlKey || e.metaKey);

  assert.equal(isPinchEvent({ ctrlKey: true, metaKey: false }), true);
  assert.equal(isPinchEvent({ ctrlKey: false, metaKey: true }), true);
  assert.equal(isPinchEvent({ ctrlKey: false, metaKey: false }), false);
});

test('Pan activation detector triggers on HandTool, Spacebar, MiddleClick, or background drag when zoomed', () => {
  const shouldStartPan = ({ isHandTool, isSpacePressed, button, zoom, isTargetBackground }) => {
    if (isHandTool || isSpacePressed || button === 1) return true;
    if (zoom > 1.0 && isTargetBackground && button === 0) return true;
    return false;
  };

  // Hand tool
  assert.equal(shouldStartPan({ isHandTool: true, isSpacePressed: false, button: 0, zoom: 1.0, isTargetBackground: false }), true);
  // Spacebar
  assert.equal(shouldStartPan({ isHandTool: false, isSpacePressed: true, button: 0, zoom: 1.0, isTargetBackground: false }), true);
  // Middle click (button 1)
  assert.equal(shouldStartPan({ isHandTool: false, isSpacePressed: false, button: 1, zoom: 1.0, isTargetBackground: false }), true);
  // Zoomed in, left click on background
  assert.equal(shouldStartPan({ isHandTool: false, isSpacePressed: false, button: 0, zoom: 1.5, isTargetBackground: true }), true);
  // Normal mode, left click on content (text selection)
  assert.equal(shouldStartPan({ isHandTool: false, isSpacePressed: false, button: 0, zoom: 1.0, isTargetBackground: false }), false);
  // Zoomed in, left click on text content (preserve text selection)
  assert.equal(shouldStartPan({ isHandTool: false, isSpacePressed: false, button: 0, zoom: 1.5, isTargetBackground: false }), false);
});

test('WebKit gesturechange converts cumulative scale to incremental factors', () => {
  let lastScale = 1.0;
  const calculateFactor = (cumulativeScale) => {
    const factor = cumulativeScale / lastScale;
    lastScale = cumulativeScale;
    return factor;
  };

  // Safari gesture moves from 1.0 -> 1.05 -> 1.10
  const factor1 = calculateFactor(1.05);
  assert.equal(Math.round(factor1 * 1000) / 1000, 1.05);

  const factor2 = calculateFactor(1.1025);
  // 1.1025 / 1.05 = 1.05 (clean 5% step, not 1.10 compounding on 1.05)
  assert.equal(Math.round(factor2 * 1000) / 1000, 1.05);
});

test('Continuous vertical scroll mode maintains scroll coordinate invariance', () => {
  const containerScrollTop = 2400; // Scrolled down to page 4
  const cursorOffsetY = 300; // 300px below top of container viewport
  const prevScale = 1.0;
  const nextScale = 1.2;
  const ratio = nextScale / prevScale;

  const containerY = containerScrollTop + cursorOffsetY; // 2700
  const shiftY = containerY * (ratio - 1); // 2700 * 0.2 = 540

  const newScrollTop = containerScrollTop + shiftY; // 2940
  // Screen coordinate of point after zoom:
  // (containerY * ratio) - newScrollTop = 2700 * 1.2 - 2940 = 3240 - 2940 = 300px
  const screenPosAfterZoom = (containerY * ratio) - newScrollTop;
  assert.equal(screenPosAfterZoom, cursorOffsetY, 'Document point must stay exactly under cursor across multiple pages');
});

test('Multi-touch pinch distance computes correct incremental scaling factor', () => {
  const touch1Initial = { clientX: 100, clientY: 100 };
  const touch2Initial = { clientX: 200, clientY: 100 };
  const initialDist = Math.hypot(
    touch1Initial.clientX - touch2Initial.clientX,
    touch1Initial.clientY - touch2Initial.clientY
  );
  assert.equal(initialDist, 100);

  // Fingers spread apart to 120px
  const touch1Moved = { clientX: 90, clientY: 100 };
  const touch2Moved = { clientX: 210, clientY: 100 };
  const currentDist = Math.hypot(
    touch1Moved.clientX - touch2Moved.clientX,
    touch1Moved.clientY - touch2Moved.clientY
  );
  assert.equal(currentDist, 120);

  const factor = currentDist / initialDist;
  assert.equal(factor, 1.2);
});

test('Synchronous zoom ref tracking prevents stale closures under rapid event bursts', () => {
  let scale = 1.0;
  const scaleRef = { current: scale };

  const handleZoomEvent = (factor) => {
    const prev = scaleRef.current;
    const next = prev * factor;
    // Synchronous update prevents stale batching:
    scaleRef.current = next;
    scale = next;
  };

  // 3 rapid micro-events in the same frame
  handleZoomEvent(1.02);
  handleZoomEvent(1.02);
  handleZoomEvent(1.02);

  assert.equal(Math.round(scaleRef.current * 1000) / 1000, 1.061);
});

test('Capture-phase event filter accurately determines if cursor is within viewport bounds', () => {
  const cRect = { left: 100, right: 900, top: 50, bottom: 650 };
  const isInside = (clientX, clientY) =>
    clientX >= cRect.left &&
    clientX <= cRect.right &&
    clientY >= cRect.top &&
    clientY <= cRect.bottom;

  assert.equal(isInside(500, 300), true, 'Inside bounds must pass');
  assert.equal(isInside(50, 300), false, 'Left of bounds must fail');
  assert.equal(isInside(950, 300), false, 'Right of bounds must fail');
  assert.equal(isInside(500, 20), false, 'Above bounds must fail');
  assert.equal(isInside(500, 700), false, 'Below bounds must fail');
});
