export const printSensorType = (sensorType: any) => {
        switch (sensorType) {
            case 'damWaterLevel':
                return 'Dam Water Level';
            case 'humidity':
                return 'Humidity';
            case 'rainfall':
                return 'Effective Rainfall';
            case 'temperature':
                return 'Temperature';
        }
    };
    
    export const printPeriod = (period: any) => {
        switch (period) {
            case '1day':
                return '1 day';
            case '7days':
                return '7 days';
            case '1month':
                return '1 month';
            case '3months':
                return '3 months';
            case '6months':
                return '6 months';
            case '1year':
                return '1 year';
        }
    };