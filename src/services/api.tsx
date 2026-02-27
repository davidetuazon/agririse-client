import axios from 'axios';
import { ACCESS_TOKEN } from '../utils/constants';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5000';
const BASE_PATH = `${BASE_URL}/api/v1`;

const api = axios.create({
    baseURL: BASE_PATH,
});

api.interceptors.request.use((config) => {
    const token = Cookies.get(ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
});

export const me = async () => {
    try {
        const res = await api.get('user/me');
        return res.data;
    } catch (e) {
        throw new Error("Failed fetch on:'/me'");
    }
}

export const login = async (email: string, password: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const res = await api.post('/user/login', { email, password}, {});
        return res.data;
    } catch (e) {
        throw e;
    }
}

export const latest = async () => {
    // eslint-disable-next-line no-useless-catch
    try {
        const res = await api.get('/iot/latest');
        return res.data;
    } catch (e) {
        throw e;
    }
}

export const getAnalytics = async (
    {
        sensorType,
        startDate,
        endDate,
        limit,
        cursor,
    }: { 
        sensorType: string,
        startDate: string,
        endDate: string,
        limit: number,
        cursor: string
    }
) => {
    try {
        const res = await api.get('/iot/analytics', { params: { sensorType, startDate, endDate, limit, cursor } });
         return res.data;
    } catch (e:any) {
        if (e.response.data.error) return { data: null, error: e.response.data.error }
        return { data: null, error: e.message || 'Unkown error occured' };
    }
}

export const getHistory = async (
    {
        sensorType,
        startDate,
        endDate,
        limit,
        cursor
    }: { 
        sensorType: string,
        startDate: string,
        endDate: string,
        limit: number,
        cursor: string
    }
) => {
    try {
        const res = await api.get('/iot/history', { params: { sensorType, startDate, endDate, limit, cursor } });
        return res.data;
    } catch (e:any) {
        if (e.response.data.error) return { data: null, error: e.response.data.error }
        return { data: null, error: e.message || 'Unkown error occured' };
    }
}

export type ImportRow = {
    recordedAt: string;
    value: number | string;
    [key: string]: unknown;
};

export const processImportData = async (
    {
        data,
        sensorType,
    }: {
        data: ImportRow[];
        sensorType: string;
    }
) => {
    try {
        const res = await api.post('/iot/data/import', { data, sensorType });
        return res.data;
    } catch (e: any) {
        if (e.response?.data?.error) return { data: null, error: e.response.data.error };
        return { data: null, error: e.message || 'Unknown error occurred' };
    }
}

export const saveImportData = async (
    {
        importId,
        sensorType,
    }: {
        importId: string;
        sensorType: string;
    }
) => {
    try {
        const res = await api.post('/iot/data/import/save', { importId, sensorType });
        return res.data;
    } catch (e: any) {
        if (e.response?.data?.error) return { data: null, error: e.response.data.error };
        return { data: null, error: e.message || 'Unknown error occurred' };
    }
}

export const changePassword = async (oldPassword: string, newPassword: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const res = await api.patch('/user/settings/password', { oldPassword, newPassword });
        return res.data;
    } catch (e) {
        throw e;
    }
}

// Optimization / allocations
export type OptimizationRun = {
    _id: string;
    status: 'pending' | 'completed' | 'failed';
    triggeredBy?: { _id: string; name: string; email: string; role?: string };
    inputSnapshot?: {
        scenario: 'dry season' | 'wet season';
        cropVariant?: 'main' | 'second';
        locality?: string;
        totalSeasonalWaterSupplyM3: number;
        canalInput?: Array<{
            _id?: string;
            mainLateralId?: string;
            tbsByDamHa?: number;
            netWaterDemandM3?: number;
            seepageM3?: number;
            lossFactorPercentage?: number;
            coverage?: Array<{ barangay: string; fractionalAreaHa?: number }>;
        }>;
        createdAt?: string;
    };
    createdAt?: string;
};

export type AllocationUnit = {
    mainLateralId: string;
    areaHa?: number;
    allocatedWaterM3: number;
    effectiveWaterM3?: number;
    netWaterDemandM3?: number;
    shortfallM3?: number;
    shortfallPercentage?: number;
    coveragePercentage?: number;
    coverage?: Array<{ barangay: string; fractionalAreaHa: number }>;
};

export type ObjectiveValue = {
    value: number;
    unit: string;
    direction: 'maximize' | 'minimize';
};

export type ParetoSolution = {
    _id: string;
    runId: string;
    allocationVector: AllocationUnit[];
    objectiveValues: Record<string, ObjectiveValue>;
};

export type SelectedSolutionHistoryItem = {
    _id: string;
    runId: string;
    createdAt?: string;
    runSnapshot?: {
        createdAt?: string;
        inputSnapshot?: {
            scenario?: 'dry season' | 'wet season';
            cropVariant?: 'main' | 'second';
            totalSeasonalWaterSupplyM3?: number;
        };
    };
    solutionSnapshot?: {
        allocationVector?: AllocationUnit[];
        objectiveValues?: Record<string, ObjectiveValue>;
    };
    selectedBy?: {
        _id?: string;
        name?: string;
        email?: string;
        role?: string;
    };
};

export const createOptimizationRun = async (params: {
    totalSeasonalWaterSupplyM3: number;
    scenario: 'dry season' | 'wet season';
}) => {
    const res = await api.post<{ optimizationRun: OptimizationRun }>('/optimization/ga', params);
    return res.data;
};

export const getOptimizationRunStatus = async (runId: string) => {
    const res = await api.get<{ status: 'pending' | 'completed' | 'failed' }>(
        `/optimization/runs/${runId}/status`
    );
    return res.data;
};

export const getOptimizationRunResults = async (runId: string) => {
    const res = await api.get<{
        optimizationRun: OptimizationRun;
        paretoSolutions?: ParetoSolution[];
        message?: string;
    }>(`/optimization/runs/${runId}`);
    return res.data;
};

export const selectOptimizationSolution = async (runId: string, solutionId: string) => {
    const res = await api.post<{ success: boolean }>(`/optimization/runs/${runId}/select`, {
        solutionId,
    });
    return res.data;
}

export const getSelectedSolutionsHistory = async (params?: {
    year?: number;
    scenario?: 'dry season' | 'wet season';
    cropVariant?: 'main' | 'second';
}) => {
    const searchParams = new URLSearchParams();
    if (params?.year != null) searchParams.set('year', String(params.year));
    if (params?.scenario) searchParams.set('scenario', params.scenario);
    if (params?.cropVariant) searchParams.set('cropVariant', params.cropVariant);

    const queryString = searchParams.toString();
    const url = queryString
        ? `/optimization/runs/solutions?${queryString}`
        : '/optimization/runs/solutions';

    const res = await api.get<SelectedSolutionHistoryItem[]>(url);
    return res.data;
}