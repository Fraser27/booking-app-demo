import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import config from '../config.json';

export interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  check_in: number;
  check_out: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  guest_details: {
    name: string;
    email: string;
    phone: string;
    adults: number;
    children: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateBookingRequest {
  property_id: string;
  user_id: string;
  check_in: number;
  check_out: number;
  guest_details: {
    name: string;
    email: string;
    phone: string;
    adults: number;
    children: number;
  };
}

export const createBooking = async (booking: CreateBookingRequest): Promise<Booking> => {
  const session = await fetchAuthSession();
  const response = await fetch(`${config.apiUrl}/properties/booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.tokens.idToken.toString()}`
    },
    body: JSON.stringify(booking)
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