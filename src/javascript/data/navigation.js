export const normalizeBearing = degrees => ((degrees % 360) + 360) % 360;
export const compassHeading = heading => normalizeBearing(-heading * 180 / Math.PI);
export const relativeBearing = (bearing, heading) => ((bearing - heading + 540) % 360) - 180;
export const compassPoint = bearing => ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(normalizeBearing(bearing) / 45) % 8];
export const bearingTo = (origin, target) => normalizeBearing(Math.atan2(target[0] - origin.x, origin.z - target[2]) * 180 / Math.PI);
