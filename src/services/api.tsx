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