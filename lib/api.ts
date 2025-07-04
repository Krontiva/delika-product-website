/**
 * Utility functions for making API calls through the Next.js API routes
 */

import { formatOrderData } from './utils/orderUtils';

/**
 * Interface for auth token response
 */
export interface AuthResponse {
  authToken: string;
  message?: string;
  [key: string]: any;
}

/**
 * Interface for OTP validation response
 */
export interface OTPResponse {
  otpValidate: string;
  [key: string]: any;
}

/**
 * Interface for user data
 */
export interface UserData {
  id: string;
  OTP: string;
  city: string;
  role: string;
  email: string;
  image: string | null;
  Status: boolean;
  onTrip: boolean;
  address: string;
  country: string;
  Location: {
    lat: string;
    long: string;
  };
  branchId: string | null;
  deviceId: string;
  fullName: string;
  userName: string;
  tripCount: number;
  created_at: number;
  postalCode: string;
  addressFrom: string[];
  dateOfBirth: string | null;
  phoneNumber: string;
  restaurantId: string | null;
  customerTable: Array<{
    id: string;
    userId: string;
    created_at: number;
    deliveryAddress: {
      fromAddress: string;
      fromLatitude: string;
      fromLongitude: string;
    };
    favoriteRestaurants: Array<{
      branchName: string;
    }>;
  }>;
  [key: string]: any;
}

/**
 * Make a POST request to the API through the proxy
 * @param endpoint - The API endpoint to call
 * @param data - The data to send
 * @param headers - Optional headers to include
 * @returns The response data
 */
export async function apiPost<T = any>(endpoint: string, data: any, headers = {}): Promise<T> {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        data,
        headers,
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'API request failed');
    }
    
    return responseData as T;
  } catch (error) {

    throw error;
  }
}

/**
 * Make a GET request to the API through the proxy
 * @param endpoint - The API endpoint to call
 * @returns The response data
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'API request failed');
    }
    
    return responseData as T;
  } catch (error) {

    throw error;
  }
}

/**
 * Make a login request through the dedicated auth API route
 * @param credentials - The login credentials
 * @returns The response data with auth token
 */
export async function login(credentials: { email: string; password: string }): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Login failed');
    }
    
    return responseData as AuthResponse;
  } catch (error) {

    throw error;
  }
}

/**
 * Make any auth-related request
 * @param path - The auth endpoint path (e.g., 'register', 'reset-password')
 * @param data - The data to send
 * @param options - Optional request options
 * @returns The response data
 */
export async function authRequest<T = any>(
  path: string, 
  data: any = {}, 
  options: { method?: string; headers?: Record<string, string> } = {}
): Promise<T> {
  try {
    const { method = 'POST', headers = {} } = options;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    // Add body for non-GET requests
    if (method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }
    
    const response = await fetch(`/api/auth/${path}`, requestOptions);

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Auth request failed');
    }
    
    return responseData as T;
  } catch (error) {

    throw error;
  }
}

/**
 * Get branches data
 * @returns The branches data
 */
export async function getBranches<T = any>(): Promise<T> {
  try {
    const response = await fetch('/api/branches', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to fetch branches');
    }
    
    return responseData as T;
  } catch (error) {

    throw error;
  }
}

/**
 * Get customer details
 * @param customerId - Optional customer ID
 * @returns The customer details
 */
export async function getCustomerDetails<T = any>(userId?: string): Promise<T> {
  try {
    // Get auth token from localStorage if available
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Use the customer details API URL from environment variables
    const customerDetailsApiUrl = process.env.NEXT_PUBLIC_CUSTOMER_DETAILS_API;
    
    if (!customerDetailsApiUrl) {
      throw new Error('CUSTOMER_DETAILS_API environment variable is not defined');
    }
    
    // Construct the URL with the customerId as a query parameter
    const url = userId ? `${customerDetailsApiUrl}?userId=${encodeURIComponent(userId)}` : customerDetailsApiUrl;
    
    // Make the API call
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    // Handle non-OK responses
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch {
        errorText = await response.text();
      }
      
      throw new Error(`Failed to fetch customer details: ${response.status}`);
    }
    
    // Parse and return successful response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    throw error;
  }
}

/**
 * Update customer favorites
 * @param data - The favorites data with userId, branchName, and liked status
 * @returns The response data
 */
export async function updateFavorites<T = any>(data: { 
  userId: string; 
  branchName: string; 
  liked: boolean;
}): Promise<T> {
  try {
    const response = await fetch('/api/favorites', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to update favorites');
    }
    
    return responseData as T;
  } catch (error) {
    console.error('Error updating favorites:', error);
    throw error;
  }
}

/**
 * Submit restaurant approval
 * @param data - The restaurant approval data
 * @returns The response data
 */
export async function submitRestaurantApproval<T = any>(data: any): Promise<T> {
  try {
    const response = await fetch('/api/restaurant/approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to submit restaurant approval');
    }
    
    return responseData as T;
  } catch (error) {
    throw error;
  }
}

/**
 * Submit rider approval
 * @param data - The rider approval data
 * @returns The response data
 */
export async function submitRiderApproval<T = any>(data: any): Promise<T> {
  try {
    const response = await fetch('/api/rider/approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to submit rider approval');
    }
    
    return responseData as T;
  } catch (error) {
    throw error;
  }
}

/**
 * Submit a new order
 * @param orderData - The order data to submit
 * @returns The response data
 */
export const submitOrder = async (orderData: any) => {
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_ORDERS_API || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error('Failed to submit order');
    }

    return responseData;
  } catch (error) {
    console.error('Error submitting order:', error);
    throw error;
  }
};

/**
 * Initialize Paystack payment
 * @param amount - Amount in kobo (smallest currency unit)
 * @param email - Customer's email
 * @param orderId - Order ID
 * @param customerId - Customer ID
 * @returns The response data
 */
export async function initializePaystackPayment(
  amount: number,
  email: string,
  orderId: string,
  customerId: string
): Promise<{ data: { authorization_url: string; reference: string } }> {
  try {
    const response = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        email,
        orderId,
        customerId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initialize payment');
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    throw error;
  }
}

export async function calculateDeliveryPrices(params: {
  pickup: {
    fromLatitude: string;
    fromLongitude: string;
  };
  dropOff: {
    toLatitude: string;
    toLongitude: string;
  };
  rider: boolean;
  pedestrian: boolean;
}) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_DELIVERY_PRICE || "https://api-server.krontiva.africa/api:uEBBwbSs/calculate/delivery/price"

    const response = await fetch(
      apiUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to calculate delivery price");
    }

    const data = await response.json();

    if (!data.riderFee && !data.pedestrianFee) {
      throw new Error("Invalid API response - missing fee data");
    }

    return {
      riderFee: data.riderFee,
      pedestrianFee: data.pedestrianFee,
    };
  } catch (error) {
    throw error; // Re-throw the error to be handled by the calling component
  }
} 