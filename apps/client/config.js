const environments = {
  development: {
    apiUrl: 'http://localhost:3000/api'
  },
  production: {
    apiUrl: 'https://livraria-api-phg1.onrender.com/api'
  }
};

const isProduction = window.location.hostname.includes('onrender.com');
const apiBaseUrl = (isProduction ? environments.production : environments.development).apiUrl;


export const API_BASE_URL = apiBaseUrl;
export const GOOGLE_API_URL = 'https://www.googleapis.com/books/v1/volumes';