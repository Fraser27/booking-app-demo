import React, { useState, useEffect } from 'react';
import { Card, List, Button, message, Typography, Space } from 'antd';
import { getBookings, cancelBooking, Booking } from '../services/bookingService';
import '../styles/LuxstayTheme.css';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const UserBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(JSON.parse(data['body'])['bookings']);
    } catch (error) {
      message.error('Failed to fetch bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      message.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      message.error('Failed to cancel booking');
      console.error('Error cancelling booking:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className="luxstay-booking-container">
      <Title level={2} className="luxstay-booking-header">My Bookings</Title>
      <Card 
        loading={loading}
        className="luxstay-booking-card"
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={bookings}
          renderItem={(booking) => (
            <List.Item className="luxstay-booking-item">
              <div style={{ width: '100%' }}>
                <div className="luxstay-booking-id">
                  Booking #{booking.booking_id.slice(8)}
                </div>
                <div className="luxstay-booking-dates">
                  {dayjs.unix(booking.check_in).format('MMM D, YYYY')} - {dayjs.unix(booking.check_out).format('MMM D, YYYY')}
                </div>
                <div className="luxstay-booking-price">
                  Total Price: ${booking.total_price}
                </div>
                <div className={`luxstay-booking-status ${booking.status}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </div>
                {booking.status === 'confirmed' && (
                  <Button
                    className="luxstay-booking-cancel-btn"
                    onClick={() => handleCancel(booking.booking_id)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default UserBookings; 