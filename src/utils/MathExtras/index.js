
Math.lerp = function(from,to,weight=0.10) { // linear interpolation
    if (Math.abs(to-from) < 0.001) return to;
    return from+((to-from)*weight)
}
Math.vectorDistance = function(vec1, vec2) { // distance formula for 2d vectors
    if (!vec1 || !vec2) return NaN;
    if (isNaN(vec1.x) || isNaN(vec1.y) || isNaN(vec2.x) || isNaN(vec2.y)) return NaN;
    return Math.sqrt(Math.pow(vec2.x - vec1.x, 2) + Math.pow(vec2.y - vec1.y, 2) * 1.0);
}
Math.dot = function(vec1, vec2) {
    if (!vec1 || !vec2) return NaN;
    if (isNaN(vec1.x) || isNaN(vec1.y) || isNaN(vec2.x) || isNaN(vec2.y)) return NaN;
    return vec1.x * vec2.x + vec1.y * vec2.y;
}
Math.angleToUnit = function(angle, targetVec={}) {
    targetVec.x = Math.cos(angle*Math.PI/180); targetVec.y = Math.sin(angle*Math.PI/180);
    return targetVec;
}
Math.unitToAngle = function(vec) {
    return Math.atan2(vec.y, vec.x)*180/Math.PI;
};