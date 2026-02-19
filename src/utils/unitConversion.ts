export type SensorType = 'damWaterLevel' | 'humidity' | 'rainfall' | 'temperature';

export type UnitOption = {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

/**
 * HUMIDITY CONVERSION ASSUMPTIONS:
 * 
 * Converting between relative humidity (%) and absolute/specific humidity requires
 * temperature and pressure data. Since this data is not available in the history,
 * we use standard atmospheric conditions for conversions:
 * 
 * - Temperature: 20°C (293.15K)
 * - Pressure: 1013.25 hPa (101325 Pa)
 * - Saturation vapor pressure at 20°C: 2337 Pa
 * 
 * These conversions are approximations and may not be accurate for actual conditions.
 * For precise humidity calculations, temperature and pressure data would be required.
 */

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
      
      // Add other humidity units if they're not already the source
      if (sourceUnit !== 'g/m³') humidityOptions.push({ value: 'g/m³', label: 'g/m³ (absolute humidity)' });
      if (sourceUnit !== 'g/kg') humidityOptions.push({ value: 'g/kg', label: 'g/kg (specific humidity)' });
      
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
  // For conversions involving g/m³ and g/kg, we need temperature and pressure
  // Using standard conditions: 20°C (293.15K), 1013.25 hPa
  const TEMP_K = 293.15; // 20°C in Kelvin
  const PRESSURE_PA = 101325; // 1013.25 hPa in Pascals
  const SATURATION_VAPOR_PRESSURE_PA = 2337; // at 20°C
  
  // Convert to percentage first (as base unit)
  let percent: number;
  switch (from) {
    case '%':
      percent = value;
      break;
    case 'g/m³':
      // Convert absolute humidity to relative humidity
      // RH = (actual vapor pressure / saturation vapor pressure) * 100
      // Using ideal gas law: P = (ρ * R * T) / M
      // where ρ = density (g/m³), R = gas constant, T = temperature, M = molar mass of water
      const R = 8.314; // J/(mol·K)
      const M_WATER = 0.018015; // kg/mol (molar mass of water)
      const vapor_pressure = (value / 1000) * R * TEMP_K / M_WATER; // Convert g/m³ to Pa
      percent = (vapor_pressure / SATURATION_VAPOR_PRESSURE_PA) * 100;
      break;
    case 'g/kg':
      // Convert specific humidity to relative humidity
      // This is a simplified conversion assuming standard atmospheric conditions
      // Specific humidity to mixing ratio, then to relative humidity
      const mixing_ratio = value / (1000 - value); // g/kg to kg/kg
      const saturation_mixing_ratio = 0.622 * SATURATION_VAPOR_PRESSURE_PA / (PRESSURE_PA - SATURATION_VAPOR_PRESSURE_PA);
      percent = (mixing_ratio / saturation_mixing_ratio) * 100;
      break;
    default:
      return value;
  }
  
  // Convert from percentage to target
  switch (to) {
    case '%':
      return percent;
    case 'g/m³':
      // Convert relative humidity to absolute humidity
      const vapor_pressure_target = (percent / 100) * SATURATION_VAPOR_PRESSURE_PA;
      const M_WATER_KG = 0.018015; // kg/mol
      const density_kg_m3 = (vapor_pressure_target * M_WATER_KG) / (R * TEMP_K);
      return density_kg_m3 * 1000; // Convert kg/m³ to g/m³
    case 'g/kg':
      // Convert relative humidity to specific humidity
      const vapor_pressure_specific = (percent / 100) * SATURATION_VAPOR_PRESSURE_PA;
      const mixing_ratio_result = 0.622 * vapor_pressure_specific / (PRESSURE_PA - vapor_pressure_specific);
      return (mixing_ratio_result * 1000) / (1 + mixing_ratio_result); // Convert to g/kg
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