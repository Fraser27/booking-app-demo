import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import config from '../config.json';

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
}

export const createBooking = async (bookingData: CreateBookingRequest): Promise<Booking> => {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();

  const response = await fetch(`${config.apiUrl}/properties/booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token || ''
    },
    body: JSON.stringify(bookingData)
  });

  if (!response.ok) {
    throw new Error('Failed to create booking');
  }

  return response.json();
};

export const getBookings = async (): Promise<Booking[]> => {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  // I want to get the user id from the token
  const user = await getCurrentUser();
  const userId = user.username;
  // I want to use the userIID as a query paramater in the get request
  const response = await fetch(`${config.apiUrl}/properties/booking?user_id=${userId}`, {
    headers: {
      'Authorization': token || ''
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }

  return response.json();
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  

  const response = await fetch(`${config.apiUrl}/properties/booking/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': token || ''
    }
  });

  if (!response.ok) {
    throw new Error('Failed to cancel booking');
  }
}; 