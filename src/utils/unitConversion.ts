export type SensorType = 'damWaterLevel' | 'humidity' | 'rainfall' | 'temperature';

export type UnitOption = {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

// Calibration constants from environment variables
const getCalibrationConstants = () => {
  const maxDepthM = import.meta.env.VITE_DAM_MAX_DEPTH_M;
  const maxVolumeMCM = import.meta.env.VITE_DAM_MAX_VOLUME_MCM;
  
  return {
    damMaxDepthMeters: maxDepthM ? parseFloat(maxDepthM) : null,
    damMaxVolumeMCM: maxVolumeMCM ? parseFloat(maxVolumeMCM) : null,
  };
};

/**
 * Get available unit options for a sensor type, with source unit always first
 */
export function getUnitOptions(sensorType: SensorType, sourceUnit: string): UnitOption[] {
  const calibration = getCalibrationConstants();
  
  switch (sensorType) {
    case 'temperature':
      const tempOptions: UnitOption[] = [
        { value: sourceUnit, label: sourceUnit }, // Source first
      ];
      
      // Add other temperature units if they're not already the source
      if (sourceUnit !== '°F') tempOptions.push({ value: '°F', label: '°F' });
      if (sourceUnit !== 'K') tempOptions.push({ value: 'K', label: 'K' });
      
      return tempOptions;
      
    case 'rainfall':
      const rainfallOptions: UnitOption[] = [
        { value: sourceUnit, label: sourceUnit }, // Source first
      ];
      
      // Add other rainfall units if they're not already the source
      if (sourceUnit !== 'cm') rainfallOptions.push({ value: 'cm', label: 'cm' });
      if (sourceUnit !== 'in') rainfallOptions.push({ value: 'in', label: 'in' });
      
      return rainfallOptions;
      
    case 'humidity':
      const humidityOptions: UnitOption[] = [
        { value: sourceUnit, label: sourceUnit }, // Source first
      ];
      
      // Add fraction option if source is not already fraction
      if (sourceUnit !== 'fraction') {
        humidityOptions.push({ value: 'fraction', label: 'fraction (0-1)' });
      }
      
      return humidityOptions;
      
    case 'damWaterLevel':
      const damOptions: UnitOption[] = [
        { value: sourceUnit, label: sourceUnit }, // Source first
      ];
      
      // Add derived units with calibration checks
      if (sourceUnit !== 'm') {
        damOptions.push({
          value: 'm',
          label: 'm',
          disabled: !calibration.damMaxDepthMeters,
          disabledReason: !calibration.damMaxDepthMeters ? 'Missing VITE_DAM_MAX_DEPTH_M' : undefined,
        });
      }
      
      if (sourceUnit !== 'ft') {
        damOptions.push({
          value: 'ft',
          label: 'ft',
          disabled: !calibration.damMaxDepthMeters,
          disabledReason: !calibration.damMaxDepthMeters ? 'Missing VITE_DAM_MAX_DEPTH_M' : undefined,
        });
      }
      
      if (sourceUnit !== 'MCM') {
        damOptions.push({
          value: 'MCM',
          label: 'MCM',
          disabled: !calibration.damMaxVolumeMCM,
          disabledReason: !calibration.damMaxVolumeMCM ? 'Missing VITE_DAM_MAX_VOLUME_MCM' : undefined,
        });
      }
      
      return damOptions;
      
    default:
      return [{ value: sourceUnit, label: sourceUnit }];
  }
}

/**
 * Convert a value between units for a given sensor type
 */
export function convertValue({
  sensorType,
  value,
  sourceUnit,
  targetUnit,
}: {
  sensorType: SensorType;
  value: number;
  sourceUnit: string;
  targetUnit: string;
}): number {
  if (sourceUnit === targetUnit) {
    return value;
  }
  
  if (!Number.isFinite(value)) {
    return value;
  }
  
  switch (sensorType) {
    case 'temperature':
      return convertTemperature(value, sourceUnit, targetUnit);
      
    case 'rainfall':
      return convertRainfall(value, sourceUnit, targetUnit);
      
    case 'humidity':
      return convertHumidity(value, sourceUnit, targetUnit);
      
    case 'damWaterLevel':
      return convertDamWaterLevel(value, sourceUnit, targetUnit);
      
    default:
      return value;
  }
}

function convertTemperature(value: number, from: string, to: string): number {
  // Convert to Celsius first
  let celsius: number;
  switch (from) {
    case '°C':
      celsius = value;
      break;
    case '°F':
      celsius = (value - 32) * 5 / 9;
      break;
    case 'K':
      celsius = value - 273.15;
      break;
    default:
      return value;
  }
  
  // Convert from Celsius to target
  switch (to) {
    case '°C':
      return celsius;
    case '°F':
      return (celsius * 9 / 5) + 32;
    case 'K':
      return celsius + 273.15;
    default:
      return value;
  }
}

function convertRainfall(value: number, from: string, to: string): number {
  // Convert to mm first
  let mm: number;
  switch (from) {
    case 'mm':
      mm = value;
      break;
    case 'cm':
      mm = value * 10;
      break;
    case 'in':
      mm = value * 25.4;
      break;
    default:
      return value;
  }
  
  // Convert from mm to target
  switch (to) {
    case 'mm':
      return mm;
    case 'cm':
      return mm / 10;
    case 'in':
      return mm / 25.4;
    default:
      return value;
  }
}

function convertHumidity(value: number, from: string, to: string): number {
  // Convert to percentage first
  let percent: number;
  switch (from) {
    case '%':
      percent = value;
      break;
    case 'fraction':
      percent = value * 100;
      break;
    default:
      return value;
  }
  
  // Convert from percentage to target
  switch (to) {
    case '%':
      return percent;
    case 'fraction':
      return percent / 100;
    default:
      return value;
  }
}

function convertDamWaterLevel(value: number, from: string, to: string): number {
  const calibration = getCalibrationConstants();
  
  // Convert to percentage first
  let percent: number;
  switch (from) {
    case '%':
      percent = value;
      break;
    case 'm':
      if (!calibration.damMaxDepthMeters) return value;
      percent = (value / calibration.damMaxDepthMeters) * 100;
      break;
    case 'ft':
      if (!calibration.damMaxDepthMeters) return value;
      const meters = value / 3.280839895;
      percent = (meters / calibration.damMaxDepthMeters) * 100;
      break;
    case 'MCM':
      if (!calibration.damMaxVolumeMCM) return value;
      percent = (value / calibration.damMaxVolumeMCM) * 100;
      break;
    default:
      return value;
  }
  
  // Convert from percentage to target
  switch (to) {
    case '%':
      return percent;
    case 'm':
      if (!calibration.damMaxDepthMeters) return value;
      return (percent / 100) * calibration.damMaxDepthMeters;
    case 'ft':
      if (!calibration.damMaxDepthMeters) return value;
      const metersResult = (percent / 100) * calibration.damMaxDepthMeters;
      return metersResult * 3.280839895;
    case 'MCM':
      if (!calibration.damMaxVolumeMCM) return value;
      return (percent / 100) * calibration.damMaxVolumeMCM;
    default:
      return value;
  }
}

/**
 * Get calibration status for debugging/UI purposes
 */
export function getCalibrationStatus() {
  const calibration = getCalibrationConstants();
  return {
    damDepthAvailable: calibration.damMaxDepthMeters !== null,
    damVolumeAvailable: calibration.damMaxVolumeMCM !== null,
    damMaxDepthMeters: calibration.damMaxDepthMeters,
    damMaxVolumeMCM: calibration.damMaxVolumeMCM,
  };
}