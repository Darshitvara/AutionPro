import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect if this is not a login attempt
            const isLoginRequest = error.config?.url?.includes('/auth/login');
            const isRegisterRequest = error.config?.url?.includes('/auth/register');
            
            if (!isLoginRequest && !isRegisterRequest) {
                // Unauthorized - clear token and redirect (for authenticated routes)
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            // For login/register requests, let the component handle the error
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    register: async (username, email, password) => {
        const response = await api.post('/auth/register', {
            username,
            email,
            password,
        });
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/auth/login', {
            email,
            password,
        });
        return response.data;
    },

    verify: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },
};

// Auction API
export const auctionAPI = {
    // Get all auctions with optional pagination
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Add pagination parameters if provided
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        
        const queryString = queryParams.toString();
        const url = queryString ? `/auctions?${queryString}` : '/auctions';
        
        const response = await api.get(url);
        return response.data;
    },

    getLive: async () => {
        const response = await api.get('/auctions/live');
        return response.data;
    },

    getUpcoming: async () => {
        const response = await api.get('/auctions');
        const auctions = response.data.auctions || [];
        return {
            ...response.data,
            auctions: auctions.filter(auction => auction.status === 'upcoming')
        };
    },

    getById: async (id) => {
        const response = await api.get(`/auctions/${id}`);
        return response.data;
    },

    create: async (auctionData) => {
        const response = await api.post('/auctions', auctionData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/auctions/${id}`);
        return response.data;
    },

    start: async (id) => {
        const response = await api.put(`/auctions/${id}/start`, { 
            manualStart: true // Explicit flag to confirm this is a manual admin action
        });
        return response.data;
    },

    stop: async (id) => {
        const response = await api.put(`/auctions/${id}/stop`);
        return response.data;
    },

    verify: async (id) => {
        const response = await api.get(`/auctions/${id}/verify`);
        return response.data;
    },
};

export default api;
