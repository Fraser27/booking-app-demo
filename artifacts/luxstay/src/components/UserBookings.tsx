import React, { useState, useEffect } from 'react';
import { Card, List, Button, message, Typography, Space } from 'antd';
import { getBookings, cancelBooking, Booking } from '../services/bookingService';
import '../styles/LuxstayTheme.css';
import dayjs from 'dayjs';

const { Text } = Typography;

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
    <div className="luxstay-container">
      <Card 
        title="My Bookings" 
        loading={loading}
        className="luxstay-card luxstay-fade-in"
      >
        <List
          dataSource={bookings}
          renderItem={(booking) => (
            <List.Item
              className="luxstay-fade-in"
              actions={[
                booking.status === 'confirmed' && (
                  <Button
                    danger
                    className="luxstay-button"
                    onClick={() => handleCancel(booking.booking_id)}
                  >
                    Cancel Booking
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Text strong className="luxstay-property-price">
                    Booking #{booking.booking_id.slice(0, 8)}
                  </Text>
                }
                description={
                  <Space direction="vertical" className="luxstay-property-details">
                    <Text>
                      <span className="luxstay-property-location">Dates:</span>{' '}
                      {dayjs.unix(booking.check_in).format('MMM D, YYYY')} - {dayjs.unix(booking.check_out).format('MMM D, YYYY')}
                    </Text>
                    <Text>
                      <span className="luxstay-property-location">Total Price:</span>{' '}
                      ${booking.total_price}
                    </Text>
                    <Text type={getStatusColor(booking.status)}>
                      <span className="luxstay-property-location">Status:</span>{' '}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default UserBookings; 