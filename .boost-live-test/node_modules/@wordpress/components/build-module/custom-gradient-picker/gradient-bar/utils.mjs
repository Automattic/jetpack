// packages/components/src/custom-gradient-picker/gradient-bar/utils.ts
import { MINIMUM_DISTANCE_BETWEEN_POINTS } from "./constants.mjs";
function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}
function isOverlapping(value, initialIndex, newPosition, minDistance = MINIMUM_DISTANCE_BETWEEN_POINTS) {
  const initialPosition = value[initialIndex].position;
  const minPosition = Math.min(initialPosition, newPosition);
  const maxPosition = Math.max(initialPosition, newPosition);
  return value.some(({
    position
  }, index) => {
    return index !== initialIndex && (Math.abs(position - newPosition) < minDistance || minPosition < position && position < maxPosition);
  });
}
function addControlPoint(points, position, color) {
  const nextIndex = points.findIndex((point) => point.position > position);
  const newPoint = {
    color,
    position
  };
  const newPoints = points.slice();
  newPoints.splice(nextIndex - 1, 0, newPoint);
  return newPoints;
}
function removeControlPoint(points, index) {
  return points.filter((_point, pointIndex) => {
    return pointIndex !== index;
  });
}
function updateControlPoint(points, index, newPoint) {
  const newValue = points.slice();
  newValue[index] = newPoint;
  return newValue;
}
function updateControlPointPosition(points, index, newPosition) {
  if (isOverlapping(points, index, newPosition)) {
    return points;
  }
  const newPoint = {
    ...points[index],
    position: newPosition
  };
  return updateControlPoint(points, index, newPoint);
}
function updateControlPointColor(points, index, newColor) {
  const newPoint = {
    ...points[index],
    color: newColor
  };
  return updateControlPoint(points, index, newPoint);
}
function updateControlPointColorByPosition(points, position, newColor) {
  const index = points.findIndex((point) => point.position === position);
  return updateControlPointColor(points, index, newColor);
}
function getHorizontalRelativeGradientPosition(mouseXCoordinate, containerElement) {
  if (!containerElement) {
    return;
  }
  const {
    x,
    width
  } = containerElement.getBoundingClientRect();
  const absolutePositionValue = mouseXCoordinate - x;
  return Math.round(clampPercent(absolutePositionValue * 100 / width));
}
export {
  addControlPoint,
  clampPercent,
  getHorizontalRelativeGradientPosition,
  isOverlapping,
  removeControlPoint,
  updateControlPoint,
  updateControlPointColor,
  updateControlPointColorByPosition,
  updateControlPointPosition
};
//# sourceMappingURL=utils.mjs.map
