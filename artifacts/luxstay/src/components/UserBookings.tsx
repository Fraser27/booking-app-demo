import React, { useState, useEffect } from 'react';
import { Card, List, Button, message, Typography, Space } from 'antd';
import { getBookings, cancelBooking, Booking } from '../services/bookingService';
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
    <Card title="My Bookings" loading={loading}>
      <List
        dataSource={bookings}
        renderItem={(booking) => (
          <List.Item
            actions={[
              booking.status === 'confirmed' && (
                <Button
                  danger
                  onClick={() => handleCancel(booking.id)}
                >
                  Cancel Booking
                </Button>
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={`Booking #${booking.id.slice(0, 8)}`}
              description={
                <Space direction="vertical">
                  <Text>
                    Dates: {dayjs(booking.startDate).format('MMM D, YYYY')} - {dayjs(booking.endDate).format('MMM D, YYYY')}
                  </Text>
                  <Text>
                    Total Price: ${booking.totalPrice}
                  </Text>
                  <Text type={getStatusColor(booking.status)}>
                    Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default UserBookings; 